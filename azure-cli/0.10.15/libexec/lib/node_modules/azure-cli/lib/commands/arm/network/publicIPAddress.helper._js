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

var generatorUtils = require('../../../util/generatorUtils');

function PublicIPAddress(cli, networkManagementClient) {
  this.output = cli.output;
  this.interaction = cli.interaction;
  this.networkManagementClient = networkManagementClient;
}

__.extend(PublicIPAddress.prototype, {
  get: function (resourceGroup, name, _) {
    var self = this;
    var progress = self.interaction.progress(util.format($('Looking up the public ip "%s"'), name));
    try {
      var publicIP = self.networkManagementClient.publicIPAddresses.get(resourceGroup, name, null, _);
      return publicIP;
    } catch (e) {
      if (e.statusCode === 404) {
        return null;
      }
      throw e;
    } finally {
      progress.end();
    }
  },

  show: function (resourceGroup, name, options, _) {
    var self = this;
    var publicIPAddress;

    if (options.vmssName && options.vmIndex && options.nicName && options.ipConfigName) {
      var progress = self.interaction.progress(util.format($('Looking up the public ip address "%s" on VMSS "%s"'), name, options.vmssName));
      try {
        publicIPAddress = self.networkManagementClient.publicIPAddresses.getVirtualMachineScaleSetPublicIPAddress(resourceGroup, options.vmssName, options.vmIndex, options.nicName, options.ipConfigName, name, _);
      } finally {
        progress.end();
      }
    } else {
      publicIPAddress = self.get(resourceGroup, name, _);
      if (!publicIPAddress) {
        self.output.warn(util.format($('public ip address with name "%s" not found in the resource group "%s"'), name, resourceGroup));
      }
    }

    self.interaction.formatOutput(publicIPAddress, generatorUtils.traverse);
  },

  list: function (resourceGroup, options, _) {
    var self = this;
    var progress;
    var publicIPAddresses;

    if (resourceGroup && options.vmssName) {
      progress = self.interaction.progress(util.format($('Looking up public ip addresses on VMSS "%s"'), options.vmssName));
      try {
        if (options.vmIndex && options.nicName && options.ipConfigName) {
          publicIPAddresses = self.networkManagementClient.publicIPAddresses.listVirtualMachineScaleSetVMPublicIPAddresses(resourceGroup, options.vmssName, options.vmIndex, options.nicName, options.ipConfigName, _);
        } else {
          publicIPAddresses = self.networkManagementClient.publicIPAddresses.listVirtualMachineScaleSetPublicIPAddresses(resourceGroup, options.vmssName, _);
        }
      } finally {
        progress.end();
      }
    } else {
       try {
        if (typeof self.networkManagementClient.publicIPAddresses.listAll !== 'function') {
          resourceGroup = self.interaction.promptIfNotGiven($('resource-group : '), resourceGroup, _);
        }
        progress = self.interaction.progress($('Getting public ip addresses'));
        if (resourceGroup) {
          publicIPAddresses = self.networkManagementClient.publicIPAddresses.list(resourceGroup,  _);
        } else {
          publicIPAddresses = self.networkManagementClient.publicIPAddresses.listAll(_);
        }
      } finally {
        progress.end();
      }
    }

    self.interaction.formatOutput(publicIPAddresses, generatorUtils.traverse);
  }
});

module.exports = PublicIPAddress;