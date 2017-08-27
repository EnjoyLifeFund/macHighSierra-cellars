/**
* Copyright (c) Microsoft.  All rights reserved.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

var __ = require('underscore');

var profile = require('../../../util/profile');
var utils = require('../../../util/utils');
var HdiCustomization = require('./hdiCustomization');
var HdiConfigClient = require('./hdiConfigClient');

function HdiClient(cli, subscription) {
  this.cli = cli;
  this.subscription = subscription;
}

__.extend(HdiClient.prototype, {
  createCluster: function(resourceGroupName, clusterName, clusterCreateParameters, _) {
    var customization = new HdiCustomization(this.cli);
    var result = customization.createCluster(resourceGroupName, clusterName, clusterCreateParameters, _);
    return result;
  },

  getCluster: function(resourceGroupName, clusterName, _) {
    try {
      var subscription = profile.current.getSubscription(this.subscription);
      var client = utils.createHDInsightManagementClient(subscription);
      return client.clusters.get(resourceGroupName, clusterName, _);

    } catch (e) {
      if (e.code === 'ResourceNotFound' || e.code === 'NotFound') {
        return null;
      }
      throw e;
    }
  },

  listClusters: function(resourceGroupName, _) {
    try {
      var subscription = profile.current.getSubscription(this.subscription);
      var client = utils.createHDInsightManagementClient(subscription);
      if (resourceGroupName !== undefined && resourceGroupName !== null) {
        return client.clusters.listByResourceGroup(resourceGroupName, _);
      }
      return client.clusters.list(_);

    } catch (e) {
      if (e.code === 'ResourceNotFound' || e.code === 'NotFound') {
        return null;
      }
      throw e;
    }
  },

  deleteCluster: function(resourceGroupName, clusterName, _) {
    try {
      var subscription = profile.current.getSubscription(this.subscription);
      var client = utils.createHDInsightManagementClient(subscription);
      return client.clusters.deleteMethod(resourceGroupName, clusterName, _);
    } catch (e) {
      if (e.code === 'ResourceNotFound' || e.code === 'NotFound') {
        return null;
      }
      throw e;
    }
  },

  resizeCluster: function(resourceGroupName, clusterName, targetInstanceCount, _) {
    try {
      var subscription = profile.current.getSubscription(this.subscription);
      var client = utils.createHDInsightManagementClient(subscription);
      var resizeParameter = {
        targetInstanceCount: targetInstanceCount
      };
      return client.clusters.resize(resourceGroupName, clusterName, resizeParameter, _);
    } catch (e) {
      if (e.code === 'ResourceNotFound' || e.code === 'NotFound') {
        return null;
      }
      throw e;
    }
  },

  listPersistedScripts : function(resourceGroupName, clusterName, _) {
    try {
      var subscription = profile.current.getSubscription(this.subscription);
      var client = utils.createHDInsightManagementClient(subscription);
      return client.clusters.listPersistedScripts(resourceGroupName, clusterName, _);
    } catch (e) {
      if (e.code === 'ResourceNotFound' || e.code === 'NotFound') {
        return null;
      }
      throw e;
    }
  },

  listScriptExecutionHistory : function(resourceGroupName, clusterName, _) {
    try {
      var subscription = profile.current.getSubscription(this.subscription);
      var client = utils.createHDInsightManagementClient(subscription);
      return client.clusters.listScriptExecutionHistory(resourceGroupName, clusterName, _);
    } catch (e) {
      if (e.code === 'ResourceNotFound' || e.code === 'NotFound') {
        return null;
      }
      throw e;
    }
  },

  getScriptExecutionDetail : function(resourceGroupName, clusterName, scriptExecutionId, _) {
    var subscription = profile.current.getSubscription(this.subscription);
    var client = utils.createHDInsightManagementClient(subscription);
    return client.clusters.getScriptExecutionDetail(resourceGroupName, clusterName, scriptExecutionId, _);
  },

  promoteScript : function(resourceGroupName, clusterName, scriptExecutionId, _) {
    var subscription = profile.current.getSubscription(this.subscription);
    var client = utils.createHDInsightManagementClient(subscription);
    return client.clusters.promoteScript(resourceGroupName, clusterName, scriptExecutionId, _);
  },

  deletePersistedScript : function(resourceGroupName, clusterName, scriptName, _) {
    var subscription = profile.current.getSubscription(this.subscription);
    var client = utils.createHDInsightManagementClient(subscription);
    return client.clusters.deletePersistedScript(resourceGroupName, clusterName, scriptName, _);
  },

  executeScriptActions : function(resourceGroupName, clusterName, executeScriptActionParameters, _) {
    try {
      var subscription = profile.current.getSubscription(this.subscription);
      var client = utils.createHDInsightManagementClient(subscription);
      return client.clusters.executeScriptActions(resourceGroupName, clusterName, executeScriptActionParameters, _);
    } catch (e) {
      if (e.code === 'ResourceNotFound' || e.code === 'NotFound') {
        return null;
      }
      throw e;
    }
  },

  enableHttp: function(resourceGroupName, clusterName, userName, password, _) {
    try {
      var subscription = profile.current.getSubscription(this.subscription);
      var client = utils.createHDInsightManagementClient(subscription);
      var httpSettingsParameters = {
        httpUserEnabled: true,
        httpUsername: userName,
        httpPassword: password
      };
      return client.clusters.configureHttpSettings(resourceGroupName, clusterName, httpSettingsParameters, _);
    } catch (e) {
      if (e.code === 'ResourceNotFound' || e.code === 'NotFound') {
        return null;
      }
      throw e;
    }
  },

  disableHttp: function(resourceGroupName, clusterName, _) {
    try {
      var subscription = profile.current.getSubscription(this.subscription);
      var client = utils.createHDInsightManagementClient(subscription);
      var httpSettingsParameters = {
        httpUserEnabled: false
      };
      return client.clusters.configureHttpSettings(resourceGroupName, clusterName, httpSettingsParameters, _);
    } catch (e) {
      if (e.code === 'ResourceNotFound' || e.code === 'NotFound') {
        return null;
      }
      throw e;
    }
  },

  enableRdp: function(resourceGroupName, clusterName, rdpUserName, rdpPassword, rdpExpiryDate, _) {
    try {
      var subscription = profile.current.getSubscription(this.subscription);
      var client = utils.createHDInsightManagementClient(subscription);
      var rdpSettingsParameters = {
        osProfile: {
          windowsOperatingSystemProfile: {
            rdpSettings: {
              userName: rdpUserName,
              password: rdpPassword,
              expiryDate: rdpExpiryDate
            }
          }
        }
      };
      return client.clusters.configureRdpSettings(resourceGroupName, clusterName, rdpSettingsParameters, _);
    } catch (e) {
      if (e.code === 'ResourceNotFound' || e.code === 'NotFound') {
        return null;
      }
      throw e;
    }
  },

  disableRdp: function(resourceGroupName, clusterName, _) {
    try {
      var subscription = profile.current.getSubscription(this.subscription);
      var client = utils.createHDInsightManagementClient(subscription);
      var rdpSettingsParameters = {
        osProfile: {
          windowsOperatingSystemProfile: {
            rdpSettings: null
          }
        }
      };
      return client.clusters.configureRdpSettings(resourceGroupName, clusterName, rdpSettingsParameters, _);
    } catch (e) {
      if (e.code === 'ResourceNotFound' || e.code === 'NotFound') {
        return null;
      }
      throw e;
    }
  },

  createConfigFile: function(configFilePath) {
    var configClient = new HdiConfigClient(this.cli);
    var result = configClient.createConfigFile(configFilePath);
    return result;
  },

  addConfigValue: function(configFilePath, options) {
    var configClient = new HdiConfigClient(this.cli);
    var result = configClient.addConfigValue(configFilePath, options);
    return result;
  },

  addScriptAction: function(configFilePath, options) {
    var configClient = new HdiConfigClient(this.cli);
    var result = configClient.addScriptAction(configFilePath, options);
    return result;
  }
});

module.exports = HdiClient;