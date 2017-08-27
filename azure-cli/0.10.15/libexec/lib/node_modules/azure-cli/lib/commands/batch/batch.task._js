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

var fs = require('fs');
var util = require('util');
var batchUtil = require('./batch.util');
var batchShowUtil = require('./batch.showUtil');
var utils = require('../../util/utils');
var startProgress = batchUtil.startProgress;
var endProgress = batchUtil.endProgress;

var $ = utils.getLocaleString;

/**
* Init batch task command
*/
exports.init = function(cli) {
  
  //Init batchUtil
  batchUtil.init(cli);

  /**
  * Define batch task command usage
  */
  var batch = cli.category('batch');

  var task = batch.category('task').description($('Commands to manage your Batch tasks'));

  var logger = cli.output;

  var interaction = cli.interaction;

  task.command('create [jobId] [json-file]')
    .description($('Create a Batch task'))
    .option('-j, --job-id <jobId>', $('the id of the job to which the task is to be added'))
    .option('-f, --json-file <json-file>', $('the file containing either a single task object or an array of task objects in JSON format, if this parameter is specified, --id and --command-line parameters are ignored'))
    .option('-i, --id <taskId>', $('the Batch task id'))
    .option('-c, --command-line <command-line>', $('the command line of the task'))
    .option('--affinity-id <affinity-id>', $('the opaque string representing the location of compute node or a task that has run previously'))
    .option('--max-wall-clock-time <max-wall-clock-time>', $('the maximum elapsed time that the task may run, measured from the time the task starts, in ISO 8601 duration formation'))
    .option('--max-task-retry-count <max-task-retry-count>', $('the maximum number of times the task may be retried'))
    .option('--retention-time <retention-time>', $('the time in which the working directory for the task is retained, in ISO 8601 duration formation'))
    .option('-e, --environment-settings <environment-settings>', $('the semicolon separated list of environment variable settings for the task, ex: name1=value1;name2=value2'))
    .option('-r, --resources-files <resources-files>', $('the semicolon separated list of files that Batch will download to the compute node before running the command line, ex: blob1=file1;blob2=file2'))
    .appendBatchAccountOption()
    .execute(createTask);

  task.command('list [jobId]')
    .description($('List Batch tasks under a job'))
    .option('-j, --job-id <jobId>', $('the id of the job from which you want to get a list of tasks'))
    .appendODataFilterOption(true, true, true)
    .appendBatchAccountOption()
    .execute(listTasks);
  
  task.command('show [jobId] [taskId]')
    .description($('Show information on the specified Batch task'))
    .option('-j, --job-id <jobId>', $('the Batch job id'))
    .option('-i, --id <taskId>', $('the Batch task id'))
    .option('--subtasks', $('display information about the subtasks of a multi-instance task'))
    .appendODataFilterOption(true, false, true)
    .appendCommonHeaderFilterOption(true, true)
    .appendBatchAccountOption()
    .execute(showTask);

  task.command('delete [jobId] [taskId]')
    .description($('Delete the specified Batch task'))
    .option('-j, --job-id <jobId>', $('the Batch job id'))
    .option('-i, --id <taskId>', $('the Batch task id'))
    .option('-q, --quiet', $('remove the specified Batch task without confirmation'))
    .appendCommonHeaderFilterOption(true, true)
    .appendBatchAccountOption()
    .execute(deleteTask);

  task.command('set [jobId] [taskId]')
    .description($('Update the properties of the specified Batch task'))
    .option('-j, --job-id <jobId>', $('the Batch job id'))
    .option('-i, --id <taskId>', $('the Batch task id'))
    .option('--max-wall-clock-time <max-wall-clock-time>', $('the maximum elapsed time that the task may run, measured from the time the task starts, in ISO 8601 duration formation'))
    .option('--max-task-retry-count <max-task-retry-count>', $('the maximum number of times the task may be retried'))
    .option('--retention-time <retention-time>', $('the time in which the working directory for the task is retained, in ISO 8601 duration formation'))
    .appendCommonHeaderFilterOption(true, true)
    .appendBatchAccountOption()
    .execute(updateTask);

  task.command('stop [jobId] [taskId]')
    .description($('Terminate the specified Batch task'))
    .option('-j, --job-id <jobId>', $('the Batch job id'))
    .option('-i, --id <taskId>', $('the Batch task id'))
    .option('-q, --quiet', $('terminate the specified Batch task without confirmation'))
    .appendCommonHeaderFilterOption(true, true)
    .appendBatchAccountOption()
    .execute(terminateTask);

  task.command('reactivate [jobId] [taskId]')
    .description($('Reactivate the specified Batch task'))
    .option('-j, --job-id <jobId>', $('the Batch job id'))
    .option('-i, --id <taskId>', $('the Batch task id'))
    .appendCommonHeaderFilterOption(true, true)
    .appendBatchAccountOption()
    .execute(reactivateTask);

  /**
  * Implement batch task cli
  */

  /**
  * Create a batch task
  * @param {string} [jobId] the id of the job to which the task is to be added
  * @param {string} [jsonFile] the file containing the single task or multiple tasks to create in JSON format
  * @param {object} options command line options
  * @param {callback} _ callback function
  */
  function createTask(jobId, jsonFile, options, _) {
    if (!jobId) {
      jobId = options.jobId;
    }
    jobId = interaction.promptIfNotGiven($('Job id: '), jobId, _);
    if (!jsonFile) {
      jsonFile = options.jsonFile;
    }

    var parsedJson = null;
    var multiTasks = false;
    var addTask = null;
    var client = batchUtil.createBatchServiceClient(options);
    var resultMapper;

    if (!jsonFile) {    
      if (!options.id) {
        jsonFile = interaction.promptIfNotGiven($('JSON file name: '), jsonFile, _);
      } else {
        parsedJson = { 'id' : options.id };
        var commandLine = options.commandLine;
        if (!commandLine) {
          commandLine = cli.interaction.promptIfNotGiven($('Command Line: '), commandLine, _);
        }
        __.extend(parsedJson, { 'commandLine' : commandLine });
        
        if (options.affinityId) {
          __.extend(parsedJson, { 'affinityInfo' : { 'affinityId': options.affinityId } });
        }
        
        var constraint = {};
        if (options.maxWallClockTime) {
          __.extend(constraint, { 'maxWallClockTime' : options.maxWallClockTime });
        }
        if (options.maxTaskRetryCount) {
          __.extend(constraint, { 'maxTaskRetryCount' : Number(options.maxTaskRetryCount) });
        } 
        if (options.retentionTime) {
          __.extend(constraint, { 'retentionTime' : options.retentionTime });
        }
        if (!__.isEmpty(constraint))
        {
          __.extend(parsedJson, {'constraints' : constraint}); 
        }
        
        var ref;
        if (options.environmentSettings) {
          ref = [];
          options.environmentSettings.split(';').forEach(function(entry) {
            var item = entry.split('=');
            ref.push({ 'name' : item[0], 'value' : item[1] });
          });
          __.extend(parsedJson, { 'environmentSettings' : ref });
        }
        if (options.resourcesFiles) {
          ref = [];
          options.resourcesFiles.split(';').forEach(function(entry) {
            var item = entry.split('=');
            ref.push({ 'blobSource' : item[0], 'filePath' : item[1] });
          });
          __.extend(parsedJson, { 'resourceFiles' : ref });
        }

        resultMapper = new client.models['TaskAddParameter']().mapper();
        addTask = client.deserialize(resultMapper, parsedJson, 'result');
      }
    }
        
    if (jsonFile) {
      var objJson = fs.readFileSync(jsonFile).toString();
      parsedJson = JSON.parse(objJson);

      resultMapper = new client.models['TaskAddParameter']().mapper();
      addTask = client.deserialize(resultMapper, parsedJson, 'result');
      if (!addTask || Object.keys(addTask).length === 0 ) {
        if (parsedJson.length > 100) {
          throw new Error($('Too many tasks specified. The maximum number of tasks that can be added in a single request is 100.'));
        }
        if (parsedJson.length === 0) {
          throw new Error($('Invalid json file.'));
        }
        addTask = [];
        parsedJson.forEach(function(entry) {
          addTask.push(client.deserialize(resultMapper, entry, 'result'));
        });
        multiTasks = true;
      }
    }
    
    var tips = $('Creating Batch task');
    var batchOptions = {};

    startProgress(tips);
    
    if (multiTasks) {
      batchOptions.taskAddCollectionOptions = batchUtil.getBatchOperationDefaultOption();
      
      var result = null;
      try {
        result = client.task.addCollection(jobId, addTask, batchOptions, _);
      } catch (err) {
        if (err.message) {
          if (typeof err.message === 'object') {
            err.message = err.message.value;
          }
        }

        throw err;
      }
      finally {
        endProgress();
      }

      cli.interaction.formatOutput(result.value, function (outputData) {
        if (outputData.length === 0) {
          logger.info($('No task creation result found'));
        } else {
          logger.table(outputData, function(row, item) {
            row.cell($('Task Id'), item.taskId);
            row.cell($('Status'), item.status);
            row.cell($('Error'), item.error ? item.error.code : '');
          });
        }
      });
    } else {
      batchOptions.taskAddOptions = batchUtil.getBatchOperationDefaultOption();
      
      try {
        client.task.add(jobId, addTask, batchOptions, _);
      } catch (err) {
        if (err.message) {
          if (typeof err.message === 'object') {
            err.message = err.message.value;
          }
        }

        throw err;
      }
      finally {
        endProgress();
      }

      logger.verbose(util.format($('Task %s has been created successfully'), addTask.id));
      showTask(jobId, addTask.id, options, _);
    }
  }

  /**
  * Show the details of the specified Batch task
  * @param {string} [jobId] job id
  * @param {string} [taskId] task id
  * @param {object} options command line options
  * @param {callback} _ callback function
  */
  function showTask(jobId, taskId, options, _) {
    var client = batchUtil.createBatchServiceClient(options);
    if (!jobId) {
      jobId = options.jobId;
    }
    jobId = interaction.promptIfNotGiven($('Job id: '), jobId, _);
    if (!taskId) {
      taskId = options.id;
    }
    taskId = interaction.promptIfNotGiven($('Task id: '), taskId, _);
    var tips = $('Getting Batch task information');

    var batchOptions = {};
    batchOptions.taskGetOptions = batchUtil.getBatchOperationDefaultOption();

    if (options.selectClause) {
      batchOptions.taskGetOptions.select = options.selectClause;
    }
    if (options.expandClause) {
      batchOptions.taskGetOptions.expand = options.expandClause;
    }

    var batchSubtaskOptions = {};
    batchSubtaskOptions.taskListSubtasksOptions = batchUtil.getBatchOperationDefaultOption();

    if (options.selectClause) {
      batchSubtaskOptions.taskGetOptions.select = options.selectClause;
    }

    var task = null;
    var subTasks = null;

    startProgress(tips);
    try {
      task = client.task.get(jobId, taskId, batchOptions, _);
      if (options.subtasks) {
        subTasks = client.task.listSubtasks(jobId, taskId, batchSubtaskOptions, _);
      }
    } catch (e) {
      if (batchUtil.isNotFoundException(e)) {
        throw new Error(util.format($('Task %s does not exist'), taskId));
      } else {
        if (e.message) {
          if (typeof e.message === 'object') {
            e.message = e.message.value;
          }
        }
        
        throw e;
      }
    } finally {
      endProgress();
    }
    
    batchShowUtil.showCloudTask(task, subTasks, cli.output);
  }

  /**
  * List batch tasks under a job
  * @param {string} [jobId] job id
  * @param {object} options command line options
  * @param {callback} _ callback function
  */
  function listTasks(jobId, options, _) {
    var client = batchUtil.createBatchServiceClient(options);
    if (!jobId) {
      jobId = options.jobId;
    }
    jobId = interaction.promptIfNotGiven($('Job id: '), jobId, _);
    var tips = $('Listing Batch tasks');
    var batchOptions = {};
    batchOptions.taskListOptions = batchUtil.getBatchOperationDefaultOption();

    if (options.selectClause) {
      batchOptions.taskListOptions.select = options.selectClause;
    }
    if (options.expandClause) {
      batchOptions.taskListOptions.expand = options.expandClause;
    }
    if (options.filterClause) {
      batchOptions.taskListOptions.filter = options.filterClause;
    }

    var tasks = [];
    startProgress(tips);

    try {
      result = client.task.list(jobId, batchOptions, _);
      result.forEach(function (task) {
        tasks.push(task);
      });
      var nextLink = result.odatanextLink;
            
      while (nextLink) {
        batchOptions = batchUtil.getBatchOperationDefaultOption();
        options.taskListOptions = batchOptions;
        result = client.task.listNext(nextLink, batchOptions, _);
        result.forEach(function (task) {
          tasks.push(task);
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

    cli.interaction.formatOutput(tasks, function (outputData) {
      if (outputData.length === 0) {
        logger.info($('No task found'));
      } else {
        logger.table(outputData, function(row, item) {
          row.cell($('Id'), item.id);
          row.cell($('State'), item.state);
          row.cell($('Command Line'), item.commandLine);
        });
      }
    });
  }

  /**
  * Delete the specified batch task
  * @param {string} [jobId] job Id
  * @param {string} [taskId] task Id
  * @param {object} options command line options
  * @param {callback} _ callback function
  */
  function deleteTask(jobId, taskId, options, _) {
    var client = batchUtil.createBatchServiceClient(options);
    if (!jobId) {
      jobId = options.id;
    }
    jobId = interaction.promptIfNotGiven($('Job id: '), jobId, _);
    if (!taskId) {
      taskId = options.id;
    }
    taskId = interaction.promptIfNotGiven($('Task id: '), taskId, _);
    var tips = util.format($('Deleting task %s'), taskId);
    var batchOptions = {};
    batchOptions.taskDeleteMethodOptions = batchUtil.getBatchOperationDefaultOption();

    if (options.ifMatch) {
      batchOptions.taskDeleteMethodOptions.ifMatch = options.ifMatch;
    }
    if (options.ifNoneMatch) {
      batchOptions.taskDeleteMethodOptions.ifNoneMatch = options.ifNoneMatch;
    }
    if (options.ifModifiedSince) {
      batchOptions.taskDeleteMethodOptions.ifModifiedSince = options.ifModifiedSince;
    }
    if (options.ifUnmodifiedSince) {
      batchOptions.taskDeleteMethodOptions.ifUnmodifiedSince = options.ifUnmodifiedSince;
    }

    if (!options.quiet) {
      if (!interaction.confirm(util.format($('Do you want to delete task %s? [y/n]: '), taskId), _)) {
        return;
      }
    }
    
    startProgress(tips);

    try {
      client.task.deleteMethod(jobId, taskId, batchOptions, _);
    } catch (err) {
      if (batchUtil.isNotFoundException(err)) {
        throw new Error(util.format($('Task %s does not exist'), taskId));
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

    logger.info(util.format($('Task %s has been deleted successfully'), taskId));
  }

  /**
  * Terminate the specified batch task
  * @param {string} [jobId] job Id
  * @param {string} [taskId] task Id
  * @param {object} options command line options
  * @param {callback} _ callback function
  */
  function terminateTask(jobId, taskId, options, _) {
    var client = batchUtil.createBatchServiceClient(options);
    if (!jobId) {
      jobId = options.id;
    }
    jobId = interaction.promptIfNotGiven($('Job id: '), jobId, _);
    if (!taskId) {
      taskId = options.id;
    }
    taskId = interaction.promptIfNotGiven($('Task id: '), taskId, _);
    var tips = util.format($('Terminating task %s'), taskId);
    var batchOptions = {};
    batchOptions.taskTerminateOptions = batchUtil.getBatchOperationDefaultOption();

    if (options.ifMatch) {
      batchOptions.taskTerminateOptions.ifMatch = options.ifMatch;
    }
    if (options.ifNoneMatch) {
      batchOptions.taskTerminateOptions.ifNoneMatch = options.ifNoneMatch;
    }
    if (options.ifModifiedSince) {
      batchOptions.taskTerminateOptions.ifModifiedSince = options.ifModifiedSince;
    }
    if (options.ifUnmodifiedSince) {
      batchOptions.taskTerminateOptions.ifUnmodifiedSince = options.ifUnmodifiedSince;
    }

    if (!options.quiet) {
      if (!interaction.confirm(util.format($('Do you want to terminate task %s? [y/n]: '), taskId), _)) {
        return;
      }
    }
    
    startProgress(tips);

    try {
      client.task.terminate(jobId, taskId, batchOptions, _);
    } catch (err) {
      if (batchUtil.isNotFoundException(err)) {
        throw new Error(util.format($('Task %s does not exist'), taskId));
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

    logger.info(util.format($('Task %s has been terminated successfully'), taskId));
  }

  /**
  * Reactivate the specified batch task
  * @param {string} [jobId] job Id
  * @param {string} [taskId] task Id
  * @param {object} options command line options
  * @param {callback} _ callback function
  */
  function reactivateTask(jobId, taskId, options, _) {
    var client = batchUtil.createBatchServiceClient(options);
    if (!jobId) {
      jobId = options.id;
    }
    jobId = interaction.promptIfNotGiven($('Job id: '), jobId, _);
    if (!taskId) {
      taskId = options.id;
    }
    taskId = interaction.promptIfNotGiven($('Task id: '), taskId, _);
    var tips = util.format($('Reactivating task %s'), taskId);
    var batchOptions = {};
    batchOptions.taskReactivateOptions = batchUtil.getBatchOperationDefaultOption();

    if (options.ifMatch) {
      batchOptions.taskReactivateOptions.ifMatch = options.ifMatch;
    }
    if (options.ifNoneMatch) {
      batchOptions.taskReactivateOptions.ifNoneMatch = options.ifNoneMatch;
    }
    if (options.ifModifiedSince) {
      batchOptions.taskReactivateOptions.ifModifiedSince = options.ifModifiedSince;
    }
    if (options.ifUnmodifiedSince) {
      batchOptions.taskReactivateOptions.ifUnmodifiedSince = options.ifUnmodifiedSince;
    }

    startProgress(tips);

    try {
      client.task.reactivate(jobId, taskId, batchOptions, _);
    } catch (err) {
      if (batchUtil.isNotFoundException(err)) {
        throw new Error(util.format($('Task %s does not exist'), taskId));
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

    logger.info(util.format($('Task %s has been reactivated successfully'), taskId));
  }

  /**
   * Update the specified batch task
   * @param {string} [jobId] job Id
   * @param {string} [taskId] task Id
   * @param {string} [jsonFile] file containing the task properties to update in JSON format
   * @param {object} options command line options
   * @param {callback} _ callback function
   */
  function updateTask(jobId, taskId, jsonFile, options, _) {
    if (!jobId) {
      jobId = options.jobId;
    }
    jobId = interaction.promptIfNotGiven($('Job id: '), jobId, _);
    if (!taskId) {
      taskId = options.id;
    }
    taskId = interaction.promptIfNotGiven($('Task id: '), taskId, _);

    if (!options.maxWallClockTime && !options.maxTaskRetryCount && !options.retentionTime) {
      throw new Error($('You must specify at least one of the following: --max-wall-clock-time, --max-task-retry-count and --retention-time.'));
    }
    var constraint = {};
    if (options.maxWallClockTime) {
      __.extend(constraint, { 'maxWallClockTime' : options.maxWallClockTime });
    }
    if (options.maxTaskRetryCount) {
      __.extend(constraint, { 'maxTaskRetryCount' : Number(options.maxTaskRetryCount) });
    } 
    if (options.retentionTime) {
      __.extend(constraint, { 'retentionTime' : options.retentionTime });
    } 

    var client = batchUtil.createBatchServiceClient(options);
    var resultMapper = new client.models['TaskUpdateParameter']().mapper();
    var updateTaskParam = client.deserialize(resultMapper, { 'constraints' : constraint }, 'result');

    var tips = util.format($('Updating task %s'), taskId);

    var batchOptions = {};
    batchOptions.taskUpdateOptions = batchUtil.getBatchOperationDefaultOption();
    // For the update task call, the constraints property from the TaskUpdateParameter has to 
    // be copied over to the TaskUpdateOptions.
    batchOptions.constraints = updateTaskParam.constraints;

    if (options.ifMatch) {
      batchOptions.taskUpdateOptions.ifMatch = options.ifMatch;
    }
    if (options.ifNoneMatch) {
      batchOptions.taskUpdateOptions.ifNoneMatch = options.ifNoneMatch;
    }
    if (options.ifModifiedSince) {
      batchOptions.taskUpdateOptions.ifModifiedSince = options.ifModifiedSince;
    }
    if (options.ifUnmodifiedSince) {
      batchOptions.taskUpdateOptions.ifUnmodifiedSince = options.ifUnmodifiedSince;
    }

    startProgress(tips);

    try {
      client.task.update(jobId, taskId, batchOptions, _);
    } catch (err) {
      if (batchUtil.isNotFoundException(err)) {
        throw new Error(util.format($('Task %s does not exist'), taskId));
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

    logger.verbose(util.format($('Task %s has been updated successfully'), taskId));
    showTask(jobId, taskId, options, _);
  }
};