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
var uuid = require('uuid');

var profile = require('../../util/profile');
var utils = require('../../util/utils');

var $ = utils.getLocaleString;

var batchUtil = {};

/**
* Module variables
*/
var cli = null;
var logger = null;
var progress = null;
var operationTimeout = null;

/**
* Batch connection string environment variable name
*/
batchUtil.ENV_SDK_ACCOUNT_ENDPOINT = 'AZURE_BATCH_ENDPOINT';
batchUtil.ENV_SDK_ACCOUNT_NAME = 'AZURE_BATCH_ACCOUNT';
batchUtil.ENV_SDK_ACCOUNT_KEY = 'AZURE_BATCH_ACCESS_KEY';

/**
* Init cli module
*/
batchUtil.init = function (azureCli) {
  cli = azureCli;
  logger = cli.output;
  operationTimeout = 30;

  var batch = cli.category('batch');
  
  Object.getPrototypeOf(batch).appendSubscriptionAndResourceGroupOption = function () {
    this.option('-g, --resource-group <resource-group>', $('the resource group name'));
    this.option('-s, --subscription <subscription>', $('the subscription id'));
    return this;
  };

  Object.getPrototypeOf(batch).appendBatchAccountOption = function () {
    this.option('-a, --account-name <account-name>', $('the Batch account name'));
    this.option('-k, --account-key <account-key>', $('the Batch account key'));
    this.option('-u, --account-endpoint <account-endpoint>', $('the Batch account URL'));
    return this;
  };

  Object.getPrototypeOf(batch).appendODataFilterOption = function (select, filter, expand) {
    if (select) {
      this.option('--select-clause <select-clause>', $('list of a subset of properties to select'));
    }
    
    if (filter) {
      this.option('--filter-clause <filter-clause>', $('an OData expression by which the results will be filtered'));
    }
    
    if (expand) {
      this.option('--expand-clause <expand-clause>', $('list of related entities by which the results can be expanded'));
    }
    return this;
  };

  Object.getPrototypeOf(batch).appendCommonHeaderFilterOption = function (eTag, lastModified) {
    if (eTag) {
      this.option('--if-match <if-match>', $('only perform if resource\'s ETag is an exact match to the specified value'));
      this.option('--if-none-match <if-none-match>', $('only perform if resource\'s ETag does not match the specified value'));
    }

    if (lastModified) {
      this.option('--if-modified-since <if-modified-since>', $('only perform if the resource has been modified since the specified time'));
      this.option('--if-unmodified-since <if-unmodified-since>', $('only perform if the resource has not been modified since the specified time'));
    }

    return this;
  };
};

/**
* Start cli operation progress
*/
batchUtil.startProgress = function (tips) {
  if (progress !== null) {
    batchUtil.endProgress();
  }
  progress = cli.interaction.progress(tips);
};

/**
* End cli operation progress
*/
batchUtil.endProgress = function () {
  if (progress !== null) {
    progress.end();
  }
  progress = null;
};

/**
* Get Batch default operation options
*/
batchUtil.getBatchOperationDefaultOption = function () {
  var option = {};
  batchUtil.setOperationTimeout(option);
  batchUtil.setClientRequestId(option);
  return option;
};

/**
* Set REST operation time out
*/
batchUtil.setOperationTimeout = function (options) {
  if ((options.timeout === undefined) &&  operationTimeout !== null && !isNaN(operationTimeout) && operationTimeout > 0) {
    options.timeout = 30;
  }
};

/**
* Set REST operation client request id
*/
batchUtil.setClientRequestId = function (options) {
  if (options.clientRequestId === undefined) {
    options.clientRequestId = uuid();
    options.returnClientRequestId = true;
  }
};

/**
* Is not found exception
*/
batchUtil.isNotFoundException = function (e) {
  var notFoundErrors = ['NotFound', 'ResourceNotFound', 'PoolNotFound', 'NodeNotFound', 'JobNotFound', 'TaskNotFound', 'CertificateNotFound'];
  return notFoundErrors.some(function (error) { return e.body && e.body.code === error; });
};

batchUtil.createBatchManagementClient = function(subscriptionOrName) {
  var client;
  if (__.isString(subscriptionOrName) || !subscriptionOrName) {
    subscriptionOrName = profile.current.getSubscription(subscriptionOrName);
  }
  client = utils.createBatchResourceProviderClient(subscriptionOrName);
  return client;
};

batchUtil.createBatchServiceClient = function(options) {
  var accountName;
  var accountKey;
  var accountEndpoint;
  
  if (options) {
    accountName = options.accountName;
    accountKey = options.accountKey;
    accountEndpoint = options.accountEndpoint;
  }
  
  if (!accountName && !accountKey && !accountEndpoint) {
    accountName = process.env[batchUtil.ENV_SDK_ACCOUNT_NAME];
    accountKey = process.env[batchUtil.ENV_SDK_ACCOUNT_KEY];
    accountEndpoint = process.env[batchUtil.ENV_SDK_ACCOUNT_ENDPOINT];
  }
  
  if (!accountName || !accountKey || !accountEndpoint) {
    throw new Error($('Please specify a Batch account name, access key, and endpoint URL in one of the two following ways:\n 1. Use the --account-name, --account-key, and --account-endpoint parameters.\n 2. Set the AZURE_BATCH_ACCOUNT, AZURE_BATCH_ACCESS_KEY, and AZURE_BATCH_ENDPOINT environment variables.'));
  }
  
  return utils.createBatchClient(accountName, accountKey, accountEndpoint);
};

batchUtil.parseResourceGroupNameFromId = function(id) {
  if (!id) { return ''; }
  var keyword = '/resourceGroups/';
  var startIndex = id.indexOf(keyword) + keyword.length;
  var endIndex = id.indexOf('/', startIndex);
  return id.substring(startIndex, endIndex); 
};

module.exports = batchUtil;
