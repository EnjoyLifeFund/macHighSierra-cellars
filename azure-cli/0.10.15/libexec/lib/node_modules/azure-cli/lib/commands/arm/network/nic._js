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
var util = require('util');
var utils = require('../../../util/utils');
var $ = utils.getLocaleString;
var tagUtils = require('../tag/tagUtils');
var Subnet = require('./subnet');
var LoadBalancer = require('./loadBalancer');
var Nsg = require('./nsg');
var PublicIp = require('./publicIPAddress.helper');

function Nic(cli, networkManagementClient) {
  this.networkManagementClient = networkManagementClient;
  this.subnetCrud = new Subnet(cli, networkManagementClient);
  this.loadBalancerCrud = new LoadBalancer(cli, networkManagementClient);
  this.nsgCrud = new Nsg(cli, networkManagementClient);
  this.publicIpCrud = new PublicIp(cli, networkManagementClient);
  this.output = cli.output;
  this.interaction = cli.interaction;
}

__.extend(Nic.prototype, {

  get: function (resourceGroupName, nicName, _) {
    var self = this;
    var progress = self.interaction.progress(util.format($('Looking up the network interface "%s"'), nicName));
    try {
      var nic = self.networkManagementClient.networkInterfaces.get(resourceGroupName, nicName, null, _);
      return nic;
    } catch (e) {
      if (e.statusCode === 404) {
        return null;
      }
      throw e;
    } finally {
      progress.end();
    }
  },

  list: function (options, _) {
    var self = this;

    var nics = null;
    var progress = self.interaction.progress($('Getting the network interfaces'));

    try {
      if (options.resourceGroup) {
        if (options.virtualMachineScaleSetName) {
          if (options.virtualMachineIndex) {
            nics = self.networkManagementClient.networkInterfaces.listVirtualMachineScaleSetVMNetworkInterfaces(options.resourceGroup, options.virtualMachineScaleSetName, options.virtualMachineIndex, _);
          } else {
            nics = self.networkManagementClient.networkInterfaces.listVirtualMachineScaleSetNetworkInterfaces(options.resourceGroup, options.virtualMachineScaleSetName, _);
          }
        } else {
          nics = self.networkManagementClient.networkInterfaces.list(options.resourceGroup, _);
        }
      } else {
        nics = self.networkManagementClient.networkInterfaces.listAll(_);
      }
    } finally {
      progress.end();
    }

    self.interaction.formatOutput(nics, function (nics) {
      if (nics.length === 0) {
        self.output.warn($('No network interfaces found'));
      } else {
        self.output.table(nics, function (row, nic) {
          row.cell($('Name'), nic.name);
          row.cell($('Location'), nic.location || '');
          var resInfo = resourceUtils.getResourceInformation(nic.id);
          row.cell($('Resource group'), resInfo.resourceGroup);
          row.cell($('Provisioning state'), nic.provisioningState);
          row.cell($('MAC Address'), nic.macAddress || '');
          row.cell($('IP forwarding'), nic.enableIPForwarding);
          row.cell($('Internal DNS name'), nic.dnsSettings.internalDnsNameLabel || '');
          row.cell($('Internal FQDN'), nic.dnsSettings.internalFqdn || '');
          if (nic.dnsSettings.internalDomainNameSuffix) {
            row.cell($('Internal domain name suffix'), nic.dnsSettings.internalDomainNameSuffix || '');
          }

        });
      }
    });
  },

  show: function (resourceGroupName, nicName, options, _) {
    var self = this;
    var nic = null;

    if (options.virtualMachineScaleSetName || options.virtualMachineIndex) {
      if (!(options.virtualMachineScaleSetName && options.virtualMachineIndex)) {
        throw new Error(util.format($('--virtual-machine-scale-set-name and --virtual-machine-index must be specified')));
      }
      nic = self.getFromScaleSet(resourceGroupName, options.virtualMachineScaleSetName, options.virtualMachineIndex, nicName, _);
    } else {
      nic = self.get(resourceGroupName, nicName, _);
    }

    self._showNic(nic, resourceGroupName, nicName);
  },

  getFromScaleSet: function (resourceGroupName, virtualMachineScaleSetName, virtualMachineIndex, nicName, _) {
    var self = this;
    var progress = self.interaction.progress(util.format($('Looking up the network interface "%s" in scale set "%s"'), nicName, virtualMachineScaleSetName));
    try {
      var nic = self.networkManagementClient.networkInterfaces.getVirtualMachineScaleSetNetworkInterface(resourceGroupName, virtualMachineScaleSetName, virtualMachineIndex, nicName, null, _);
      return nic;
    } catch (e) {
      if (e.statusCode === 404) {
        return null;
      }
      throw e;
    } finally {
      progress.end();
    }
  },

  update: function (resourceGroupName, nicName, nic, _) {
    var self = this;
    var progress = self.interaction.progress(util.format($('Updating network interface "%s"'), nicName));
    try {
      nic = self.networkManagementClient.networkInterfaces.createOrUpdate(resourceGroupName, nicName, nic, _);
      return nic;
    } finally {
      progress.end();
    }
  },

  /**
   * NIC Backend Address Pool methods
   */
  createBackendAddressPool: function (resourceGroupName, nicName, ipConfigName, options, _) {
    this._updateBackendAddressPool(resourceGroupName, nicName, ipConfigName, options, true, _);
  },

  deleteBackendAddressPool: function (resourceGroupName, nicName, ipConfigName, options, _) {
    this._updateBackendAddressPool(resourceGroupName, nicName, ipConfigName, options, false, _);
  },

  /**
   * NIC Inbound NAT Rule methods
   */
  createInboundNatRule: function (resourceGroupName, nicName, ipConfigName, options, _) {
    this._updateInboundNatRule(resourceGroupName, nicName, ipConfigName, options, true, _);
  },

  deleteInboundNatRule: function (resourceGroupName, nicName, ipConfigName, options, _) {
    this._updateInboundNatRule(resourceGroupName, nicName, ipConfigName, options, false, _);
  },

  _showNic: function (nic, resourceGroupName, nicName) {
    var self = this;

    self.interaction.formatOutput(nic, function (nic) {
      if (nic === null) {
        self.output.warn(util.format($('A network interface with name "%s" not found in the resource group "%s"'), nicName, resourceGroupName));
        return;
      }

      self.output.nameValue($('Id'), nic.id);
      self.output.nameValue($('Name'), nic.name);
      self.output.nameValue($('Type'), nic.type);
      self.output.nameValue($('Location'), nic.location);
      self.output.nameValue($('Provisioning state'), nic.provisioningState);
      self.output.nameValue($('Tags'), tagUtils.getTagsInfo(nic.tags));
      self.output.nameValue($('MAC address'), nic.macAddress);
      self.output.nameValue($('Internal DNS name label'), nic.dnsSettings.internalDnsNameLabel);
      self.output.nameValue($('Internal FQDN'), nic.dnsSettings.internalFqdn);
      self.output.nameValue($('Internal domain name suffix'), nic.dnsSettings.internalDomainNameSuffix);
      self.output.nameValue($('Enable IP forwarding'), nic.enableIPForwarding);

      if (nic.networkSecurityGroup) {
        self.output.nameValue($('Network security group'), nic.networkSecurityGroup.id);
      }
      if (nic.virtualMachine) {
        self.output.nameValue($('Virtual machine'), nic.virtualMachine.id);
      }

      self.output.header($('IP configurations'));
      nic.ipConfigurations.forEach(function (ipConfig) {
        self._showIpConfig(ipConfig, nicName, ipConfig.name);
        self.output.data($(''), '');
      });
    });
  },

  _showIpConfig: function(ipConfig, nicName, ipConfigName) {
    var self = this;
    var configIndent = 2;
    var subItemsIndent = 4;

    self.interaction.formatOutput(ipConfig, function (ipConfig) {
      if (ipConfig === null || ipConfig === undefined) {
        self.output.warn(util.format($('IP configuration with name "%s" not found in the nic "%s"'), ipConfigName, nicName));
        return;
      }

      self.output.nameValue($('Name'), ipConfig.name, configIndent);
      self.output.nameValue($('Primary'), ipConfig.primary, configIndent);
      self.output.nameValue($('Provisioning state'), ipConfig.provisioningState, configIndent);
      self.output.nameValue($('Private IP address'), ipConfig.privateIPAddress, configIndent);
      self.output.nameValue($('Private IP version'), ipConfig.privateIPAddressVersion, configIndent);
      self.output.nameValue($('Private IP allocation method'), ipConfig.privateIPAllocationMethod, configIndent);
      if (ipConfig.publicIPAddress) {
        self.output.nameValue($('Public IP address'), ipConfig.publicIPAddress.id, configIndent);
      }
      if (ipConfig.subnet) {
        self.output.nameValue($('Subnet'), ipConfig.subnet.id, configIndent);
      }

      if (ipConfig.loadBalancerBackendAddressPools && ipConfig.loadBalancerBackendAddressPools.length > 0) {
        self.output.header($('Load balancer backend address pools'), configIndent);
        ipConfig.loadBalancerBackendAddressPools.forEach(function (pool) {
          self.output.nameValue($('Id'), pool.id, subItemsIndent);
        });
      }
      if (ipConfig.loadBalancerInboundNatRules && ipConfig.loadBalancerInboundNatRules.length > 0) {
        self.output.header($('Load balancer inbound NAT rules'), configIndent);
        ipConfig.loadBalancerInboundNatRules.forEach(function (rule) {
          self.output.nameValue($('Id'), rule.id, subItemsIndent);
        });
      }
    });
  },

  _updateBackendAddressPool: function (resourceGroupName, nicName, ipConfigName, options, isAdding, _) {
    var self = this;

    var nic = self.get(resourceGroupName, nicName, _);
    if (!nic) {
      throw new Error(util.format($('A network interface with name "%s" not found in the resource group "%s"'), nicName, resourceGroupName));
    }

    var ipConfig;
    if (ipConfigName) {
      ipConfig = utils.findFirstCaseIgnore(nic.ipConfigurations, {name: ipConfigName});
      if (!ipConfig) {
        throw new Error(util.format($('An ip configuration with name "%s" not found in the nic "%s"'), ipConfigName, nicName));
      }
    } else {
      ipConfig = nic.ipConfigurations[0];
      self.output.warn(util.format($('--ip-config-name not specified, using "%s" ip configuration'), ipConfig.name));
    }


    var poolId = null;
    if (!ipConfig.loadBalancerBackendAddressPools) {
      ipConfig.loadBalancerBackendAddressPools = [];
    }

    if (!options.lbAddressPoolId && !options.lbName && !options.lbAddressPoolName) {
      throw new Error($('You must specify --lb-address-pool-id or --lb-name, --lb-address-pool-name'));
    }

    if (options.lbAddressPoolId) {
      if (options.lbName || options.lbAddressPoolName) {
        self.output.warn('--lb-name parameter, --lb-address-pool-name will be ignored');
      }
      poolId = options.lbAddressPoolId;
    } else if (options.lbName || options.lbAddressPoolName) {
      if (!options.lbName) {
        throw new Error($('You must specify --lb-name parameter if --lb-address-pool-name is specified'));
      }
      if (!options.lbAddressPoolName) {
        throw new Error($('You must specify --lb-address-pool-name parameter if --lb-name is specified'));
      }

      var lb = self.loadBalancerCrud.get(resourceGroupName, options.lbName, _);
      if (!lb) {
        throw new Error(util.format($('A load balancer with name "%s" not found in the resource group "%s'), options.lbName, resourceGroupName));
      }

      var pool = utils.findFirstCaseIgnore(lb.backendAddressPools, {name: options.lbAddressPoolName});
      if (!pool) {
        throw new Error(util.format($('A backend address pool with name "%s" not found in the load balancer "%s" resource group "%s"'), options.lbAddressPoolName, options.lbName, resourceGroupName));
      }
      poolId = pool.id;
    }

    if (isAdding) {
      if (utils.findFirstCaseIgnore(ipConfig.loadBalancerBackendAddressPools, {id: poolId})) {
        throw new Error(util.format($('Specified backend address pool already attached to NIC "%s" in the resource group "%s"'), nicName, resourceGroupName));
      }
      ipConfig.loadBalancerBackendAddressPools.push({id: poolId});
    } else {
      var index = utils.indexOfCaseIgnore(ipConfig.loadBalancerBackendAddressPools, {id: poolId});
      if (index === -1) {
        throw new Error(util.format($('Backend address pool is not attached to NIC "%s" in the resource group "%s"'), nicName, resourceGroupName));
      }
      ipConfig.loadBalancerBackendAddressPools.splice(index, 1);
    }

    nic = self.update(resourceGroupName, nicName, nic, _);
    self._showNic(nic);
  },

  _updateInboundNatRule: function (resourceGroupName, nicName, ipConfigName, options, isAdding, _) {
    var self = this;

    var nic = self.get(resourceGroupName, nicName, _);
    if (!nic) {
      throw new Error(util.format($('A network interface with name "%s" not found in the resource group "%s"'), nicName, resourceGroupName));
    }

    var ipConfig;
    if (ipConfigName) {
      ipConfig = utils.findFirstCaseIgnore(nic.ipConfigurations, {name: ipConfigName});
      if (!ipConfig) {
        throw new Error(util.format($('An ip configuration with name "%s" not found in the nic "%s"'), ipConfigName, nicName));
      }
    } else {
      ipConfig = nic.ipConfigurations[0];
      self.output.warn(util.format($('--ip-config-name not specified, using "%s" ip configuration'), ipConfig.name));
    }


    var ruleId = null;
    if (!ipConfig.loadBalancerInboundNatRules) {
      ipConfig.loadBalancerInboundNatRules = [];
    }

    if (!options.lbInboundNatRuleId && !options.lbName && !options.lbInboundNatRuleName) {
      throw new Error($('You must specify --lb-inbound-nat-rule-id or --lb-name, --lb-inbound-nat-rule-name'));
    }

    if (options.lbInboundNatRuleId) {
      if (options.lbName || options.lbInboundNatRuleName) {
        self.output.warn('--lb-name, --lb-inbound-nat-rule-name will be ignored');
      }
      ruleId = options.lbInboundNatRuleId;
    } else if (options.lbName || options.lbInboundNatRuleName) {
      if (!options.lbName) {
        throw new Error($('You must specify --lb-name parameter if --lb-inbound-nat-rule-name is specified'));
      }
      if (!options.lbInboundNatRuleName) {
        throw new Error($('You must specify --lb-inbound-nat-rule-name parameter if --lb-name is specified'));
      }

      var lb = self.loadBalancerCrud.get(resourceGroupName, options.lbName, _);
      if (!lb) {
        throw new Error(util.format($('A load balancer with name "%s" not found in the resource group "%s'), options.lbName, resourceGroupName));
      }

      var rule = utils.findFirstCaseIgnore(lb.inboundNatRules, {name: options.lbInboundNatRuleName});
      if (!rule) {
        throw new Error(util.format($('An inbound NAT rule with name "%s" not found in the load balancer "%s"'), options.lbInboundNatRuleName, options.lbName));
      } else {
        ruleId = rule.id;
      }
    }

    if (isAdding) {
      if (!utils.findFirstCaseIgnore(ipConfig.loadBalancerInboundNatRules, {id: ruleId})) {
        ipConfig.loadBalancerInboundNatRules.push({id: ruleId});
      } else {
        throw new Error(util.format($('Inbound NAT rule already attached to NIC "%s" in the resource group "%s"'), nicName, resourceGroupName));
      }
    } else {
      var index = utils.indexOfCaseIgnore(ipConfig.loadBalancerInboundNatRules, {id: ruleId});
      if (index !== -1) {
        ipConfig.loadBalancerInboundNatRules.splice(index, 1);
      } else {
        throw new Error(util.format($('Inbound NAT rule is not attached to NIC "%s" in the resource group "%s"'), nicName, resourceGroupName));
      }
    }

    nic = self.update(resourceGroupName, nicName, nic, _);
    self._showNic(nic);
  }
});

module.exports = Nic;