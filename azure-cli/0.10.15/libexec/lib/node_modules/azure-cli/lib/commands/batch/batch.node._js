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

var fs = require('fs');
var ss = require('streamline/lib/streams/streams');
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

  var node = batch.category('node')
    .description($('Commands to manage your Batch compute nodes'));

  var nodeUser = batch.category('node-user')
    .description($('Commands to manage your Batch compute node users'));
  
  var remoteLoginSettings = node.category('remote-login-settings')
    .description($('The remote login settings for a Batch compute node'));  

  var remoteDesktop = node.category('remote-desktop')
    .description($('The remote desktop protocol for a Batch compute node'));  
    
  var nodeSchedulingSettings = node.category('scheduling')
    .description($('The scheduling property for a Batch compute node'));  
    
  nodeUser.command('create [pool-id] [node-id] [user-name]')
    .description($('Adds a user account to the specified compute node'))
    .option('-p, --pool-id <pool-Id>', $('the id of the pool that contains the compute node'))
    .option('-i, --node-id <node-Id>', $('the id of the machine on which you want to create a user account'))
    .option('-n, --user-name <user-name>', $('the name of the user account to be created'))
    .option('-w, --user-password [user-password]', $('the password of the user account'))
    .option('--ssh-public-key [ssh-public-key]', $('the ssh public key that can be used for remote login to the compute node; can only be specified for Linux nodes'))
    .option('--admin', $('whether the account should be an administrator on the compute node'))
    .option('--expiry-time [expiry-time]', $('the time at which the account should expire'))
    .appendBatchAccountOption()
    .execute(addUser);

  nodeUser.command('delete [pool-id] [node-id] [user-name]')
    .description($('Deletes a user account from the specified compute node'))
    .option('-p, --pool-id <pool-Id>', $('the id of the pool that contains the compute node'))
    .option('-i, --node-id <node-Id>', $('the id of the machine on which you want to delete a user account'))
    .option('-n, --user-name <user-name>', $('the name of user account to delete'))
    .option('-q, --quiet', $('remove the specified user without confirmation'))
    .appendBatchAccountOption()
    .execute(deleteUser);

  nodeUser.command('set [pool-id] [node-id] [user-name]')
    .description($('Update the properties of a user account on the specified compute node'))
    .option('-p, --pool-id <pool-Id>', $('the id of the pool that contains the compute node'))
    .option('-i, --node-id <node-Id>', $('the id of the machine on which you want to update a user account'))
    .option('-n, --user-name <user-name>', $('the name of the user account to update'))
    .option('-w, --user-password [user-password]', $('the password of the user account'))
    .option('--ssh-public-key [ssh-public-key]', $('the ssh public key that can be used for remote login to the compute node; can only be specified for Linux nodes'))
    .option('--expiry-time [expiry-time]', $('the time at which the account should expire'))
    .appendBatchAccountOption()
    .execute(updateUser);

  node.command('show [pool-id] [node-id]')
    .description($('Show information about the specified compute node'))
    .option('-p, --pool-id <pool-Id>', $('the id of the pool that contains the compute node'))
    .option('-i, --node-id <node-Id>', $('the id of the compute node that you want to get information about'))
    .appendODataFilterOption(true, false, false)
    .appendBatchAccountOption()
    .execute(showNode);

  node.command('list [pool-id]')
    .description($('Lists the compute nodes in the specified pool'))
    .option('-p, --pool-id <pool-Id>', $('the id of the pool from which you want to list nodes'))
    .appendODataFilterOption(true, true, false)
    .appendBatchAccountOption()
    .execute(listNode);

  node.command('reboot [pool-id] [node-id]')
    .description($('Restarts the specified compute node'))
    .option('-p, --pool-id <pool-Id>', $('the id of the pool that contains the compute node'))
    .option('-i, --node-id <node-Id>', $('the id of the compute node that you want to restart'))
    .option('-o, --reboot-option <reboot-option>', $('when to reboot the compute node and what to do with currently running tasks'))
    .option('-q, --quiet', $('reboot the specified compute node without confirmation'))
    .appendBatchAccountOption()
    .execute(rebootNode);

  node.command('reimage [pool-id] [node-id]')
    .description($('Reinstalls the operating system on the specified compute node'))
    .option('-p, --pool-id <pool-Id>', $('the id of the pool that contains the compute node'))
    .option('-i, --node-id <node-Id>', $('the id of the compute node that you want to reimage'))
    .option('-o, --reimage-option <reimage-option>', $('when to reimage the compute node and what to do with currently running tasks'))
    .option('-q, --quiet', $('reimage the specified compute node without confirmation'))
    .appendBatchAccountOption()
    .execute(reimageNode);

  nodeSchedulingSettings.command('disable [pool-id] [node-id]')
    .description($('Disable scheduling on the Batch compute node'))
    .option('-p, --pool-id <pool-Id>', $('the id of the pool that contains the compute node'))
    .option('-i, --node-id <node-Id>', $('the id of the compute node that you want to disable scheduling'))
    .option('-o, --disable-option <disable-option>', $('option of what to do with currently running tasks when to disable scheduling on the compute node'))
    .appendBatchAccountOption()
    .execute(disableSchedulingNode);
  
  nodeSchedulingSettings.command('enable [pool-id] [node-id]')
    .description($('Enable scheduling on the Batch compute node'))
    .option('-p, --pool-id <pool-Id>', $('the id of the pool that contains the compute node'))
    .option('-i, --node-id <node-Id>', $('the id of the compute node that you want to enable scheduling'))
    .appendBatchAccountOption()
    .execute(enableSchedulingNode);
  
  remoteDesktop.command('show [pool-id] [node-id] [rdp-file]')
    .description($('Gets the Remote Desktop Protocol file for the specified compute node'))
    .option('-p, --pool-id <pool-Id>', $('the id of the pool that contains the compute node'))
    .option('-i, --node-id <node-Id>', $('the id of the compute node for which you want to get the Remote Desktop Protocol file'))
    .option('-f, --rdp-file <rdp-file>', $('the path where you would like to save the Remote Desktop Protocol file'))
    .option('-q, --quiet', $('overwrite the destination Remote Desktop Protocol file without confirmation'))
    .appendBatchAccountOption()
    .execute(getRemoteDesktop);
      
  remoteLoginSettings.command('show [pool-id] [node-id]')
    .description($('Gets the remote login settings for the specified node'))
    .option('-p, --pool-id <pool-Id>', $('the id of the pool that contains the compute node'))
    .option('-i, --node-id <node-Id>', $('the id of the compute node for which you want to get the remote login settings'))
    .appendBatchAccountOption()
    .execute(getRemoteLoginSettings);

  /**
  * Implement batch node cli
  */

  /**
  * Add compute node user
  * @param {string} [poolId] pool id
  * @param {string} [nodeId] node id
  * @param {string} [userName] the user name
  * @param {object} options command line options
  * @param {callback} _ callback function
  */
  function addUser(poolId, nodeId, userName, options, _) {
    if (!poolId) {
      poolId = options.poolId;
    }
    poolId = interaction.promptIfNotGiven($('Pool id: '), poolId, _);
    if (!nodeId) {
      nodeId = options.nodeId;
    }
    nodeId = interaction.promptIfNotGiven($('Node id: '), nodeId, _);
    if (!userName) {
      userName = options.userName;
    }
    userName = interaction.promptIfNotGiven($('User name: '), userName, _);

    var client = batchUtil.createBatchServiceClient(options);
    var tips = util.format($('Adding node user %s'), userName);
    var batchOptions = {};
    batchOptions.computeNodeAddUserOptions = batchUtil.getBatchOperationDefaultOption();

    var param = {};
    param.name = userName;
    if (options.userPassword) {
      param.password = options.userPassword;
    }
    if (options.admin) {
      param.isAdmin = true;
    }
    if (options.expiryTime) {
      param.expiryTime = options.expiryTime;
    }
    if (options.sshPublicKey) {
      param.sshPublicKey = options.sshPublicKey;
    }

    startProgress(tips);
    try {
      client.computeNodeOperations.addUser(poolId, nodeId, param, batchOptions, _);
    } catch (err) {
      if (batchUtil.isNotFoundException(err)) {
        throw new Error(util.format($('Pool %s or node %s doesn\'t exist'), poolId, nodeId));
      } else {
        if (err.message) {
          if (typeof err.message === 'object') {
            err.message = err.message.value;
          }
        }

        throw err;
      }
    }
    finally {
      endProgress();
    }

    logger.verbose(util.format($('User %s has been added to node %s successfully'), userName, nodeId));
  }

  /**
   * Delete the specified user
   * @param {string} [poolId] pool Id
   * @param {string} [nodeId] node id
   * @param {string} [userName] the user name
   * @param {object} options command line options
   * @param {callback} _ callback function
   */
  function deleteUser(poolId, nodeId, userName, options, _) {
    if (!poolId) {
      poolId = options.poolId;
    }
    poolId = interaction.promptIfNotGiven($('Pool id: '), poolId, _);
    if (!nodeId) {
      nodeId = options.nodeId;
    }
    nodeId = interaction.promptIfNotGiven($('Node id: '), nodeId, _);
    if (!userName) {
      userName = options.userName;
    }
    userName = interaction.promptIfNotGiven($('User name: '), userName, _);

    var client = batchUtil.createBatchServiceClient(options);
    var tips = util.format($('Deleting user %s'), userName);
    var batchOptions = {};
    batchOptions.computeNodeDeleteUserOptions = batchUtil.getBatchOperationDefaultOption();

    if (!options.quiet) {
      if (!interaction.confirm(util.format($('Do you want to delete user %s? '), userName), _)) {
        return;
      }
    }

    startProgress(tips);

    try {
      client.computeNodeOperations.deleteUser(poolId, nodeId, userName, batchOptions, _);
    } catch (err) {
      if (batchUtil.isNotFoundException(err)) {
        throw new Error(util.format($('Pool %s or node %s doesn\'t exist'), poolId, nodeId));
      } else {
        if (err.message) {
          if (typeof err.message === 'object') {
            err.message = err.message.value;
          }
        }

        throw err;
      }
    } finally {
      endProgress();
    }

    logger.info(util.format($('User %s has been deleted successfully'), userName));
  }

  /**
   * Update compute node user
   * @param {string} [poolId] pool id
   * @param {string} [nodeId] node id
   * @param {string} [userName] the user name
   * @param {object} options command line options
   * @param {callback} _ callback function
   */
  function updateUser(poolId, nodeId, userName, options, _) {
    if (!poolId) {
      poolId = options.poolId;
    }
    poolId = interaction.promptIfNotGiven($('Pool id: '), poolId, _);
    if (!nodeId) {
      nodeId = options.nodeId;
    }
    nodeId = interaction.promptIfNotGiven($('Node id: '), nodeId, _);
    if (!userName) {
      userName = options.userName;
    }
    userName = interaction.promptIfNotGiven($('User name: '), userName, _);

    var client = batchUtil.createBatchServiceClient(options);
    var tips = util.format($('Updating node user %s'), userName);
    var batchOptions = {};
    batchOptions.computeNodeUpdateUserOptions = batchUtil.getBatchOperationDefaultOption();

    var param = {};
    if (options.userPassword) {
      param.password = options.userPassword;
    }
    if (options.expiryTime) {
      param.expiryTime = options.expiryTime;
    }
    if (options.sshPublicKey) {
      param.sshPublicKey = options.sshPublicKey;
    }

    startProgress(tips);
    try {
      client.computeNodeOperations.updateUser(poolId, nodeId, userName, param, batchOptions, _);
    } catch (err) {
      if (batchUtil.isNotFoundException(err)) {
        throw new Error(util.format($('Pool %s or node %s doesn\'t exist'), poolId, nodeId));
      } else {
        if (err.message) {
          if (typeof err.message === 'object') {
            err.message = err.message.value;
          }
        }

        throw err;
      }
    }
    finally {
      endProgress();
    }

    logger.verbose(util.format($('User %s has been updated on node %s successfully'), userName, nodeId));
  }

  /**
  * Show the details of the specified Batch compute node
  * @param {string} [poolId] pool id
  * @param {string} [nodeId] node id
  * @param {object} options command line options
  * @param {callback} _ callback function
  */
  function showNode(poolId, nodeId, options, _) {
    var client = batchUtil.createBatchServiceClient(options);
    if (!poolId) {
      poolId = options.poolId;
    }
    poolId = interaction.promptIfNotGiven($('Pool id: '), poolId, _);
    if (!nodeId) {
      nodeId = options.nodeId;
    }
    nodeId = interaction.promptIfNotGiven($('Node id: '), nodeId, _);
    var tips = $('Getting Batch node information');
    var batchOptions = {};
    batchOptions.computeNodeGetOptions = batchUtil.getBatchOperationDefaultOption();

    if (options.selectClause) {
      batchOptions.computeNodeGetOptions.select = options.selectClause;
    }

    var node = null;
    startProgress(tips);

    try {
      node = client.computeNodeOperations.get(poolId, nodeId, batchOptions, _);
    } catch (err) {
      if (batchUtil.isNotFoundException(err)) {
        throw new Error(util.format($('Pool %s or node %s doesn\'t exist'), poolId, nodeId));
      } else {
        if (err.message) {
          if (typeof err.message === 'object') {
            err.message = err.message.value;
          }
        }
        
        throw err;
      }
    } finally {
      endProgress();
    }

    batchShowUtil.showComputeNode(node, cli.output);
  }

  /**
  * List batch compute nodes
  * @param {string} [poolId] pool id
  * @param {object} options command line options
  * @param {callback} _ callback function
  */
  function listNode(poolId, options, _) {
    if (!poolId) {
      poolId = options.poolId;
    }
    poolId = interaction.promptIfNotGiven($('Pool id: '), poolId, _);

    var client = batchUtil.createBatchServiceClient(options);
    var tips = $('Listing Batch nodes');
    var batchOptions = {};
    batchOptions.computeNodeListOptions = batchUtil.getBatchOperationDefaultOption();

    if (options.selectClause) {
      batchOptions.computeNodeListOptions.select = options.selectClause;
    }
    if (options.filterClause) {
      batchOptions.computeNodeListOptions.filter = options.filterClause;
    }

    var nodes = [];
    startProgress(tips);

    try {
      var result = client.computeNodeOperations.list(poolId, batchOptions, _);
      result.forEach(function (node) {
        nodes.push(node);
      });
      var nextLink = result.odatanextLink;

      while (nextLink) {
        batchOptions.computeNodeListOptions = batchUtil.getBatchOperationDefaultOption();
        result = client.computeNodeOperations.listNext(nextLink, batchOptions, _);
        result.forEach(function (node) {
          nodes.push(node);
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

    cli.interaction.formatOutput(nodes, function (outputData) {
      if (outputData.length === 0) {
        logger.info($('No node found'));
      } else {
        logger.table(outputData, function(row, item) {
          row.cell($('Id'), item.id);
          row.cell($('State'), item.state);
          row.cell($('VM Size'), item.vmSize);
          row.cell($('IP Address'), item.ipAddress);
        });
      }
    });
  }
  
  /**
   * Reboot the specified batch compute node
   * @param {string} [poolId] pool id
   * @param {string} [nodeId] node id
   * @param {object} options command line options
   * @param {callback} _ callback function
   */
  function rebootNode(poolId, nodeId, options, _) {
    var client = batchUtil.createBatchServiceClient(options);
    if (!poolId) {
      poolId = options.poolId;
    }
    poolId = interaction.promptIfNotGiven($('Pool id: '), poolId, _);
    if (!nodeId) {
      nodeId = options.nodeId;
    }
    nodeId = interaction.promptIfNotGiven($('Node id: '), nodeId, _);

    var tips = util.format($('Rebooting compute node %s'), nodeId);
    var batchOptions = {};
    batchOptions.computeNodeRebootOptions = batchUtil.getBatchOperationDefaultOption();

    if (!options.quiet) {
      if (!interaction.confirm(util.format($('Do you want to reboot node %s? '), nodeId), _)) {
        return;
      }
    }

    if (options.rebootOption) {
      batchOptions.nodeRebootOption = options.rebootOption;
    }

    startProgress(tips);

    try {
      client.computeNodeOperations.reboot(poolId, nodeId, batchOptions, _);
    } catch (err) {
      if (batchUtil.isNotFoundException(err)) {
        throw new Error(util.format($('Pool %s or node %s doesn\'t exist'), poolId, nodeId));
      } else {
        if (err.message) {
          if (typeof err.message === 'object') {
            err.message = err.message.value;
          }
        }

        throw err;
      }
    } finally {
      endProgress();
    }

    logger.info(util.format($('Node %s has been rebooted successfully'), nodeId));
  }

  /**
   * Reimage the specified batch compute node
   * @param {string} [poolId] pool id
   * @param {string} [nodeId] node id
   * @param {object} options command line options
   * @param {callback} _ callback function
   */
  function reimageNode(poolId, nodeId, options, _) {
    var client = batchUtil.createBatchServiceClient(options);
    if (!poolId) {
      poolId = options.poolId;
    }
    poolId = interaction.promptIfNotGiven($('Pool id: '), poolId, _);
    if (!nodeId) {
      nodeId = options.nodeId;
    }
    nodeId = interaction.promptIfNotGiven($('Node id: '), nodeId, _);
    var tips = util.format($('Reimaging compute node %s'), nodeId);
    var batchOptions = {};
    batchOptions.computeNodeReimageOptions = batchUtil.getBatchOperationDefaultOption();

    if (!options.quiet) {
      if (!interaction.confirm(util.format($('Do you want to reimage node %s? '), nodeId), _)) {
        return;
      }
    }

    if (options.reimageOption) {
      batchOptions.nodeReimageOption = options.reimageOption;
    }

    startProgress(tips);

    try {
      client.computeNodeOperations.reimage(poolId, nodeId, batchOptions, _);
    } catch (err) {
      if (batchUtil.isNotFoundException(err)) {
        throw new Error(util.format($('Pool %s or node %s doesn\'t exist'), poolId, nodeId));
      } else {
        if (err.message) {
          if (typeof err.message === 'object') {
            err.message = err.message.value;
          }
        }

        throw err;
      }
    } finally {
      endProgress();
    }

    logger.info(util.format($('Node %s has been reimaged successfully'), nodeId));
  }

  /**
   * Disable scheduling at the specified batch compute node
   * @param {string} [poolId] pool id
   * @param {string} [nodeId] node id
   * @param {object} options command line options
   * @param {callback} _ callback function
   */
  function disableSchedulingNode(poolId, nodeId, options, _) {
    var client = batchUtil.createBatchServiceClient(options);
    if (!poolId) {
      poolId = options.poolId;
    }
    poolId = interaction.promptIfNotGiven($('Pool id: '), poolId, _);
    if (!nodeId) {
      nodeId = options.nodeId;
    }
    nodeId = interaction.promptIfNotGiven($('Node id: '), nodeId, _);
    var tips = util.format($('Disabling scheduling at compute node %s'), nodeId);
    var batchOptions = {};
    batchOptions.computeNodeDisableSchedulingOptions = batchUtil.getBatchOperationDefaultOption();

    if (options.disableOption) {
      batchOptions.nodeDisableSchedulingOption = options.disableOption;
    }

    startProgress(tips);

    try {
      client.computeNodeOperations.disableScheduling(poolId, nodeId, batchOptions, _);
    } catch (err) {
      if (batchUtil.isNotFoundException(err)) {
        throw new Error(util.format($('Pool %s or node %s doesn\'t exist'), poolId, nodeId));
      } else {
        if (err.message) {
          if (typeof err.message === 'object') {
            err.message = err.message.value;
          }
        }

        throw err;
      }
    } finally {
      endProgress();
    }

    logger.info(util.format($('Node %s has been disabled scheduling successfully'), nodeId));
  }

  /**
   * Enable scheduling at the specified batch compute node
   * @param {string} [poolId] pool id
   * @param {string} [nodeId] node id
   * @param {object} options command line options
   * @param {callback} _ callback function
   */
  function enableSchedulingNode(poolId, nodeId, options, _) {
    var client = batchUtil.createBatchServiceClient(options);
    if (!poolId) {
      poolId = options.poolId;
    }
    poolId = interaction.promptIfNotGiven($('Pool id: '), poolId, _);
    if (!nodeId) {
      nodeId = options.nodeId;
    }
    nodeId = interaction.promptIfNotGiven($('Node id: '), nodeId, _);
    var tips = util.format($('Enabling scheduling at compute node %s'), nodeId);
    var batchOptions = {};
    batchOptions.computeNodeEnableSchedulingOptions = batchUtil.getBatchOperationDefaultOption();

    startProgress(tips);

    try {
      client.computeNodeOperations.enableScheduling(poolId, nodeId, batchOptions, _);
    } catch (err) {
      if (batchUtil.isNotFoundException(err)) {
        throw new Error(util.format($('Pool %s or node %s doesn\'t exist'), poolId, nodeId));
      } else {
        if (err.message) {
          if (typeof err.message === 'object') {
            err.message = err.message.value;
          }
        }

        throw err;
      }
    } finally {
      endProgress();
    }

    logger.info(util.format($('Node %s has been enabled scheduling successfully'), nodeId));
  }

  /**
   * Get Remote Desktop Protocol file from the specified batch compute node
   * @param {string} [poolId] pool Id
   * @param {string} [nodeId] node id
   * @param {string} [rdpFile] the file name for saving RDP
   * @param {object} options command line options
   * @param {callback} _ callback function
   */
  function getRemoteDesktop(poolId, nodeId, rdpFile, options, _) {
    var client = batchUtil.createBatchServiceClient(options);
    if (!poolId) {
      poolId = options.poolId;
    }
    poolId = interaction.promptIfNotGiven($('Pool id: '), poolId, _);
    if (!nodeId) {
      nodeId = options.nodeId;
    }
    nodeId = interaction.promptIfNotGiven($('Node id: '), nodeId, _);
    if (!rdpFile) {
      rdpFile = options.autoscaleFormula;
    }
    rdpFile = interaction.promptIfNotGiven($('RDP file: '), rdpFile, _);

    // If destination exists as a file, prompt for overwrite if not in
    // quite mode.
    var force = !!options.quiet;
    if (utils.fileExists(rdpFile, _)) {
      if (force !== true) {
        force = interaction.confirm(util.format($('Do you want to overwrite file %s? '), rdpFile), _);
        if (force !== true) {
          return;
        }
      }
    }

    var tips = util.format($('Getting RDP at node %s'), nodeId);
    var batchOptions = {};
    batchOptions.computeNodeGetRemoteDesktopOptions = batchUtil.getBatchOperationDefaultOption();

    startProgress(tips);

    var stream;
    try {
      stream = client.computeNodeOperations.getRemoteDesktop(poolId, nodeId, batchOptions, _);
    } catch (err) {
      if (batchUtil.isNotFoundException(err)) {
        throw new Error(util.format($('Pool %s or node %s doesn\'t exist'), poolId, nodeId));
      } else {
        if (err.message) {
          if (typeof err.message === 'object') {
            err.message = err.message.value;
          }
        }

        throw err;
      }
    } finally {
      endProgress();
    }

    var reader = new ss.ReadableStream(stream);
    var data = reader.read(_);
    var fd = fs.openSync(rdpFile, 'w');
    fs.write(fd, data, 0, data.length, 0, _);
    fs.close(fd);
  }

    /**
   * Gets the remote login settings for the specified batch compute node
   * @param {string} [poolId] pool Id
   * @param {string} [nodeId] node id
   * @param {object} options command line options
   * @param {callback} _ callback function
   */
  function getRemoteLoginSettings(poolId, nodeId, options, _) {
    var client = batchUtil.createBatchServiceClient(options);
    if (!poolId) {
      poolId = options.poolId;
    }
    poolId = interaction.promptIfNotGiven($('Pool id: '), poolId, _);
    if (!nodeId) {
      nodeId = options.nodeId;
    }
    nodeId = interaction.promptIfNotGiven($('Node id: '), nodeId, _);

    var tips = util.format($('Getting remote login settings for node %s'), nodeId);
    var batchOptions = {};
    batchOptions.computeNodeGetRemoteLoginSettingsOptions = batchUtil.getBatchOperationDefaultOption();

    startProgress(tips);

    try {
      settings = client.computeNodeOperations.getRemoteLoginSettings(poolId, nodeId, batchOptions, _);
    } catch (err) {
      if (batchUtil.isNotFoundException(err)) {
        throw new Error(util.format($('Pool %s or node %s doesn\'t exist'), poolId, nodeId));
      } else {
        if (err.message) {
          if (typeof err.message === 'object') {
            err.message = err.message.value;
          }
        }

        throw err;
      }
    } finally {
      endProgress();
    }

    batchShowUtil.showRemoteLoginSettings(settings, cli.output);
  }
};
