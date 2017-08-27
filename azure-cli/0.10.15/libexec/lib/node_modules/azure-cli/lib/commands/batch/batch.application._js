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
var batchUtil = require('./batch.util');
var batchShowUtil = require('./batch.showUtil');
var utils = require('../../util/utils');
var startProgress = batchUtil.startProgress;
var endProgress = batchUtil.endProgress;

var $ = utils.getLocaleString;

/**
* Init batch compute node command
*/
exports.init = function(cli) {
  
  //Init batchUtil
  batchUtil.init(cli);

  /**
  * Define batch compute node command usage
  */
  var batch = cli.category('batch')
    .description($('Commands to manage your Batch objects'));

  var logger = cli.output;

  var interaction = cli.interaction;

  var application = batch.category('application')
    .description($('Commands to manage your Batch Application'));

  application.command('create [resource-group] [account-name] [application-id]')
    .description($('Adds an application to the specified Batch account'))
    .option('--account-name <account-name>', $('the name of the Batch account'))
    .option('--application-id <application-id>', $('the id of the application'))
    .option('--allow-updates <allow-updates>', $('whether packages within the application may be overwritten using the same version string'))
    .option('--display-name <display-name>', $('the display name for the application'))
    .appendSubscriptionAndResourceGroupOption()
    .execute(addApplication);

  application.command('set [resource-group] [account-name] [application-id]')
    .description($('Updates an application to the specified Batch account'))
    .option('--account-name <account-name>', $('the name of the Batch account'))
    .option('--application-id <application-id>', $('the id of the application'))
    .option('--allow-updates <allow-updates>', $('whether packages within the application may be overwritten using the same version string'))
    .option('--display-name <display-name>', $('the display name for the application'))
    .option('--default-version <default-version>', $('the package to use if a client requests the application but does not specify a version'))
    .appendSubscriptionAndResourceGroupOption()
    .execute(updateApplication);

  application.command('delete [resource-group] [account-name] [application-id]')
    .description($('Deletes an application'))
    .option('--account-name <account-name>', $('the name of the Batch account'))
    .option('--application-id <application-id>', $('the id of the application'))
    .option('-q, --quiet', $('delete the specified application without confirmation'))
    .appendSubscriptionAndResourceGroupOption()
    .execute(deleteApplication);

  application.command('show [resource-group] [account-name] [application-id]')
    .description($('Show details of the Batch application'))
    .option('--account-name <account-name>', $('the name of the Batch account'))
    .option('--application-id <application-id>', $('the id of the application'))
    .appendSubscriptionAndResourceGroupOption()
    .execute(showApplication);

  application.command('list [resource-group] [account-name]')
    .description($('Lists all of the applications in the specified account'))
    .option('--account-name <account-name>', $('the name of the Batch account'))
    .appendSubscriptionAndResourceGroupOption()
    .execute(listApplication);

  application.command('list-summary')
    .description($('Lists all of the applications available in the specified account'))
    .appendBatchAccountOption()
    .execute(listApplicationSummary);

  application.command('show-summary [application-id]')
    .description($('Show details of the application in the specified account'))
    .option('--application-id <application-id>', $('the id of the application'))
    .appendBatchAccountOption()
    .execute(showApplicationSummary);

  /**
  * Implement batch application cli
  */

  function validateResourceGroupAndAccountName(resourceGroup, accountName, options, _) {
    if (resourceGroup) {
      options.resourceGroup = resourceGroup;
    }
    options.resourceGroup = cli.interaction.promptIfNotGiven($('Resource group name: '), options.resourceGroup, _);

    if (accountName) {
      options.accountName = accountName;
    }
    options.accountName = cli.interaction.promptIfNotGiven($('Account name: '), options.accountName, _);
  }

  function validateResourceGroupAccountApplication(resourceGroup, accountName, applicationId, options, _) {
    validateResourceGroupAndAccountName(resourceGroup, accountName, options, _);

    if (applicationId) {
      options.applicationId = applicationId;
    }
    options.applicationId = cli.interaction.promptIfNotGiven($('Application Id: '), options.applicationId, _);
  }

  /**
   * Add batch application
   * @param {object} options command line options
   * @param {callback} _ callback function
   */
  function addApplication(resourcegroup, accountName, applicationId, options, _) {
    var service = batchUtil.createBatchManagementClient(options.subscription);

    validateResourceGroupAccountApplication(resourcegroup, accountName, applicationId, options, _);

    var batchAccount = service.batchAccountOperations.get(options.resourceGroup, options.accountName, _);
    if (!batchAccount.autoStorage || !batchAccount.autoStorage.storageAccountId) {
      throw new Error($('The account need has auto-storage enabled'));      
    }
    
    var tips = util.format($('Adding application %s'), applicationId);
    var param = {};
    if (typeof options.allowUpdates !== 'undefined') {
      param.allowUpdates = (options.allowUpdates === 'true');
    }
    if (options.displayName) {
      param.displayName = options.displayName;
    }

    try {
      startProgress(tips);
      service.applicationOperations.create(options.resourceGroup, options.accountName, options.applicationId, { parameters : param }, _);
    } finally {
      endProgress();
    }

    logger.verbose(util.format($('Application %s has been added to account %s successfully'), applicationId, accountName));
  }

  /**
   * Update batch application
   * @param {object} options command line options
   * @param {callback} _ callback function
   */
  function updateApplication(resourcegroup, accountName, applicationId, options, _) {
    var service = batchUtil.createBatchManagementClient(options.subscription);

    validateResourceGroupAccountApplication(resourcegroup, accountName, applicationId, options, _);
    if (!options.allowUpdates && !options.displayName && !options.defaultVersion) {
      throw new Error($('Please specify at least one of option: allow-updates, display-name, default-version'));
    }

    var tips = util.format($('Updating application %s'), applicationId);
    var param = {};
    if (typeof options.allowUpdates !== 'undefined') {
      param.allowUpdates = (options.allowUpdates === 'true');
    }
    if (options.displayName) {
      param.displayName = options.displayName;
    }
    if (options.defaultVersion) {
      param.defaultVersion = options.defaultVersion;
    }

    try {
      startProgress(tips);
      service.applicationOperations.update(options.resourceGroup, options.accountName, options.applicationId, param, _);
    } finally {
      endProgress();
    }

    logger.verbose(util.format($('Application %s has been updated at account %s successfully'), applicationId, accountName));
  }

  /**
   * Delete the specified application
   * @param {object} options command line options
   * @param {callback} _ callback function
   */
  function deleteApplication(resourcegroup, accountName, applicationId, options, _) {
    var service = batchUtil.createBatchManagementClient(options.subscription);

    validateResourceGroupAccountApplication(resourcegroup, accountName, applicationId, options, _);

    if (!options.quiet) {
      if (!interaction.confirm(util.format($('Do you want to delete application %s? '), applicationId), _)) {
        return;
      }
    }

    var tips = util.format($('Deleting application %s'), applicationId);
    try {
      startProgress(tips);
      service.applicationOperations.deleteMethod(options.resourceGroup, options.accountName, options.applicationId, _);
    } finally {
      endProgress();
    }

    logger.verbose(util.format($('Application %s has been deleted from account %s successfully'), applicationId, accountName));
  }

  /**
  * Show the details of the specified application
  * @param {object} options command line options
  * @param {callback} _ callback function
  */
  function showApplication(resourcegroup, accountName, applicationId, options, _) {
    var service = batchUtil.createBatchManagementClient(options.subscription);

    validateResourceGroupAccountApplication(resourcegroup, accountName, applicationId, options, _);
    var tips = $('Getting Batch application information');

    var application = null;
    try {
      startProgress(tips);
      application = service.applicationOperations.get(options.resourceGroup, options.accountName, options.applicationId, _);
    } finally {
      endProgress();
    }

    batchShowUtil.showApplication(application, cli.output);
  }

  /**
   * List the specified applications of the account
   * @param {object} options command line options
   * @param {callback} _ callback function
   */
  function listApplication(resourcegroup, accountName, options, _) {
    var service = batchUtil.createBatchManagementClient(options.subscription);

    validateResourceGroupAndAccountName(resourcegroup, accountName, options, _);
    var tips = $('Listing Batch applications');

    var applications = [];
    try {
      startProgress(tips);
      var result = service.applicationOperations.list(options.resourceGroup, options.accountName, _);
      result.forEach(function (app) {
        applications.push(app);
      });
      var nextLink = result.nextLink;

      while (nextLink) {
        result = service.applicationOperations.listNext(nextLink, _);
        result.forEach(function (app) {
          applications.push(app);
        });
        nextLink = result.nextLink;
      }
    } finally {
      endProgress();
    }

    cli.interaction.formatOutput(applications, function (outputData) {
      if (outputData.length === 0) {
        logger.info($('No application found'));
      } else {
        logger.table(outputData, function(row, item) {
          row.cell($('Id'), item.id);
          row.cell($('Default Version'), item.defaultVersion);
          row.cell($('Allow Updates'), item.allowUpdates);
          if (item.packages) {
            row.cell($('Version Count'), item.packages.length);
          }
        });
      }
    });
  }

  /**
  * List batch application summary
  * @param {object} options command line options
  * @param {callback} _ callback function
  */
  function showApplicationSummary(applicationId, options, _) {
    var client = batchUtil.createBatchServiceClient(options);
    var tips = $('Showing Batch application summary');
    var batchOptions = {};
    batchOptions.applicationGetOptions = batchUtil.getBatchOperationDefaultOption();

    var application = null;
    startProgress(tips);

    try {
      application = client.application.get(applicationId, batchOptions, _);
    } catch (err) {
      if (err.message) {
        if (typeof err.message === 'object') {
          err.message = err.message.value;
        }
      }
      
      throw err;
    } finally {
      endProgress();
    }

    batchShowUtil.showApplicationSummary(application, cli.output);
  }

  /**
  * List batch application summary
  * @param {object} options command line options
  * @param {callback} _ callback function
  */
  function listApplicationSummary(options, _) {
    var client = batchUtil.createBatchServiceClient(options);
    var tips = $('Listing Batch applications summary');
    var batchOptions = {};
    batchOptions.applicationListOptions = batchUtil.getBatchOperationDefaultOption();

    var applications = [];
    startProgress(tips);

    try {
      var result = client.application.list(batchOptions, _);
      result.forEach(function (app) {
        applications.push(app);
      });
      var nextLink = result.odatanextLink;

      while (nextLink) {
        batchOptions.applicationListOptions = batchUtil.getBatchOperationDefaultOption();
        result = client.application.listNext(nextLink, batchOptions, _);
        result.forEach(function (app) {
          applications.push(app);
        });
        nextLink = result.odatanextLink;
      }
    } catch (err) {
      if (err.message) {
        if (typeof err.message === 'object') {
          err.message = err.message.value;
        }
      }
      
      throw err;
    } finally {
      endProgress();
    }

    cli.interaction.formatOutput(applications, function (outputData) {
      if (outputData.length === 0) {
        logger.info($('No application found'));
      } else {
        logger.table(outputData, function(row, item) {
          row.cell($('Application Id'), item.id);
          row.cell($('Display Name'), item.displayName);
          row.cell($('Versions'), JSON.stringify(item.versions));
        });
      }
    });
  }
};
