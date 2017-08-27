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
var fs = require('fs');
var constants = require('./constants');
var resourceUtils = require('../resource/resourceUtils');
var tagUtils = require('../tag/tagUtils');
var util = require('util');
var utils = require('../../../util/utils');
var validation = require('../../../util/validation');
var ExpressRoute = require('./expressRoute');
var LocalNetworkGateway = require('./localNetworkGateway');
var PublicIp = require('./publicIPAddress.helper');
var Subnet = require('./subnet');
var VnetUtil = require('../../../util/vnet.util');
var $ = utils.getLocaleString;

function VirtualNetworkGateway(cli, networkManagementClient) {
  this.interaction = cli.interaction;
  this.expressRouteCrud = new ExpressRoute(cli, networkManagementClient);
  this.lnetGatewayCrud = new LocalNetworkGateway(cli, networkManagementClient);
  this.networkManagementClient = networkManagementClient;
  this.output = cli.output;
  this.publicIpCrud = new PublicIp(cli, networkManagementClient);
  this.subnetCrud = new Subnet(cli, networkManagementClient);
  this.vnetUtil = new VnetUtil();
}

__.extend(VirtualNetworkGateway.prototype, {
  /**
   * Virtual network gateway methods
   */
  create: function (resourceGroupName, gatewayName, options, _) {
    var self = this;

    if (!options.publicIpId && !options.publicIpName) {
      options.publicIpName = self.interaction.prompt($('Public IP name: '), _);
    }

    if (!options.subnetId && !options.vnetName) {
      options.vnetName = self.interaction.prompt($('Virtual network name: '), _);
    }

    if (options.vnetName && !options.subnetName) {
      var defSubnetName = constants.vpnGateway.subnetName;
      self.output.warn(util.format($('Using default subnet name: %s'), defSubnetName));
      options.subnetName = defSubnetName;
    }

    var parameters = {
      gatewayType: constants.vpnGateway.gatewayType[0],
      vpnType: constants.vpnGateway.vpnType[0],
      sku: {
        name: constants.vpnGateway.sku[0],
        tier: constants.vpnGateway.sku[0]
      },
      enableBgp: false,
      location: options.location,
      vpnClientConfiguration: {
        vpnClientAddressPool: {
          addressPrefixes: []
        },
        vpnClientRootCertificates: [],
        vpnClientRevokedCertificates: []
      },
      ipConfigurations: [
        {
          name: 'ip-config'
        }
      ]
    };

    parameters = self._parseGateway(resourceGroupName, parameters, options, _);

    var gateway = self.get(resourceGroupName, gatewayName, _);
    if (gateway) {
      throw new Error(util.format($('A virtual network gateway with name "%s" already exists in the resource group "%s"'), gatewayName, resourceGroupName));
    }

    var progress = self.interaction.progress(util.format($('Creating virtual network gateway "%s"'), gatewayName));
    try {
      gateway = self.networkManagementClient.virtualNetworkGateways.createOrUpdate(resourceGroupName, gatewayName, parameters, _);
    } finally {
      progress.end();
    }

    self._showGateway(gateway, resourceGroupName, gatewayName);
  },

  set: function (resourceGroupName, gatewayName, options, _) {
    var self = this;

    var gateway = self.get(resourceGroupName, gatewayName, _);
    if (!gateway) {
      throw new Error(util.format($('A virtual network gateway with name "%s" not found in the resource group "%s"'), gatewayName, resourceGroupName));
    }

    gateway = self._parseGateway(resourceGroupName, gateway, options, _);

    gateway = self.update(resourceGroupName, gatewayName, gateway, _);

    self._showGateway(gateway, resourceGroupName, gatewayName);
  },

  list: function (resourceGroupName, options, _) {
    var self = this;

    var gateways = null;
    var progress = self.interaction.progress($('Looking up virtual network gateways'));
    try {
      gateways = self.networkManagementClient.virtualNetworkGateways.list(resourceGroupName, _);
    } finally {
      progress.end();
    }

    self.interaction.formatOutput(gateways, function (gateways) {
      if (gateways.length === 0) {
        self.output.warn($('No virtual network gateways found'));
      } else {
        self.output.table(gateways, function (row, gateway) {
          row.cell($('Name'), gateway.name);
          row.cell($('Location'), gateway.location);
          row.cell($('Provisioning state'), gateway.provisioningState);
          row.cell($('Gateway type'), gateway.gatewayType);
          row.cell($('VPN type'), gateway.vpnType);
          row.cell($('SKU'), gateway.sku.name);
          row.cell($('Enable BGP'), gateway.enableBgp);
          row.cell($('Private IP allocation'), gateway.ipConfigurations[0].privateIPAllocationMethod);
          row.cell($('Private IP address'), gateway.ipConfigurations[0].privateIPAddress || '');
        });
      }
    });
  },

  show: function (resourceGroupName, gatewayName, options, _) {
    var self = this;

    var gateway = self.get(resourceGroupName, gatewayName, _);
    self._showGateway(gateway, resourceGroupName, gatewayName);
  },

  delete: function (resourceGroupName, gatewayName, options, _) {
    var self = this;

    var gateway = self.get(resourceGroupName, gatewayName, _);
    if (!gateway) {
      throw new Error(util.format($('Virtual network gateway "%s" not found in the resource group "%s"'), gatewayName, resourceGroupName));
    }

    if (!options.quiet && !self.interaction.confirm(util.format($('Delete virtual network gateway "%s"? [y/n] '), gatewayName), _)) {
      return;
    }

    var progress = self.interaction.progress(util.format($('Deleting virtual network gateway "%s"'), gatewayName));
    try {
      self.networkManagementClient.virtualNetworkGateways.deleteMethod(resourceGroupName, gatewayName, _);
    } finally {
      progress.end();
    }
  },

  get: function (resourceGroupName, gatewayName, _) {
    var self = this;
    var progress = self.interaction.progress(util.format($('Looking up virtual network gateway "%s"'), gatewayName));
    try {
      var gateway = self.networkManagementClient.virtualNetworkGateways.get(resourceGroupName, gatewayName, _);
      self._createVpnConfigIfNotExist(gateway);
      return gateway;
    } catch (e) {
      if (e.statusCode === 404) {
        return null;
      }
      throw e;
    } finally {
      progress.end();
    }
  },

  update: function (resourceGroupName, gatewayName, gateway, _) {
    var self = this;
    var progress = self.interaction.progress(util.format($('Updating virtual network gateway "%s"'), gatewayName));
    try {
      gateway = self.networkManagementClient.virtualNetworkGateways.createOrUpdate(resourceGroupName, gatewayName, gateway, _);
    } finally {
      progress.end();
    }
    return gateway;
  },

  /**
   * Root Certificate methods
   */
  createRootCert: function (resourceGroupName, gatewayName, certName, options, _) {
    var self = this;

    var gateway = self.get(resourceGroupName, gatewayName, _);
    if (!gateway) {
      throw new Error(util.format($('A virtual network gateway with name "%s" not found in the resource group "%s"'), gatewayName, resourceGroupName));
    }

    if (gateway.vpnClientConfiguration.vpnClientAddressPool.addressPrefixes.length === 0) {
      throw new Error($('You must add address pool before adding root certificate. Please use --address-prefixes option for vpn-gateway create|set commands.'));
    }

    var certData = fs.readFileSync(options.certFile);
    certData = certData.toString('base64');

    var rootCert = {
      name: certName,
      publicCertData: certData
    };

    if (utils.findFirstCaseIgnore(gateway.vpnClientConfiguration.vpnClientRootCertificates, {name: certName})) {
      throw new Error(util.format($('A Root Certificate with name "%s" already exists in Virtual Network Gateway "%s"'), certName, gatewayName));
    }

    gateway.vpnClientConfiguration.vpnClientRootCertificates.push(rootCert);
    gateway = self.update(resourceGroupName, gatewayName, gateway, _);

    self._showGateway(gateway, resourceGroupName, gatewayName);
  },

  deleteRootCert: function (resourceGroupName, gatewayName, certName, options, _) {
    var self = this;

    var gateway = self.get(resourceGroupName, gatewayName, _);
    if (!gateway) {
      throw new Error(util.format($('A virtual network gateway with name "%s" not found in the resource group "%s"'), gatewayName, resourceGroupName));
    }

    var index = utils.indexOfCaseIgnore(gateway.vpnClientConfiguration.vpnClientRootCertificates, {name: certName});
    if (index === -1) {
      throw new Error(util.format($('A Root Certificate with name "%s" not found in Virtual Network Gateway "%s"'), certName, gatewayName));
    }

    if (!options.quiet && !self.interaction.confirm(util.format($('Delete a root certificate "%s?" [y/n] '), certName), _)) {
      return;
    }

    gateway.vpnClientConfiguration.vpnClientRootCertificates.splice(index, 1);
    gateway = self.update(resourceGroupName, gatewayName, gateway, _);

    self._showGateway(gateway, resourceGroupName, gatewayName);
  },

  /**
   * Revoked Certificate methods
   */
  createRevokedCert: function(resourceGroupName, gatewayName, certName, options, _) {
    var self = this;

    var gateway = self.get(resourceGroupName, gatewayName, _);
    if (!gateway) {
      throw new Error(util.format($('A virtual network gateway with name "%s" not found in the resource group "%s"'), gatewayName, resourceGroupName));
    }

    if (gateway.vpnClientConfiguration.vpnClientAddressPool.addressPrefixes.length === 0) {
      throw new Error($('You must add address pool before adding revoked certificate. Please use --address-prefixes option for vpn-gateway create|set commands.'));
    }

    var revokedCert = {
      name: certName,
      thumbprint: options.thumbprint
    };

    if (utils.findFirstCaseIgnore(gateway.vpnClientConfiguration.vpnClientRevokedCertificates, {name: certName})) {
      throw new Error(util.format($('A Revoked Certificate with name "%s" already exists in Virtual Network Gateway "%s"'), certName, gatewayName));
    }

    gateway.vpnClientConfiguration.vpnClientRevokedCertificates.push(revokedCert);
    gateway = self.update(resourceGroupName, gatewayName, gateway, _);

    self._showGateway(gateway, resourceGroupName, gatewayName);
  },

  deleteRevokedCert: function(resourceGroupName, gatewayName, certName, options, _) {
    var self = this;

    var gateway = self.get(resourceGroupName, gatewayName, _);
    if (!gateway) {
      throw new Error(util.format($('A virtual network gateway with name "%s" not found in the resource group "%s"'), gatewayName, resourceGroupName));
    }

    var index = utils.indexOfCaseIgnore(gateway.vpnClientConfiguration.vpnClientRevokedCertificates, {name: certName});
    if (index === -1) {
      throw new Error(util.format($('A Revoked Certificate with name "%s" not found in Virtual Network Gateway "%s"'), certName, gatewayName));
    }

    if (!options.quiet && !self.interaction.confirm(util.format($('Delete a revoked certificate "%s?" [y/n] '), certName), _)) {
      return;
    }

    gateway.vpnClientConfiguration.vpnClientRevokedCertificates.splice(index, 1);
    gateway = self.update(resourceGroupName, gatewayName, gateway, _);

    self._showGateway(gateway, resourceGroupName, gatewayName);
  },

  /**
   * Gateway connection methods
   */
  createConnection: function (resourceGroupName, connectionName, options, _) {
    var self = this;

    var parameters = {
      location: options.location,
      virtualNetworkGateway1: {}
    };
    parameters = self._parseConnection(resourceGroupName, parameters, options, true, _);

    var connection = self.getConnection(resourceGroupName, connectionName, _);
    if (connection) {
      throw new Error(util.format($('A virtual network gateway connection with name "%s" already exists in the resource group "%s"'), connectionName, resourceGroupName));
    }

    var progress = self.interaction.progress(util.format($('Creating gateway connection "%s" between "%s" and "%s"'), connectionName, options.vnetGateway1, options.vnetGateway2 || options.lnetGateway2 || options.peerName));
    try {
      connection = self.networkManagementClient.virtualNetworkGatewayConnections.createOrUpdate(resourceGroupName, connectionName, parameters, _);
    } finally {
      progress.end();
    }
    self._showConnection(connection, resourceGroupName, connectionName);
  },

  setConnection: function (resourceGroupName, connectionName, options, _) {
    var self = this;

    var connection = self.getConnection(resourceGroupName, connectionName, _);
    if (!connection) {
      throw new Error(util.format($('A virtual network gateway connection with name "%s" not found in the resource group "%s"'), connectionName, resourceGroupName));
    }

    connection = self._parseConnection(resourceGroupName, connection, options, false, _);

    var progress = self.interaction.progress(util.format($('Updating gateway connection "%s"'), connectionName));
    try {
      connection = self.networkManagementClient.virtualNetworkGatewayConnections.createOrUpdate(resourceGroupName, connectionName, connection, _);
    } finally {
      progress.end();
    }
    self._showConnection(connection, resourceGroupName, connectionName);
  },

  listConnections: function (resourceGroupName, options, _) {
    var self = this;

    var progress = self.interaction.progress($('Looking up gateway connections'));
    var connections = null;

    try {
      connections = self.networkManagementClient.virtualNetworkGatewayConnections.list(resourceGroupName, _);
    } finally {
      progress.end();
    }

    self.interaction.formatOutput(connections, function (connections) {
      if (connections.length === 0) {
        self.output.warn($('No gateway connections found'));
      } else {
        self.output.table(connections, function (row, connection) {
          row.cell($('Name'), connection.name);
          row.cell($('Location'), connection.location);
          row.cell($('Provosioning state'), connection.provisioningState);
          row.cell($('Type'), connection.connectionType);
          row.cell($('Routing weight'), connection.routingWeight);
          var vnetGatewayInfo = resourceUtils.getResourceInformation(connection.virtualNetworkGateway1.id);
          row.cell($('Virtual network gateway'), vnetGatewayInfo.resourceName);
          var connectedEntityInfo;
          if (connection.virtualNetworkGateway2) {
            connectedEntityInfo = resourceUtils.getResourceInformation(connection.virtualNetworkGateway2.id);
          } else {
            connectedEntityInfo = resourceUtils.getResourceInformation(connection.localNetworkGateway2.id);
          }
          row.cell($('Connected entity'), connectedEntityInfo.resourceName);
        });
      }
    });
  },

  showConnection: function (resourceGroupName, connectionName, options, _) {
    var self = this;
    var connection = self.getConnection(resourceGroupName, connectionName, _);
    self._showConnection(connection, resourceGroupName, connectionName);
  },

  deleteConnection: function (resourceGroupName, connectionName, options, _) {
    var self = this;
    var connection = self.getConnection(resourceGroupName, connectionName, _);

    if (!connection) {
      throw new Error(util.format($('A gateway connection with name "%s" not found in the resource group "%s"'), connectionName, resourceGroupName));
    }

    if (!options.quiet && !self.interaction.confirm(util.format($('Delete gateway connection "%s"? [y/n] '), connectionName), _)) {
      return;
    }

    var progress = self.interaction.progress(util.format($('Deleting gateway connection "%s"'), connectionName));
    try {
      self.networkManagementClient.virtualNetworkGatewayConnections.deleteMethod(resourceGroupName, connectionName, _);
    } finally {
      progress.end();
    }
  },

  getConnection: function (resourceGroupName, connectionName, _) {
    var self = this;
    var progress = self.interaction.progress(util.format($('Looking up gateway connection "%s"'), connectionName));
    try {
      var connection = self.networkManagementClient.virtualNetworkGatewayConnections.get(resourceGroupName, connectionName, _);
      return connection;
    } catch (e) {
      if (e.statusCode === 404) {
        return null;
      }
      throw e;
    } finally {
      progress.end();
    }
  },

  /**
   * Gateway connection Shared Key methods
   */
  setConnectionSharedKey: function (resourceGroupName, connectionName, options, _) {
    var self = this;

    var connection = self.getConnection(resourceGroupName, connectionName, _);
    if (!connection) {
      throw new Error(util.format($('A virtual network gateway connection with name "%s" not found in the resource group "%s"'), connectionName, resourceGroupName));
    }

    var progress = self.interaction.progress(util.format($('Setting shared key for gateway connection "%s"'), connectionName));
    try {
      self.networkManagementClient.virtualNetworkGatewayConnections.setSharedKey(resourceGroupName, connectionName, options, _);
    } finally {
      progress.end();
    }
  },

  resetConnectionSharedKey: function (resourceGroupName, connectionName, options, _) {
    var self = this;

    if (isNaN(options.keyLength)) {
      throw new Error($('--key-length parameter must be an integer'));
    }

    var connection = self.getConnection(resourceGroupName, connectionName, _);
    if (!connection) {
      throw new Error(util.format($('A virtual network gateway connection with name "%s" not found in the resource group "%s"'), connectionName, resourceGroupName));
    }

    var params = {
      keyLength: utils.parseInt(options.keyLength)
    };

    var progress = self.interaction.progress(util.format($('Resetting shared key for gateway connection "%s"'), connectionName));
    try {
      self.networkManagementClient.virtualNetworkGatewayConnections.resetSharedKey(resourceGroupName, connectionName, params, _);
    } finally {
      progress.end();
    }
  },

  showConnectionSharedKey: function (resourceGroupName, connectionName, options, _) {
    var self = this;

    var connection = self.getConnection(resourceGroupName, connectionName, _);
    if (!connection) {
      throw new Error(util.format($('A virtual network gateway connection with name "%s" not found in the resource group "%s"'), connectionName, resourceGroupName));
    }

    var sharedKey = self.getConnectionSharedKey(resourceGroupName, connectionName, _);
    self.interaction.formatOutput(sharedKey, function (sharedKey) {
      if (sharedKey === null) {
        self.output.warn(util.format($('A shared key for gateway connection "%s" not found'), connectionName));
      } else {
        self.output.nameValue($('Value'), sharedKey.value);
      }
    });
  },

  getConnectionSharedKey: function (resourceGroupName, connectionName, _) {
    var self = this;
    var progress = self.interaction.progress(util.format($('Looking up shared key for gateway connection "%s"'), connectionName));
    try {
      var sharedKey = self.networkManagementClient.virtualNetworkGatewayConnections.getSharedKey(resourceGroupName, connectionName, _);
      return sharedKey;
    } catch (e) {
      if (e.statusCode === 404) {
        return null;
      }
      throw e;
    } finally {
      progress.end();
    }
  },

  /**
   * Private methods
   */
  _parseGateway: function (resourceGroupName, gateway, options, _) {
    var self = this;

    if (options.gatewayType) {
      gateway.gatewayType = validation.isIn(options.gatewayType, constants.vpnGateway.gatewayType, '--gateway-type');
    }

    if (options.vpnType) {
      gateway.vpnType = validation.isIn(options.vpnType, constants.vpnGateway.vpnType, '--vpn-type');
    }

    if (options.skuName) {
      gateway.sku.name = validation.isIn(options.skuName, constants.vpnGateway.sku, '--sku-name');
      gateway.sku.tier = gateway.sku.name; // in case of Gateway sku name and tier are the same
    }

    if (options.enableBgp) {
      gateway.enableBgp = validation.isBool(options.enableBgp, '--enable-bgp');
    }

    if (options.bgpAsn) {
      var asn = parseInt(options.bgpAsn);
      if(isNaN(asn)) {
        throw new Error(util.format($('BGP settings ASN "%s" is not valid. It must be a number'), options.bgpAsn));
      }
      if(!gateway.bgpSettings) {
        gateway.bgpSettings = {};
      }
      gateway.bgpSettings.asn = asn;
    }

    if (options.bgpPeeringAddress) {
      if(!gateway.bgpSettings) {
        gateway.bgpSettings = {};
      }
      var ipValidationResult = self.vnetUtil.parseIPv4(options.bgpPeeringAddress);
      if (ipValidationResult.error) {
        throw new Error(util.format($('BGP peering address "%s" is not valid'), options.bgpPeeringAddress));
      }
      gateway.bgpSettings.bgpPeeringAddress = options.bgpPeeringAddress;
    }

    if(options.bgpPeerWeight) {
      var weight = parseInt(options.bgpPeerWeight);
      if(isNaN(weight)) {
        throw new Error(util.format($('BGP peering weight "%s" is not valid. It must be a number'), options.bgpPeerWeight));
      }
      if(!gateway.bgpSettings) {
        gateway.bgpSettings = {};
      }
      gateway.bgpSettings.peerWeight = weight;
    }

    if (options.publicIpId) {
      if (options.publicIpName) {
        self.output.warn($('--public-ip-name parameter will be ignored because --public-ip-id and --public-ip-name are mutually exclusive'));
      }
      gateway.ipConfigurations[0].publicIPAddress = {
        id: options.publicIpId
      };
    } else if (options.publicIpName) {
      var publicip = self.publicIpCrud.get(resourceGroupName, options.publicIpName, _);
      if (!publicip) {
        throw new Error(util.format($('A public ip address with name "%s" not found in the resource group "%s"'), options.publicIpName, resourceGroupName));
      }
      gateway.ipConfigurations[0].publicIPAddress = {
        id: publicip.id
      };
    }

    if (options.subnetId) {
      if (options.vnetName || options.subnetName) {
        self.output.warn($('--vnet-name, --subnet-name gateway will be ignored because --subnet-id and --vnet-name, --subnet-name are mutually exclusive'));
      }
      gateway.ipConfigurations[0].subnet = {
        id: options.subnetId
      };
    } else if (options.vnetName && options.subnetName) {
      var subnet = self.subnetCrud.get(resourceGroupName, options.vnetName, options.subnetName, _);
      if (!subnet) {
        throw new Error(util.format($('A subnet with name "%s" not found in the resource group "%s"'), options.subnetName, resourceGroupName));
      }
      gateway.ipConfigurations[0].subnet = {
        id: subnet.id
      };
    }

    if (options.defaultSiteId) {
      if (options.defaultSiteName) {
        self.output.warn($('--default-site-name parameter will be ignored because --default-site-id and --default-site-name are mutually exclusive'));
      }
      if (utils.argHasValue(options.defaultSiteId)) {
        gateway.gatewayDefaultSite = {
          id: options.defaultSiteId
        };
      } else {
        delete gateway.gatewayDefaultSite;
      }
    } else if (options.defaultSiteName) {
      if (utils.argHasValue(options.defaultSiteName)) {
        var localGateway = self.lnetGatewayCrud.get(resourceGroupName, options.defaultSiteName, _);
        if (!localGateway) {
          throw new Error(util.format($('A Local Network Gateway with name "%s" not found in the resource group "%s"'), options.defaultSiteName, resourceGroupName));
        }
        gateway.gatewayDefaultSite = {
          id: localGateway.id
        };
      } else {
        delete gateway.gatewayDefaultSite;
      }
    }

    if (options.addressPrefixes) {
      var addrPrefixes = gateway.vpnClientConfiguration.vpnClientAddressPool.addressPrefixes;
      var prefixes = options.addressPrefixes.split(',');
      prefixes.forEach(function (address) {
        if (addrPrefixes.indexOf(address) === -1) {
          validation.isCIDR(address, '--address-prefixes');
          addrPrefixes.push(address);
        }
      });
    }

    if (options.tags) {
      if (utils.argHasValue(options.tags)) {
        tagUtils.appendTags(gateway, options);
      } else {
        gateway.tags = {};
      }
    }

    return gateway;
  },

  _createVpnConfigIfNotExist: function (gateway) {
    if (gateway.vpnClientConfiguration === undefined) {
      gateway.vpnClientConfiguration = {
        vpnClientAddressPool: {
          addressPrefixes: []
        },
        vpnClientRootCertificates: [],
        vpnClientRevokedCertificates: []
      };
    } else if (gateway.vpnClientConfiguration.vpnClientAddressPool === undefined) {
      gateway.vpnClientConfiguration.vpnClientAddressPool = {
        addressPrefixes: []
      };
    }
  },

  _parseConnection: function (resourceGroupName, connection, options, useDefaults, _) {
    var self = this;
    if (options.type) {
      connection.connectionType = validation.isIn(options.type, constants.vpnGateway.connectionType, '--type');
    } else if (useDefaults) {
      connection.connectionType = utils.takeDefault(self.output, constants.vpnGateway.connectionType[0], '--type');
    }

    if (useDefaults && !options.vnetGateway2 && !options.lnetGateway2 && !options.peerName) {
      throw new Error($('You must specify connected entity with --vnet-gateway2 or --lnet-gateway2 or --peer-name option'));
    }

    if (options.routingWeight) {
      connection.routingWeight = validation.isInt(options.routingWeight, {}, '--weight');
    } else if (useDefaults) {
      connection.routingWeight = utils.takeDefault(self.output, constants.vpnGateway.defWeight, '--weight');
    }

    if (options.sharedKey) {
      connection.sharedKey = options.sharedKey;
    }

    if (options.tags) {
      if (utils.argHasValue(options.tags)) {
        tagUtils.appendTags(connection, options);
      } else {
        connection.tags = {};
      }
    }

    if (options.vnetGateway1) {
      var resGroupGateway1 = options.vnetGateway1Group || resourceGroupName;
      if (!options.vnetGateway1Group) {
        self.output.warn(util.format($('Using resource group for Gateway 1: %s'), resGroupGateway1));
      }
      var gateway1 = self.get(resGroupGateway1, options.vnetGateway1, _);
      if (!gateway1) throw new Error(util.format($('A virtual network gateway with name "%s" not found in the resource group "%s"'), options.vnetGateway1, resGroupGateway1));
      connection.virtualNetworkGateway1 = gateway1;
    } else if (!useDefaults && !connection.virtualNetworkGateway1.ipConfigurations) {
      var vnetGateway1Info = resourceUtils.getResourceInformation(connection.virtualNetworkGateway1.id);
      connection.virtualNetworkGateway1 = self.get(vnetGateway1Info.resourceGroup, vnetGateway1Info.resourceName, _);
    }

    if (options.vnetGateway2) {
      var resGroupGateway2 = options.vnetGateway2Group || resourceGroupName;
      if (!options.vnetGateway2Group) {
        self.output.warn(util.format($('Using resource group for Gateway 2: %s'), resGroupGateway2));
      }
      var gateway2 = self.get(resGroupGateway2, options.vnetGateway2, _);
      if (!gateway2) throw new Error(util.format($('A virtual network gateway with name "%s" not found in the resource group "%s"'), options.vnetGateway2, resGroupGateway2));
      connection.virtualNetworkGateway2 = gateway2;
    } else if (!useDefaults && !connection.virtualNetworkGateway2.ipConfigurations) {
      var vnetGateway2Info = resourceUtils.getResourceInformation(connection.virtualNetworkGateway2.id);
      connection.virtualNetworkGateway2 = self.get(vnetGateway2Info.resourceGroup, vnetGateway2Info.resourceName, _);
    }

    if (options.lnetGateway2) {
      var resGroupLnetGateway2 = options.lnetGateway2Group || resourceGroupName;
      if (!options.lnetGateway2Group) {
        self.output.warn(util.format($('Using resource group for Local Network Gateway 2: %s'), resGroupLnetGateway2));
      }
      var lnet2 = self.lnetGatewayCrud.get(resGroupLnetGateway2, options.lnetGateway2, _);
      if (!lnet2) throw new Error(util.format($('A local network gateway with name "%s" not found in the resource group "%s"'), options.lnetGateway2, resGroupLnetGateway2));
      connection.localNetworkGateway2 = lnet2;
    }

    if (options.peerName) {
      var resGroupPeer = options.peerGroup || resourceGroupName;
      if (!options.peerGroup) {
        self.output.warn(util.format($('Using resource group for connected peer: %s'), resGroupPeer));
      }

      var peer = self.expressRouteCrud.getCircuit(resGroupPeer, options.peerName, _);
      if (!peer) throw new Error(util.format($('An express route circuit with name "%s" not found in the resource group "%s"'), options.peerName, resGroupPeer));
      connection.peer = peer;
    }

    if (options.enableBgp) {
      connection.enableBgp = validation.isBool(options.enableBgp, '--enable-bgp');
    }

    return connection;
  },

  _showGateway: function (gateway, resourceGroupName, gatewayName) {
    var self = this;

    self.interaction.formatOutput(gateway, function (gateway) {
      if (gateway === null) {
        self.output.warn(util.format($('Virtual network gateway "%s" not found in the resource group "%s"'), gatewayName, resourceGroupName));
        return;
      }

      self.output.nameValue($('Id'), gateway.id);
      self.output.nameValue($('Name'), gateway.name);
      self.output.nameValue($('Type'), gateway.type);
      self.output.nameValue($('Location'), gateway.location);
      self.output.nameValue($('Tags'), tagUtils.getTagsInfo(gateway.tags));
      self.output.nameValue($('Provisioning state'), gateway.provisioningState);
      self.output.nameValue($('Gateway type'), gateway.gatewayType);
      self.output.nameValue($('VPN type'), gateway.vpnType);
      self.output.nameValue($('Enable BGP'), gateway.enableBgp);

      self.output.header($('BGP Settings'));
      self.output.nameValue($('ASN'), gateway.bgpSettings.asn, 2);
      self.output.nameValue($('Peering Address'), gateway.bgpSettings.bgpPeeringAddress, 2);
      self.output.nameValue($('Peer Weight'), gateway.bgpSettings.peerWeight, 2);

      if (gateway.gatewayDefaultSite) {
        self.output.nameValue($('Default Site id'), gateway.gatewayDefaultSite.id);
      }

      self.output.header($('SKU'));
      self.output.nameValue($('Name'), gateway.sku.name, 2);
      self.output.nameValue($('Tier'), gateway.sku.tier, 2);
      self.output.nameValue($('Capacity'), gateway.sku.capacity, 2);

      var vpnConfig = gateway.vpnClientConfiguration;
      if (vpnConfig) {
        if (vpnConfig.vpnClientAddressPool.addressPrefixes.length > 0) {
          self.output.header($('Address Prefixes'));
          self.output.list(vpnConfig.vpnClientAddressPool.addressPrefixes, 2);
        }
        if (vpnConfig.vpnClientRootCertificates.length > 0) {
          self.output.header($('Root certificates'));
          vpnConfig.vpnClientRootCertificates.forEach(function (rootCert) {
            self.output.nameValue($('Name'), rootCert.name, 2);
            self.output.nameValue($('Provisioning state'), rootCert.provisioningState, 2);
          });
        }
        if (vpnConfig.vpnClientRevokedCertificates.length > 0) {
          self.output.header($('Revoked certificates'));
          vpnConfig.vpnClientRevokedCertificates.forEach(function (revokedCert) {
            self.output.nameValue($('Name'), revokedCert.name, 2);
            self.output.nameValue($('Provisioning state'), revokedCert.provisioningState, 2);
            self.output.nameValue($('Thumbprint'), revokedCert.thumbprint, 2);
          });
        }
      }

      self.output.header($('IP configurations'));
      gateway.ipConfigurations.forEach(function (ipConfig) {
        self.output.nameValue($('Id'), ipConfig.id, 2);
        self.output.nameValue($('Name'), ipConfig.name, 2);
        self.output.nameValue($('Provisioning state'), ipConfig.provisioningState, 2);
        self.output.nameValue($('Private IP allocation method'), ipConfig.privateIPAllocationMethod, 2);
        self.output.nameValue($('Private IP address'), ipConfig.privateIPAddress, 2);
        self.output.nameValue($('Public IP address id'), ipConfig.publicIPAddress.id, 2);
        self.output.nameValue($('Subnet id'), ipConfig.subnet.id, 2);
        self.output.data('');
      });
    });
  },

  _showConnection: function (connection, resourceGroupName, connectionName) {
    var self = this;

    self.interaction.formatOutput(connection, function (connection) {
      if (connection === null) {
        self.output.warn(util.format($('A gateway connection with name "%s" not found in the resource group "%s"'), connectionName, resourceGroupName));
        return;
      }

      self.output.nameValue($('Id'), connection.id);
      self.output.nameValue($('Name'), connection.name);
      self.output.nameValue($('Type'), connection.type);
      self.output.nameValue($('Location'), connection.location);
      self.output.nameValue($('Provisioning state'), connection.provisioningState);
      self.output.nameValue($('Tags'), tagUtils.getTagsInfo(connection.tags));
      self.output.nameValue($('Connection type'), connection.connectionType);
      self.output.nameValue($('Routing weight'), connection.routingWeight);
      self.output.nameValue($('Shared key'), connection.sharedKey);
      self.output.nameValue($('Virtual network gateway 1'), connection.virtualNetworkGateway1.id);
      if (connection.virtualNetworkGateway2) {
        self.output.nameValue($('Virtual network gateway 2'), connection.virtualNetworkGateway2.id);
      }
      if (connection.localNetworkGateway2) {
        self.output.nameValue($('Local network gateway 2'), connection.localNetworkGateway2.id);
      }
      self.output.header($('Bytes transferred'));
      self.output.nameValue($('Egress'), connection.egressBytesTransferred, 2);
      self.output.nameValue($('Ingress'), connection.ingressBytesTransferred, 2);
    });
  }
});

module.exports = VirtualNetworkGateway;