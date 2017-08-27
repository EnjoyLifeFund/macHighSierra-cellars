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

var storage = require('azure-storage');
var util = require('util');
var commander = require('commander');
var fs = require('fs');
var path = require('path');
var StorageUtil = require('../../util/storage.util');
var utils = require('../../util/utils');
var validation = require('../../util/validation');
var Wildcard = utils.Wildcard;
var performStorageOperation = StorageUtil.performStorageOperation;
var startProgress = StorageUtil.startProgress;
var endProgress = StorageUtil.endProgress;
var BlobConstants = storage.Constants.BlobConstants;
var BlobUtilities = storage.BlobUtilities;
var SpeedSummary = storage.BlobService.SpeedSummary;

var __ = require('underscore');
var $ = utils.getLocaleString;

/**
* Add storage account command line options
*/
commander.Command.prototype.addStorageAccountOption = function() {
  this.option('-a, --account-name <accountName>', $('the storage account name or omit it to use environment variable [AZURE_STORAGE_ACCOUNT]'));
  this.option('-k, --account-key <accountKey>', $('the storage account key or omit it to use environment variable [AZURE_STORAGE_ACCESS_KEY]'));
  this.option('-c, --connection-string <connectionString>', $('the storage connection string or omit it to use environment variable [AZURE_STORAGE_CONNECTION_STRING]'));
  this.option('-vv', $('run storage command in debug mode'));
  return this;
};

