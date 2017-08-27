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
var StorageUtil = require('../../../util/storage.util');

var $ = utils.getLocaleString;

function AemExtensionUtil(cli) {
    this.cli = cli;
}

__.extend(AemExtensionUtil.prototype, {
  getStorageAccountProperties: function(serviceClients, storageAccounts, storageAccountName, _){
    var saProperties = {};

    saProperties.name = storageAccountName;

    //Get resourceGroupName and type of storage account
    var resourceGroupName = null;
    storageAccountName = storageAccountName.toLowerCase();
    var pattern = new RegExp('resourceGroups\/(.+?)\/.*/storageAccounts\/'+ storageAccountName + '$');
    for(var i = 0; i < storageAccounts.length; i++){
      storageAccount = storageAccounts[i];
      var match = pattern.exec(storageAccount.id);
      if(match && match[1]){
        resourceGroupName = match[1];
        if(storageAccount.sku.name.slice(0, 'Standard'.length) === 'Standard'){
          saProperties.type = 'Standard';
        }else{
          saProperties.type = 'Premium';
        }
        saProperties.endpoints = storageAccount.primaryEndpoints;
        break;
      }
    }

    if(!resourceGroupName){
      throw new Error(util.format($('Failed to get resource group name for storage account "%s"'), storageAccountName));
    }
    
    StorageUtil.startProgress(util.format($('Getting keys for storage account: "%s"'), storageAccountName));
    var keys = null;
    try{
      keys = serviceClients.storageManagementClient.storageAccounts.listKeys(resourceGroupName, storageAccountName, _);
    } finally {
      StorageUtil.endProgress();
    }
    saProperties.key = keys.keys[0].value;
   
    return saProperties;
  },

  enableStorageAccountAnalytics: function(saProperties, _){
    var options = {
      accountName: saProperties.name,
      accountKey: saProperties.key
    };

    StorageUtil.init(this.cli);

    var client = StorageUtil.getServiceClient(StorageUtil.getBlobService, options);
    var getOperation = StorageUtil.getStorageOperation(client, StorageUtil.OperationType.Blob, 'getServiceProperties');

    var tips = null;
    var loggingProperties = null;
    tips = util.format($('Checking storage logging properties for: %s'), saProperties.name);
    StorageUtil.startProgress(tips);

    try{
      loggingProperties = StorageUtil.performStorageOperation(getOperation, _);
    }finally{
      StorageUtil.endProgress();
    }

    if(!loggingProperties ||
        !loggingProperties.Logging ||
        !loggingProperties.Logging.Read  ||
        !loggingProperties.Logging.Write ||
        !loggingProperties.Logging.Delete ||
        !loggingProperties.MinuteMetrics ||
        !loggingProperties.MinuteMetrics.Enabled ||
        !loggingProperties.MinuteMetrics.RetentionPolicy ||
        !loggingProperties.MinuteMetrics.RetentionPolicy.Enabled ||
        !loggingProperties.MinuteMetrics.RetentionPolicy.Days ||
        loggingProperties.MinuteMetrics.RetentionPolicy.Days === 0){
      this.cli.output.info(util.format($('Logging is not enabled for storage account "%s"'), saProperties.name));
      tips = util.format($('Setting storage logging properties for: %s'), saProperties.name);
      StorageUtil.startProgress(tips);
      try{
        var setOperation = StorageUtil.getStorageOperation(client, StorageUtil.OperationType.Blob, 'setServiceProperties');
        var defaultLoggingPerperties = this.getDefaultLoggingPerperties();
        StorageUtil.performStorageOperation(setOperation, _, defaultLoggingPerperties);
      }finally{
        StorageUtil.endProgress();
      }
    }
  },

  getDefaultLoggingPerperties: function(){
    return {
      Logging:{ 
        Version: '1.0',
        Delete: true,
        Read: true,
        Write: true,
        RetentionPolicy: { Enabled: true, Days: 13 } },
      HourMetrics:{ 
        Version: '1.0',
        Enabled: true,
        IncludeAPIs: true,
        RetentionPolicy: { Enabled: true, Days: 13 } },
      MinuteMetrics:{ 
        Version: '1.0',
        Enabled: true,
        IncludeAPIs: true,
        RetentionPolicy: { Enabled: true, Days: 13 } 
      } 
    }; 
  }

});

module.exports = AemExtensionUtil;
