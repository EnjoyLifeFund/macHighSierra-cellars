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
var StorageUtil = require('../../util/storage.util');
var pathUtil = require('path');
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

  var taskfile = batch.category('task-file')
    .description($('Commands to manage your Batch task files'));

  var nodefile = batch.category('node-file')
      .description($('Commands to manage your Batch compute node files'));

  nodefile.command('delete [pool-id] [node-id] [file-name]')
    .description($('Deletes the specified file from the compute node'))
    .option('-p, --pool-id <pool-Id>', $('the id of the pool that contains the compute node'))
    .option('-i, --node-id <node-Id>', $('the id of the compute node from which you want to delete the file'))
    .option('-f, --file-name <user-name>', $('the path to the file that you want to delete'))
    .option('-r, --recursive', $('whether to delete children of a directory'))
    .option('-q, --quiet', $('delete file(s) without confirmation'))
    .appendBatchAccountOption()
    .execute(deleteNodeFile);
  
  taskfile.command('delete [job-id] [task-id] [file-name]')
    .description($('Deletes the specified task file from the compute node where the task ran'))
    .option('-j, --job-id <job-Id>', $('the id of the job that contains the task'))
    .option('-i, --task-id <task-Id>', $('the id of the task whose file you want to delete'))
    .option('-f, --file-name <user-name>', $('the path to the task file that you want to delete'))
    .option('-r, --recursive', $('whether to delete children of a directory'))
    .option('-q, --quiet', $('delete file(s) without confirmation'))
    .appendBatchAccountOption()
    .execute(deleteTaskFile);

  nodefile.command('download [pool-id] [node-id] [file-name] [destination]')
    .description($('Download a file from a Batch compute node'))
    .option('-p, --pool-id <pool-Id>', $('the id of the pool that contains the compute node'))
    .option('-i, --node-id <node-Id>', $('the id of the compute node that contains the file'))
    .option('-f, --file-name <user-name>', $('the path to the file that you want to download'))
    .option('-d, --destination <destination>', $('path to the destination file or directory'))
    .option('--range <range>', $('the byte range to be retrieved, the default is to retrieve the entire file'))
    .option('-q, --quiet', $('overwrite the destination file without confirmation'))
    .appendCommonHeaderFilterOption(false, true)
    .appendBatchAccountOption()
    .execute(getNodeFile);

  taskfile.command('download [job-id] [task-id] [file-name] [destination]')
    .description($('Download a Batch task file'))
    .option('-j, --job-id <job-Id>', $('the batch job id'))
    .option('-i, --task-id <task-Id>', $('the batch task id'))
    .option('-f, --file-name <user-name>', $('the path to the file that you want to download'))
    .option('-d, --destination <destination>', $('path to the destination file or directory'))
    .option('--range <range>', $('the byte range to be retrieved, the default is to retrieve the entire file'))
    .option('-q, --quiet', $('overwrite the destination file without confirmation'))
    .appendCommonHeaderFilterOption(false, true)
    .appendBatchAccountOption()
    .execute(getTaskFile);

  nodefile.command('show [pool-id] [node-id] [file-name]')
    .description($('Get the properties of the specified compute node file'))
    .option('-p, --pool-id <pool-Id>', $('the id of the pool that contains the compute node'))
    .option('-i, --node-id <node-Id>', $('the id of the compute node that contains the file'))
    .option('-f, --file-name <user-name>', $('the path to the file that you want to get the properties of'))
    .appendCommonHeaderFilterOption(false, true)
    .appendBatchAccountOption()
    .execute(showNodeFile);
  
  taskfile.command('show [job-id] [task-id] [file-name]')
    .description($('Gets the properties of the specified task file'))
    .option('-j, --job-id <job-Id>', $('the id of the job that contains the task'))
    .option('-i, --task-id <task-Id>', $('the id of the task whose file you want to get the properties of'))
    .option('-f, --file-name <user-name>', $('the path to the file that you want to get the properties of'))
    .appendCommonHeaderFilterOption(false, true)
    .appendBatchAccountOption()
    .execute(showTaskFile);

  nodefile.command('list [pool-id] [node-id]')
    .description($('Lists all of the files in task directories on the specified compute node'))
    .option('-p, --pool-id <pool-Id>', $('the id of the pool that contains the compute node'))
    .option('-i, --node-id <node-Id>', $('the id of the compute node whose files you want to list'))
    .option('-r, --recursive', $('whether to list children of a directory'))
    .appendODataFilterOption(false, true, false)
    .appendBatchAccountOption()
    .execute(listNodeFile);

  taskfile.command('list [job-id] [task-id]')
    .description($('Lists the files in a task\'s directory on its compute node'))
    .option('-j, --job-id <job-Id>', $('the id of the job that contains the task'))
    .option('-i, --task-id <task-Id>', $('the id of the task whose files you want to list'))
    .option('-r, --recursive', $('whether to list children of a directory'))
    .appendODataFilterOption(false, true, false)
    .appendBatchAccountOption()
    .execute(listTaskFile);

  /**
  * Implement batch file cli
  */

  /**
   * Delete file from compute node
   * @param {string} [poolId] pool Id
   * @param {string} [nodeId] node id
   * @param {string} [fileName] the file name
   * @param {object} options command line options
   * @param {callback} _ callback function
   */
  function deleteNodeFile(poolId, nodeId, fileName, options, _) {
    if (!poolId) {
      poolId = options.poolId;
    }
    poolId = interaction.promptIfNotGiven($('Pool id: '), poolId, _);
    if (!nodeId) {
      nodeId = options.nodeId;
    }
    nodeId = interaction.promptIfNotGiven($('Node id: '), nodeId, _);
    if (!fileName) {
      fileName = options.fileName;
    }
    fileName = interaction.promptIfNotGiven($('File name: '), fileName, _);

    if (!options.quiet) {
      if (!interaction.confirm(util.format($('Do you want to delete file %s? '), fileName), _)) {
        return;
      }
    }

    var client = batchUtil.createBatchServiceClient(options);
    var tips = util.format($('Deleting file %s'), fileName);
    var batchOptions = {};
    batchOptions.fileDeleteFromComputeNodeOptions = batchUtil.getBatchOperationDefaultOption();
    if (options.recursive) {
      batchOptions.recursive = true;
    }

    startProgress(tips);

    try {
      client.file.deleteFromComputeNode(poolId, nodeId, fileName, batchOptions, _);
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

    logger.info(util.format($('File %s has been deleted successfully'), fileName));
  }

  /**
   * Delete file from cloud task
   * @param {string} [jobId] job Id
   * @param {string} [taskId] node id
   * @param {string} [fileName] the file name
   * @param {object} options command line options
   * @param {callback} _ callback function
   */
  function deleteTaskFile(jobId, taskId, fileName, options, _) {
    if (!jobId) {
      jobId = options.jobId;
    }
    jobId = interaction.promptIfNotGiven($('Job id: '), jobId, _);
    if (!taskId) {
      taskId = options.taskId;
    }
    taskId = interaction.promptIfNotGiven($('Task id: '), taskId, _);
    if (!fileName) {
      fileName = options.fileName;
    }
    fileName = interaction.promptIfNotGiven($('File name: '), fileName, _);

    if (!options.quiet) {
      if (!interaction.confirm(util.format($('Do you want to delete file %s? '), fileName), _)) {
        return;
      }
    }

    var client = batchUtil.createBatchServiceClient(options);
    var tips = util.format($('Deleting file %s'), fileName);
    var batchOptions = {};
    batchOptions.fileDeleteFromTaskOptions = batchUtil.getBatchOperationDefaultOption();
    if (options.recursive) {
      batchOptions.recursive = true;
    }

    startProgress(tips);

    try {
      client.file.deleteFromTask(jobId, taskId, fileName, batchOptions, _);
    } catch (err) {
      if (batchUtil.isNotFoundException(err)) {
        throw new Error(util.format($('Job %s or task %s doesn\'t exist'), jobId, taskId));
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

    logger.info(util.format($('File %s has been deleted successfully'), fileName));
  }

  /**
  * Show the details of the specified file by Batch compute node
  * @param {string} [poolId] pool id
  * @param {string} [nodeId] node id
  * @param {string} [fileName] the file name
  * @param {object} options command line options
  * @param {callback} _ callback function
  */
  function showNodeFile(poolId, nodeId, fileName, options, _) {
    if (!poolId) {
      poolId = options.id;
    }
    poolId = interaction.promptIfNotGiven($('Pool id: '), poolId, _);
    if (!nodeId) {
      nodeId = options.nodeId;
    }
    nodeId = interaction.promptIfNotGiven($('Node id: '), nodeId, _);
    if (!fileName) {
      fileName = options.fileName;
    }
    fileName = interaction.promptIfNotGiven($('File name: '), fileName, _);

    var client = batchUtil.createBatchServiceClient(options);
    var tips = $('Getting Batch file properties');
    var batchOptions = {};
    batchOptions.fileGetNodeFilePropertiesFromComputeNodeOptions = batchUtil.getBatchOperationDefaultOption();

    if (options.ifModifiedSince) {
      batchOptions.fileGetNodeFilePropertiesFromComputeNodeOptions.ifModifiedSince = options.ifModifiedSince;
    }
    if (options.ifUnmodifiedSince) {
      batchOptions.fileGetNodeFilePropertiesFromComputeNodeOptions.ifUnmodifiedSince = options.ifUnmodifiedSince;
    }

    var properties = null;
    startProgress(tips);

    try {
      var results = client.file.getNodeFilePropertiesFromComputeNode(poolId, nodeId, fileName, batchOptions, [_]);
      properties = {};
      properties.name = fileName;
      properties.properties = {};
      var headers = results[2].headers;
      if (headers) {
        if (headers['ocp-batch-file-isdirectory']) {
          properties.isDirectory = (headers['ocp-batch-file-isdirectory'] === 'True' || headers['ocp-batch-file-isdirectory'] === 'true');
        }
        properties.properties.contentLength = headers['content-length'];
        properties.properties.creationTime = new Date(headers['ocp-creation-time']);
        properties.properties.lastModified = new Date(headers['last-modified']);
        properties.properties.contentType = headers['content-type'];
      }
    } catch (err) {
      if (batchUtil.isNotFoundException(err)) {
        throw new Error(util.format($('Pool %s or node %s doesn\'t exist'), poolId, nodeId));
      } else {
        if (err.statusCode === 404) {
          throw new Error(util.format($('File %s doesn\'t exist'), fileName));
        }
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

    batchShowUtil.showFile(properties, cli.output);
  }

  /**
   * Show the details of the specified file by Batch task
   * @param {string} [jobId] job Id
   * @param {string} [taskId] node id
   * @param {string} [fileName] the file name
   * @param {object} options command line options
   * @param {callback} _ callback function
   */
  function showTaskFile(jobId, taskId, fileName, options, _) {
    if (!jobId) {
      jobId = options.jobId;
    }
    jobId = interaction.promptIfNotGiven($('Job id: '), jobId, _);
    if (!taskId) {
      taskId = options.taskId;
    }
    taskId = interaction.promptIfNotGiven($('Task id: '), taskId, _);
    if (!fileName) {
      fileName = options.fileName;
    }
    fileName = interaction.promptIfNotGiven($('File name: '), fileName, _);

    var client = batchUtil.createBatchServiceClient(options);
    var tips = $('Getting Batch file properties');
    var batchOptions = {};
    batchOptions.fileGetNodeFilePropertiesFromTaskOptions = batchUtil.getBatchOperationDefaultOption();

    if (options.ifModifiedSince) {
      batchOptions.fileGetNodeFilePropertiesFromTaskOptions.ifModifiedSince = options.ifModifiedSince;
    }
    if (options.ifUnmodifiedSince) {
      batchOptions.fileGetNodeFilePropertiesFromTaskOptions.ifUnmodifiedSince = options.ifUnmodifiedSince;
    }

    var properties = null;
    startProgress(tips);

    try {
      var results = client.file.getNodeFilePropertiesFromTask(jobId, taskId, fileName, batchOptions, [_]);
      properties = {};
      properties.name = fileName;
      properties.properties = {};
      var headers = results[2].headers;
      if (headers) {
        if (headers['ocp-batch-file-isdirectory']) {
          properties.isDirectory = (headers['ocp-batch-file-isdirectory'] === 'True' || headers['ocp-batch-file-isdirectory'] === 'true');
        }
        properties.properties.contentLength = headers['content-length'];
        properties.properties.creationTime = new Date(headers['ocp-creation-time']);
        properties.properties.lastModified = new Date(headers['last-modified']);
        properties.properties.contentType = headers['content-type'];
      }
    } catch (err) {
      if (batchUtil.isNotFoundException(err)) {
        throw new Error(util.format($('Job %s or task %s doesn\'t exist'), jobId, taskId));
      } else {
        if (err.statusCode === 404) {
          throw new Error(util.format($('File %s doesn\'t exist'), fileName));
        }
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

    batchShowUtil.showFile(properties, cli.output);
  }

  /**
  * List files from batch compute nodes
  * @param {string} [poolId] pool id
  * @param {string} [nodeId] node id
  * @param {object} options command line options
  * @param {callback} _ callback function
  */
  function listNodeFile(poolId, nodeId, options, _) {
    if (!poolId) {
      poolId = options.id;
    }
    poolId = interaction.promptIfNotGiven($('Pool id: '), poolId, _);
    if (!nodeId) {
      nodeId = options.nodeId;
    }
    nodeId = interaction.promptIfNotGiven($('Node id: '), nodeId, _);

    var client = batchUtil.createBatchServiceClient(options);
    var tips = $('Listing node files');
    var batchOptions = {};
    batchOptions.fileListFromComputeNodeOptions = batchUtil.getBatchOperationDefaultOption();
    if (options.recursive) {
      batchOptions.recursive = true;
    }

    if (options.filterClause) {
      batchOptions.fileListFromComputeNodeOptions.filter = options.filterClause;
    }

    var files = [];
    startProgress(tips);

    try {
      var result = client.file.listFromComputeNode(poolId, nodeId, batchOptions, _);
      result.forEach(function (file) {
        files.push(file);
      });
      var nextLink = result.odatanextLink;

      while (nextLink) {
        batchOptions.fileListFromComputeNodeOptions = batchUtil.getBatchOperationDefaultOption();
        result = client.file.listFromComputeNodeNext(nextLink, batchOptions, _);
        result.forEach(function (file) {
          files.push(file);
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

    cli.interaction.formatOutput(files, function (outputData) {
      var UTCFormat = 'YYYY-MM-DDTHH:MI:SSZ';
      if (outputData.length === 0) {
        logger.info($('No file found'));
      } else {
        logger.table(outputData, function(row, item) {
          row.cell($('Name'), item.name);
          row.cell($('Is Directory'), item.isDirectory);
          if (item.properties) {
            row.cell($('Content Length'), item.properties.contentLength);
            if (item.properties.creationTime) {
              row.cell($('Creation Time'), item.properties.creationTime.toUTCFormat(UTCFormat));
            }
          }
        });
      }
    });
  }

  /**
   * List files from batch compute nodes
   * @param {string} [jobId] job Id
   * @param {string} [taskId] node id
   * @param {object} options command line options
   * @param {callback} _ callback function
   */
  function listTaskFile(jobId, taskId, options, _) {
    if (!jobId) {
      jobId = options.jobId;
    }
    jobId = interaction.promptIfNotGiven($('Job Id: '), jobId, _);
    if (!taskId) {
      taskId = options.taskId;
    }
    taskId = interaction.promptIfNotGiven($('Task Id: '), taskId, _);

    var client = batchUtil.createBatchServiceClient(options);
    var tips = $('Listing task files');
    var batchOptions = {};
    batchOptions.fileListFromTaskOptions = batchUtil.getBatchOperationDefaultOption();
    if (options.recursive) {
      batchOptions.recursive = true;
    }

    if (options.filterClause) {
      batchOptions.fileListFromTaskOptions.filter = options.filterClause;
    }

    var files = [];
    startProgress(tips);

    try {
      var result = client.file.listFromTask(jobId, taskId, batchOptions, _);
      result.forEach(function (file) {
        files.push(file);
      });
      var nextLink = result.odatanextLink;

      while (nextLink) {
        batchOptions.fileListFromTaskOptions = batchUtil.getBatchOperationDefaultOption();
        result = client.file.fileListFromTaskOptions(nextLink, batchOptions, _);
        result.forEach(function (file) {
          files.push(file);
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

    cli.interaction.formatOutput(files, function (outputData) {
      var UTCFormat = 'YYYY-MM-DDTHH:MI:SSZ';
      if (outputData.length === 0) {
        logger.info($('No file found'));
      } else {
        logger.table(outputData, function(row, item) {
          row.cell($('Name'), item.name);
          row.cell($('Is Directory'), item.isDirectory);
          if (item.properties) {
            row.cell($('Content Length'), item.properties.contentLength);
            if (item.properties.creationTime) {
              row.cell($('Creation Time'), item.properties.creationTime.toUTCFormat(UTCFormat));
            }
          }
        });
      }
    });
  }

  /**
   * Download the specified file from batch compute node
   * @param {string} [poolId] pool id
   * @param {string} [nodeId] node id
   * @param {string} [fileName] the name of the file to download
   * @param {string} [destination] the destination file path or name
   * @param {object} options command line options
   * @param {callback} _ callback function
   */
  function getNodeFile(poolId, nodeId, fileName, destination, options, _) {
    if (!poolId) {
      poolId = options.id;
    }
    poolId = interaction.promptIfNotGiven($('Pool id: '), poolId, _);
    if (!nodeId) {
      nodeId = options.nodeId;
    }
    nodeId = interaction.promptIfNotGiven($('Node id: '), nodeId, _);
    if (!fileName) {
      fileName = options.fileName;
    }
    fileName = interaction.promptIfNotGiven($('File name: '), fileName, _);
    if (!destination) {
      destination = options.destination;
    }

    var force = !!options.quiet;
    var localFileName = StorageUtil.normalizePath(fileName);
    var result = StorageUtil.fetchBasenameAndDirname(localFileName);
    var directory = result.dirname;
    var file = result.basename;
    logger.verbose(directory);
    logger.verbose(file);

    if (destination) {
      var stat;
      try {
        stat = fs.stat(destination, _);
        if (stat.isDirectory()) {

          // If destination is an existing directory, join the remote file
          // name to build up the destination file.
          destination = pathUtil.join(destination, file);
        }
      } catch (err) {
        if (!StorageUtil.isFileNotFoundException(err)) {
          throw err;
        }
      }
    } else {
      destination = pathUtil.join('.', file);
    }

    if (utils.fileExists(destination, _)) {
      if (force !== true) {
        force = interaction.confirm(util.format($('Do you want to overwrite file %s? '), destination), _);
        if (force !== true) {
          return;
        }
      }
    }

    var client = batchUtil.createBatchServiceClient(options);
    var tips = util.format($('Downloading file %s'), fileName);
    var batchOptions = {};
    batchOptions.fileGetFromComputeNodeOptions = batchUtil.getBatchOperationDefaultOption();

    if (options.ifModifiedSince) {
      batchOptions.fileGetFromComputeNodeOptions.ifModifiedSince = options.ifModifiedSince;
    }
    if (options.ifUnmodifiedSince) {
      batchOptions.fileGetFromComputeNodeOptions.ifUnmodifiedSince = options.ifUnmodifiedSince;
    }
    if (options.range) {
      batchOptions.fileGetFromComputeNodeOptions.ocpRange = options.range;
    }

    startProgress(tips);

    try {
      stream = client.file.getFromComputeNode(poolId, nodeId, fileName, batchOptions, _);
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
    var fd = fs.openSync(destination, 'w');
    var data;
    var cur = 0;
    do {
      data = reader.read(_, 10000);
      if (data !== null) {
        fs.write(fd, data, 0, data.length, cur, _);
        cur += data.length;
      }
    } while (data !== null);
    fs.close(fd);

    logger.info(util.format($('File %s has been saved to %s successfully'), fileName, destination));
  }

  /**
   * Download the specified file from batch task
   * @param {string} [jobId] job Id
   * @param {string} [taskId] node id
   * @param {string} [fileName] the name of the file to download
   * @param {string} [destination] the destination file path or name
   * @param {object} options command line options
   * @param {callback} _ callback function
   */
  function getTaskFile(jobId, taskId, fileName, destination, options, _) {
    if (!jobId) {
      jobId = options.jobId;
    }
    jobId = interaction.promptIfNotGiven($('Job id: '), jobId, _);
    if (!taskId) {
      taskId = options.taskId;
    }
    taskId = interaction.promptIfNotGiven($('Task id: '), taskId, _);
    if (!fileName) {
      fileName = options.fileName;
    }
    fileName = interaction.promptIfNotGiven($('File name: '), fileName, _);
    if (!destination) {
      destination = options.destination;
    }

    var force = !!options.quiet;
    var localFileName = StorageUtil.normalizePath(fileName);
    var result = StorageUtil.fetchBasenameAndDirname(localFileName);
    var directory = result.dirname;
    var file = result.basename;
    logger.verbose(directory);
    logger.verbose(file);

    if (destination) {
      var stat;
      try {
        stat = fs.stat(destination, _);
        if (stat.isDirectory()) {

          // If destination is an existing directory, join the remote file
          // name to build up the destination file.
          destination = pathUtil.join(destination, file);
        }
      } catch (err) {
        if (!StorageUtil.isFileNotFoundException(err)) {
          throw err;
        }
      }
    } else {
      destination = pathUtil.join('.', file);
    }

    if (utils.fileExists(destination, _)) {
      if (force !== true) {
        force = interaction.confirm(util.format($('Do you want to overwrite file %s? '), destination), _);
        if (force !== true) {
          return;
        }
      }
    }

    var client = batchUtil.createBatchServiceClient(options);
    var tips = util.format($('Downloading file %s'), fileName);
    var batchOptions = {};
    batchOptions.fileGetFromTaskOptions = batchUtil.getBatchOperationDefaultOption();

    if (options.ifModifiedSince) {
      batchOptions.fileGetFromTaskOptions.ifModifiedSince = options.ifModifiedSince;
    }
    if (options.ifUnmodifiedSince) {
      batchOptions.fileGetFromTaskOptions.ifUnmodifiedSince = options.ifUnmodifiedSince;
    }
    if (options.range) {
      batchOptions.fileGetFromTaskOptions.ocpRange = options.range;
    }

    startProgress(tips);

    try {
      stream = client.file.getFromTask(jobId, taskId, fileName, batchOptions, _);
    } catch (err) {
      if (batchUtil.isNotFoundException(err)) {
        throw new Error(util.format($('Job %s or task %s doesn\'t exist'), jobId, taskId));
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
    var fd = fs.openSync(destination, 'w');
    var data;
    var cur = 0;
    do {
      data = reader.read(_, 10000);
      if (data !== null) {
        fs.write(fd, data, 0, data.length, cur, _);
        cur += data.length;
      }
    } while (data !== null);
    fs.close(fd);

    logger.info(util.format($('File %s has been saved to %s successfully'), fileName, destination));
  }
};
