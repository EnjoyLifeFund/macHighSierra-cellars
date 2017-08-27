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
var constants = require('./constants');
var fs = require('fs');
var profile = require('../../../util/profile');
var PublicIp = require('./publicIPAddress.helper');
var resourceUtils = require('../resource/resourceUtils');
var Subnet = require('./subnet');
var tagUtils = require('../tag/tagUtils');
var util = require('util');
var utils = require('../../../util/utils');
var VNetUtil = require('../../../util/vnet.util');
var $ = utils.getLocaleString;

function AppGateways(cli, networkManagementClient) {
  this.interaction = cli.interaction;
  this.networkManagementClient = networkManagementClient;
  this.output = cli.output;
  this.publicIpCrud = new PublicIp(cli, networkManagementClient);
  this.subnetCrud = new Subnet(cli, networkManagementClient);
  this.vnetUtil = new VNetUtil();
}

__.extend(AppGateways.prototype, {
  createAppGateway: function (resourceGroup, appGatewayName, location, options, _) {
    var self = this;
    var appGateway = self.get(resourceGroup, appGatewayName, _);
    if (appGateway) {
      throw new Error(util.format($('Application gateway "%s" already exists in resource group "%s"'), appGatewayName, resourceGroup));
    }
    var subnetId;
    if (options.subnetId) {
      subnetId = options.subnetId;
    } else {
      var subnet = self.subnetCrud.get(resourceGroup, options.vnetName, options.subnetName, _);
      if (!subnet) {
        throw new Error(util.format($('Subnet "%s" not found in virtual network "%s"'), options.subnetName, options.vnetName));
      }
      subnetId = subnet.id;
    }

    var parameters = self._setDefaultAttributes(options);
    self.subscriptionId = self._getSubscriptionId(options);
    var frontendIpID = self._generateResourceId(resourceGroup, appGatewayName, 'frontendIPConfigurations', parameters.frontendIpName);
    var frontendPortID = self._generateResourceId(resourceGroup, appGatewayName, 'frontendPorts', parameters.frontendPortName);
    var poolID = self._generateResourceId(resourceGroup, appGatewayName, 'backendAddressPools', parameters.addressPoolName);
    var settingsID = self._generateResourceId(resourceGroup, appGatewayName, 'backendHttpSettingsCollection', parameters.httpSettingsName);
    var listenerID = self._generateResourceId(resourceGroup, appGatewayName, 'httpListeners', parameters.httpListenerName);

    appGateway = {
      name: appGatewayName,
      location: location,
      gatewayIPConfigurations: [{
        name: parameters.gatewayIpName,
        subnet: {id: subnetId}
      }],
      frontendPorts: [{
        name: parameters.frontendPortName,
        port: parseInt(parameters.frontendPort)
      }],
      backendAddressPools: [{
        name: parameters.addressPoolName,
        backendAddresses: self._parseDnsServers(options),
        backendIPConfiguration: []
      }],
      backendHttpSettingsCollection: [{
        name: parameters.httpSettingsName,
        protocol: parameters.httpSettingsProtocol,
        port: parseInt(parameters.httpSettingsPort),
        cookieBasedAffinity: parameters.httpSettingsCookieBasedAffinity
      }],
      httpListeners: [{
        name: parameters.httpListenerName,
        frontendIPConfiguration: {id: frontendIpID},
        frontendPort: {id: frontendPortID},
        protocol: parameters.httpListenerProtocol
      }],
      requestRoutingRules: [{
        name: parameters.routingRuleName,
        ruleType: parameters.routingRuleType,
        backendAddressPool: {id: poolID},
        backendHttpSettings: {id: settingsID},
        httpListener: {id: listenerID}
      }]
    };
    if (parameters.skuName) {
      utils.verifyParamExistsInCollection(constants.appGateway.sku.name, parameters.skuName, '--sku-name');
      appGateway.sku = {
        name: parameters.skuName
      };
    }
    if (options.skuTier) {
      utils.verifyParamExistsInCollection(constants.appGateway.sku.tier, parameters.skuTier, '--sku-tier');
      appGateway.sku.tier = parameters.skuTier;
    }
    if (options.capacity) {
      var capacity = parseInt(options.capacity);
      if (capacity >= constants.appGateway.sku.capacity[0] && capacity <= constants.appGateway.sku.capacity[1]) {
        appGateway.sku.capacity = capacity;
      } else {
        throw new Error(util.format($('Given %s "%s" is invalid, supported values are: \[%s\]'), '--capacity', options.capacity, constants.appGateway.sku.capacity));
      }
    }

    appGateway.frontendIPConfigurations = [];
    appGateway.frontendIPConfigurations.push(self._parseFrontendIp(resourceGroup, appGatewayName, parameters.frontendIpName, parameters, _));

    if (parameters.certFile) {
      appGateway.sslCertificates = [];
      var data = fs.readFileSync(parameters.certFile);
      appGateway.sslCertificates.push({
        name: parameters.certName,
        password: parameters.certPassword,
        data: data.toString('base64')
      });
      var certID = self._generateResourceId(resourceGroup, appGatewayName, 'sslCertificates', parameters.certName);
      appGateway.httpListeners[0].sslCertificate = {
        id: certID
      };
    }

    if (utils.argHasValue(options.tags)) {
      tagUtils.appendTags(appGateway, options);
    } else {
      appGateway.tags = {};
    }

    var progress = self.interaction.progress(util.format($('Creating configuration for an application gateway "%s"'), appGatewayName));
    var createdAppGateway;
    try {
      createdAppGateway = self.networkManagementClient.applicationGateways.createOrUpdate(resourceGroup, appGatewayName, appGateway, _);
    } finally {
      progress.end();
    }
    self._showAppGateway(createdAppGateway);
  },

  setAppGateway: function (resourceGroup, appGatewayName, options, _) {
    var self = this;
    var appGateway = self.get(resourceGroup, appGatewayName, _);
    if (!appGateway) {
      throw new Error(util.format($('Application gateway "%s" not found in resource group "%s"'), appGatewayName, resourceGroup));
    }

    if (options.skuName) {
      utils.verifyParamExistsInCollection(constants.appGateway.sku.name, options.skuName, '--sku-name');
      appGateway.sku.name = options.skuName;
    }
    if (options.skuTier) {
      utils.verifyParamExistsInCollection(constants.appGateway.sku.tier, options.skuTier, '--sku-tier');
      appGateway.sku.tier = options.skuTier;
    }
    if (options.capacity) {
      var capacity = parseInt(options.capacity);
      if (capacity >= constants.appGateway.sku.capacity[0] && capacity <= constants.appGateway.sku.capacity[1]) {
        appGateway.sku.capacity = capacity;
      } else {
        throw new Error(util.format($('Given %s "%s" is invalid, supported values are: \[%s\]'), '--capacity', options.capacity, constants.appGateway.sku.capacity));
      }
    }
    if (utils.argHasValue(options.tags)) {
      tagUtils.appendTags(appGateway, options);
    }

    self.output.warn('Application gateway set command is a long-running process. It may take up to 15-20 minutes to complete.');
    self._setAppGateway(resourceGroup, appGatewayName, appGateway, options, _);
  },

  get: function (resourceGroup, appGatewayName, _) {
    var self = this;
    var appGateway;
    var progress = self.interaction.progress(util.format($('Looking up an application gateway "%s"'), appGatewayName));
    try {
      appGateway = self.networkManagementClient.applicationGateways.get(resourceGroup, appGatewayName, null, _);
    } catch (error) {
      if (error.statusCode === 404) {
        appGateway = null;
      }
    } finally {
      progress.end();
    }
    return appGateway;
  },

  addUrlPathMap: function (resourceGroup, appGatewayName, urlPathMapName, options, _) {
    var self = this;
    var appGateway = self.get(resourceGroup, appGatewayName, _);
    if (!appGateway) {
      throw new Error(util.format($('Application gateway "%s" not found'), appGatewayName));
    }

    if (utils.findFirstCaseIgnore(appGateway.urlPathMaps, {name: urlPathMapName})) {
      throw new Error(util.format($('An url path map with name "%s" already exists in application gateway "%s"'), urlPathMapName, appGatewayName));
    }

    var backendHttpSettings = utils.findFirstCaseIgnore(appGateway.backendHttpSettingsCollection, {name: options.httpSettingsName});
    if (!backendHttpSettings) {
      throw new Error(util.format($('A backend http settings with name "%s" not found in application gateway "%s"'), options.httpSettingsName, appGatewayName));
    }

    var backendAddressPool = utils.findFirstCaseIgnore(appGateway.backendAddressPools, {name: options.addressPoolName});
    if (!backendAddressPool) {
      throw new Error(util.format($('Address pool with name "%s" not found for an application gateway "%s"'), options.addressPoolName, appGatewayName));
    }

    var urlPathMap = {
      name: urlPathMapName,
      defaultBackendAddressPool: {
        id: backendAddressPool.id
      },
      defaultBackendHttpSettings: {
        id: backendHttpSettings.id
      },
      pathRules: [{
        name: options.ruleName,
        paths: [options.path],
        backendAddressPool: {id: backendAddressPool.id},
        backendHttpSettings: {id: backendHttpSettings.id}
      }]
    };

    appGateway.urlPathMaps.push(urlPathMap);
    self._setAppGateway(resourceGroup, appGatewayName, appGateway, options, _);
  },

  setUrlPathMap: function (resourceGroup, appGatewayName, urlPathMapName, options, _) {
    var self = this;
    var appGateway = self.get(resourceGroup, appGatewayName, _);
    if (!appGateway) {
      throw new Error(util.format($('Application gateway "%s" not found'), appGatewayName));
    }

    var urlPathMap = utils.findFirstCaseIgnore(appGateway.urlPathMaps, {name: urlPathMapName});
    if (!urlPathMap) {
      throw new Error(util.format($('An url path map with name "%s" not found in application gateway "%s"'), urlPathMapName, appGatewayName));
    }

    if (options.httpSettingsName) {
      var backendHttpSettings = utils.findFirstCaseIgnore(appGateway.backendHttpSettingsCollection, {name: options.httpSettingsName});
      if (!backendHttpSettings) {
        throw new Error(util.format($('A backend http settings with name "%s" not found in application gateway "%s"'), options.httpSettingsName, appGatewayName));
      }
      urlPathMap.defaultBackendHttpSettings = { id: backendHttpSettings.id };
    }

    if (options.addressPoolName) {
      var backendAddressPool = utils.findFirstCaseIgnore(appGateway.backendAddressPools, {name: options.addressPoolName});
      if (!backendAddressPool) {
        throw new Error(util.format($('Address pool with name "%s" not found for an application gateway "%s"'), options.addressPoolName, appGatewayName));
      }
      urlPathMap.defaultBackendAddressPool = { id: backendAddressPool.id };
    }

    if (options.defaultRedirectConfigurationName) {
      var redirectConfiguration = utils.findFirstCaseIgnore(appGateway.redirectConfigurations, {name: options.defaultRedirectConfigurationName});
      if (!redirectConfiguration) {
        throw new Error(util.format($('Redirect configuration with name "%s" not found for an application gateway "%s"'), options.defaultRedirectConfigurationName, appGatewayName));
      }
      urlPathMap.defaultRedirectConfiguration = { id: redirectConfiguration.id };
    }

    self._setAppGateway(resourceGroup, appGatewayName, appGateway, options, _);
  },

  listUrlPathMaps: function (resourceGroup, appGatewayName, options, _) {
    var self = this;

    var appGateway = self.get(resourceGroup, appGatewayName, _);
    if (!appGateway) {
      throw new Error(util.format($('Application gateway "%s" not found'), appGatewayName));
    }

    self._listAppGatewayUrlPathMaps(appGateway);
  },

  showUrlPathMap: function (resourceGroup, appGatewayName, urlPathMapName, options, _) {
    var self = this;

    var appGateway = self.get(resourceGroup, appGatewayName, _);
    if (!appGateway) {
      throw new Error(util.format($('Application gateway "%s" not found'), appGatewayName));
    }

    var urlPathMap = utils.findFirstCaseIgnore(appGateway.urlPathMaps, {name: urlPathMapName});
    if (!urlPathMap) {
      throw new Error(util.format($('An url path map with name "%s" not found in application gateway "%s"'), urlPathMapName, appGatewayName));
    }
    self._showAppGatewayUrlPathMap(urlPathMap);
  },

  removeUrlPathMap: function (resourceGroup, appGatewayName, urlPathMapName, options, _) {
    var self = this;
    var appGateway = self.get(resourceGroup, appGatewayName, _);
    if (!appGateway) {
      throw new Error(util.format($('Application gateway "%s" not found'), appGatewayName));
    }

    var index = utils.indexOfCaseIgnore(appGateway.urlPathMaps, {name: urlPathMapName});
    if (index === -1) {
      throw new Error(util.format($('An url path map with name "%s" not found in application gateway "%s"'), urlPathMapName, appGatewayName));
    }

    if (!options.quiet && !self.interaction.confirm(util.format($('Delete url path map "%s"? [y/n] '), urlPathMapName), _)) {
      return;
    }
    appGateway.urlPathMaps.splice(index, 1);
    self._setAppGateway(resourceGroup, appGatewayName, appGateway, options, _);
  },

  addMapRule: function (resourceGroup, appGatewayName, ruleName, options, _) {
    var self = this;
    var appGateway = self.get(resourceGroup, appGatewayName, _);
    if (!appGateway) {
      throw new Error(util.format($('Application gateway "%s" not found'), appGatewayName));
    }

    var urlPathMap = utils.findFirstCaseIgnore(appGateway.urlPathMaps, {name: options.urlPathMapName});
    if (!urlPathMap) {
      throw new Error(util.format($('An url path map with name "%s" not found in application gateway "%s"'), options.urlPathMapName, appGatewayName));
    }

    if (utils.findFirstCaseIgnore(urlPathMap.pathRules, {name: ruleName})) {
      throw new Error(util.format($('A rule with name "%s" already exists in url path map "%s"'), ruleName, options.urlPathMapName));
    }

    var rule = {
      name: ruleName,
      paths: [options.path]
    };

    if (options.httpSettingsName) {
      var backendHttpSettings = utils.findFirstCaseIgnore(appGateway.backendHttpSettingsCollection, {name: options.httpSettingsName});
      if (!backendHttpSettings) {
        throw new Error(util.format($('A backend http settings with name "%s" not found in application gateway "%s"'), options.httpSettingsName, appGatewayName));
      }
      rule.backendHttpSettings = {id: backendHttpSettings.id};
    }

    if (options.backendAddressPool) {
      var backendAddressPool = utils.findFirstCaseIgnore(appGateway.backendAddressPools, {name: options.addressPoolName});
      if (!backendAddressPool) {
        throw new Error(util.format($('Address pool with name "%s" not found for an application gateway "%s"'), options.addressPoolName, appGatewayName));
      }
      rule.backendAddressPool =  {id: backendAddressPool.id};
    }

    if (options.redirectConfigurationName) {
      var redirectConfiguration = utils.findFirstCaseIgnore(appGateway.redirectConfigurations, {name: options.redirectConfigurationName});
      if (!redirectConfiguration) {
        throw new Error(util.format($('Redirect configuration with name "%s" not found for an application gateway "%s"'), options.redirectConfigurationName, appGatewayName));
      }
      rule.redirectConfiguration = { id: redirectConfiguration.id };
    }

    urlPathMap.pathRules.push(rule);
    self._setAppGateway(resourceGroup, appGatewayName, appGateway, options, _);
  },

  setMapRule: function (resourceGroup, appGatewayName, ruleName, options, _) {
    var self = this;
    var appGateway = self.get(resourceGroup, appGatewayName, _);
    if (!appGateway) {
      throw new Error(util.format($('Application gateway "%s" not found'), appGatewayName));
    }

    var urlPathMap = utils.findFirstCaseIgnore(appGateway.urlPathMaps, {name: options.urlPathMapName});
    if (!urlPathMap) {
      throw new Error(util.format($('An url path map with name "%s" not found in application gateway "%s"'), options.urlPathMapName, appGatewayName));
    }

    var rule = utils.findFirstCaseIgnore(urlPathMap.pathRules, {name: ruleName});
    if (!rule) {
      throw new Error(util.format($('A rule with name "%s" not found in url path map "%s"'), ruleName, options.urlPathMapName));
    }

    if (options.httpSettingsName) {
      var backendHttpSettings = utils.findFirstCaseIgnore(appGateway.backendHttpSettingsCollection, {name: options.httpSettingsName});
      if (!backendHttpSettings) {
        throw new Error(util.format($('A backend http settings with name "%s" not found in application gateway "%s"'), options.httpSettingsName, appGatewayName));
      }
      rule.backendHttpSettings = { id: backendHttpSettings.id };
    }

    if (options.addressPoolName) {
      var backendAddressPool = utils.findFirstCaseIgnore(appGateway.backendAddressPools, {name: options.addressPoolName});
      if (!backendAddressPool) {
        throw new Error(util.format($('Address pool with name "%s" not found for an application gateway "%s"'), options.addressPoolName, appGatewayName));
      }
      rule.backendAddressPool = { id: backendAddressPool.id };
    }

    if (options.redirectConfigurationName) {
      var redirectConfiguration = utils.findFirstCaseIgnore(appGateway.redirectConfigurations, {name: options.redirectConfigurationName});
      if (!redirectConfiguration) {
        throw new Error(util.format($('Redirect configuration with name "%s" not found for an application gateway "%s"'), options.redirectConfigurationName, appGatewayName));
      }
      rule.redirectConfiguration = { id: redirectConfiguration.id };
    }

    self._setAppGateway(resourceGroup, appGatewayName, appGateway, options, _);
  },

  listUrlPathMapRules: function (resourceGroup, appGatewayName, urlPathMapName, options, _) {
    var self = this;

    var appGateway = self.get(resourceGroup, appGatewayName, _);
    if (!appGateway) {
      throw new Error(util.format($('Application gateway "%s" not found'), appGatewayName));
    }

    var urlPathMap = utils.findFirstCaseIgnore(appGateway.urlPathMaps, {name: urlPathMapName});
    if (!urlPathMap) {
      throw new Error(util.format($('An url path map with name "%s" not found in application gateway "%s"'), urlPathMapName, appGatewayName));
    }

    self._listAppGatewayUrlPathMapRules(urlPathMap.pathRules);
  },

  showUrlPathMapRule: function (resourceGroup, appGatewayName, urlPathMapName, ruleName, options, _) {
    var self = this;

    var appGateway = self.get(resourceGroup, appGatewayName, _);
    if (!appGateway) {
      throw new Error(util.format($('Application gateway "%s" not found'), appGatewayName));
    }

    var urlPathMap = utils.findFirstCaseIgnore(appGateway.urlPathMaps, {name: urlPathMapName});
    if (!urlPathMap) {
      throw new Error(util.format($('An url path map with name "%s" not found in application gateway "%s"'), urlPathMapName, appGatewayName));
    }

    var rule = utils.findFirstCaseIgnore(urlPathMap.pathRules, {name: ruleName});
    if (!rule) {
      throw new Error(util.format($('An url path map with name "%s" doesn\'t contain rule with name "%s"'), urlPathMapName, ruleName));
    }
    self._showAppGatewayUrlPathMapRule(rule);
  },

  removeMapRule: function (resourceGroup, appGatewayName, ruleName, options, _) {
    var self = this;
    var appGateway = self.get(resourceGroup, appGatewayName, _);
    if (!appGateway) {
      throw new Error(util.format($('Application gateway "%s" not found'), appGatewayName));
    }

    var urlPathMap = utils.findFirstCaseIgnore(appGateway.urlPathMaps, {name: options.urlPathMapName});
    if (!urlPathMap) {
      throw new Error(util.format($('An url path map with name "%s" not found in application gateway "%s"'), options.urlPathMapName, appGatewayName));
    }

    var index = utils.indexOfCaseIgnore(urlPathMap.pathRules, {name: ruleName});
    if (index === -1) {
      throw new Error(util.format($('A rule with name "%s" not found in url path map "%s"'), ruleName, options.urlPathMapName));
    }

    if (!options.quiet && !self.interaction.confirm(util.format($('Delete url path map rule "%s"? [y/n] '), ruleName), _)) {
      return;
    }
    urlPathMap.pathRules.splice(index, 1);
    self._setAppGateway(resourceGroup, appGatewayName, appGateway, options, _);
  },

  createDisabledRuleGroup: function (resourceGroup, appGatewayName, options, _) {
    var self = this;
    var result = self.get(resourceGroup, appGatewayName, _);
    if (!result) {
      throw new Error(util.format($('application gateway with name "%s" not found in the resource group "%s"'),
        appGatewayName, resourceGroup));
    }

    var wafConfig = result.webApplicationFirewallConfiguration;
    if (!wafConfig) {
      throw new Error(util.format($('WAF config not found for application gateway with name "%s" in resource group "%s"'),
        appGatewayName, resourceGroup));
    }

    if (!wafConfig.disabledRuleGroups) {
      wafConfig.disabledRuleGroups = [];
    }

    var disabledRuleGroup = utils.findFirstCaseIgnore(wafConfig.disabledRuleGroups, {ruleGroupName: options.ruleGroupName});
    if (disabledRuleGroup) {
      throw new Error(util.format($('rule group with name "%s" already exists', options.ruleGroupName)));
    }

    wafConfig.disabledRuleGroups.push({
      ruleGroupName: options.ruleGroupName,
      rules: options.rules ? options.rules.split(',').map(utils.parseInt) : null
    });

    var progress = self.interaction.progress(util.format($('Adding new disabled rule group to application gateway ' +
      'WAF configuration in "%s"'), appGatewayName));
    try {
      result = self.networkManagementClient.applicationGateways.createOrUpdate(resourceGroup, appGatewayName, result, _);
    } finally {
      progress.end();
    }

    self._showAppGatewayWAFConfig(wafConfig);
  },

  setDisabledRuleGroup: function (resourceGroup, appGatewayName, options, _) {
    var self = this;
    var result = self.get(resourceGroup, appGatewayName, _);
    if (!result) {
      throw new Error(util.format($('application gateway with name "%s" not found in the resource group "%s"'),
        appGatewayName, resourceGroup));
    }

    var wafConfig = result.webApplicationFirewallConfiguration;
    if (!wafConfig) {
      throw new Error(util.format($('WAF config not found for application gateway with name "%s" in resource group "%s"'),
        appGatewayName, resourceGroup));
    }

    var disabledRuleGroup = utils.findFirstCaseIgnore(wafConfig.disabledRuleGroups, {ruleGroupName: options.ruleGroupName});
    if (!disabledRuleGroup) {
      throw new Error(util.format($('rule group with name "%s" is not found', options.ruleGroupName)));
    }

    disabledRuleGroup.rules = options.rules ? options.rules.split(',').map(utils.parseInt) : null;

    var progress = self.interaction.progress(util.format($('Updating disabled rule group "%s" in application gateway ' +
      'WAF configuration in "%s"'), options.ruleGroupName, appGatewayName));
    try {
      result = self.networkManagementClient.applicationGateways.createOrUpdate(resourceGroup, appGatewayName, result, _);
    } finally {
      progress.end();
    }

    self._showAppGatewayWAFConfig(wafConfig);
  },

  showDisabledRuleGroup: function (resourceGroup, appGatewayName, options, _) {
    var self = this;
    var result = self.get(resourceGroup, appGatewayName, _);
    if (!result) {
      throw new Error(util.format($('application gateway with name "%s" not found in the resource group "%s"'),
        appGatewayName, resourceGroup));
    }

    var wafConfig = result.webApplicationFirewallConfiguration;
    if (!wafConfig) {
      throw new Error(util.format($('WAF config not found for application gateway with name "%s" in resource group "%s"'),
        appGatewayName, resourceGroup));
    }

    var disabledRuleGroup = utils.findFirstCaseIgnore(wafConfig.disabledRuleGroups, {ruleGroupName: options.ruleGroupName});
    if (!disabledRuleGroup) {
      throw new Error(util.format($('rule group with name "%s" is not disabled', options.ruleGroupName)));
    }

    self.interaction.formatOutput(disabledRuleGroup, function (group) {
      self.output.nameValue($('Group name'), group.ruleGroupName);
      self.output.nameValue($('Disabled rules'), group.rules ? group.rules.join(', ') : 'All rules are disabled');  
    });
  },

  listDisabledRuleGroups: function (resourceGroup, appGatewayName, options, _) {
    var self = this;
    var result = self.get(resourceGroup, appGatewayName, _);
    if (!result) {
      throw new Error(util.format($('application gateway with name "%s" not found in the resource group "%s"'),
        appGatewayName, resourceGroup));
    }

    var wafConfig = result.webApplicationFirewallConfiguration;
    if (!wafConfig) {
      throw new Error(util.format($('WAF config not found for application gateway with name "%s" in resource group "%s"'),
        appGatewayName, resourceGroup));
    }

    self._listAppGatewayDisabledRuleGroup(wafConfig);
  },

  deleteDisabledRuleGroup: function (resourceGroup, appGatewayName, options, _) {
    var self = this;
    var result = self.get(resourceGroup, appGatewayName, _);
    if (!result) {
      throw new Error(util.format($('application gateway with name "%s" not found in the resource group "%s"'),
        appGatewayName, resourceGroup));
    }

    var wafConfig = result.webApplicationFirewallConfiguration;
    if (!wafConfig) {
      throw new Error(util.format($('WAF config not found for application gateway with name "%s" in resource group "%s"'),
        appGatewayName, resourceGroup));
    }

    var disabledRuleGroup = utils.findFirstCaseIgnore(wafConfig.disabledRuleGroups, {ruleGroupName: options.ruleGroupName});
    if (!disabledRuleGroup) {
      throw new Error(util.format($('rule group with name "%s" is not found', options.ruleGroupName)));
    }

    if (!options.quiet && !self.interaction.confirm(util.format($('Delete disabled rule group "%s"? [y/n] '), disabledRuleGroup.ruleGroupName), _)) {
      return;
    }

    wafConfig.disabledRuleGroups.splice(wafConfig.disabledRuleGroups.indexOf(disabledRuleGroup), 1);

    var progress = self.interaction.progress(util.format($('Deleting disabled rule group "%s" from application gateway ' +
      'WAF configuration in "%s"'), disabledRuleGroup.ruleGroupName, appGatewayName));
    try {
      result = self.networkManagementClient.applicationGateways.createOrUpdate(resourceGroup, appGatewayName, result, _);
    } finally {
      progress.end();
    }

    self._showAppGatewayWAFConfig(wafConfig);
  },

  listAvailableSslOptions: function (options, _) {
    var self = this;
    var result;

    var progress = self.interaction.progress($('Getting list of all available SSL options'));
    try {
      result = self.networkManagementClient.applicationGateways.listAvailableSslOptions(_);
    } finally {
      progress.end();
    }

    self._listAppGatewayAvailableSslOptions(result);
  },

  getSslPredefinedPolicy: function (name, options, _) {
    var self = this;
    var result;

    var progress = self.interaction.progress(util.format($('Getting details of Ssl predefined policy with the name "%s"'), name));
    try {
      result = self.networkManagementClient.applicationGateways.getSslPredefinedPolicy(name, _);
    } finally {
      progress.end();
    }

    self._showAppGatewayPredefinedPolicy(result);
  },

  listSslPredefinedPolicies: function (options, _) {
    var self = this;
    var result;

    var progress = self.interaction.progress($('Getting list of all Ssl predefined policies'));
    try {
      result = self.networkManagementClient.applicationGateways.listAvailableSslPredefinedPolicies(_);
    } finally {
      progress.end();
    }

    self._listAppGatewayPredefinedPolicies(result);
  },

  _generateResourceId: function (resourceGroup, appGatewayName, resourceType, resourceName) {
    var id = '';
    id += '/subscriptions/';
    id += encodeURIComponent(this.subscriptionId);
    id += '/resourceGroups/';
    id += encodeURIComponent(resourceGroup);
    id += '/providers/';
    id += 'Microsoft.Network';
    id += '/applicationGateways/';
    id += encodeURIComponent(appGatewayName);
    id += util.format($('/%s'), resourceType);
    id += util.format($('/%s'), resourceName);
    return id;
  },

  _getAttributeNames: function (list) {
    var namesString = '[';
    var counter = 0;
    list.forEach(function (item) {
      if (counter > 0) {
        namesString += ', ';
      }
      namesString += item.name;
      counter++;
    });
    namesString += ']';
    return namesString;
  },

  _getSubscriptionId: function (options) {
    var subscription = profile.current.getSubscription(options.subscription);
    var client = utils.createResourceClient(subscription);
    return client.credentials.subscriptionId;
  },

  _listAppGatewayAddressPools: function (appGateway, indent) {
    var self = this;

    if (!indent) indent = 0;
    self.interaction.formatOutput(appGateway.backendAddressPools, function (pools) {
      var formattedPools = [];
      var index = 0;
      pools.forEach(function (pool) {
        formattedPools.push({name: pool.name, ips: []});
        pool.backendAddresses.forEach(function (ip) {
          formattedPools[index].ips.push(ip.ipAddress);
        });
        index++;
      });

      formattedPools.forEach(function (item) {
        self.output.nameValue($('Name'), item.name, indent);
        self.output.header($('IP Addresses'), indent);
        self.output.list(item.ips, indent + 2);
        self.output.data($(''), '');
      });
    });
  },

  _listAppGatewayAvailableSslOptions: function (options, indent) {
    var self = this;

    if (!indent) indent = 0;
    self.interaction.formatOutput(options, function (options) {
      self.output.nameValue($('Default Policy'), options.defaultPolicy, indent);

      self.output.header($('Predefined Policies'), indent);
      var policies = options.predefinedPolicies.map(function (policy) {
        var split = policy.id.split('/');
        return split[split.length - 1];
      });
      self.output.list(policies, indent + 2);

      self.output.header($('Available Protocols'), indent);
      self.output.list(options.availableProtocols, indent + 2);

      self.output.header($('Available Cipher Suites'), indent);
      self.output.list(options.availableCipherSuites, indent + 2);
      
      self.output.data($(''), '');
    });
  },

  _listAppGatewayDisabledRuleGroup: function (wafConfig, indent) {
    var self = this;

    if (!indent) indent = 0;
    self.interaction.formatOutput(wafConfig.disabledRuleGroups, function (disabledRuleGroups) {
      if (!disabledRuleGroups || disabledRuleGroups.length === 0) {
        self.output.warn($('No disabled rule groups'));
      } else {
        disabledRuleGroups.forEach(function (group) {
          self.output.nameValue($('Group name'), group.ruleGroupName, indent);
          self.output.nameValue($('Disabled rules'), group.rules ? group.rules.join(', ') : 'All rules are disabled', indent);
          self.output.data($(''), '');
        });
      }
    });
  },

  _listAppGatewayFrontendIpConfigs: function (appGateway, indent) {
    var self = this;

    if (!indent) indent = 0;
    self.interaction.formatOutput(appGateway.frontendIPConfigurations, function (frontendPorts) {
      frontendPorts.forEach(function (item) {
        self.output.nameValue($('Name'), item.name, indent);
        self.output.nameValue($('Allocation method'), item.privateIPAllocationMethod, indent);
        self.output.nameValue($('Private IP address'), item.privateIPAddress, indent);
        self.output.data($(''), '');
      });
    });
  },

  _listAppGatewayFrontendPorts: function (appGateway, indent) {
    var self = this;

    if (!indent) indent = 0;
    self.interaction.formatOutput(appGateway.frontendPorts, function (frontendPorts) {
      frontendPorts.forEach(function (item) {
        self.output.nameValue($('Name'), item.name, indent);
        self.output.nameValue($('Port'), item.port, indent);
        self.output.data($(''), '');
      });
    });
  },

  _listAppGatewayHttpListeners: function (appGateway, indent) {
    var self = this;

    if (!indent) indent = 0;
    self.interaction.formatOutput(appGateway.httpListeners, function (listeners) {
      listeners.forEach(function (listener) {
        self._showAppGatewayHttpListener(listener, indent);
      });
    });
  },

  _listAppGatewayHttpSettings: function (appGateway, indent) {
    var self = this;

    if (!indent) indent = 0;
    self.interaction.formatOutput(appGateway.backendHttpSettingsCollection, function (httpSettings) {
      httpSettings.forEach(function (item) {
        self.output.nameValue($('Name'), item.name, indent);
        self.output.nameValue($('Protocol'), item.protocol, indent);
        self.output.nameValue($('Port'), item.port, indent);
        self.output.nameValue($('Timeout'), item.requestTimeout, indent);
        self.output.nameValue($('Cookie Based Affinity'), item.cookieBasedAffinity, indent);
        self.output.data($(''), '');
      });
    });
  },

  _listAppGatewayPredefinedPolicies: function (policies, indent) {
    var self = this;

    if (!indent) indent = 0;
    self.interaction.formatOutput(policies, function (policies) {
      policies.forEach(function (policy) {
        self._showAppGatewayPredefinedPolicy(policy, indent);
      });
    });
  },

  _listAppGatewayProbes: function (appGateway, indent) {
    var self = this;

    if (!indent) indent = 0;
    self.interaction.formatOutput(appGateway.probes, function (probes) {
      probes.forEach(function (item) {
        self.output.nameValue($('Name'), item.name, indent);
        self.output.nameValue($('Protocol'), item.protocol, indent);
        self.output.nameValue($('Host'), item.host, indent);
        self.output.nameValue($('Path'), item.path, indent);
        self.output.nameValue($('Interval'), item.interval, indent);
        self.output.nameValue($('Timeout'), item.timeout, indent);
        self.output.nameValue($('Unhealthy Threshold'), item.unhealthyThreshold, indent);
        self.output.data($(''), '');
      });
    });
  },

  _listAppGatewayRoutingRules: function (appGateway, indent) {
    var self = this;

    if (!indent) indent = 0;
    self.interaction.formatOutput(appGateway.requestRoutingRules, function (routingRules) {
      routingRules.forEach(function (item) {
        var listener = resourceUtils.getResourceInformation(item.httpListener.id);
        self.output.nameValue($('Name'), item.name, indent);
        self.output.nameValue($('Rule Type'), item.ruleType, indent);
        self.output.nameValue($('Listener'), listener.resourceName, indent);
        self.output.data($(''), '');
      });
    });
  },

  _listAppGatewaySslCerificates: function (appGateway, indent) {
    var self = this;

    if (!indent) indent = 0;
    self.interaction.formatOutput(appGateway.sslCertificates, function (sslCerts) {
      sslCerts.forEach(function (item) {
        self.output.nameValue($('Name'), item.name, indent);
        self.output.nameValue($('Provisioning State'), item.provisioningState, indent);
        self.output.data($(''), '');
      });
    });
  },

  _listAppGatewayUrlPathMaps: function (appGateway, indent) {
    var self = this;

    if (!indent) indent = 0;
    self.interaction.formatOutput(appGateway.urlPathMaps, function (urlPathMaps) {
      urlPathMaps.forEach(function (urlPathMap) {
        self._showAppGatewayUrlPathMap(urlPathMap, indent);
      });
    });
  },

  _listAppGatewayUrlPathMapRules: function (rules, indent) {
    var self = this;

    if (!indent) indent = 0;
    self.interaction.formatOutput(rules, function (rules) {
      if (rules.length > 0) {
        self.output.header($('Rules'), indent);
        indent += 2;
        rules.forEach(function (rule) {
          self._showAppGatewayUrlPathMapRule(rule, indent);
        });
      }
    });
  },

  _parseDnsServers: function (options) {
    var self = this;

    var ipAddresses = options.servers.split(',');
    var dnsServers = [];

    ipAddresses.forEach(function (address) {
      var ipValidationResult = self.vnetUtil.parseIPv4(address);
      if (ipValidationResult.error) {
        var dnsValidationResult = self.vnetUtil.isValidDns(address);
        if (dnsValidationResult === false) {
          throw new Error(util.format($('Address "%s" is not valid IPv4 or DNS name'), address));
        }
      }
      var dns = {ipAddress: address};
      dnsServers.push(dns);
    });

    return dnsServers;
  },

  _parseFrontendIp: function (resourceGroup, appGatewayName, frontendIpName, options, _) {
    var self = this;
    var frontendIp = {
      id: self._generateResourceId(resourceGroup, appGatewayName, 'frontendIPConfigurations', frontendIpName),
      name: frontendIpName,
      privateIPAllocationMethod: constants.appGateway.frontendIp.privateIPAllocationMethod[0]
    };

    if (options.staticIpAddress) {
      var ipValidationResult = self.vnetUtil.parseIPv4(options.staticIpAddress);
      if (ipValidationResult.error) {
        throw new Error(util.format($('IPv4 %s static ip address is not valid'), options.staticIpAddress));
      }
      frontendIp.privateIPAddress = options.staticIpAddress;
    }

    if (options.publicIpId) {
      frontendIp.publicIPAddress = options.publicIpId;
      return frontendIp;
    }

    if (options.publicIpName) {
      var publicIp = self.publicIpCrud.get(resourceGroup, options.publicIpName, _);
      if (!publicIp) {
        throw new Error(util.format($('Public IP "%s" not found in resource group "%s"'), options.publicIpName, resourceGroup));
      }
      frontendIp.publicIPAddress = {id: publicIp.id};
      return frontendIp;
    }

    if (options.vnetName && options.subnetName) {
      var subnet = self.subnetCrud.get(resourceGroup, options.vnetName, options.subnetName, _);
      if (!subnet) {
        throw new Error(util.format($('Subnet "%s" not found in virtual network "%s" resource group "%s"'), options.subnetName, options.vnetName, resourceGroup));
      }
      frontendIp.subnet = {id: subnet.id};
      return frontendIp;
    }

    if (options.subnetId) {
      frontendIp.subnet = {id: options.subnetId};
    }

    return frontendIp;
  },

  _setAppGateway: function (resourceGroup, appGatewayName, appGateway, options, _) {
    var self = this;

    var progress = self.interaction.progress(util.format($('Setting long-running configuration for an application gateway %s'), appGatewayName));
    var updatedAppGateway;
    try {
      if (options.nowait) {
        updatedAppGateway = self.networkManagementClient.applicationGateways.beginCreateOrUpdate(resourceGroup, appGatewayName, appGateway, null, _);
      } else {
        updatedAppGateway = self.networkManagementClient.applicationGateways.createOrUpdate(resourceGroup, appGatewayName, appGateway, null, _);
      }
    } finally {
      progress.end();
    }
    self._showAppGateway(updatedAppGateway);
  },

  _setDefaultAttributes: function (options) {
    var self = this;
    if (options.certFile) {
      if (options.httpListenerProtocol) {

        // If certificate was attached - http listener protocol must be Https.
        if (options.httpListenerProtocol.toLowerCase() !== constants.appGateway.httpListener.protocol[1]) {
          throw new Error($('--http-listener-protocol parameter must be Https'));
        }
      } else {
        options.httpListenerProtocol = constants.appGateway.httpListener.protocol[1];
        self.output.warn(util.format($('Using default http listener protocol: %s'), options.httpListenerProtocol));
      }
      options.certName = 'cert01';
      if (utils.stringIsNullOrEmpty(options.certFile)) {
        throw new Error($('--cert-file parameter must not be empty'));
      }
      if (utils.stringIsNullOrEmpty(options.certPassword)) {
        throw new Error($('--cert-password parameter must not be empty'));
      }
    }
    if (!options.gatewayIpName) {
      options.gatewayIpName = constants.appGateway.gatewayIp.name;
      self.output.warn(util.format($('Using default gateway ip name: %s'), options.gatewayIpName));
    }
    if (!options.skuName) {
      options.skuName = constants.appGateway.sku.name[0];
      self.output.warn(util.format($('Using default sku name: %s'), options.skuName));
    }
    if (!options.skuTier) {
      options.skuTier = constants.appGateway.sku.tier[0];
      self.output.warn(util.format($('Using default sku tier: %s'), options.skuTier));
    }
    if (!options.capacity) {
      options.capacity = constants.appGateway.sku.capacity[0];
      self.output.warn(util.format($('Using default sku capacity: %s'), options.capacity));
    } else {
      if (options.capacity < constants.appGateway.sku.capacity[0] || options.capacity > constants.appGateway.sku.capacity[1]) {
        throw new Error(util.format($('Application gateway instance count must be in range "[%s]"'), constants.appGateway.sku.capacity));
      }
    }
    if (!options.frontendIpName) {
      options.frontendIpName = constants.appGateway.frontendIp.name;
      self.output.warn(util.format($('Using default frontend ip name: %s'), options.frontendIpName));
    }
    if (!options.frontendPortName) {
      options.frontendPortName = constants.appGateway.frontendPort.name;
      self.output.warn(util.format($('Using default frontend port name: %s'), options.frontendPortName));
    }
    if (!options.frontendPort) {
      options.frontendPort = options.certFile ? constants.appGateway.settings.defHttpsPort : constants.appGateway.settings.defHttpPort;
      self.output.warn(util.format($('Using default frontend port: %s'), options.frontendPort));
    }
    if (!options.addressPoolName) {
      options.addressPoolName = constants.appGateway.pool.name;
      self.output.warn(util.format($('Using default address pool name: %s'), options.addressPoolName));
    }
    if (!options.httpSettingsName) {
      options.httpSettingsName = constants.appGateway.settings.name;
      self.output.warn(util.format($('Using default http settings name: %s'), options.httpSettingsName));
    }
    if (!options.httpSettingsProtocol) {
      options.httpSettingsProtocol = constants.appGateway.settings.protocol[0];
      self.output.warn(util.format($('Using default http settings protocol: %s'), options.httpSettingsProtocol));
    }
    if (!options.httpSettingsPort) {
      options.httpSettingsPort = constants.appGateway.settings.defHttpPort;
      self.output.warn(util.format($('Using default http settings port: %s'), options.httpSettingsPort));
    }
    if (!options.httpSettingsCookieBasedAffinity) {
      options.httpSettingsCookieBasedAffinity = constants.appGateway.settings.affinity[0];
      self.output.warn(util.format($('Using default http settings cookie based affinity: %s'), options.httpSettingsCookieBasedAffinity));
    }
    if (!options.httpListenerName) {
      options.httpListenerName = constants.appGateway.httpListener.name;
      self.output.warn(util.format($('Using default http listener name: %s'), options.httpListenerName));
    }
    if (!options.routingRuleName) {
      options.routingRuleName = constants.appGateway.routingRule.name;
      self.output.warn(util.format($('Using default request routing rule name: %s'), options.routingRuleName));
    }
    if (!options.routingRuleType) {
      options.routingRuleType = constants.appGateway.routingRule.type[0];
      self.output.warn(util.format($('Using default request routing rule type: %s'), options.routingRuleType));
    }
    return options;
  },

  _showAppGateway: function (appGateway) {
    var self = this;
    self.interaction.formatOutput(appGateway, function (appGateway) {
      var indent = 2;
      
      self.output.nameValue($('Id'), appGateway.id);
      self.output.nameValue($('Name'), appGateway.name);
      self.output.nameValue($('Location'), appGateway.location);
      self.output.nameValue($('Provisioning state'), appGateway.provisioningState);
      self.output.nameValue($('Sku'), appGateway.sku.name);

      var resource = resourceUtils.getResourceInformation(appGateway.id);
      self.output.nameValue($('Resource Group'), resource.resourceGroup);
      self.output.nameValue($('Tags'), tagUtils.getTagsInfo(appGateway.tags));
      self.output.nameValue($('Gateway IP configations'), self._getAttributeNames(appGateway.gatewayIPConfigurations));
      
      if (utils.findFirstCaseIgnore(appGateway.httpListeners, {protocol: constants.appGateway.httpListener.protocol[1]})) {
        self.output.header($('SSL cerificates'));
        self._listAppGatewaySslCerificates(appGateway, indent);
      }

      self.output.header($('Frontend ip configurations'));
      self._listAppGatewayFrontendIpConfigs(appGateway, indent);

      self.output.header($('Frontend ports'));
      self._listAppGatewayFrontendPorts(appGateway, indent);

      self.output.header($('Backend address pools'));
      self._listAppGatewayAddressPools(appGateway, indent);

      self.output.header($('Backend http settings'));
      self._listAppGatewayHttpSettings(appGateway, indent);

      self.output.header($('Http listeners'));
      self._listAppGatewayHttpListeners(appGateway, indent);

      self.output.header($('Request routing rules'));
      self._listAppGatewayRoutingRules(appGateway, indent);

      self.output.header($('Probes'));
      self._listAppGatewayProbes(appGateway, indent);

      self.output.header($('Url Path Maps'));
      self._listAppGatewayUrlPathMaps(appGateway, indent);
    });
  },

  _showAppGatewayHttpListener: function (listener, indent) {
    var self = this;

    if (!indent) indent = 0;
    self.interaction.formatOutput(listener, function (listener) {
      var frontendIPConfiguration = resourceUtils.getResourceInformation(listener.frontendIPConfiguration.id);
      var frontendPort = resourceUtils.getResourceInformation(listener.frontendPort.id);

      var sslCertificateName = '';
      if (listener.sslCertificate) {
        sslCertificateName = resourceUtils.getResourceInformation(listener.sslCertificate.id).resourceName;
      }

      self.output.nameValue($('Name'), listener.name, indent);
      self.output.nameValue($('Frontend IP config name'), frontendIPConfiguration.resourceName, indent);
      self.output.nameValue($('Frontend port name'), frontendPort.resourceName, indent);
      self.output.nameValue($('SSL certificate name'), sslCertificateName, indent);
      self.output.nameValue($('Protocol'), listener.protocol, indent);
      self.output.nameValue($('Host name'), listener.hostName, indent);
      self.output.data($(''), '');
    });
  },

  _showAppGatewayPredefinedPolicy:function (policy, indent) {
    var self = this;

    if (!indent) indent = 0;
    self.interaction.formatOutput(policy, function (policy) {
      self.output.nameValue($('Name'), policy.name, indent);
      self.output.nameValue($('Minimum version of SSL protocol'), policy.minProtocolVersion, indent);
      self.output.header($('Cipher Suites'), indent);
      self.output.list(policy.cipherSuites, indent + 2);
      self.output.data($(''), '');
    });
  },

  _showAppGatewayUrlPathMap: function (urlPathMap, indent) {
    var self = this;

    if (!indent) indent = 0;
    self.interaction.formatOutput(urlPathMap, function (urlPathMap) {
      var urlPathName = resourceUtils.getResourceInformation(urlPathMap.id);
      var defaultAddressPool = resourceUtils.getResourceInformation(urlPathMap.defaultBackendAddressPool.id);
      var defaultHttpSetting = resourceUtils.getResourceInformation(urlPathMap.defaultBackendHttpSettings.id);

      self.output.nameValue($('Name'), urlPathName.resourceName, indent);
      self.output.nameValue($('Pool Name'), defaultAddressPool.resourceName, indent);
      self.output.nameValue($('Http Setting Name'), defaultHttpSetting.resourceName, indent);

      if (urlPathMap.defaultRedirectConfiguration) {
        var defaultRedirectConfiguration = resourceUtils.getResourceInformation(urlPathMap.defaultRedirectConfiguration.id);
        self.output.nameValue($('Redirect Configuration Name'), defaultRedirectConfiguration.resourceName, indent);
      }

      self._listAppGatewayUrlPathMapRules(urlPathMap.pathRules, indent);
    });
  },

  _showAppGatewayUrlPathMapRule: function (rule, indent) {
    var self = this;

    if (!indent) indent = 0;
    self.interaction.formatOutput(rule, function (rule) {
      var addressPool = resourceUtils.getResourceInformation(rule.backendAddressPool.id);
      var httpSetting = resourceUtils.getResourceInformation(rule.backendHttpSettings.id);

      self.output.nameValue($('Name'), rule.name, indent);
      self.output.nameValue($('Address Pool Name'), addressPool.resourceName, indent);
      self.output.nameValue($('Http Settings Name'), httpSetting.resourceName, indent);

      if (rule.redirectConfiguration) {
        var redirectConfiguration = resourceUtils.getResourceInformation(rule.redirectConfiguration.id);
        self.output.nameValue($('Redirect Configuration Name'), redirectConfiguration.resourceName, indent);
      }
      
      if (rule.paths.length > 0) {
        self.output.header($('Paths'), indent);
        self.output.list(rule.paths, indent + 2);
      }
      
      self.output.data($(''), '');
    });
  },

  _showAppGatewayWAFConfig: function (wafConfig) {
    var self = this;
    self.interaction.formatOutput(wafConfig, function (wafConfig) {
      self.output.nameValue($('Enabled'), wafConfig.enabled);
      self.output.nameValue($('Firewall Mode'), wafConfig.firewallMode);
      self.output.nameValue($('Rule Set Type'), wafConfig.ruleSetType);
      self.output.nameValue($('Rule Set Version'), wafConfig.ruleSetVersion);
      self.output.header($('Disabled Rule Groups'));
      self._listAppGatewayDisabledRuleGroup(wafConfig, 2);
    });
  }
});

module.exports = AppGateways;
