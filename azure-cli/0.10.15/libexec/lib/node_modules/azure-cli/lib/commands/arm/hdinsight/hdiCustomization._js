//
// Copyright (c) Microsoft and contributors.  All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//
// See the License for the specific language governing permissions and
// limitations under the License.
//

var __ = require('underscore');
var util = require('util');
var profile = require('../../../util/profile');
var fs = require('fs');
var adUtils = require('../ad/adUtils');
var utils = require('../../../util/utils');
var HDIConstants = require('./hdiConstants');
var HdiUtils = require('./hdiUtils');

var $ = utils.getLocaleString;

function HdiCustomization(cli, subscription) {
  this.cli = cli;
  this.subscription = subscription;
}

__.extend(HdiCustomization.prototype, {
  getHeadNodeSize: function(clusterCreateParameters) {
    var headNodeSize;
    if (clusterCreateParameters.headNodeSize !== null && clusterCreateParameters.headNodeSize !== undefined) {
      headNodeSize = clusterCreateParameters.headNodeSize;
    } else {
      headNodeSize = (utils.ignoreCaseEquals(clusterCreateParameters.clusterType, 'Hadoop') || utils.ignoreCaseEquals(clusterCreateParameters.clusterType, 'Spark')) ? 'Standard_D12' : 'Large';
    }
    return headNodeSize;
  },

  getWorkerNodeSize: function(clusterCreateParameters) {
    var workerNodeSize;
    if (clusterCreateParameters.workerNodeSize !== null && clusterCreateParameters.workerNodeSize !== undefined) {
      workerNodeSize = clusterCreateParameters.workerNodeSize;
    } else {
      workerNodeSize = utils.ignoreCaseEquals(clusterCreateParameters.clusterType, 'Hadoop') || utils.ignoreCaseEquals(clusterCreateParameters.clusterType, 'Spark') ? 'Standard_D12' : 'Standard_D3';
    }
    return workerNodeSize;
  },

  getRoleCollection: function(clusterCreateParameters) {
    //OS Profile
    var osProfile = {};
    if (utils.ignoreCaseEquals(clusterCreateParameters.osType, 'Windows')) {
      var rdpSettingsParams = {};
      if (!utils.stringIsNullOrEmpty(clusterCreateParameters.rdpUserName)) {
        rdpSettingsParams = {
          userName: clusterCreateParameters.rdpUserName,
          password: clusterCreateParameters.rdpPassword,
          expiryDate: clusterCreateParameters.rdpAccessExpiry
        };
      }
      osProfile = {
        windowsOperatingSystemProfile:
        {
          rdpSettings: rdpSettingsParams
        }
      };
    } else if (utils.ignoreCaseEquals(clusterCreateParameters.osType, 'Linux')) {
      var sshPublicKeys = [];
      if (!utils.stringIsNullOrEmpty(clusterCreateParameters.sshPublicKey)) {
        var sshPublicKey = {
          certificateData: clusterCreateParameters.sshPublicKey
        };
        sshPublicKeys.push(sshPublicKey);
      }

      var sshProfile = {};
      if (sshPublicKeys.length > 0) {
        sshProfile =
        {
          sshPublicKeys: sshPublicKeys
        };
      } else {
        sshProfile = null;
      }

      osProfile = {
        linuxOperatingSystemProfile:
        {
          userName: clusterCreateParameters.sshUserName,
          password: clusterCreateParameters.sshPassword,
          sshProfile: sshProfile
        }
      };
    }

    //VNet Profile
    var vnetProfile = {};
    if (!utils.stringIsNullOrEmpty(clusterCreateParameters.virtualNetworkId)) {
      vnetProfile.id = clusterCreateParameters.virtualNetworkId;
    }
    if (!utils.stringIsNullOrEmpty(clusterCreateParameters.subnetName)) {
      vnetProfile.subnetName = clusterCreateParameters.subnetName;
    }
    if (utils.stringIsNullOrEmpty(vnetProfile.Id) && utils.stringIsNullOrEmpty(vnetProfile.subnetName)) {
      vnetProfile = null;
    }

    var workernodeactions = [];
    var headnodeactions = [];
    var zookeepernodeactions = [];

    //Script Actions
    if (clusterCreateParameters.scriptActions !== null && clusterCreateParameters.scriptActions !== undefined) {
      var scriptActionNodes = Object.keys(clusterCreateParameters.scriptActions);
      scriptActionNodes.forEach(function(nodeType) {
        var value = clusterCreateParameters.scriptActions[nodeType];
        if (utils.ignoreCaseEquals(nodeType, 'workernode')) {
          workernodeactions = value;
        } else if (utils.ignoreCaseEquals(nodeType, 'headnode')) {
          headnodeactions = value;
        } else if (utils.ignoreCaseEquals(nodeType, 'zookeepernode')) {
          zookeepernodeactions = value;
        }
      });
    }

    //Roles
    var roles = [];
    var headNodeSize = this.getHeadNodeSize(clusterCreateParameters);
    var headNode =
    {
      name: 'headnode',
      targetInstanceCount: 2,
      hardwareProfile: {
        vmSize: headNodeSize
      },
      osProfile: osProfile,
      virtualNetworkProfile: vnetProfile,
      scriptActions: headnodeactions
    };
    roles.push(headNode);

    var workerNodeSize = this.getWorkerNodeSize(clusterCreateParameters);
    var workerNode = {
      name: 'workernode',
      targetInstanceCount: clusterCreateParameters.clusterSizeInNodes,
      hardwareProfile: {
        vmSize: workerNodeSize
      },
      osProfile: osProfile,
      scriptActions: workernodeactions
    };
    roles.push(workerNode);

    if (utils.ignoreCaseEquals(clusterCreateParameters.osType, 'Windows')) {
      if (utils.ignoreCaseEquals(clusterCreateParameters.clusterType, 'Hadoop') ||
        utils.ignoreCaseEquals(clusterCreateParameters.clusterType, 'Spark')) {
        return roles;
      }
    }

    if (utils.ignoreCaseEquals(clusterCreateParameters.osType, 'Linux')) {
      if (utils.ignoreCaseEquals(clusterCreateParameters.clusterType, 'Hadoop') ||
        utils.ignoreCaseEquals(clusterCreateParameters.clusterType, 'Spark')) {
        clusterCreateParameters.zookeeperNodeSize = 'Small';
      }
    }

    var zookeeperNodeSize;
    if (utils.stringIsNullOrEmpty(clusterCreateParameters.zookeeperNodeSize)) {
      zookeeperNodeSize = 'Medium';
    } else {
      zookeeperNodeSize = clusterCreateParameters.zookeeperNodeSize;
    }

    var zookeepernode = {
      name: 'zookeepernode',
      scriptActions: zookeepernodeactions,
      targetInstanceCount: 3,
      osProfile: osProfile,
      hardwareProfile: {
        vmSize: zookeeperNodeSize
      }
    };

    roles.push(zookeepernode);
    return roles;
  },

  getCoreSiteConfigurationsForWASB : function(configurations, clusterName, hdiVersion, storageAccountDetails) {
    var coreConfig = configurations[HDIConstants.ConfigurationKey.CoreSite];
    if (!coreConfig) {
      coreConfig = {};
    }
    var storageAccountNameKey = 'fs.defaultFS';
    var defaultFS = coreConfig[storageAccountNameKey];
    if (!defaultFS) {
      if (hdiVersion !== null && hdiVersion === '2.1') {
        storageAccountNameKey = 'fs.default.name';
      }    
      var container = utils.stringIsNullOrEmpty(storageAccountDetails.defaultStorageContainer) ?
        clusterName : storageAccountDetails.defaultStorageContainer;
      coreConfig[storageAccountNameKey] = util.format($('wasb://%s@%s'), container, storageAccountDetails.defaultStorageAccountName);
    }

    var defaultStorageConfigKey = util.format($('fs.azure.account.key.%s'), storageAccountDetails.defaultStorageAccountName);
    var defaultStorageAccount = coreConfig[defaultStorageConfigKey];
    if (!defaultStorageAccount) {
      coreConfig[defaultStorageConfigKey] = storageAccountDetails.defaultStorageAccountKey;
    }
    return coreConfig;
  },

  getCoreSiteConfigurationsForAdlDefaultFS : function(configurations, storageAccountDetails) {
    var coreConfig = configurations[HDIConstants.ConfigurationKey.CoreSite];
    if (!coreConfig) {
      coreConfig = {};
      coreConfig['fs.defaultFS'] = 'adl://home';
      coreConfig['dfs.adls.home.hostname'] = storageAccountDetails.defaultStorageAccountName;
      coreConfig['dfs.adls.home.mountpoint'] = storageAccountDetails.defaultStorageRootPath;
    }
     return coreConfig;
  },

  getAppIDFromObjectId : function(objectId, _) {
    var subscription = profile.current.getSubscription(this.subscription);
    var graphClient = adUtils.getADGraphClient(subscription);
    var servicePrincipal = graphClient.servicePrincipals.get(objectId, _);
    return servicePrincipal.appId;
  },

  getAuthorityUri : function(tenantId) {
      // If the user provided tenantId is in URL format, return it as it is.
      // else return "https://login.windows.net/<tenantId>" since RP expects an URL
       if (utils.stringStartsWith(tenantId, 'http://', true) || utils.stringStartsWith(tenantId, 'https://', true)) {
         return tenantId; 
       } else {
         var authorityUriPrefix = 'https://login.windows.net/';
         return authorityUriPrefix + tenantId;
       }    
  },

  getCertificateData : function(certFilePath) {
      var certificateContents = fs.readFileSync(certFilePath);
      return new Buffer(certificateContents).toString('base64');
  },

  getClusterIdentityConfigurations : function(configurations, clusterIdentityDetails, _) { 
  
    var clusterIdentityConfig = configurations[HDIConstants.ConfigurationKey.ClusterIdentity];

    if (!clusterIdentityConfig && clusterIdentityDetails) {    
      clusterIdentityConfig = {};
      clusterIdentityConfig['clusterIdentity.applicationId'] = this.getAppIDFromObjectId(clusterIdentityDetails.objectId, _);
      clusterIdentityConfig['clusterIdentity.aadTenantId'] = this.getAuthorityUri(clusterIdentityDetails.aadTenant);
      clusterIdentityConfig['clusterIdentity.resourceUri'] = clusterIdentityDetails.resourceUri;
      clusterIdentityConfig['clusterIdentity.certificate'] = this.getCertificateData(clusterIdentityDetails.certificatePath);
      clusterIdentityConfig['clusterIdentity.certificatePassword'] = clusterIdentityDetails.certificatePassword;
    }
    return clusterIdentityConfig;
  },

  getMetastoreConfigIaas: function(metastore, metastoreType) {
    var connectionUrl =
      util.format($('jdbc:sqlserver://%s.database.windows.net;database=%s;encrypt=true;trustServerCertificate=true;create=false;loginTimeout=300;sendStringParametersAsUnicode=true;prepareSQL=0'),
        metastore.server, metastore.database);
    var configurations = [];
    if (utils.ignoreCaseEquals(metastoreType, HDIConstants.ConfigurationKey.HiveSite)) {
      var hiveSiteKey = HDIConstants.ConfigurationKey.HiveSite;
      var hiveConfigValue = [
        { 'javax.jdo.option.ConnectionURL': connectionUrl },
        { 'javax.jdo.option.ConnectionUserName': metastore.user },
        { 'javax.jdo.option.ConnectionPassword': metastore.password },
        { 'javax.jdo.option.ConnectionDriverName': 'com.microsoft.sqlserver.jdbc.SQLServerDriver' }
      ];
      HdiUtils.pushToConfig(hiveSiteKey, hiveConfigValue, configurations);

      var hiveEnvKey = HDIConstants.ConfigurationKey.HiveEnv;
      var hiveEnvValue = [
        { 'hive_database': 'Existing MSSQL Server database with SQL authentication' },
        { 'hive_database_name': metastore.database },
        { 'hive_database_type': 'mssql' },
        { 'hive_existing_mssql_server_database': metastore.database },
        { 'hive_existing_mssql_server_host': util.format($('%s.database.windows.net)'), metastore.Server) },
        { 'hive_hostname': util.format($('%s.database.windows.net)'), metastore.server) }
      ];
      HdiUtils.pushToConfig(hiveEnvKey, hiveEnvValue, configurations);

      return configurations;
    } else {
      var oozieSiteKey = HDIConstants.ConfigurationKey.OozieSite;
      var oozieSiteValue = [
        { 'oozie.service.JPAService.jdbc.url': connectionUrl },
        { 'oozie.service.JPAService.jdbc.username': metastore.user },
        { 'oozie.service.JPAService.jdbc.password': metastore.password },
        { 'oozie.service.JPAService.jdbc.driver': 'com.microsoft.sqlserver.jdbc.SQLServerDriver' },
        { 'oozie.db.schema.name': 'oozie' }
      ];
      HdiUtils.pushToConfig(oozieSiteKey, oozieSiteValue, configurations);

      var oozieEnvKey = HDIConstants.ConfigurationKey.OozieEnv;
      var oozieEnvValue = [
        { 'oozie_database': 'Existing MSSQL Server database with SQL authentication' },
        { 'oozie_database_type': 'mssql' },
        { 'oozie_existing_mssql_server_database': metastore.database },
        { 'oozie_existing_mssql_server_host': util.format($('%s.database.windows.net)', metastore.server)) },
        { 'oozie_hostname': util.format($('%s.database.windows.net)', metastore.server)) }
      ];
      HdiUtils.pushToConfig(oozieEnvKey, oozieEnvValue, configurations);
      return configurations;
    }
  },

  getMetastoreConfigPaas: function(metastore, metastoreType) {
    var connectionUrl =
      util.format($('jdbc:sqlserver://%s.database.windows.net;database=%s;encrypt=true;trustServerCertificate=trsee;create=false;loginTimeout=300'),
        metastore.server, metastore.database);
    var username = util.format($('%s@%s'), metastore.user, metastore.server);
    var config = [
      { 'javax.jdo.option.ConnectionURL': connectionUrl },
      { 'javax.jdo.option.ConnectionUserName': username },
      { 'javax.jdo.option.ConnectionPassword': metastore.password }
    ];

    var configKey = '';
    if (utils.ignoreCaseEquals(metastoreType, 'hive')) {
      configKey = HDIConstants.ConfigurationKey.HiveSite;
    } else if (utils.ignoreCaseEquals(metastoreType, 'oozie')) {
      configKey = HDIConstants.ConfigurationKey.OozieSite;
    }
    var configs = {};
    configs[configKey] = config;
    return configs;
  },

  getMetastoreConfig: function(metastore, osType, metastoreType) {
    if (utils.ignoreCaseEquals(osType, 'Windows')) {
      return this.getMetastoreConfigPaas(metastore, metastoreType);
    } else {
      return this.getMetastoreConfigIaas(metastore, metastoreType);
    }
  },

  getConfigurations: function(clusterName, clusterCreateParameters, _) {
    var configurations = clusterCreateParameters.configurations;
    if (!configurations) {
      configurations = {};
    }

    //Core Config  
    if(utils.ignoreCaseEquals(clusterCreateParameters.defaultStorageType, HDIConstants.StorageType.AzureStorage)){
      coreConfig = this.getCoreSiteConfigurationsForWASB(configurations, clusterName, clusterCreateParameters.version, clusterCreateParameters.defaultStorageAccountDetails);
    } else { 
      coreConfig = this.getCoreSiteConfigurationsForAdlDefaultFS(configurations, clusterCreateParameters.defaultStorageAccountDetails);
    }    

    if (clusterCreateParameters.additionalStorageAccounts instanceof Array) {
      for (var i = 0; i < clusterCreateParameters.additionalStorageAccounts.length; i++) {
        var storageAccount = clusterCreateParameters.additionalStorageAccounts[i];
        var configKey = util.format($('fs.azure.account.key.%s'), storageAccount.key);
        var configValue = coreConfig[configKey];
        if (configValue === null || configValue === undefined) {
          coreConfig[configKey] = storageAccount.value;
        }
      }
    }

    configurations[HDIConstants.ConfigurationKey.CoreSite] = coreConfig;

    //Cluster Identity Details
    var clusterIdentityConfig = this.getClusterIdentityConfigurations(configurations, clusterCreateParameters.clusterIdentity, _);
    configurations[HDIConstants.ConfigurationKey.ClusterIdentity] = clusterIdentityConfig;

    //Gateway Config
    var gatewayConfig = configurations[HDIConstants.ConfigurationKey.Gateway];

    if (gatewayConfig !== null && gatewayConfig !== undefined) {
      return configurations;
    }
    gatewayConfig = {};

    if (!utils.stringIsNullOrEmpty(clusterCreateParameters.userName)) {
      gatewayConfig['restAuthCredential.isEnabled'] = 'true';
      gatewayConfig['restAuthCredential.username'] = clusterCreateParameters.userName;
      gatewayConfig['restAuthCredential.password'] = clusterCreateParameters.password;
    } else {
      gatewayConfig['restAuthCredential.isEnabled'] = 'false';
    }

    configurations[HDIConstants.ConfigurationKey.Gateway] = gatewayConfig;

    return configurations;
  },

  getExtendedClusterCreateParameters: function(clusterName, clusterCreateParameters, _) {
    var createParamsExtended = {
      location: clusterCreateParameters.location,
      properties: {
        clusterDefinition: {
          clusterType: clusterCreateParameters.clusterType
        },
        clusterVersion: clusterCreateParameters.version,
        operatingSystemType: clusterCreateParameters.osType,
        clusterTier: clusterCreateParameters.clusterTier
      }
    };

    var configurations = this.getConfigurations(clusterName, clusterCreateParameters, _);

    if (clusterCreateParameters.hiveMetastore !== null && clusterCreateParameters.hiveMetastore !== undefined) {
      var hiveMetastoreConfig = this.getMetastoreConfig(clusterCreateParameters.hiveMetastore, clusterCreateParameters.osType, 'Hive');
      if (hiveMetastoreConfig instanceof Array) {
        for (var i = 0; i < hiveMetastoreConfig.length; i++) {
          var hiveConfigSet = hiveMetastoreConfig[i];
          if (configurations[hiveConfigSet.key] !== null && configurations[hiveConfigSet.key] !== undefined) {
            for (var j = 0; j < hiveConfigSet.value.length; j++) {
              var configs = {};
              configs[config.key] = config.value;
              configurations[hiveConfigSet.value[j].key] = configs;
            }
          } else {
            configurations[hiveConfigSet.key] = hiveConfigSet.value;
          }
        }
      }
    }
    if (clusterCreateParameters.oozieMetastore !== null && clusterCreateParameters.oozieMetastore !== undefined) {
      var oozieMetastoreConfig = this.getMetastoreConfig(clusterCreateParameters.oozieMetastore, clusterCreateParameters.osType, 'Oozie');
      if (oozieMetastoreConfig instanceof Array) {
        for (var k = 0; k < oozieMetastoreConfig.length; k++) {
          var oozieConfigSet = oozieMetastoreConfig[k];
          if (configurations[oozieConfigSet.key] !== null &&
            configurations[oozieConfigSet.key] !== undefined) {
            for (var m = 0; m < oozieConfigSet.value.length; m++) {
              var configs2 = {};
              configs2[config.key] = config.value;
              configurations[oozieConfigSet.value[m].key] = configs2;
            }
          } else {
            configurations[oozieConfigSet.key] = oozieConfigSet.value;
          }
        }
      }
    }

    createParamsExtended.properties.clusterDefinition.configurations = configurations;

    createParamsExtended.properties.computeProfile = [];
    createParamsExtended.properties.computeProfile.roles = this.getRoleCollection(clusterCreateParameters);

    if (clusterCreateParameters.securityProfile !== null && clusterCreateParameters.securityProfile !== undefined) {
      var securityProfile = {
        directoryType: clusterCreateParameters.securityProfile.directoryType,
        domain: clusterCreateParameters.securityProfile.domain,
        organizationalUnitDN: clusterCreateParameters.securityProfile.organizationalUnitDN,
        ldapsUrls: clusterCreateParameters.securityProfile.ldapsUrls,
        domainUsername: clusterCreateParameters.securityProfile.domainUsername,
        domainUserPassword: clusterCreateParameters.securityProfile.domainUserPassword
      };

      if (clusterCreateParameters.securityProfile.clusterUsersGroupDNs !== null  && 
          clusterCreateParameters.securityProfile.clusterUsersGroupDNs !== undefined) {
        securityProfile.clusterUsersGroupDNs = clusterCreateParameters.securityProfile.clusterUsersGroupDNs;
      }

      createParamsExtended.properties.securityProfile = securityProfile;
    }

    return createParamsExtended;
  },

  createCluster: function(resourceGroupName, clusterName, clusterCreateParameters, _) {
    try {
      var clusterCreateParametersExtended = this.getExtendedClusterCreateParameters(clusterName, clusterCreateParameters, _);
      var subscription = profile.current.getSubscription(this.subscription);
      var client = utils.createHDInsightManagementClient(subscription);
      return client.clusters.create(resourceGroupName, clusterName, clusterCreateParametersExtended, _);

    } catch (e) {
      console.log('Error submitting create command: ' + e);
      throw new Error(e);
    }
  }
});

module.exports = HdiCustomization;