/**
* Init storage blob command
*/
exports.init = function(cli) {

  //Init StorageUtil
  StorageUtil.init(cli);

  /**
  * Define storage blob command usage
  */
  var storage = cli.category('storage')
    .description($('Commands to manage your storage objects'));

  var logger = cli.output;

  var interaction = cli.interaction;

  var container = storage.category('container')
    .description($('Commands to manage your storage containers'));

  container.command('list [prefix]')
    .description($('List storage containers with wildcard'))
    .option('-p, --prefix <prefix>', $('the storage container name prefix'))
    .addStorageAccountOption()
    .execute(listAzureContainersWithAcl);

  container.command('show [container]')
    .description($('Show details of the specified storage container'))
    .option('--container <container>', $('the storage container name'))
    .option('--lease <leaseId>', $('the lease ID'))
    .addStorageAccountOption()
    .execute(showAzureContainer);

  container.command('create [container]')
    .description($('Create a storage container'))
    .option('--container <container>', $('the storage container name'))
    .option('-p, --permission <permission>', $('the storage container ACL permission(Off/Blob/Container)'))
    .addStorageAccountOption()
    .execute(createAzureContainer);

  container.command('delete [container]')
    .description($('Delete the specified storage container'))
    .option('--container <container>', $('the storage container name'))
    .option('--lease <leaseId>', $('the lease ID'))
    .option('-q, --quiet', $('remove the specified storage container without confirmation'))
    .addStorageAccountOption()
    .execute(deleteAzureContainer);

  container.command('set [container]')
    .description($('Set storage container ACL'))
    .option('--container <container>', $('the storage container name'))
    .option('--lease <leaseId>', $('the lease ID'))
    .option('-p, --permission <permission>', $('the storage container ACL permission(Off/Blob/Container)'))
    .addStorageAccountOption()
    .execute(setAzureContainer);
    
  var containerLease = container.category('lease')
    .description($('Commands to manage leases of your storage container'));
    
  containerLease.command('acquire [container] [duration] [proposedId]')
    .description($('Acquire a new lease against your storage container'))
    .option('--container <container>', $('the storage container name'))
    .option('--duration <duration>', $('the lease duration in seconds (15-60) or not specify for a lease that never expires'))
    .option('--proposed-id <proposedId>', $('the proposed lease ID'))
    .option('--sas <sas>', $('the shared access signature'))
    .addStorageAccountOption()
    .execute(acquireContainerLease);

  containerLease.command('renew [container] [lease]')
    .description($('Renew an existing lease against your storage container'))
    .option('--container <container>', $('the storage container name'))
    .option('--lease <leaseId>', $('the existing lease ID'))
    .option('--sas <sas>', $('the shared access signature'))
    .addStorageAccountOption()
    .execute(renewContainerLease);

  containerLease.command('change [container] [lease] [proposedId]')
    .description($('Change an existing lease against your storage container'))
    .option('--container <container>', $('the storage container name'))
    .option('--lease <leaseId>', $('the existing lease ID'))
    .option('--proposed-id <proposedId>', $('the proposed lease ID'))
    .option('--sas <sas>', $('the shared access signature'))
    .addStorageAccountOption()
    .execute(changeContainerLease);
        
  containerLease.command('release [container] [lease]')
    .description($('Release an existing lease against your storage container'))
    .option('--container <container>', $('the storage container name'))
    .option('--lease <leaseId>', $('the existing lease ID'))
    .option('--sas <sas>', $('the shared access signature'))
    .addStorageAccountOption()
    .execute(releaseContainerLease);

  containerLease.command('break [container] [duration]')
    .description($('Break an existing lease against your storage container'))
    .option('--container <container>', $('the storage container name'))
    .option('--duration <duration>', $('the proposed duration the lease should continue before it is broken in seconds (0-60)'))
    .option('--sas <sas>', $('the shared access signature'))
    .addStorageAccountOption()
    .execute(breakContainerLease);
    
  var containerSas = container.category('sas')
    .description($('Commands to manage shared access signatures of your storage container'));

  containerSas.command('create [container] [permissions] [expiry]')
    .description($('Generate shared access signature of storage container'))
    .option('--container <container>', $('the storage container name'))
    .option('--permissions <permissions>', $('the operation permissions combining symbols of r(Read)/w(Write)/d(Delete)/l(List)'))
    .option('--protocol <protocol>', $('the protocol permitted for a request made with the SAS. Possible values are HttpsOnly and HttpsOrHttp'))
    .option('--ip-range <ipRange>', $('an IP address or a range of IP addresses from which to accept requests. When specifying a range of IP addresses, note that the range is inclusive. For example, specifying 168.1.5.65 or 168.1.5.60-168.1.5.70 on the SAS restricts the request to those IP addresses.'))
    .option('--start <start>', $('the UTC time at which the SAS becomes valid'))
    .option('--expiry <expiry>', $('the UTC time at which the SAS expires'))
    .option('--policy <policy>', $('the stored access policy identifier'))
    .addStorageAccountOption()
    .execute(createContainerSAS);

  var policy = container.category('policy')
    .description($('Commands to manage stored access policies of your storage container'));

  policy.command('create [container] [name]')
    .usage('[options] [container] [name]')
    .description($('Create a stored access policy on the container'))
    .option('--container <container>', $('the storage container name'))
    .option('--name <name>', $('the policy name'))
    .option('--lease <leaseId>', $('the lease ID'))
    .option('--start <start>', $('the UTC time at which the policy becomes valid'))
    .option('--expiry <expiry>', $('the UTC time at which the policy expires'))
    .option('--permissions <permissions>', $('the operation permissions combining symbols of r(Read)/w(Write)/d(Delete)/l(List)'))
    .addStorageAccountOption()
    .execute(createContainerPolicy);

  policy.command('show [container] [name]')
    .usage('[options] [container] [name]')
    .description($('Show a stored access policy on the container'))
    .option('--container <container>', $('the storage container name'))
    .option('--name <name>', $('the policy name'))
    .option('--lease <leaseId>', $('the lease ID'))
    .addStorageAccountOption()
    .execute(showContainerPolicy);

  policy.command('list [container]')
    .usage('[options] [container]')
    .description($('List stored access policies on the container'))
    .option('--container <container>', $('the storage container name'))
    .option('--lease <leaseId>', $('the lease ID'))
    .addStorageAccountOption()
    .execute(listContainerPolicy);

  policy.command('set [container] [name]')
    .usage('[options] [container] [name]')
    .description($('Set a stored access policy on the container'))
    .option('--container <container>', $('the storage container name'))
    .option('--name <name>', $('the policy name'))
    .option('--lease <leaseId>', $('the lease ID'))
    .option('--start <start>', $('the UTC time at which the policy becomes valid and passing two spaces means to remove the existing setting'))
    .option('--expiry <expiry>', $('the UTC time at which the policy expires and passing two spaces means to remove the existing setting'))
    .option('--permissions <permissions>', $('the operation permissions combining symbols of r(Read)/w(Write)/d(Delete)/l(List) and passing two spaces means to remove the existing setting'))
    .addStorageAccountOption()
    .execute(setContainerPolicy);

  policy.command('delete [container] [name]')
    .usage('[options] [container] [name]')
    .description($('Delete a stored access policy on the container'))
    .option('--container <container>', $('the storage container name'))
    .option('--name <name>', $('the policy name'))
    .option('--lease <leaseId>', $('the lease ID'))
    .addStorageAccountOption()
    .execute(deleteContainerPolicy);

  var blob = storage.category('blob')
    .description($('Commands to manage your storage blobs'));

  blob.command('list [container] [prefix]')
    .usage('[options] [container] [prefix]')
    .description($('List storage blob in the specified storage container use wildcard and blob name prefix'))
    .option('--container <container>', $('the storage container name'))
    .option('-p, --prefix <prefix>', $('the blob name prefix'))
    .option('--sas <sas>', $('the shared access signature'))
    .addStorageAccountOption()
    .execute(listAzureBlob);

  blob.command('show [container] [blob]')
    .usage('[options] [container] [blob]')
    .description($('Show details of the specified storage blob'))
    .option('--container <container>', $('the storage container name'))
    .option('-b, --blob <blobName>', $('the storage blob name'))
    .option('--lease <leaseId>', $('the lease ID'))
    .option('--snapshot <snapshotTimestamp>', $('the snapshot timestamp'))
    .option('--sas <sas>', $('the shared access signature'))
    .addStorageAccountOption()
    .execute(showAzureBlob);

  blob.command('delete [container] [blob]')
    .usage('[options] [container] [blob]')
    .description($('Delete the specified storage blob'))
    .option('--container <container>', $('the storage container name'))
    .option('-b, --blob <blobName>', $('the storage blob name'))
    .option('--snapshot <snapshotTimestamp>', $('the snapshot timestamp'))
    .option('--lease <leaseId>', $('the lease ID'))
    .option('--sas <sas>', $('the shared access signature'))
    .option('--delete-snapshots <deleteSnapshots>', $('\'include\' to delete the base blob and all of its snapshots. \'only\' to delete only the blob\'s snapshots and not the blob itself'))
    .option('-q, --quiet', $('remove the specified storage blob without confirmation'))
    .addStorageAccountOption()
    .execute(deleteAzureBlob);

  blob.command('upload [file] [container] [blob]')
    .usage('[options] [file] [container] [blob]')
    .description($('Upload the specified file to storage blob. To upload to large block blob, please run on 64-bit machine with 64-bit node.'))
    .option('-f, --file <file>', $('the local file path'))
    .option('--container <container>', $('the storage container name'))
    .option('-b, --blob <blobName>', $('the storage blob name'))
    .option('-t, --blobtype <blobtype>', util.format($('the storage blob type(%s)'), getAvailableBlobTypes()))
    .option('-p, --properties <properties>', $('the storage blob properties for uploaded file. Properties are key=value pairs and separated with semicolon(;). Available properties are contentType, contentEncoding, contentLanguage, cacheControl, contentDisposition, contentMD5'))
    .option('-m, --metadata <metadata>', $('the storage blob metadata for uploaded file. Metadata are key=value pairs and separated with semicolon(;)'))
    .option('--concurrenttaskcount <concurrenttaskcount>', $('the maximum number of concurrent upload requests'))
    .option('--lease <leaseId>', $('the lease ID'))
    .option('--sas <sas>', $('the shared access signature'))
    .option('-q, --quiet', $('overwrite the specified storage blob without confirmation'))
    .addStorageAccountOption()
    .execute(uploadAzureBlob);

  blob.command('download [container] [blob] [destination]')
    .usage('[options] [container] [blob] [destination]')
    .description($('Download the specified storage blob'))
    .option('--container <container>', $('the storage container name'))
    .option('-b, --blob <blobName>', $('the storage blob name'))
    .option('--snapshot <snapshotTimestamp>', $('the snapshot timestamp'))
    .option('--lease <leaseId>', $('the lease ID'))
    .option('-d, --destination [destination]', $('download destination file or directory path'))
    .option('-m, --checkmd5', $('check md5sum for the downloaded file'))
    .option('--concurrenttaskcount <concurrenttaskcount>', $('the maximum number of concurrent download requests'))
    .option('--sas <sas>', $('the shared access signature'))
    .option('-q, --quiet', $('overwrite the destination file without confirmation'))
    .addStorageAccountOption()
    .execute(downloadAzureBlob);
    
  blob.command('snapshot [container] [blob]')
    .usage('[options] [container] [blob]')
    .description($('Creates a read-only snapshot of the blob'))
    .option('--container <container>', $('the storage container name'))
    .option('-b, --blob <blobName>', $('the storage blob name'))
    .option('--lease <leaseId>', $('the lease ID'))
    .option('--sas <sas>', $('the shared access signature'))
    .addStorageAccountOption()
    .execute(snapshotAzureBlob);

  blob.command('update [container] [blob]')
    .usage('[options] [container] [blob]')
    .description($('Update the properties of the specified storage blob'))
    .option('--container <container>', $('the storage container name'))
    .option('-b, --blob <blobName>', $('the storage blob name'))
    .option('-p, --properties <properties>', $('the storage blob properties. Properties are key=value pairs and separated with semicolon(;). Available properties are contentType, contentEncoding, contentLanguage, cacheControl, contentDisposition, contentMD5'))
    .option('--lease <leaseId>', $('the lease ID'))
    .option('--sas <sas>', $('the shared access signature'))
    .addStorageAccountOption()
    .execute(updateAzureBlob);
    
  var blobLease = blob.category('lease')
    .description($('Commands to manage leases of your storage blob'));
    
  blobLease.command('acquire [container] [blob] [duration] [proposedId]')
    .description($('Acquire a new lease against your storage blob'))
    .option('--container <container>', $('the storage container name'))
    .option('-b, --blob <blobName>', $('the storage blob name'))
    .option('--duration <duration>', $('the lease duration in seconds (15-60) or negative one (-1) for a lease that never expires'))
    .option('--proposed-id <proposedId>', $('the proposed lease ID'))
    .option('--sas <sas>', $('the shared access signature'))
    .addStorageAccountOption()
    .execute(acquireBlobLease);

  blobLease.command('renew [container] [blob] [lease]')
    .description($('Renew an existing lease against your storage blob'))
    .option('--container <container>', $('the storage container name'))
    .option('-b, --blob <blobName>', $('the storage blob name'))
    .option('--lease <leaseId>', $('the existing lease ID'))
    .option('--sas <sas>', $('the shared access signature'))
    .addStorageAccountOption()
    .execute(renewBlobLease);

  blobLease.command('change [container] [blob] [lease] [proposedId]')
    .description($('Change an existing lease against your storage blob'))
    .option('--container <container>', $('the storage container name'))
    .option('-b, --blob <blobName>', $('the storage blob name'))
    .option('--lease <leaseId>', $('the existing lease ID'))
    .option('--proposed-id <proposedId>', $('the proposed lease ID'))
    .option('--sas <sas>', $('the shared access signature'))
    .addStorageAccountOption()
    .execute(changeBlobLease);
        
  blobLease.command('release [container] [blob] [lease]')
    .description($('Release an existing lease against your storage blob'))
    .option('--container <container>', $('the storage container name'))
    .option('-b, --blob <blobName>', $('the storage blob name'))
    .option('--lease <leaseId>', $('the existing lease ID'))
    .option('--sas <sas>', $('the shared access signature'))
    .addStorageAccountOption()
    .execute(releaseBlobLease);

  blobLease.command('break [container] [blob] [duration]')
    .description($('Break an existing lease against your storage blob'))
    .option('--container <container>', $('the storage container name'))
    .option('-b, --blob <blobName>', $('the storage blob name'))
    .option('--duration <duration>', $('the proposed duration the lease should continue before it is broken in seconds (0-60)'))
    .option('--sas <sas>', $('the shared access signature'))
    .addStorageAccountOption()
    .execute(breakBlobLease);
    
  var copy = blob.category('copy')
    .description($('Commands to manage your blob copy operations'));

  copy.command('start [sourceUri] [destContainer]')
    .usage('[options] [sourceUri] [destContainer]')
    .description($('Start to copy the resource to the specified storage blob which completes asynchronously'))
    .option('--source-sas <sourceSas>', $('the shared access signature of the source storage'))
    .option('--source-uri <sourceUri>', $('the source storage blob or file absolute uri. By providing this option, all other source related options will be ignored.'))
    .option('--source-container <sourceContainer>', $('the source storage container name when copies a blob to a blob'))
    .option('--source-blob <sourceBlob>', $('the source storage blob name when copies a blob to a blob'))
    .option('--snapshot <snapshotTimestamp>', $('the snapshot timestamp if source is a snapshot'))
    .option('--source-lease <sourceLeaseId>', $('the lease ID of the source blob '))
    .option('--source-share <sourceShare>', $('the source storage share name when copies a file to a blob'))
    .option('--source-path <sourcePath>', $('the source storage file path when copies a file to a blob'))
    .option('--dest-account-name <destAccountName>', $('the destination storage account name'))
    .option('--dest-account-key <destAccountKey>', $('the destination storage account key'))
    .option('--dest-connection-string <destConnectionString>', $('the destination storage connection string'))
    .option('--dest-sas <destSas>', $('the shared access signature of the destination storage container or blob'))
    .option('--dest-container <destContainer>', $('the destination storage container name'))
    .option('--dest-blob <destBlob>', $('the destination storage blob name'))
    .option('--dest-lease <destLeaseId>', $('the lease ID of the destination blob '))
    .option('--incremental', $('whether start page blob incremental copy or not. If yes, the source must be a page blob snapshot. Refer to https://docs.microsoft.com/en-us/rest/api/storageservices/fileservices/incremental-copy-blob for more detailed information.'))
    .option('-q, --quiet', $('overwrite the destination blob without confirmation'))
    .addStorageAccountOption()
    .execute(startBlobCopy);

  copy.command('show [container] [blob]')
    .usage('[options] [container] [blob]')
    .description($('Show the copy status'))
    .option('--container <container>', $('the destination container in the blob copy start operation'))
    .option('--blob <blob>', $('the destination blob in the blob copy start operation'))
    .option('--lease <leaseId>', $('the lease ID of the destination blob '))
    .option('--sas <sas>', $('the shared access signature of the destination storage container or blob'))
    .addStorageAccountOption()
    .execute(showBlobCopy);

  copy.command('stop [container] [blob] [copyid]')
    .usage('[options] [container] [blob] [copyid]')
    .description($('Stop the copy operation'))
    .option('--container <container>', $('the destination container in the blob copy start operation'))
    .option('--blob <blob>', $('the destination blob in the blob copy start operation'))
    .option('--lease <leaseId>', $('the lease ID of the destination blob '))
    .option('--copyid <copyid>', $('the copy ID which is returned from blob copy start operation'))
    .addStorageAccountOption()
    .execute(stopBlobCopy);

  var blobSas = blob.category('sas')
    .description($('Commands to manage shared access signature of your storage blob'));

  blobSas.command('create [container] [blob] [permissions] [expiry]')
    .description($('Generate shared access signature of storage blob'))
    .option('--container <container>', $('the storage container name'))
    .option('--blob <blobName>', $('the storage blob name'))
    .option('--permissions <permissions>', $('the operation permissions combining symbols of r(Read)/a(Add)/c(Create)/w(Write)/d(Delete)'))
    .option('--protocol <protocol>', $('the protocol permitted for a request made with the SAS. Possible values are HttpsOnly and HttpsOrHttp'))
    .option('--ip-range <ipRange>', $('an IP address or a range of IP addresses from which to accept requests. When specifying a range of IP addresses, note that the range is inclusive. For example, specifying 168.1.5.65 or 168.1.5.60-168.1.5.70 on the SAS restricts the request to those IP addresses.'))
    .option('--start <start>', $('the UTC time at which the SAS becomes valid'))
    .option('--expiry <expiry>', $('the UTC time at which the SAS expires'))
    .option('--policy <policy>', $('the stored access policy identifier'))
    .addStorageAccountOption()
    .execute(createBlobSAS);

  /**
  * Implement storage blob cli
  */

  /**
  * Get storage blob operation object
  * @param {string} [operationName] operation name
  * @return {StorageOperation} storage blob operation
  */
  function getStorageBlobOperation(serviceClient, operationName) {
    return StorageUtil.getStorageOperation(serviceClient, StorageUtil.OperationType.Blob, operationName);
  }

  /**
  * Get storage blob operation options
  */
  function getStorageBlobOperationDefaultOption() {
    var option = StorageUtil.getStorageOperationDefaultOption();

    // Add blob specific options here
    option.parallelOperationThreadCount = StorageUtil.threadsInOperation;

    return option;
  }

  /**
  * Get blob service account from user specified credential or env variables
  */
  function getBlobServiceClient(options) {
    var serviceClient = StorageUtil.getServiceClient(StorageUtil.getBlobService, options);
    applyBlobServicePatch(serviceClient);
    return serviceClient;
  }

  /**
  * Create a policy setting
  */
  function createContainerPolicySetting(options) {
    var policySettings = {};
    policySettings.accessType = StorageUtil.AccessType.Container;
    policySettings.serviceClient = getBlobServiceClient(options);
    policySettings.getAclOperation = getStorageBlobOperation(policySettings.serviceClient, 'getContainerAcl');
    policySettings.setAclOperation = getStorageBlobOperation(policySettings.serviceClient, 'setContainerAcl');
    policySettings.storageOptions = getStorageBlobOperationDefaultOption();
    policySettings.storageOptions.leaseId = options.lease;
    policySettings.policyOptions = options;
    return policySettings;
  }

  /**
  * List storage container with acl
  * @param {string} prefix container prefix
  * @param {object} options commadline options
  * @param {callback} _ callback function
  */
  function listAzureContainersWithAcl(prefix, options, _) {
    var blobService = getBlobServiceClient(options);
    var listOperation = getStorageBlobOperation(blobService, 'listAllContainers');
    var tips = $('Getting storage containers');
    var containerOpts = getStorageBlobOperationDefaultOption();
    var useWildcard = false;
    containerOpts.include = 'metadata';

    if (Wildcard.containWildcards(prefix)) {
      containerOpts.prefix = Wildcard.getNonWildcardPrefix(prefix);
      useWildcard = true;
    } else {
      containerOpts.prefix = prefix;
    }

    var containers = [];
    startProgress(tips);

    try {
      /*jshint camelcase:false*/
      performStorageOperation(listOperation, _, containerOpts).forEach_(_, 1, function(_, container) {
        /*jshint camelcase:true*/
        if (useWildcard && !Wildcard.isMatch(container.name, prefix)) {
          return;
        }
        containers.push(container);
        container.publicAccessLevel = StorageUtil.containerAccessLevelToString(container.publicAccessLevel);
      });
    } finally {
      endProgress();
    }

    cli.interaction.formatOutput(containers, function(outputData) {
      if (outputData.length === 0) {
        logger.info($('No containers found'));
      } else {
        logger.table(outputData, function(row, item) {
          row.cell($('Name'), item.name);
          row.cell($('Public Access'), item.publicAccessLevel);
          row.cell($('Last Modified'), item.lastModified);
        });
      }
    });
  }

  /**
  * Show the details for the specified storage container
  * @param {string} container container name
  */
  function showAzureContainer(container, options, _) {
    var blobService = getBlobServiceClient(options);
    container = interaction.promptIfNotGiven($('Container name: '), container, _);
    var propertiesOperation = getStorageBlobOperation(blobService, 'getContainerProperties');
    var tips = $('Getting storage container information');
    var showOptions = getStorageBlobOperationDefaultOption();
    var properties = {};

    startProgress(tips);

    try {
      showOptions.leaseId = options.lease;
      //Get Container Properties operation returns all user-defined metadata and system properties for the specified container.
      properties = performStorageOperation(propertiesOperation, _, container, showOptions);
      try {
        properties.publicAccessLevel = StorageUtil.containerAccessLevelToString(properties.publicAccessLevel);          
      } catch (e) {
        logger.warn($('Current storage account doesn\'t support getting ACL'));
      }
    } catch (e) {
      if (StorageUtil.isNotFoundException(e)) {
        throw new Error(util.format($('Container %s doesn\'t exist'), container));
      } else {
        throw e;
      }
    } finally {
      endProgress();
    }

    logger.json(properties);
  }


  /**
  * Create a storage container
  */
  function createAzureContainer(container, options, _) {
    var blobService = getBlobServiceClient(options);
    container = interaction.promptIfNotGiven($('Container name: '), container, _);
    var operation = getStorageBlobOperation(blobService, 'createContainerIfNotExists');
    var tips = util.format($('Creating storage container %s'), container);
    var storageOptions = getStorageBlobOperationDefaultOption();
    var permission = options.permission;
    if (permission) {
      validation.isValidEnumValue(permission, Object.keys(BlobUtilities.BlobContainerPublicAccessType));
    }

    startProgress(tips);
    try {
      var createResult = performStorageOperation(operation, _, container, storageOptions);
      if (createResult.created === false) {
        throw new Error(util.format($('Container \'%s\' already exists'), container));
      } else if (permission) {
        try
        {
          var aclOperation = getStorageBlobOperation(blobService, 'setContainerAcl');
          storageOptions.publicAccessLevel = StorageUtil.stringToContainerAccessLevel(permission);
          performStorageOperation(aclOperation, _, container, null, storageOptions);
        } catch (e) {
          logger.warn($('Current storage account doesn\'t support setting ACL'));
        }
      }
    } finally {
      endProgress();
    }

    logger.verbose(util.format($('Container %s created successfully'), container));
    showAzureContainer(container, StorageUtil.getStorageAccountOptions(options), _);
  }

  /**
  * Delete the specified storage container
  */
  function deleteAzureContainer(container, options, _) {
    var blobService = getBlobServiceClient(options);
    container = interaction.promptIfNotGiven($('Container name: '), container, _);
    var tips = util.format($('Deleting Container %s'), container);
    var operation = getStorageBlobOperation(blobService, 'deleteContainer');
    var storageOptions = getStorageBlobOperationDefaultOption();
    var force = !!options.quiet;

    if (force !== true) {
      force = interaction.confirm(util.format($('Do you want to remove the storage container %s? '), container), _);
      if (force !== true) {
        return;
      }
    }

    startProgress(tips);

    try {
      storageOptions.leaseId = options.lease;
      performStorageOperation(operation, _, container, storageOptions);
    } catch (e) {
      if (StorageUtil.isNotFoundException(e)) {
        throw new Error(util.format($('Can not find container \'%s\''), container));
      } else {
        throw e;
      }
    } finally {
      endProgress();
    }

    logger.info(util.format($('Container %s deleted successfully'), container));
  }

  /**
  * Set container acl(properties/metadata)
  */
  function setAzureContainer(container, options, _) {
    var blobService = getBlobServiceClient(options);
    container = interaction.promptIfNotGiven($('Container name: '), container, _);
    var tips = $('Set container');
    
    startProgress(tips);
    setAzureContainerAcl(blobService, container, options, _);
    endProgress();

    showAzureContainer(container, StorageUtil.getStorageAccountOptions(options), _);
  }

  /**
  * Set container acl
  */
  function setAzureContainerAcl(blobService, container, options, _) {
    if (options.permission) {
      try {
        var getAclOperation = getStorageBlobOperation(blobService, 'getContainerAcl');
        var setAclOperation = getStorageBlobOperation(blobService, 'setContainerAcl');
        var storageOptions = getStorageBlobOperationDefaultOption();
        storageOptions.leaseId = options.lease;
        validation.isValidEnumValue(options.permission, Object.keys(BlobUtilities.BlobContainerPublicAccessType));
        storageOptions.publicAccessLevel = StorageUtil.stringToContainerAccessLevel(options.permission);

        // Get the original policies to avoid erasing them
        var policies = performStorageOperation(getAclOperation, _, container, storageOptions).signedIdentifiers;
        performStorageOperation(setAclOperation, _, container, policies, storageOptions);
      } catch (e) {
        logger.warn($('Cannot set container ACL'));
        throw e;
      }
    }
  }
  
  /**
  * Acquire a new lease against the container
  */
  function acquireContainerLease(container, duration, proposedId, options, _) {
    options.tips = $('Acquiring a new lease against the container');
    acquireLease(container, null, duration, proposedId, options, _);
  }
  
  /**
  * Acquire a new lease against the blob
  */
  function acquireBlobLease(container, blob, duration, proposedId, options, _) {
    options.forBlob = true;
    options.tips = $('Acquiring a new lease against the blob');
    acquireLease(container, blob, duration, proposedId, options, _);
  }  
  
  /**
  * Acquire a new lease
  */
  function acquireLease(container, blob, duration, proposedId, options, _) {
    var blobService = getBlobServiceClient(options);
    __.extend(options, getStorageBlobOperationDefaultOption());
    
    options.container = container;
    options.blob = blob;
    options.leaseDuration = duration;
    options.proposedLeaseId = proposedId;
    
    options.operation = getStorageBlobOperation(blobService, 'acquireLease');
    StorageUtil.acquireLease(blobService, options, _);
  }
  
  /**
  * Renew an existing lease against the container
  */
  function renewContainerLease(container, leaseId, options, _) {
    options.tips = $('Renewing a new lease against the container');
    renewLease(container, null, leaseId, options, _);
  }
  
  /**
  * Renew an existing lease against the blob
  */
  function renewBlobLease(container, blob, leaseId, options, _) {
    options.forBlob = true;
    options.tips = $('Renewing a new lease against the blob');
    renewLease(container, blob, leaseId, options, _);
  }  
  
  /**
  * Renew an existing lease
  */
  function renewLease(container, blob, leaseId, options, _) {
    var blobService = getBlobServiceClient(options);
    __.extend(options, getStorageBlobOperationDefaultOption());
    
    options.container = container;
    options.blob = blob;
    options.leaseId = leaseId;
    
    options.operation = getStorageBlobOperation(blobService, 'renewLease');
    StorageUtil.renewLease(blobService, options, _);
  }
  
  /**
  * Change an existing lease against the container
  */
  function changeContainerLease(container, leaseId, proposedId, options, _) {
    options.tips = $('Changing a new lease against the container');
    changeLease(container, null, leaseId, proposedId, options, _);
  }
  
  /**
  * Change an existing lease against the blob
  */
  function changeBlobLease(container, blob, leaseId, proposedId, options, _) {
    options.forBlob = true;
    options.tips = $('Changing a new lease against the blob');
    changeLease(container, blob, leaseId, proposedId, options, _);
  }  
  
  /**
  * Change an existing lease
  */
  function changeLease(container, blob, leaseId, proposedId, options, _) {
    var blobService = getBlobServiceClient(options);
    __.extend(options, getStorageBlobOperationDefaultOption());
    
    options.container = container;
    options.blob = blob;
    options.leaseId = leaseId;
    options.proposedId = proposedId;
    
    options.operation = getStorageBlobOperation(blobService, 'changeLease');
    StorageUtil.changeLease(blobService, options, _);
  }

  /**
  * Release an existing lease against the container
  */
  function releaseContainerLease(container, leaseId, options, _) {
    options.tips = $('Releasing an existing lease against the container');
    releaseLease(container, null, leaseId, options, _);
  }

  /**
  * Release an existing lease against the blob
  */
  function releaseBlobLease(container, blob, leaseId, options, _) {
    options.forBlob = true;
    options.tips = $('Releasing an existing lease against the blob');
    releaseLease(container, blob, leaseId, options, _);
  }
    
  /**
  * Release an existing lease
  */
  function releaseLease(container, blob, leaseId, options, _) {
    var blobService = getBlobServiceClient(options);
    __.extend(options, getStorageBlobOperationDefaultOption());
        
    options.container = container;
    options.blob = blob;
    options.leaseId = leaseId;
    options.tips = $('Release an existing lease ');
    options.operation = getStorageBlobOperation(blobService, 'releaseLease');
    StorageUtil.releaseLease(blobService, options, _);
  }
  
  /**
  * Break an existing lease against the container
  */
  function breakContainerLease(container, duration, options, _) {
    options.tips = $('Breaking an existing lease against the container');
    breakLease(container, null, duration, options, _);
  }
  
  /**
  * Break an existing lease against the blob
  */
  function breakBlobLease(container, blob, duration, options, _) {
    options.forBlob = true;
    options.tips = $('Breaking an existing lease against the blob');
    breakLease(container, blob, duration, options, _);
  }
  
  /**
  * Break an existing lease
  */
  function breakLease(container, blob, duration, options, _) {
    var blobService = getBlobServiceClient(options);
    __.extend(options, getStorageBlobOperationDefaultOption());

    options.container = container;
    options.blob = blob;
    options.leaseBreakPeriod = duration;
    
    options.operation = getStorageBlobOperation(blobService, 'breakLease');
    StorageUtil.breakLease(blobService, options, _);
  }

 /**
  * Create shared access signature to the container
  */
  function createContainerSAS(container, permissions, expiry, options, _) {
    createSas(container, null, permissions, options.protocol, options.ipRange, expiry, options, true, _);
  }
  
   /**
  * Create shared access signature to the blob
  */
  function createBlobSAS(container, blob, permissions, expiry, options, _) {
    createSas(container, blob, permissions, options.protocol, options.ipRange, expiry, options, false, _);
  }

  /**
  * Create shared access signature
  */
  function createSas(container, blob, permissions, protocol, ipRange, expiry, options, isOnContainer, _) {
    var blobService = getBlobServiceClient(options);
    container = interaction.promptIfNotGiven($('Container name: '), container, _);

    var accessType;
    if (!isOnContainer) {
      blob = interaction.promptIfNotGiven($('Blob name: '), blob, _);
      accessType = StorageUtil.AccessType.Blob;
    } else {
      accessType = StorageUtil.AccessType.Container;
    }

    if (!options.policy) {
      permissions = interaction.promptIfNotGiven($('Permissions: '), permissions, _);
      StorageUtil.validatePermissions(accessType, permissions);

      expiry = interaction.promptIfNotGiven($('Expiry: '), expiry, _);
      expiry = utils.parseDateTime(expiry);
    }

    var start;
    if (options.start) {
      start = utils.parseDateTime(options.start);
    }

    var output = { sas: '', url: '' };
    var sharedAccessPolicy = StorageUtil.getSharedAccessPolicy(accessType, permissions, protocol, ipRange, start, expiry, null, options.policy);
    var tips;
    if (isOnContainer) {
      tips = util.format($('Creating shared access signature for container %s'), container);
    } else {
      tips = util.format($('Creating shared access signature for blob %s in container %s'), blob, container);
    }
    startProgress(tips);
    try {
      output.sas = blobService.generateSharedAccessSignature(container, blob, sharedAccessPolicy);
      output.url = blobService.getUrl(container, blob, output.sas);
    } finally {
      endProgress();
    }

    cli.interaction.formatOutput(output, function(outputData) {
      logger.data($('Shared Access Signature'), outputData.sas);
      logger.data($('Shared Access URL'), outputData.url);
    });
  }

  /**
  * Create a stored access policy on the container
  */
  function createContainerPolicy(container, name, options, _) {
    var createPolicySettings = createContainerPolicySetting(options);
    createPolicySettings.resourceName = interaction.promptIfNotGiven($('Container name: '), container, _);
    createPolicySettings.policyName = interaction.promptIfNotGiven($('Policy name: '), name, _);
    createPolicySettings.tips = util.format($('Creating the stored access policy %s on the container %s'), createPolicySettings.policyName, createPolicySettings.resourceName);

    if (options.permissions) {
      StorageUtil.validatePermissions(StorageUtil.AccessType.Container, options.permissions);
    }

    var policies = StorageUtil.createPolicy(createPolicySettings, _);
    cli.interaction.formatOutput(policies, function(outputData) {
      logger.info(util.format($('The stored access policies on container %s are: '), createPolicySettings.resourceName));
      StorageUtil.showPolicyResults(outputData);
    });
  }

  /**
  * List the stored access policies on the container
  */
  function listContainerPolicy(container, options, _) {
    var listPolicySettings = createContainerPolicySetting(options);
    listPolicySettings.resourceName = interaction.promptIfNotGiven($('Container name: '), container, _);
    listPolicySettings.tips = util.format($('Listing the stored access policies on the container %s'), listPolicySettings.resourceName);

    var policies = StorageUtil.selectPolicy(listPolicySettings, _);
    cli.interaction.formatOutput(policies, function(outputData) {
      if (outputData) {
        StorageUtil.showPolicyResults(outputData);
      } else {
        logger.info(util.format($('There is no stored access policy on the container %s.'), listPolicySettings.resourceName));
      }
    });
  }

  /**
  * Show the stored access policy on the container
  */
  function showContainerPolicy(container, name, options, _) {
    var showPolicySettings = createContainerPolicySetting(options);
    showPolicySettings.resourceName = interaction.promptIfNotGiven($('Container name: '), container, _);
    showPolicySettings.policyName = interaction.promptIfNotGiven($('Policy name: '), name, _);
    showPolicySettings.tips = util.format($('Showing the stored access policy %s on the container %s'), showPolicySettings.policyName, showPolicySettings.resourceName);

    var policy = StorageUtil.selectPolicy(showPolicySettings, _);
    cli.interaction.formatOutput(policy, function(outputData) {
      StorageUtil.showPolicyResults(outputData);
    });
  }

  /**
  * Set a stored access policy on the container
  */
  function setContainerPolicy(container, name, options, _) {
    var setPolicySettings = createContainerPolicySetting(options);
    setPolicySettings.resourceName = interaction.promptIfNotGiven($('Container name: '), container, _);
    setPolicySettings.policyName = interaction.promptIfNotGiven($('Policy name: '), name, _);
    setPolicySettings.tips = util.format($('Setting the stored access policy %s on the container %s'), setPolicySettings.policyName, setPolicySettings.resourceName);

    if (options.permissions) {
      StorageUtil.validatePermissions(StorageUtil.AccessType.Container, options.permissions);
    }

    var policies = StorageUtil.setPolicy(setPolicySettings, _);
    cli.interaction.formatOutput(policies, function(outputData) {
      logger.info(util.format($('The stored access policies on container %s are: '), setPolicySettings.resourceName));
      StorageUtil.showPolicyResults(outputData);
    });
  }

  /**
  * Delete a stored access policy on the container
  */
  function deleteContainerPolicy(container, name, options, _) {
    var deletePolicySettings = createContainerPolicySetting(options);
    deletePolicySettings.resourceName = interaction.promptIfNotGiven($('Container name: '), container, _);
    deletePolicySettings.policyName = interaction.promptIfNotGiven($('Policy name: '), name, _);
    deletePolicySettings.tips = util.format($('Deleting the stored access policy %s on the container %s'), deletePolicySettings.policyName, deletePolicySettings.resourceName);

    var policies = StorageUtil.deletePolicy(deletePolicySettings, _);
    cli.interaction.formatOutput(policies, function(outputData) {
      if (outputData) {
        logger.info(util.format($('The stored access policies on container %s are: '), deletePolicySettings.resourceName));
        StorageUtil.showPolicyResults(outputData);
      } else {
        logger.info(util.format($('There is no stored access policy on the container %s.'), deletePolicySettings.resourceName));
      }
    });
  }

  /**
  * List storage blob in the specified container
  */
  function listAzureBlob(container, blobName, options, _) {
    var blobService = getBlobServiceClient(options);
    var specifiedContainerName = interaction.promptIfNotGiven($('Container name: '), container, _);
    var tips = util.format($('Getting blobs in container %s'), specifiedContainerName);
    var operation = getStorageBlobOperation(blobService, 'listAllBlobs');
    var storageOptions = getStorageBlobOperationDefaultOption();
    var useWildcard = false;
    var inputBlobName = blobName;
    if (Wildcard.containWildcards(inputBlobName)) {
      storageOptions.prefix = Wildcard.getNonWildcardPrefix(inputBlobName);
      useWildcard = true;
    } else {
      storageOptions.prefix = inputBlobName;
    }
    storageOptions.include = 'snapshots,metadata,copy';
    var blobs = [];

    startProgress(tips);

    try {
      blobs = performStorageOperation(operation, _, specifiedContainerName, storageOptions);
    } finally {
      endProgress();
    }

    var outputBlobs = [];

    if (useWildcard) {
      for (var i = 0, len = blobs.length; i < len; i++) {
        var blob = blobs[i];
        if (Wildcard.isMatch(blob.name, inputBlobName)) {
          outputBlobs.push(blob);
        }
      }
    } else {
      outputBlobs = blobs;
    }

    cli.interaction.formatOutput(outputBlobs, function(outputData) {
      if (outputData.length === 0) {
        logger.info($('No blobs found'));
      } else {
        outputData.contentSettings = outputData.contentSettings || {};
        logger.table(outputData, function(row, item) {
          item.contentSettings = item.contentSettings || {};
          row.cell($('Name'), item.name);
          row.cell($('Blob Type'), item.blobType);
          row.cell($('Length'), item.contentLength);
          row.cell($('Content Type'), item.contentSettings.contentType);
          row.cell($('Last Modified'), item.lastModified);
          row.cell($('Snapshot Time'), item.snapshot || '');
        });
      }
    });
  }

  /**
  * Show the details of the specified storage blob
  */
  function showAzureBlob(containerName, blobName, options, _) {
    var blob = getAzureBlobProperties(containerName, blobName, options, _);
    logBlobProperties(blob, options.speedSummary);
  }

  /**
  * Log blob properties
  */
  function logBlobProperties(properties, speedSummary) {
    if (!properties) return;
    var extendProperties = StorageUtil.embedTransferSummary(properties, speedSummary);
     
    cli.interaction.formatOutput(extendProperties, function(data) {
      var outputProperties = ['container', 'name', 'blobType', 'contentLength', 'contentType', 'contentMD5'];
      var output = outputProperties.map(function(propertyName) { 
        data.contentSettings = data.contentSettings || {};
        return { 
          property: propertyName, value: data[propertyName] || data.contentSettings[propertyName] 
        };
      });
      logger.table(output, function(row, item) {
        row.cell($('Property'), item.property);
        row.cell($('Value'), item.value);
      });
    });
  }

  /**
  * Get azure blob properties
  */
  function getAzureBlobProperties(container, blobName, options, _) {
    var blobService = getBlobServiceClient(options);
    var specifiedContainerName = interaction.promptIfNotGiven($('Container name: '), container, _);
    var specifiedBlobName = interaction.promptIfNotGiven($('Blob name: '), blobName, _);
    var storageOptions = getStorageBlobOperationDefaultOption();
    var blob = {};
    var propertiesOperation = getStorageBlobOperation(blobService, 'getBlobProperties');
    var tips = $('Getting storage blob information');

    startProgress(tips);

    try {
      storageOptions.leaseId = options.lease;
      storageOptions.snapshotId = options.snapshot;
      blob = performStorageOperation(propertiesOperation, _, specifiedContainerName, specifiedBlobName, storageOptions);
    } catch (e) {
      if (StorageUtil.isNotFoundException(e)) {
        throw new Error(util.format($('Blob %s in Container %s doesn\'t exist'), specifiedBlobName, specifiedContainerName));
      } else {
        throw e;
      }
    } finally {
      endProgress();
    }
    return blob;
  }

  /**
  * Show the details of the specified storage blob
  */
  function deleteAzureBlob(container, blobName, options, _) {
    var blobService = getBlobServiceClient(options);
    var specifiedContainerName = interaction.promptIfNotGiven($('Container name: '), container, _);
    var specifiedBlobName = interaction.promptIfNotGiven($('Blob name: '), blobName, _);
    var storageOptions = getStorageBlobOperationDefaultOption();

    if (options.deleteSnapshots) {
      validation.isValidEnumValue(options.deleteSnapshots, Object.keys(StorageUtil.BlobSnapshotDeletion));
    }
    
    var force = !!options.quiet;
    if (force !== true) {
      var message;
      if (options.deleteSnapshots && options.deleteSnapshots.toLowerCase() == StorageUtil.BlobSnapshotDeletion.Only.toLowerCase()) {
        message = util.format($('Do you want to remove all of the snapshots of the storage blob %s? '), blobName);
      } else if (options.snapshot) {
        message = util.format($('Do you want to remove the snapshot %s of blob %s? '), options.snapshot, blobName);
      } else {
        message = util.format($('Do you want to remove the storage blob %s and all of its snapshots? '), blobName);
      }
      
      force = interaction.confirm(message, _);
      if (force !== true) {
        return;
      }
    } else if (!options.snapshot) {
      options.deleteSnapshots = options.deleteSnapshots || StorageUtil.BlobSnapshotDeletion.Include;
    }
    
    storageOptions.deleteSnapshots = options.deleteSnapshots;
    storageOptions.snapshotId = options.snapshot;
    storageOptions.leaseId = options.lease;
    
    var tips = util.format($('Deleting Blob %s in container %s'), blobName, container);
    var operation = getStorageBlobOperation(blobService, 'deleteBlob');
    startProgress(tips);

    try {
      performStorageOperation(operation, _, specifiedContainerName, specifiedBlobName, storageOptions);
    } catch (e) {
      if (StorageUtil.isNotFoundException(e)) {
        if (options.snapshot) {
          throw new Error(util.format($('Can not find snapshot \'%s\' of blob \'%s\' in container \'%s\''), options.snapshot, specifiedBlobName, specifiedContainerName));
        } else {
          throw new Error(util.format($('Can not find blob \'%s\' in container \'%s\''), specifiedBlobName, specifiedContainerName));
        }
      } else {
        throw e;
      }
    } finally {
      endProgress();
    }

    logger.info(util.format($('Blob %s deleted successfully'), blobName));
  }

  
  /**
  * update the properties of blob
  */
  function updateAzureBlob(container, blobName, options, _) {
    var blobService = getBlobServiceClient(options);

    var specifiedContainerName = interaction.promptIfNotGiven($('Container name: '), container, _);
    var specifiedBlobName = interaction.promptIfNotGiven($('Blob name: '), blobName, _);
    var specifiedProperties = interaction.promptIfNotGiven($('Blob properties: '), options.properties, _);
    specifiedProperties = StorageUtil.parseKvParameter(specifiedProperties);

    var storageOptions = getStorageBlobOperationDefaultOption();
    storageOptions.leaseId = options.lease;

    var tips = '';
    var existingBlobProperties = null;
    try {
      tips = util.format($('Checking blob %s in container %s'), specifiedBlobName, specifiedContainerName);
      startProgress(tips);
      existingBlobProperties = getAzureBlobProperties(specifiedContainerName, specifiedBlobName, options, _);
    } finally {
      endProgress();
    }

    if (specifiedProperties !== null && specifiedProperties !== undefined) {
      // User speicifed properties are case insentive. Normalize it before passing to the azure-storage NodeJS SDK
      var properties = {};
      properties.contentType = specifiedProperties.contenttype;
      properties.contentEncoding = specifiedProperties.contentencoding;
      properties.contentLanguage = specifiedProperties.contentlanguage;
      properties.cacheControl = specifiedProperties.cachecontrol;
      properties.contentDisposition = specifiedProperties.contentdisposition;
      properties.contentMD5 = specifiedProperties.contentmd5;

      // Merge with existing properties on the server so that user can choose to update the properties partially instead of overwritting all the properties everytime.
      if (existingBlobProperties && existingBlobProperties.contentSettings) {
        properties.contentType = properties.contentType !== undefined ? properties.contentType : existingBlobProperties.contentSettings.contentType;
        properties.contentEncoding = properties.contentEncoding !== undefined ? properties.contentEncoding : existingBlobProperties.contentSettings.contentEncoding;
        properties.contentLanguage = properties.contentLanguage !== undefined ? properties.contentLanguage : existingBlobProperties.contentSettings.contentLanguage;
        properties.cacheControl = properties.cacheControl !== undefined ? properties.cacheControl : existingBlobProperties.contentSettings.cacheControl;
        properties.contentDisposition = properties.contentDisposition !== undefined ? properties.contentDisposition : existingBlobProperties.contentSettings.contentDisposition;
        properties.contentMD5 = properties.contentMD5 !== undefined ? properties.contentMD5 : existingBlobProperties.contentSettings.contentMD5;
      }

      try {
        tips = util.format($('Updating properties blob %s in container %s'), specifiedBlobName, specifiedContainerName);
        startProgress(tips);

        var propertiesOperation = getStorageBlobOperation(blobService, 'setBlobProperties');
        performStorageOperation(propertiesOperation, _, specifiedContainerName, specifiedBlobName, properties, storageOptions);
      } finally {
        endProgress();
      }
    }
  }

  /**
  * upload local file to blob
  */
  function uploadAzureBlob(file, container, blobName, options, _) {
    var blobService = getBlobServiceClient(options);
    var specifiedContainerName = interaction.promptIfNotGiven($('Container name: '), container, _);
    var specifiedFileName = interaction.promptIfNotGiven($('File name: '), file, _);
    var specifiedBlobName = blobName;
    var storageOptions = getStorageBlobOperationDefaultOption();
    var properties = StorageUtil.parseKvParameter(options.properties);
    var force = options.quiet;
    storageOptions.metadata = StorageUtil.parseKvParameter(options.metadata);
    storageOptions.storeBlobContentMD5 = true;
    StorageUtil.formatBlobProperties(properties, storageOptions);
    var summary = new SpeedSummary(specifiedBlobName);
    storageOptions.speedSummary = summary;
    storageOptions.leaseId = options.lease;

    if (!specifiedBlobName) {
      specifiedBlobName = path.basename(specifiedFileName);
    }
    specifiedBlobName = StorageUtil.convertFileNameToBlobName(specifiedBlobName);

    if (!utils.fileExists(specifiedFileName, _)) {
      throw new Error(util.format($('Local file %s doesn\'t exist'), specifiedFileName));
    }
    var fsStatus = fs.stat(specifiedFileName, _);
    if (!fsStatus.isFile()) {
      throw new Error(util.format($('%s is not a file'), specifiedFileName));
    }

    var defaultBlobTypeName = 'BLOCK';
    // If the file extension is .vhd, create page blob by default
    if (specifiedFileName.indexOf('.vhd') === (specifiedFileName.length - 4)) {
      defaultBlobTypeName = 'PAGE';
    }
    var blobTypeName = options.blobtype || defaultBlobTypeName;
    validation.isValidEnumValue(blobTypeName, Object.keys(BlobConstants.BlobTypes));
    var specifiedBlobType = BlobConstants.BlobTypes[blobTypeName.toUpperCase()];

    var sizeLimit = StorageUtil.MaxBlockBlobSize;
    if (specifiedBlobType === BlobConstants.BlobTypes.APPEND) {
      sizeLimit = StorageUtil.MaxAppendBlobSize;
    } else if (specifiedBlobType === BlobConstants.BlobTypes.PAGE) {
      sizeLimit = StorageUtil.MaxPageBlobSize;
    }
    if (fsStatus.size > sizeLimit) {
      throw new Error(util.format($('The local file size %d exceeds the Azure blob size limit %d'), fsStatus.size, sizeLimit));
    }

    var tips = '';
    if (force !== true) {
      var blobProperties = null;
      try {
        tips = util.format($('Checking blob %s in container %s'), specifiedBlobName, specifiedContainerName);
        startProgress(tips);
        var propertiesOperation = getStorageBlobOperation(blobService, 'getBlobProperties');
        blobProperties = performStorageOperation(propertiesOperation, _,
          specifiedContainerName, specifiedBlobName, storageOptions);
      } catch (e) {
        if (!StorageUtil.isNotFoundException(e)) {
          throw e;
        }
      } finally {
        endProgress();
      }

      if (blobProperties !== null) {
        if (blobProperties.blobType !== specifiedBlobType) {
          throw new Error(util.format($('BlobType mismatch. The current blob type is %s'),
            blobProperties.blobType));
        } else {
          if (!interaction.confirm(util.format($('Do you want to overwrite the blob %s in container %s? '),
            specifiedBlobName, specifiedContainerName), _)) {
            return;
          }
        }
      }
    }

    tips = util.format($('Uploading %s to blob %s in container %s'), specifiedFileName, specifiedBlobName, specifiedContainerName);
    var operation = getStorageBlobOperation(blobService, 'createBlockBlobFromLocalFile');
    storageOptions.parallelOperationThreadCount = options.concurrenttaskcount || storageOptions.parallelOperationThreadCount;
    var printer = StorageUtil.getSpeedPrinter(summary);
    var intervalId = -1;
    if (!logger.format().json) {
      intervalId = setInterval(printer, 1000);
    }
    startProgress(tips);
    endProgress();
    try {
      if (blobTypeName.toLowerCase() === 'page') {
        //Upload page blob
        operation = getStorageBlobOperation(blobService, 'createPageBlobFromLocalFile');
      } else if (blobTypeName.toLowerCase() === 'block'){
        //Upload block blob
        operation = getStorageBlobOperation(blobService, 'createBlockBlobFromLocalFile');
      } else if (blobTypeName.toLowerCase() === 'append') {
        //Upload append blob
        storageOptions.absorbConditionalErrorsOnRetry = true;
        operation = getStorageBlobOperation(blobService, 'createAppendBlobFromLocalFile');
      }
      performStorageOperation(operation, _, specifiedContainerName, specifiedBlobName, specifiedFileName, storageOptions);
    } catch (e) {
      printer(true);
      throw e;
    } finally {
      printer(true);
      clearInterval(intervalId);
    }
    var extendOption = __.extend(StorageUtil.getStorageAccountOptions(options), {speedSummary: summary});
    showAzureBlob(specifiedContainerName, specifiedBlobName, extendOption, _);
  }

  /**
  * Download storage blob
  */
  function downloadAzureBlob(container, blobName, destination, options, _) {
    var blobService = getBlobServiceClient(options);
    var specifiedContainerName = interaction.promptIfNotGiven($('Container name: '), container, _);
    //Default download destination is the current directory.
    var specifiedFileName = destination || '.';
    var specifiedBlobName = interaction.promptIfNotGiven($('Blob name: '), blobName, _);
    var dirName = '';
    var fileName = '';
    var isDirectory = false;
    var force = options.quiet;
    if (utils.pathExistsSync(specifiedFileName)) {
      var fsStatus = fs.stat(specifiedFileName, _);
      isDirectory = fsStatus.isDirectory();
    } else {
      if (specifiedFileName === '.' ||
          (specifiedFileName.length && specifiedFileName[specifiedFileName.length - 1] === path.sep)) {
        isDirectory = true;
      }
    }

    if (isDirectory) {
      dirName = specifiedFileName;
      fileName = '';
    } else {
      fileName = path.basename(specifiedFileName);
      dirName = path.dirname(specifiedFileName);
    }

    if (!utils.fileExists(dirName, _)) {
      throw new Error(util.format($('Local directory %s doesn\'t exist'), dirName));
    }

    if (!fileName) {
      var structure = StorageUtil.getStructureFromBlobName(specifiedBlobName);
      fileName = structure.fileName;
      fileName = utils.escapeFilePath(fileName);
      structure.dirName = StorageUtil.recursiveMkdir(dirName, structure.dirName);
      fileName = path.join(structure.dirName, fileName);
      
      // on Windows:
      //   fileName = "C:/foo/' will copy to "C:\foo\"
      //   fileName = "/foo/' will copy to "<current driver>:\foo\"
      //   fileName = "foo/' will copy to ".\foo\"
      // on *nix:
      //   fileName = "/foo/" will copy to "/foo/"
      //   fileName = "foo/' will copy to "./foo/"
      dirName = path.isAbsolute(fileName) ? '' : '.'; //FileName already contains the dirname
    }

    var fullName = path.join(dirName, fileName);
    if (force !== true && utils.fileExists(fullName, _)) {
      if (!interaction.confirm(util.format($('Do you want to overwrite %s? '), fullName), _)) {
        return;
      }
    }
    var tips = util.format($('Download blob %s in container %s to %s'), specifiedBlobName, specifiedContainerName, fullName);
    var storageOptions = getStorageBlobOperationDefaultOption();
    var operation = getStorageBlobOperation(blobService, 'getBlobToLocalFile');
    storageOptions.parallelOperationThreadCount = options.concurrenttaskcount || storageOptions.parallelOperationThreadCount;
    var summary = new SpeedSummary(specifiedBlobName);
    storageOptions.speedSummary = summary;
    storageOptions.disableContentMD5Validation = !options.checkmd5;
    storageOptions.leaseId = options.lease;
    storageOptions.snapshotId = options.snapshot;

    startProgress(tips);
    endProgress();
    var printer = StorageUtil.getSpeedPrinter(summary);
    var intervalId = -1;
    if (!logger.format().json) {
      intervalId = setInterval(printer, 1000);
    }
    var downloadBlob = {};
    try {
      downloadBlob = performStorageOperation(operation, _, specifiedContainerName, specifiedBlobName, fullName, storageOptions);
    } catch (e) {
      printer(true);
      if (StorageUtil.isNotFoundException(e)) {
        throw new Error(util.format($('Can not find blob \'%s\' in container \'%s\''), specifiedBlobName, specifiedContainerName));
      } else {
        throw e;
      }
    } finally {
      printer(true);
      clearInterval(intervalId);
    }

    if (options.checkmd5) {
      var calcTips = $('Calculating content md5');
      var blobProperties = {};
      startProgress(calcTips);
      try {
        var propertiesOperation = getStorageBlobOperation(blobService, 'getBlobProperties');
        blobProperties = performStorageOperation(propertiesOperation, _,
          specifiedContainerName, specifiedBlobName, storageOptions);
      } finally {
        endProgress();
      }

      blobProperties.contentSettings = blobProperties.contentSettings || {};
      downloadBlob.contentSettings = downloadBlob.contentSettings || {};
      
      if (!blobProperties.contentSettings.contentMD5) {
        logger.warn(util.format($('Blob contentMd5 is missing, and the local file md5 is %s'), downloadBlob.contentSettings.contentMD5));
      } else {
        if (blobProperties.contentSettings.contentMD5 === downloadBlob.contentSettings.contentMD5) {
          logger.info(util.format($('Md5checksum validation passed, and md5checksum is %s'), downloadBlob.contentSettings.contentMD5));
        } else {
          throw new Error(util.format($('Md5checksum validation failed. Blob md5 is %s, but local file md5 is %s'), blobProperties.contentSettings.contentMD5, downloadBlob.contentSettings.contentMD5));
        }
      }
    }
    
    var downloadedBlob = getAzureBlobProperties(specifiedContainerName, specifiedBlobName, options, _);
    if (downloadedBlob) {
      downloadedBlob['fileName'] = fullName;
    }

    downloadedBlob = StorageUtil.embedTransferSummary(downloadedBlob, summary);
    cli.interaction.formatOutput(downloadedBlob, function(data) {
      logger.info(util.format($('File saved as %s'), data.fileName));
    });
  }
  
  /**
  * Snapshot storage blob
  */
  function snapshotAzureBlob(container, blobName, options, _) {
    var blobService = getBlobServiceClient(options);
    container = interaction.promptIfNotGiven($('Container name: '), container, _);
    blobName = interaction.promptIfNotGiven($('Blob name: '), blobName, _);
    var snapshotOperation = getStorageBlobOperation(blobService, 'createBlobSnapshot');
    var snapshotOptions = getStorageBlobOperationDefaultOption();
    var snapshotTime;
    var tips = $('Creating a storage blob snapshot');

    startProgress(tips);

    try {
      snapshotOptions.leaseId = options.lease;
      snapshotTime = performStorageOperation(snapshotOperation, _, container, blobName, snapshotOptions);
    } catch (e) {
      if (StorageUtil.isNotFoundException(e)) {
        throw new Error(util.format($('Blob %s in Container %s doesn\'t exist'), blobName, container));
      } else {
        throw e;
      }
    } finally {
      endProgress();
    }

    var result = {
      snapshot: snapshotTime,
      url: util.format(blobService.getUrl(container, blobName) + '?snapshot=%s', snapshotTime)
    };
    cli.interaction.formatOutput(result, function(data) {
      logger.info(util.format(util.format('The blob snapshot %s is created '), data.url));
      logger.data($('Snapshot Time: '), data.snapshot);
      logger.data($('URL: '), data.url);
    });
  }

  /**
  * Patch for azure node sdk
  */
  function applyBlobServicePatch(blobService) {

    /*
    * List all containers
    * NOTICE: All the caller should use the options parameter since it's just a internal implementation
    */
    blobService.listAllContainers = function(options, callback) {
      StorageUtil.listWithContinuation(blobService.listContainersSegmentedWithPrefix, blobService, StorageUtil.ListContinuationTokenArgIndex.Container, options.prefix, null, options, callback);
    };

    /*
    * List all blobs
    * NOTICE: All the caller should use the options parameter since it's just a internal implementation
    */
    blobService.listAllBlobs = function(container, options, callback) {
      StorageUtil.listWithContinuation(blobService.listBlobsSegmentedWithPrefix, blobService, StorageUtil.ListContinuationTokenArgIndex.Blob, container, options.prefix, null, options, callback);
    };
  }

  /**
  * Start blob copy
  */
  function startBlobCopy(sourceUri, destContainer, options, _) {
    var startCopyParams = StorageUtil.getStartCopyParameters(StorageUtil.CopyTypes.CopyToBlob, sourceUri, options);    
    StorageUtil.startAsyncCopy(startCopyParams, destContainer, options, _);
  }

  /**
  * Show blob copy status
  */
  function showBlobCopy(container, blob, options, _) {
    var showCopyParams = {
      type: StorageUtil.CopyTypes.CopyToBlob,
      getProperties: getAzureBlobProperties
    };

    StorageUtil.showAsyncCopy(showCopyParams, container, blob, options, _);
  }

  /**
  * Stop blob copy
  */
  function stopBlobCopy(container, blob, copyid, options, _) {
    var getStopOperation = function (serviceClient) {
      var operationInfo = {};
      operationInfo.operation = getStorageBlobOperation(serviceClient, 'abortCopyBlob');
      operationInfo.options = getStorageBlobOperationDefaultOption();
      operationInfo.options.leaseId = options.lease;
      return operationInfo;
    };

    var stopCopyParams = {
      type: StorageUtil.CopyTypes.CopyToBlob,
      getStopOperation: getStopOperation
    };
    
    StorageUtil.stopAsyncCopy(stopCopyParams, container, blob, copyid, options, _);
  }

  function getAvailableBlobTypes() {
    var result = '';
    Object.keys(BlobConstants.BlobTypes).forEach(function(type) {
      result += type.toLowerCase() + ', ';
    });
    return result.slice(0, -2);
  }
};
