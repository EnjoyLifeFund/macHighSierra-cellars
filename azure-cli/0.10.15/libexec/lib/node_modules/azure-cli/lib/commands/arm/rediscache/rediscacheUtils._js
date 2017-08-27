/**
* Copyright (c) Microsoft.  All rights reserved.
*
* Licensed under the Apache License, Version 2.0 (the 'License');
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an 'AS IS' BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

'use strict';

var __ = require('underscore');
var util = require('util');
var fs = require('fs');
var utils = require('../../../util/utils');

var SKU_TYPE = ['Basic', 'Standard', 'Premium'];
var VM_SIZE = ['C0', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'P1', 'P2', 'P3', 'P4'];
var PREMIUM_VMSIZE = ['P1', 'P2', 'P3', 'P4'];
var NONPREMIUM_VMSIZE = ['C0', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6'];
var REBOOT_TYPE = ['PrimaryNode', 'SecondaryNode', 'AllNodes'];

var $ = utils.getLocaleString;

exports.getrediscacheClient = function (subscription) {
  return utils.createRedisCacheManagementClient(subscription);
};

exports.parseSkuVM = function (skuName, vmSize) {
  var skuVM = {
    sku: SKU_TYPE[1],
    vmSize: VM_SIZE[1]
  };
  if (__.isUndefined(skuName) || __.isUndefined(vmSize)) {
    return skuVM;
  }

  var indexSku = SKU_TYPE.indexOf(skuName);
  if (indexSku < 0) {
    throw new Error(util.format($('Argument sku has an invalid value: %s. Expected one of [%s].'), skuName, SKU_TYPE.join(', ')));
  }
  skuVM.sku = SKU_TYPE[indexSku];

  var indexVMSize = VM_SIZE.indexOf(vmSize);
  if (indexVMSize < 0) {
    throw new Error(util.format($('Argument size has an invalid value: %s. Expected one of [%s].'), vmSize, VM_SIZE.join(', ')));
  }
  else if (indexVMSize <= 6 && indexSku == 2) {
    throw new Error(util.format($('Argument size has an invalid value: %s. Expected one of [%s] for %s Sku.'), vmSize, PREMIUM_VMSIZE.join(', '), skuName));
  }
  else if (indexVMSize > 6 && indexSku < 2) {
    throw new Error(util.format($('Argument size has an invalid value: %s. Expected one of [%s] for %s Sku.'), vmSize, NONPREMIUM_VMSIZE.join(', '), skuName));
  }
  skuVM.vmSize = VM_SIZE[indexVMSize];

  return skuVM;
};

exports.parseRebootType = function (rebootType) {
  var indexRebootType = REBOOT_TYPE.indexOf(rebootType);
  if (indexRebootType < 0) {
    throw new Error(util.format($('Argument reboot-type has an invalid value: %s. Expected one of [%s].'), rebootType, REBOOT_TYPE.join(', ')));
  }
};

exports.getValidRedisConfiguration = function (options) {
  var redisConfigurationValues;
  if (options.redisConfigurationFile) {
    var jsonFile = fs.readFileSync(options.redisConfigurationFile, 'utf8');
    redisConfigurationValues = JSON.parse(utils.stripBOM(jsonFile));
  } else if (options.redisConfiguration) {
    redisConfigurationValues = JSON.parse(options.redisConfiguration);
  }

  if (!redisConfigurationValues) {
    throw new Error('Error parsing Redis Configuration parameters');
  }
  else {
    return redisConfigurationValues;
  }
};

exports.validateStringWithDefinedValues = function (argName, argValue, validValues) {
  var index = validValues.indexOf(argValue);
  if (index < 0) {
    throw new Error(util.format($('Argument %s has an invalid value: %s. Expected one of [%s].'), argName, argValue, validValues.join(', ')));
  }
  return true;
};

exports.parseEnumArgument = function (argName, argValue, validValues, _default) {
  if (__.isUndefined(argValue)) {
    return _default;
  }
  var index = validValues.indexOf(argValue);
  if (index < 0) {
    throw new Error(util.format($('Argument %s has an invalid value: %s. Expected one of [%s].'), argName, argValue, validValues.join(', ')));
  }
  return validValues[index];
};

exports.showNotFoundError = function notFoundError(resourceGroup, cacheName) {
  var msg;
  if (resourceGroup) {
    msg = util.format($('Cache not found in resource group %s: %s'), resourceGroup, cacheName);
  } else {
    msg = util.format($('Cache not found: %s'), cacheName);
  }
  return msg;
};

