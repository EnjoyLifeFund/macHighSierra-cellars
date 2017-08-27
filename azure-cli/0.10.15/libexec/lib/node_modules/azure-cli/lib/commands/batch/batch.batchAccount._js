//
// Copyright (c) Microsoft and contributors.  All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//
// See the License for the specific language governing permissions and
// limitations under the License.
//

var util = require('util');
var utils = require('../../util/utils');
var batchUtil = require('./batch.util');
var batchShowUtil = require('./batch.showUtil');
var storageUtil = require('../../util/storage.util');

var $ = utils.getLocaleString;

exports.init = function (cli) {
  batchUtil.init(cli);
  
  var logger = cli.output;
  
  var batch = cli.category('batch')
    .description($('Commands to manage your Batch objects'));

  var batchAccount = batch.category('account')
    .description($('Commands to manage your Batch accounts'));

  var keys = batchAccount.category('keys')
    .description($('Commands to manage your Batch account keys'));

  function showProgress(message) {
    return cli.interaction.progress(message);
  }

  function endProgress(progress)
  {
    if (progress) {
      progress.end();
    }
  }

  function validateResourceGroupName(options, _) {
    options.resourceGroup = cli.interaction.promptIfNotGiven($('Resource group name: '), options.resourceGroup, _);
  }

  function listAccounts(serviceClient, options, _) {
    var progress = showProgress($('Getting Batch accounts'));
    var batchAccounts;
    var response;
    try {
      if(options.resourceGroup){
        response = serviceClient.batchAccountOperations.listByResourceGroup(options.resourceGroup, _);
        batchAccounts = response;

        while(response.nextLink) {
          response = serviceClient.batchAccountOperations.listByResourceGroup(options.resourceGroup, _);
          batchAccounts.concat(response);
        }
      }
      else {
        response = serviceClient.batchAccountOperations.list(_);
        batchAccounts = response;

        while(response.nextLink) {
          response = serviceClient.batchAccountOperations.list(_);
          batchAccounts.concat(response);
        }
      }
    } finally {
      endProgress(progress);
    }

    return batchAccounts;
  }

  function showAccount(serviceClient, accountName, options, _) {
    var progress;
    var message = $('Getting Batch account');
    var batchAccount;
    try {
      validateResourceGroupName(options, _);
      progress = showProgress(message);
      batchAccount = serviceClient.batchAccountOperations.get(options.resourceGroup, accountName, _);
    } finally {
      endProgress(progress);
    }

    return batchAccount;
  }

  function createAccount(serviceClient, accountName, parameters, options, _) {
    var progress;
    var message = $('Creating Batch account');
    var batchAccount;
    
    try {
      validateResourceGroupName(options, _);
      progress = showProgress(message);
      batchAccount = serviceClient.batchAccountOperations.create(options.resourceGroup, accountName, parameters, _);
    } finally {
      endProgress(progress);
    }

    return batchAccount;
  }

  function setAccount(serviceClient, accountName, parameters, options, _) {
    var progress;
    var message = $('Updating Batch account');
    var batchAccount;
    
    try {
      validateResourceGroupName(options, _);
      progress = showProgress(message);
      batchAccount = serviceClient.batchAccountOperations.update(options.resourceGroup, accountName, parameters, _);
    } finally {
      endProgress(progress);
    }

    return batchAccount;
  }

  function deleteAccount(serviceClient, accountName, options, _) {
    var progress;
    var message = $('Deleting Batch account');

    try {
      validateResourceGroupName(options, _);
      progress = showProgress(message);
      serviceClient.batchAccountOperations.deleteMethod(options.resourceGroup, accountName, _);
    }
    catch (err) {
      // It looks like the RP puts the operation status token under the account that's
      // being deleted, so we get a 404 from our Get Operation Status call when the
      // deletion completes. We want 404 to throw an error on the initial delete
      // request, but for now we want to consider a 404 error on the operation status 
      // polling as a success.
      if (err.message.indexOf('ResourceNotFound') === -1 || err.message.indexOf('when polling for operation status') === -1) {
          throw err;
      }
    } finally {
      endProgress(progress);
    }
  }

  function syncAutoStorageKeys(serviceClient, accountName, options, _) {
    var progress;
    var message = $('Synchronizing auto storage account keys');
    
    try {
      validateResourceGroupName(options, _);
      progress = showProgress(message);
      serviceClient.batchAccountOperations.synchronizeAutoStorageKeys(options.resourceGroup, accountName, _);
    } finally {
      endProgress(progress);
    }
  }

  function getAccountKeys(serviceClient, accountName, options, _) {
    var progress;
    var message = $('Getting Batch account keys');
    var keys;
    
    try {
      validateResourceGroupName(options, _);
      progress = showProgress(message);
      keys = serviceClient.batchAccountOperations.getKeys(options.resourceGroup, accountName, _);
    } finally {
      endProgress(progress);
    }

    return keys;
  }

  function regenerateAccountKeys(serviceClient, accountName, options, _) {
    var progress;
    var message = $('Renewing Batch account key');
    var keys;

    try {
      var keyType;
      validateResourceGroupName(options, _);
      progress = showProgress(message);
      keyType = options.primary ? 'Primary' : 'Secondary';
      keys = serviceClient.batchAccountOperations.regenerateKey(options.resourceGroup, accountName, keyType, _);
    } finally {
      endProgress(progress);
    }

    return keys;
  }

  batchAccount.listCommand = function (options, _) {
    var service = batchUtil.createBatchManagementClient(options.subscription);

    var batchAccounts = listAccounts(service, options, _);

    batchAccounts.forEach(function(batchAccount) {
     batchAccount.resourceGroup = batchUtil.parseResourceGroupNameFromId(batchAccount.id);
    });

    cli.interaction.formatOutput(batchAccounts, function (outputData) {
      if(outputData.length === 0) {
        logger.info($('No Batch accounts found'));
      } else {
        logger.table(outputData, function (row, item) {
          row.cell($('Name'), item.name);
          row.cell($('Location'), item.location);
          row.cell($('Resource Group'), item.resourceGroup);
        });
      }
    });
  };

  batchAccount.showCommand = function (name, options, _) {
    var service = batchUtil.createBatchManagementClient(options.subscription);

    var batchAccount = showAccount(service, name, options, _);

    if (batchAccount) {
      batchShowUtil.showBatchAccount(batchAccount, cli.output);
    } else {
      logger.info($('No Batch account found'));
    }
  };

  batchAccount.createCommand = function (name, options, _) {
    var service = batchUtil.createBatchManagementClient(options.subscription);

    options.location = cli.interaction.promptIfNotGiven($('Location: '), options.location, _);
    var batchCreateParameters = {
      location: options.location,
    };

    if (options.tags) {
      batchCreateParameters.tags = storageUtil.parseKvParameterInvariant(options.tags);
    }

    if (options.autostorageAccountId) {
      batchCreateParameters.autoStorage = {
        storageAccountId: options.autostorageAccountId
      };
    }

    createAccount(service, name, batchCreateParameters, options, _);
  };

  batchAccount.setCommand = function (name, options, _) {
    var service = batchUtil.createBatchManagementClient(options.subscription);

    var batchUpdateParameters = {};

    if (options.tags) {
      batchUpdateParameters.tags = storageUtil.parseKvParameterInvariant(options.tags);
    }

    if (options.autostorageAccountId) {
      batchUpdateParameters.autoStorage = {
          storageAccountId: options.autostorageAccountId, 
      };
    }

    setAccount(service, name, batchUpdateParameters, options, _);
  };

  batchAccount.deleteCommand = function (name, options, _) {
    var service = batchUtil.createBatchManagementClient(options.subscription);

    if (!options.quiet && !cli.interaction.confirm(util.format($('Delete Batch account %s? [y/n] '), name), _)) {
      return;
    }

    deleteAccount(service, name, options, _);
  };

  batchAccount.syncAutoStorageKeysCommand = function(name, options, _) {
    var service = batchUtil.createBatchManagementClient(options.subscription);

    syncAutoStorageKeys(service, name, options, _);
  };

  keys.getCommand = function (name, options, _) {
    var service = batchUtil.createBatchManagementClient(options.subscription);

    var keys = getAccountKeys(service, name, options, _);

    if (keys) {
      cli.interaction.formatOutput(keys, function(outputData) {
        logger.data($('Primary:'), outputData.primary);
        logger.data($('Secondary:'), outputData.secondary);
      });
    } else {
      logger.info($('No Batch account keys found'));
    }
  };
  
  keys.renewCommand = function (name, options, _) {
    var service = batchUtil.createBatchManagementClient(options.subscription);

    if (!options.primary && !options.secondary) {
      throw new Error($('Need to specify either --primary or --secondary'));
    } else if (options.primary && options.secondary) {
      throw new Error($('Only one of primary or secondary keys can be renewed at a time'));
    }

    var keys = regenerateAccountKeys(service, name, options, _);

    if (keys) {
      cli.interaction.formatOutput(keys, function(outputData) {
        logger.data($('Primary:'), outputData.primary);
        logger.data($('Secondary:'), outputData.secondary);
      });
    } else {
      logger.info($('No Batch account keys found'));
    }
  };

  // Command: azure batch account list
  batchAccount.command('list')
    .description($('List the Batch accounts associated with the subscription or resource group'))
    .appendSubscriptionAndResourceGroupOption()
    .execute(batchAccount.listCommand);

  // Command: azure batch account show
  batchAccount.command('show <name>')
    .description($('Show detailed information about the specified Batch account'))
    .appendSubscriptionAndResourceGroupOption()
    .execute(batchAccount.showCommand);

  // Command: azure batch account create
  batchAccount.command('create <name>').description($('Creates a new Batch account with the specified parameters'))
    .option('-l, --location <location>', $('the location'))
    .option('--tags <tags>', $('the account tags. Tags are key=value pairs and separated with semicolon(;)'))
    .option('--autostorage-account-id <autostorageAccountId>', $('the resource id of the storage account to be used for auto storage'))
    .appendSubscriptionAndResourceGroupOption()
    .execute(batchAccount.createCommand);

  // Command: azure batch account set
  batchAccount.command('set <name>').description($('Updates the properties of an existing Batch account in the specified resource group'))
    .option('--tags <tags>', $('the account tags. Tags are key=value pairs and separated with semicolon(;)'))
    .option('--autostorage-account-id <autostorageAccountId>', $('the resource id of the storage account to be used for auto storage'))
    .appendSubscriptionAndResourceGroupOption()
    .execute(batchAccount.setCommand);

  // Command: azure batch account delete
  batchAccount.command('delete <name>')
    .description($('Deletes the specified Batch account'))
    .appendSubscriptionAndResourceGroupOption()
    .option('-q, --quiet', $('quiet mode, do not ask for delete confirmation'))
    .execute(batchAccount.deleteCommand);

  // Command: azure batch account sync-autostorage-keys
  batchAccount.command('sync-autostorage-keys <name>')
    .description($('Synchronizes access keys for the auto storage account configured for the specified Batch account'))
    .appendSubscriptionAndResourceGroupOption()
    .execute(batchAccount.syncAutoStorageKeysCommand);

  // Command: azure batch account keys list
  keys.command('list <name>')
    .description($('Gets the account keys for the given Batch account'))
    .appendSubscriptionAndResourceGroupOption()
    .execute(keys.getCommand);

  // Command: azure batch account keys renew
  keys.command('renew <name>')
    .description($('Regenerates the specified account key for the given Batch account'))
    .option('--primary', $('Update the primary key'))
    .option('--secondary', $('Update the secondary key'))
    .appendSubscriptionAndResourceGroupOption()
    .execute(keys.renewCommand);
};