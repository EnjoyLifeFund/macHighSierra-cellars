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

var fs = require('fs');
var url = require('url');
var storage = require('azure-storage');

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

  var applicationPkg = application.category('package')
    .description($('Commands to manage your Batch Application Package'));
    
  applicationPkg.command('create [resource-group] [account-name] [application-id] [version] [package-file]')
    .description($('Creates an application package record'))
    .option('--account-name <account-name>', $('the name of the Batch account'))
    .option('--application-id <application-id>', $('the id of the application'))
    .option('--version <version>', $('the version of the application'))
    .option('--package-file <package-file>', $('the application package in zip format'))
    .appendSubscriptionAndResourceGroupOption()
    .execute(addApplicationPkg);

  applicationPkg.command('delete [resource-group] [account-name] [application-id] [version]')
    .description($('Deletes an application package record'))
    .option('--account-name <account-name>', $('the name of the Batch account'))
    .option('--application-id <application-id>', $('the id of the application'))
    .option('--version <version>', $('the version of the application to delete'))
    .option('-q, --quiet', $('delete the specified application package without confirmation'))
    .appendSubscriptionAndResourceGroupOption()
    .execute(deleteApplicationPkg);

  applicationPkg.command('show [resource-group] [account-name] [application-id] [version]')
    .description($('Show details of the Batch application package'))
    .option('--account-name <account-name>', $('the name of the Batch account'))
    .option('--application-id <application-id>', $('the id of the application'))
    .option('--version <version>', $('the version of the application to show'))
    .appendSubscriptionAndResourceGroupOption()
    .execute(showApplicationPkg);

  applicationPkg.command('activate [resource-group] [account-name] [application-id] [version] [format]')
    .description($('Activate an application package'))
    .option('--account-name <account-name>', $('the name of the Batch account'))
    .option('--application-id <application-id>', $('the id of the application'))
    .option('--version <version>', $('the version of the application to activate'))
    .option('--format <format>', $('the format of the application package binary file'))
    .appendSubscriptionAndResourceGroupOption()
    .execute(activateApplicationPkg);

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

  function validateAll(resourceGroup, accountName, applicationId, version, options, _) {
    validateResourceGroupAccountApplication(resourceGroup, accountName, applicationId, options, _);

    if (version) {
      options.version = version;
    }
    options.version = cli.interaction.promptIfNotGiven($('Version: '), options.version, _);
  }

  function uploadAzureBlob(file, urlStr, _) {

    var uri = url.parse(urlStr);
    var blobService = storage.createBlobServiceWithSas(uri.hostname, uri.query);
    var specifiedContainerName = uri.pathname.split('/')[1];
    var specifiedBlobName = uri.pathname.slice(2 + specifiedContainerName.length);
    var specifiedFileName = file;

    if (!utils.fileExists(specifiedFileName, _)) {
      throw new Error(util.format($('Local file %s doesn\'t exist'), specifiedFileName));
    }
    var fsStatus = fs.stat(specifiedFileName, _);
    if (!fsStatus.isFile()) {
      throw new Error(util.format($('%s is not a file'), specifiedFileName));
    }

    blobService.createBlockBlobFromLocalFile(specifiedContainerName, specifiedBlobName, specifiedFileName, _);
  }

  /**
   * Add batch application package
   * @param {object} options command line options
   * @param {callback} _ callback function
   */
  function addApplicationPkg(resourcegroup, accountName, applicationId, version, packageFile, options, _) {
    var service = batchUtil.createBatchManagementClient(options.subscription);

    validateAll(resourcegroup, accountName, applicationId, version, options, _);

    var tips = util.format($('Adding version %s to application %s'), version, applicationId);

    try {
      startProgress(tips);
      var response = service.applicationPackageOperations.create(options.resourceGroup, options.accountName, options.applicationId, options.version, _);
      uploadAzureBlob(packageFile, response.storageUrl, _);
    } finally {
      endProgress();
    }

    logger.verbose(util.format($('Version %s has been added to application %s successfully'), version, applicationId));
  }

  /**
   * Activate the batch application package
   * @param {object} options command line options
   * @param {callback} _ callback function
   */
  function activateApplicationPkg(resourcegroup, accountName, applicationId, version, format, options, _) {
    var service = batchUtil.createBatchManagementClient(options.subscription);

    validateAll(resourcegroup, accountName, applicationId, version, options, _);
    if (!format) {
      format = options.options;
    }
    format = cli.interaction.promptIfNotGiven($('Format: '), format, _);

    var tips = util.format($('Activate application version %s'), version);

    try {
      startProgress(tips);
      service.applicationPackageOperations.activate(options.resourceGroup, options.accountName, options.applicationId, options.version, format, _);
    } finally {
      endProgress();
    }

    logger.verbose(util.format($('Version %s has been activated at application %s successfully'), version, applicationId));
  }

  /**
   * Delete the specified application package
   * @param {object} options command line options
   * @param {callback} _ callback function
   */
  function deleteApplicationPkg(resourcegroup, accountName, applicationId, version, options, _) {
    var service = batchUtil.createBatchManagementClient(options.subscription);

    validateAll(resourcegroup, accountName, applicationId, version, options, _);

    if (!options.quiet) {
      if (!interaction.confirm(util.format($('Do you want to delete application version %s? '), version), _)) {
        return;
      }
    }

    var tips = util.format($('Deleting application version %s'), version);
    try {
      startProgress(tips);
      service.applicationPackageOperations.deleteMethod(options.resourceGroup, options.accountName, options.applicationId, options.version, _);
    } finally {
      endProgress();
    }

    logger.verbose(util.format($('Version %s has been deleted from application %s successfully'), version, applicationId));
  }

  /**
   * Show the details of the specified application package
   * @param {object} options command line options
   * @param {callback} _ callback function
   */
  function showApplicationPkg(resourcegroup, accountName, applicationId, version, options, _) {
    var service = batchUtil.createBatchManagementClient(options.subscription);

    validateAll(resourcegroup, accountName, applicationId, version, options, _);
    var tips = $('Getting Batch application package information');

    var application = null;
    try {
      startProgress(tips);
      application = service.applicationPackageOperations.get(options.resourceGroup, options.accountName, options.applicationId, options.version, _);
    } finally {
      endProgress();
    }

    batchShowUtil.showAppPackage(application, cli.output);
  }
};
