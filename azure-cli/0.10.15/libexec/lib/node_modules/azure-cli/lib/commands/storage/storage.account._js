/*jshint camelcase: false */

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

var __ = require('underscore');
var util = require('util');

var profile = require('../../util/profile');
var utils = require('../../util/utils');
var validation = require('../../util/validation');
var storageUtil = require('../../util/storage.util');
var resourceLib = require('azure-arm-resource');

var $ = utils.getLocaleString;

exports.init = function (cli) {
  var log = cli.output;
  var isResourceMode = cli.getMode() === 'arm';
  var storage = cli.category('storage');

  var storageAccount = storage.category('account')
    .description($('Commands to manage your Storage accounts'));
    
  var accountSas = storageAccount.category('sas')
    .description($('Commands to manage shared access signatures of your storage account'));

  var keys = storageAccount.category('keys')
    .description($('Commands to manage your Storage account keys'));

  var usage = {};
  if (isResourceMode) {
    usage = storageAccount.category('usage')
      .description($('Commands to manage your Storage accounts usage'));
  }

  var connectionString = storageAccount.category('connectionstring')
    .description($('Commands to show your Storage connection string'));

  var serviceType = { blob: 0, queue: 1, table: 2, file: 3 };

  function wrapEndpoint(uri, type) {
    if (!uri) {
      return '';
    }

    if (uri.indexOf('//') != -1 && !utils.stringStartsWith(uri, 'http://') && !utils.stringStartsWith(uri, 'https://')) {
      throw new Error($('The provided URI "' + uri + '" is not supported.'));
    }

    if (!validation.isURL(uri, {require_protocol: false})) {
      throw new Error('The provided URI "' + uri + '" is invalid.');
    }

    var tag;
    switch (type) {
      case serviceType.blob: tag = 'BlobEndpoint='; break;
      case serviceType.queue: tag = 'QueueEndpoint='; break;
      case serviceType.table: tag = 'TableEndpoint='; break;
      case serviceType.file: tag = 'FileEndpoint='; break;
    }
    return tag + uri + ';';
  }

  function showProgress(message) {
    return cli.interaction.progress(message);
  }

  function endProgress(progress)
  {
    if (progress) {
      progress.end();
    }
  }

  function createStorageManagementClient(subscriptionOrName) {
    var client;
    if(__.isString(subscriptionOrName) || !subscriptionOrName) {
      subscriptionOrName = profile.current.getSubscription(subscriptionOrName);
    }
    if (isResourceMode) {
      client = utils.createStorageResourceProviderClient(subscriptionOrName);
    } else {
      client = utils.createStorageClient(subscriptionOrName);
    }
    return client;
  }

  function validateResourceGroupName(options, _) {
    options.resourceGroup = cli.interaction.promptIfNotGiven($('Resource group name: '), options.resourceGroup, _);
  }
  
  function validateAccountConfiguration(options, storageOptions, isUpdate, _) {
    var value = isResourceMode ? options.skuName : options.type;
    var title = isResourceMode ? $('SKU Name: ') : $('Account Type: ');
    var info = isResourceMode ? $('Getting SKU') : $('Getting type');

    // Checking SKU name (account type)
    if (!isUpdate) {
      if (value) {
        validation.isValidEnumValue(value, Object.keys(storageUtil.AccountTypeForCreating));
      } else {
        value = cli.interaction.chooseIfNotGiven(title, info, value,
          function (cb) {
            cb(null, Object.keys(storageUtil.AccountTypeForCreating));
          }, _);
      }
      storageOptions.accountType = storageUtil.getValidValueFromArgument(value, storageUtil.AccountTypeForCreating);
    } else if (value) {
      validation.isValidEnumValue(value, Object.keys(storageUtil.AccountTypeForChanging));
      storageOptions.accountType = storageUtil.getValidValueFromArgument(value, storageUtil.AccountTypeForChanging);
    }
    
    if (isResourceMode && storageOptions.accountType) {
      storageOptions.sku = { name: storageOptions.accountType };
      delete storageOptions.accountType;
    }
    
    // Location relevant
    if (!isUpdate) {
      if (options.affinityGroup) {
        storageOptions.affinityGroup = options.affinityGroup;
      } else {
        if (!isResourceMode) {
          var managementService = utils.createManagementClient(profile.current.getSubscription(options.subscription), log);
          storageOptions.location = cli.interaction.chooseIfNotGiven($('Location: '), $('Getting locations'), options.location,
            function (cb) {
              managementService.locations.list(function (err, result) {
                if (err) { return cb(err); }

                cb(null, result.locations.map(function (location) { return location.name; }));
              });
            }, _);
        } else {
          var subscription = profile.current.getSubscription(options.subscription);
          var client = new resourceLib.SubscriptionClient(subscription._createCredentials(), 
                                                    subscription.resourceManagerEndpointUrl);
          storageOptions.location = cli.interaction.chooseIfNotGiven($('Location: '), $('Getting locations'), options.location,
            function (cb) {
              client.subscriptions.listLocations(subscription.id, function (err, result) {
                if (err) { return cb(err); }

                cb(null, result.map(function (location) { return location.displayName; }));
              });
            }, _);
        }
      }
    }

    if (!isResourceMode) {
      // Description
      if (__.isString(options.description)) {
        storageOptions.description = options.description;
      }
      
      // Label
      if (options.label) {
        storageOptions.label = options.label;
      }
      
      // No more valid options for the service mode
      return;
    }
    
    if (options.tags) {
      storageOptions.tags = storageUtil.parseKvParameterInvariant(options.tags);
    }
    
    // Checking account kind
    if (!isUpdate) {
      if (options.kind) {
        validation.isValidEnumValue(options.kind, Object.keys(storageUtil.AccountKind));
      } else {
        options.kind = cli.interaction.chooseIfNotGiven($('Kind: '), $('Getting kind'), options.kind,
          function (cb) {
            cb(null, Object.keys(storageUtil.AccountKind));
          }, _);
      }
      storageOptions.kind = storageUtil.getValidValueFromArgument(options.kind, storageUtil.AccountKind);
    }

    // Checking access tier
    // # In creating, access tier is mandatory when kind is "BlobStroage".
    // # In updating, check it when the access tier option is specified.
    if ((isUpdate && options.accessTier) || 
        (options.kind && options.kind.toLowerCase() === storageUtil.AccountKind.BlobStorage.toLowerCase())) {
      if (options.accessTier) {
        validation.isValidEnumValue(options.accessTier, Object.keys(storageUtil.AccessTier));
      } else {
        options.accessTier = cli.interaction.chooseIfNotGiven($('Access Tier: '), $('Getting access tier'), options.accessTier,
          function (cb) {
            cb(null, Object.keys(storageUtil.AccessTier));
          }, _);
      }
      storageOptions.accessTier = storageUtil.getValidValueFromArgument(options.accessTier, storageUtil.AccessTier);
    } else if (!isUpdate && options.accessTier) {
      // When it runs into here, it means it is in creating an account and want to set the access tier for the account of "Storage" kind.
      throw new Error($('The storage account property \'--access-tier\' cannot be set at this time.'));
    }
    
    // Encryption
    if (options.enableEncryptionService) {
      options.enableEncryptionService = options.enableEncryptionService.split(',');
    }
    if (options.disableEncryptionService) {
      options.disableEncryptionService = options.disableEncryptionService.split(',');
    }

    if (options.enableEncryptionService) {
      storageOptions.encryption = { services: {}, keySource: storageUtil.EncryptionKeySource.Storage };

      options.enableEncryptionService.forEach(function(enableService) {
        validation.isValidEnumValue(enableService, Object.keys(storageUtil.EncryptionService));
        
        if (options.disableEncryptionService) {
          options.disableEncryptionService.forEach(function(disableService) {
            if (disableService.toLowerCase() === enableService.toLowerCase()) {
              throw new Error($('Only one of --enable-encryption-service and --disable-encryption-service can be set for a service'));
            }
          });          
        }

        storageOptions.encryption.services[enableService.toLowerCase()] = { enabled: true };
      });
    }
    
    if (options.disableEncryptionService) {
      storageOptions.encryption = storageOptions.encryption || { services: {}, keySource: storageUtil.EncryptionKeySource.Storage };

      options.disableEncryptionService.forEach(function(disableService) {
        validation.isValidEnumValue(disableService, Object.keys(storageUtil.EncryptionService));
        storageOptions.encryption.services[disableService.toLowerCase()] = { enabled: false };
      });
    }
    
    // Custom domain
    if (options.customDomain) {
      var customDomain = {};
      if (options.customDomain === storageUtil.SPACE_PARAMETER) {
        customDomain.name = '';
      } else {
        customDomain.name = options.customDomain;
        if (options.subdomain === true) {
          customDomain.useSubDomain = true;
        }
      }
      storageOptions.customDomain = customDomain;
    }
  }

  //
  // Command implementations
  //
  
  function listAccounts(serviceClient, options, _) {
    var progress = showProgress($('Getting storage accounts'));
    var storageAccounts;
    try {
      if (isResourceMode) {
        if(options.resourceGroup){
            storageAccounts = __.toArray(serviceClient.storageAccounts.listByResourceGroup(options.resourceGroup, _));
        }
        else{
            storageAccounts = __.toArray(serviceClient.storageAccounts.list(_));
        }
      } else {
        storageAccounts = serviceClient.storageAccounts.list(_).storageAccounts;
      }
    } finally {
      endProgress(progress);
    }

    return storageAccounts;
  }

  function showAccount(serviceClient, accountName, options, _) {
    var progress;
    var message = $('Getting storage account');
    var storageAccount;
    try {
      if (isResourceMode) {
        validateResourceGroupName(options, _);
        progress = showProgress(message);
        storageAccount = serviceClient.storageAccounts.getProperties(options.resourceGroup, accountName, _);
      } else {
        progress = showProgress(message);
        storageAccount = serviceClient.storageAccounts.get(accountName, _).storageAccount;
      }
    } finally {
      endProgress(progress);
    }

    return storageAccount;
  }

  function createAccount(serviceClient, parameters, options, _) {
    var progress;
    var message = $('Creating storage account');
    var storageAccount;
    
    try {
      if (isResourceMode) {
        validateResourceGroupName(options, _);
        progress = showProgress(message);
        storageAccount = serviceClient.storageAccounts.create(options.resourceGroup, parameters.name, parameters, _);
      } else {
        progress = showProgress(message);
        storageAccount = serviceClient.storageAccounts.create(parameters, _);
      }
    } finally {
      endProgress(progress);
    }

    return storageAccount;
  }

  function updateAccount(serviceClient, parameters, options, _) {
    var progress;
    var message = $('Updating storage account');
    var storageAccount;

    try {
      if (isResourceMode) {
        validateResourceGroupName(options, _);
        progress = showProgress(message);
        return serviceClient.storageAccounts.update(options.resourceGroup, parameters.name, parameters, _);
      } else {
        progress = showProgress(message);
        return serviceClient.storageAccounts.update(parameters.name, parameters, _);
      }
    } finally {
      endProgress(progress);
    }

    return storageAccount;
  }

  function deleteAccount(serviceClient, accountName, options, _) {
    var progress;
    var message = $('Deleting storage account');
    var storageAccount;

    try {
      if (isResourceMode) {
        validateResourceGroupName(options, _);
        progress = showProgress(message);
        storageAccount = serviceClient.storageAccounts.deleteMethod(options.resourceGroup, accountName, _);
      } else {
        progress = showProgress(message);
        storageAccount = serviceClient.storageAccounts.deleteMethod(accountName, _);
      }
    } finally {
      endProgress(progress);
    }

    return storageAccount;
  }

  function checkNameAvailability(serviceClient, accountName, _) {
    var progress;
    var message = $('Checking availability of the storage account name');
    var availability = {};

    try {
      progress = showProgress(message);
      availability = serviceClient.storageAccounts.checkNameAvailability(accountName, _);
    } catch (e) {
      if (!isResourceMode) {
        availability.isAvailable = false;
        availability.reason = e.message;
        availability.statusCode = e.statusCode;
        availability.requestId = e.requestId;
      } else {
        throw e;
      }
    } finally {
      endProgress(progress);
    }

    if (!isResourceMode) {
      availability.nameAvailable = availability.isAvailable;
      delete availability.isAvailable;
    }

    return availability;
  }

  function showSubscriptionUsage(serviceClient, subscriptionId, _) {
    var progress;
    var message = $('Showing the subscription usage');
    var usage = { subscription: subscriptionId };

    if(!subscriptionId) {
      usage.subscriptionId = profile.current.getSubscription().id;
    }

    try {
      progress = showProgress(message);
      var usageList = serviceClient.usageOperations.list(_);
      for (var i = 0; i < usageList.length; i++) {
        if (usageList[i].name.value === 'StorageAccounts') {
          usage.used = usageList[i].currentValue;
          usage.limit = usageList[i].limit;
          break;
        }
      }
    } finally {
      endProgress(progress);
    }
    return usage;
  }

  function getAccountKeys(serviceClient, accountName, options, _) {
    var progress;
    var message = $('Getting storage account keys');
    var keys;
    
    try {
      if (isResourceMode) {
        validateResourceGroupName(options, _);
        progress = showProgress(message);
        keys = serviceClient.storageAccounts.listKeys(options.resourceGroup, accountName, _);
      } else {
        progress = showProgress(message);
        keys = serviceClient.storageAccounts.getKeys(accountName, _);
      }
    } finally {
      endProgress(progress);
    }

    return keys;
  }

  function regenerateAccountKeys(serviceClient, accountName, options, _) {
    var progress;
    var message = $('Renewing storage account key');
    var keys;

    try {
      var keyType;
      if (isResourceMode) {
        validateResourceGroupName(options, _);
        progress = showProgress(message);
        keyType = options.primary ? 'key1' : 'key2';
        keys = serviceClient.storageAccounts.regenerateKey(options.resourceGroup, accountName, keyType, _);
      } else {
        keyType = options.primary ? 'primary' : 'secondary';
        var parameters = { name: accountName, keyType: keyType };
        progress = showProgress(message);
        keys = serviceClient.storageAccounts.regenerateKeys(parameters, _);
      }
    } finally {
      endProgress(progress);
    }

    return keys;
  }

  function parseResourceGroupNameFromId(id) {
    if (!id) { return ''; }
    var keyword = '/resourceGroups/';
    var startIndex = id.indexOf(keyword) + keyword.length;
    var endIndex = id.indexOf('/', startIndex);
    return id.substring(startIndex, endIndex); 
  }

  storageAccount.listCommand = function (options, _) {
    var service = createStorageManagementClient(options.subscription);

    var storageAccounts = listAccounts(service, options, _);

    storageAccounts.forEach(function(storageAccount) {
     storageAccount.resourceGroup = parseResourceGroupNameFromId(storageAccount.id);
    });

    cli.interaction.formatOutput(storageAccounts, function (outputData) {
      if(outputData.length === 0) {
        log.info($('No storage accounts defined'));
      } else {
        log.table(outputData, function (row, item) {
          row.cell($('Name'), item.name);
          if (isResourceMode) {
            row.cell($('SKU Name'), item.sku.name);
            row.cell($('SKU Tier'), item.sku.tier);
            row.cell($('Access Tier'), item.accessTier ? item.accessTier : '');
            row.cell($('Kind'), item.kind);
            if (item.encryption) {
              var encryptionServices = '';
              Object.keys(item.encryption.services).forEach(function (service) {
                encryptionServices += service + ' ';
              });
              row.cell($('Encrypted Service'), encryptionServices);
            } else {
              row.cell($('Encrypted Service'), '');
            }
            row.cell($('Location'), item.location);
            row.cell($('Resource Group'), item.resourceGroup);
          } else {
            row.cell($('Type'), item.properties.accountType);
            row.cell($('Label'), item.properties.label ? item.properties.label : '');
            row.cell($('Location'), item.properties.location ||
              (item.properties.affinityGroup || '') +
              (item.properties.geoPrimaryRegion ? ' (' + item.properties.geoPrimaryRegion + ')' : ''));
            row.cell($('Resource Group'), item.extendedProperties.ResourceGroup);
          }
        });
      }
    });
  };

  storageAccount.showCommand = function (name, options, _) {
    var service = createStorageManagementClient(options.subscription);

    var storageAccount = showAccount(service, name, options, _);

    if (storageAccount) {
      storageAccount.resourceGroup = parseResourceGroupNameFromId(storageAccount.id);
      cli.interaction.formatOutput(storageAccount, function(outputData) {
        log.data($('Name:'), outputData.name);
        if (isResourceMode) {
          log.data($('Url:'), outputData.id);
          log.data($('Type:'), outputData.type);
          log.data($('SKU Name:'), outputData.sku.name);
          log.data($('SKU Tier:'), outputData.sku.tier);
          log.data($('Kind:'), outputData.kind);
          if (outputData.kind.toLowerCase() == storageUtil.AccountKind.BlobStorage.toLowerCase()) {
            log.data($('Access Tier:'), outputData.accessTier);
          }
          log.data($('Resource Group:'), outputData.resourceGroup);
          log.data($('Location:'), outputData.location);
          log.data($('Provisioning State:'), outputData.provisioningState);
          log.data($('Primary Location:'), outputData.primaryLocation);
          log.data($('Primary Status:'), outputData.statusOfPrimary);
          if (outputData.encryption) {
            cli.interaction.logEachData($('Encryption:'), outputData.encryption.services);
          }
          if (outputData.customDomain) {
            log.data($('Custom Domain:'), outputData.customDomain.name);
          }
          log.data($('Secondary Location:'), outputData.secondaryLocation);
          log.data($('Creation Time:'), outputData.creationTime ? outputData.creationTime.toUTCString() : '');
          cli.interaction.logEachData($('Primary Endpoints:'), outputData.primaryEndpoints);
          if (outputData.tags) {
            cli.interaction.logEachData($('Tags:'), outputData.tags);
          }
        } else {
          log.data($('Url:'), outputData.uri);

          cli.interaction.logEachData($('Account Properties:'), outputData.properties);
          cli.interaction.logEachData($('Extended Properties:'), outputData.extendedProperties);
          cli.interaction.logEachData($('Capabilities:'), outputData.capabilities);
        }
      });
    } else {
      log.info($('No storage account found'));
    }
  };

  storageAccount.createCommand = function (name, options, _) {
    var service = createStorageManagementClient(options.subscription);
    var storageOptions = { 
      name: name, 
      label: options.label ? options.label : name };
      
    // To avoid creating command changes an existing one, check it first
    var availability = checkNameAvailability(service, name, _);
    if (!availability.nameAvailable)
    {
      if (availability.reason === 'AlreadyExists') {
        throw new Error(util.format($('The storage account named "%s" is already taken'), name));
      } else if (availability.reason === 'AccountNameInvalid') {
        throw new Error(availability.message || util.format($('The storage account name "%s" is not in valid format'), name));
      } else {

        throw new Error(availability.message || availability.reason || util.format($('The storage account named "%s" is already taken or not valid'), name));
      }
    }

    validateAccountConfiguration(options, storageOptions, false, _);

    createAccount(service, storageOptions, options, _);
  };

  storageAccount.updateCommand = function (name, options, _) {
    var service = createStorageManagementClient(options.subscription);
    var storageOptions = { name: name };

    validateAccountConfiguration(options, storageOptions, true, _);

    updateAccount(service, storageOptions, options, _);
  };

  storageAccount.deleteCommand = function (name, options, _) {
    var service = createStorageManagementClient(options.subscription);

    if (!options.quiet && !cli.interaction.confirm(util.format($('Delete storage account %s? [y/n] '), name), _)) {
      return;
    }

    deleteAccount(service, name, options, _);
  };

  storageAccount.checkCommand = function (name, options, _) {
    var service = createStorageManagementClient();
    var availability = checkNameAvailability(service, name, _);

    cli.interaction.formatOutput(availability, function(outputData) {
      log.data($('Availability:'), outputData.nameAvailable.toString());
      if (!outputData.nameAvailable) {
        log.data($('Reason:'), outputData.reason);
        if (outputData.message) {
          log.data($('Message:'), outputData.message);
        }
      }
    });
  };

  usage.usageCommand = function (subscription, options, _) {
    var service = createStorageManagementClient(subscription);
    var usage = showSubscriptionUsage(service, subscription, _);

    cli.interaction.formatOutput(usage, function(outputData) {
      log.data($('Subscription:'), outputData.subscriptionId);
      log.data($('Used:'), outputData.used);
      log.data($('Limit:'), outputData.limit);
    });
  };
  
  accountSas.createCommand = function (services, resourceTypes, permissions, expiry, options, _) {
    services = cli.interaction.promptIfNotGiven($('Services: '), services, _);
    storageUtil.validateAccountSasServices(services);
    
    resourceTypes = cli.interaction.promptIfNotGiven($('Resource Types: '), resourceTypes, _);
    storageUtil.validateAccountSasResourceTypes(resourceTypes);
    
    permissions = cli.interaction.promptIfNotGiven($('Permissions: '), permissions, _);
    storageUtil.validateAccountSasPermissions(permissions);
    
    expiry = cli.interaction.promptIfNotGiven($('Expiry: '), expiry, _);
    expiry = utils.parseDateTime(expiry);
    
    var start;
    if (options.start) {
      start = utils.parseDateTime(options.start);
    }
    
    var output = { sas: '' };
    var progress = showProgress('Creating shared access signature');
    try {
      var sharedAccessPolicy = storageUtil.getAccountSharedAccessPolicy(services, resourceTypes, permissions, options.protocol, options.ipRange, start, expiry, options.policy);
      output.sas = storageUtil.generateAccountSharedAccessSignature(options, sharedAccessPolicy);
    } finally {
      endProgress(progress);
    }

    cli.interaction.formatOutput(output, function(outputData) {
      log.data($('Shared Access Signature'), outputData.sas);
    });
  };

  keys.listCommand = function (name, options, _) {
    var service = createStorageManagementClient(options.subscription);

    var keys = getAccountKeys(service, name, options, _);

    if (keys) {
      if (isResourceMode) {
       log.table(keys.keys, function (row, item) {
          row.cell($('Name'), item.keyName);
          row.cell($('Key'), item.value);
          row.cell($('Permissions'), item.permissions);
        });
      } else {
        cli.interaction.formatOutput(keys, function(outputData) {
          log.data($('Primary:'), outputData.primaryKey);
          log.data($('Secondary:'), outputData.secondaryKey);
        });
      }
    } else {
      log.info($('No storage account keys found'));
    }
  };

  keys.renewCommand = function (name, options, _) {
    var service = createStorageManagementClient(options.subscription);

    if (!options.primary && !options.secondary) {
      throw new Error($('Need to specify either --primary or --secondary'));
    } else if (options.primary && options.secondary) {
      throw new Error($('Only one of primary or secondary keys can be renewed at a time'));
    }

    var keys = regenerateAccountKeys(service, name, options, _);

    if (keys) {
      if (isResourceMode) {
        log.table(keys.keys, function (row, item) {
          row.cell($('Name'), item.keyName);
          row.cell($('Key'), item.value);
          row.cell($('Permissions'), item.permissions);
        });
      } else{
        cli.interaction.formatOutput(keys, function(outputData) {
          log.data($('Primary:'), outputData.primaryKey);
          log.data($('Secondary:'), outputData.secondaryKey);
        });
      }
    } else {
      log.info($('No storage account keys found'));
    }
  };

  connectionString.showCommand = function (name, options, _) {
    var service = createStorageManagementClient(options.subscription);
    var keys = getAccountKeys(service, name, options, _);
    var connection = { string: '' };
    connection.string = 'DefaultEndpointsProtocol=' + (options.useHttp ? 'http;' : 'https;');
    connection.string += wrapEndpoint(options.blobEndpoint, serviceType.blob);
    connection.string += wrapEndpoint(options.queueEndpoint, serviceType.queue);
    connection.string += wrapEndpoint(options.tableEndpoint, serviceType.table);
    connection.string += wrapEndpoint(options.fileEndpoint, serviceType.file);
    connection.string += 'AccountName=' + name + ';';
    connection.string += 'AccountKey=' + (keys.primaryKey || keys.keys[0].value);
    cli.interaction.formatOutput(connection, function (outputData) {
      log.data($('connectionstring:'), outputData.string);
    });
  };
  
  Object.getPrototypeOf(storage).appendSubscriptionAndResourceGroupOption = function () {
    if (isResourceMode) {
      this.option('-g, --resource-group <resourceGroup>', $('the resource group name'));
    }
    this.option('-s, --subscription <id>', $('the subscription id'));
    return this;
  };

  // Command: azure storage account list
  storageAccount.command('list')
    .description($('List storage accounts'))
    .appendSubscriptionAndResourceGroupOption()
    .execute(storageAccount.listCommand);

  // Command: azure storage account show
  storageAccount.command('show <name>')
    .description($('Show a storage account'))
    .appendSubscriptionAndResourceGroupOption()
    .execute(storageAccount.showCommand);

  // Command: azure storage account create
  var accountCreateCommand = storageAccount.command('create <name>').description($('Create a storage account'));
  if (isResourceMode) {
    accountCreateCommand.option('--sku-name <skuName>', $('the SKU name (LRS/ZRS/GRS/RAGRS/PLRS)'))
      .option('--kind <kind>', $('the account kind (Storage/BlobStorage)'))
      .option('--access-tier <accessTier>', $('the access tier for Blob storage accounts (Hot/Cool)'))
      .option('--enable-encryption-service <enableEncryptionService>', $('specifies the service which needs to enable encryption settings. Valid inputs are blob, file or combination of any of them and separated with comma(,)'))
      .option('--custom-domain <customDomain>', $('the custom domain'))
      .option('--subdomain', $('whether uses the \'asverify\' subdomain to preregister the custom domain'))
      .option('--tags <tags>', $('the account tags. Tags are key=value pairs and separated with semicolon(;)'));
  } else {
    accountCreateCommand.option('--type <type>', $('the account type(LRS/ZRS/GRS/RAGRS/PLRS)'))
      .option('-e, --label <label>', $('the storage account label'))
      .option('-d, --description <description>', $('the storage account description'))
      .option('-a, --affinity-group <affinityGroup>', $('the affinity group'));
  }
  accountCreateCommand.option('-l, --location <location>', $('the location'))
    .appendSubscriptionAndResourceGroupOption()
    .execute(storageAccount.createCommand);

  // Command: azure storage account set
  var accountSetCommand;
  if (isResourceMode) {
    accountSetCommand = storageAccount.command('set <name>').description($('Update a storage account'))
      .option('--sku-name <skuName>', $('the SKU name (LRS/GRS/RAGRS)'))
      .option('--access-tier <accessTier>', $('the access tier for Blob storage accounts (Hot/Cool)'))
      .option('--enable-encryption-service <enableEncryptionService>', $('specifies the service which needs to enable encryption settings. Valid inputs are blob, file or combination of any of them and separated with comma(,). Only one of --enable-encryption-service and --disable-encryption-service can be set for a service'))
      .option('--disable-encryption-service <disableEncryptionService>', $('specifies the service which needs to disable encryption settings. Valid inputs are blob, file or combination of any of them and separated with comma(,). Only one of --enable-encryption-service and --disable-encryption-service can be set for a service'))
      .option('--custom-domain <customDomain>', $('the custom domain'))
      .option('--subdomain', $('whether uses the \'asverify\' subdomain to preregister the custom domain'))
      .option('--tags <tags>', $('the account tags. Tags are key=value pairs and separated with semicolon(;)'));
  } else {
    accountSetCommand = storageAccount.command('set <name>').description($('Update a storage account'))
      .option('--type <type>', $('the account type(LRS/GRS/RAGRS)'))
      .option('-e, --label <label>', $('the storage account label'))
      .option('-d, --description <description>', $('the storage account description'));
  }
  accountSetCommand.appendSubscriptionAndResourceGroupOption()
    .execute(storageAccount.updateCommand);

  // Command: azure storage account delete
  storageAccount.command('delete <name>')
    .description($('Delete a storage account'))
    .appendSubscriptionAndResourceGroupOption()
    .option('-q, --quiet', $('quiet mode, do not ask for delete confirmation'))
    .execute(storageAccount.deleteCommand);

  storageAccount.command('check <name>')
    .description($('Check whether the account name is valid and is not in use.'))
    .execute(storageAccount.checkCommand);

  if (isResourceMode) {
    usage.command('show [subscription]')
      .description($('Show the current count and the limit of the storage accounts under the subscription.'))
      .option('-s, --subscription <id>', $('the subscription id'))
      .execute(usage.usageCommand);
  }
  
  accountSas.command('create [services] [resourceTypes] [permissions] [expiry]')
    .description($('Generate shared access signature of storage account'))
    .option('--services <services>', $('the storage services accessible with the account SAS combining symbols of b(Blob)/f(File)/q(Queue)/t(Table)'))
    .option('--resource-types <resourceTypes>', $('the storage resource types accessible with the account SAS combining symbols of s(Service)/c(Container/o(Object)'))
    .option('--permissions <permissions>', $('the operation permissions combining symbols of r(Read)/w(Write)/d(Delete)/l(List)/a(Add)/c(Create)/u(Update)/p(Process)'))
    .option('--protocol <protocol>', $('the protocol permitted for a request made with the SAS. Possible values are HttpsOnly and HttpsOrHttp'))
    .option('--ip-range <ipRange>', $('an IP address or a range of IP addresses from which to accept requests. When specifying a range of IP addresses, note that the range is inclusive. For example, specifying 168.1.5.65 or 168.1.5.60-168.1.5.70 on the SAS restricts the request to those IP addresses.'))
    .option('--start <start>', $('the UTC time at which the SAS becomes valid'))
    .option('--expiry <expiry>', $('the UTC time at which the SAS expires'))
    .option('-a, --account-name <accountName>', $('the storage account name'))
    .option('-k, --account-key <accountKey>', $('the storage account key'))
    .option('-c, --connection-string <connectionString>', $('the storage connection string'))
    .execute(accountSas.createCommand);

  // Command: azure storage account keys list
  keys.command('list <name>')
    .description($('List the keys for a storage account'))
    .appendSubscriptionAndResourceGroupOption()
    .execute(keys.listCommand);

  // Command: azure storage account keys renew
  keys.command('renew <name>')
    .description($('Renew a key for a storage account from your account'))
    .option('--primary', $('Update the primary key'))
    .option('--secondary', $('Update the secondary key'))
    .appendSubscriptionAndResourceGroupOption()
    .execute(keys.renewCommand);

  // Command: azure storage account connectionstring show
  connectionString.command('show <name>')
    .description($('Show the connection string for your account'))
    .appendSubscriptionAndResourceGroupOption()
    .option('--use-http', $('Use http as default endpoints protocol'))
    .option('--blob-endpoint <blobEndpoint>', $('the blob endpoint'))
    .option('--queue-endpoint <queueEndpoint>', $('the queue endpoint'))
    .option('--table-endpoint <tableEndpoint>', $('the table endpoint'))
    .option('--file-endpoint <fileEndpoint>', $('the file endpoint'))
    .execute(connectionString.showCommand);
};