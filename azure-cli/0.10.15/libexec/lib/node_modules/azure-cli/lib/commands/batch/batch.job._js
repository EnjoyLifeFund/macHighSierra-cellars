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
* Init batch job command
*/
exports.init = function(cli) {
  
  //Init batchUtil
  batchUtil.init(cli);

  /**
  * Define batch job command usage
  */
  var batch = cli.category('batch');

  var job = batch.category('job').description($('Commands to manage your Batch jobs'));

  var jobPrepAndReleaseStatus = job.category('prep-release-status')
    .description($('Commands to manage the status of your job preparation and release tasks'));

  var logger = cli.output;

  var interaction = cli.interaction;

  job.command('create [json-file]')
    .description($('Adds a job to the specified account'))
    .option('-f, --json-file <json-file>', $('the file containing the job object to create in JSON format; if this parameter is specified, all other job parameters are ignored.'))
    .option('-i, --id <jobId>', $('the Batch job id'))
    .option('-p, --pool-id <poolId>', $('the id of an existing pool; all the tasks of the job will run on the specified pool'))
    .option('--metadata <--metadata>', $('the semicolon separated list of name-value pairs associated with the job as metadata, ex: name1=value1;name2=value2'))
    .option('--priority <priority>', $('the priority of the job, ranging from -1000 to 1000, with -1000 being the lowest priority and 1000 being the highest priority; the default value is 0.'))
    .option('--max-wall-clock-time <max-wall-clock-time>', $('the maximum elapsed time that a job may run, in ISO 8601 duration formation'))
    .option('--max-task-retry-count <max-task-retry-count>', $('the maximum number of times each task may be retried'))
    .appendBatchAccountOption()
    .execute(createJob);

  job.command('list')
    .description($('Lists all of the jobs in the specified account'))
    .option('-i, --job-schedule-id [jobScheduleId]', $('the id of the job schedule from which you want to get a list of jobs'))
    .appendODataFilterOption(true, true, true)
    .appendBatchAccountOption()
    .execute(listJobs);
  
  job.command('show [jobId]')
    .description($('Show information about the specified job'))
    .option('-i, --id <jobId>', $('the id of the job'))
    .appendODataFilterOption(true, false, true)
    .appendBatchAccountOption()
    .execute(showJob);

  job.command('delete [jobId]')
    .description($('Delete the specified job'))
    .option('-i, --id <jobId>', $('the id of the job to delete'))
    .option('-q, --quiet', $('remove the specified job without confirmation'))
    .appendCommonHeaderFilterOption(true, true)
    .appendBatchAccountOption()
    .execute(deleteJob);

  job.command('set [jobId] [json-file]')
    .description($('Patch/Update the properties of a job'))
    .option('-i, --id <jobId>', $('the id of the job whose properties you want to patch/update'))
    .option('-p, --pool-id <poolId>', $('the id of an existing pool; all the tasks of the job will run on the specified pool'))
    .option('--metadata <metadata>', $('the semicolon separated list of name-value pairs associated with the job as metadata, ex: name1=value1;name2=value2'))
    .option('--priority <priority>', $('the priority of the job, ranging from -1000 to 1000, with -1000 being the lowest priority and 1000 being the highest priority; the default value is 0.'))
    .option('--max-wall-clock-time <max-wall-clock-time>', $('the maximum elapsed time that a job may run, in ISO 8601 duration format'))
    .option('--max-task-retry-count <max-task-retry-count>', $('the maximum number of times each task may be retried'))
    .option('-f, --json-file <json-file>', $('the file containing the job properties to patch/update in JSON format; if this parameter is specified, all other job parameters are ignored.'))
    .option('-r, --replace', $('uses update instead of patch'))
    .appendCommonHeaderFilterOption(true, true)
    .appendBatchAccountOption()
    .execute(updateJob);

  job.command('enable <jobId>')
    .description($('Enables the specified job, allowing new tasks to run'))
    .appendCommonHeaderFilterOption(true, true)
    .appendBatchAccountOption()
    .execute(enableJob);

  job.command('disable <jobId>')
    .description($('Disables the specified job.  Disabled jobs do not run new tasks, but may be re-enabled later.'))
    .option('-o, --disable-option <disableOption>', $('specifies what to do with active tasks during a disable job operation, available options include "requeue", "terminate", and "wait"'))
    .appendCommonHeaderFilterOption(true, true)
    .appendBatchAccountOption()
    .execute(disableJob);

  job.command('stop <jobId>')
    .description($('Terminates the specified job, marking it as completed'))
    .option('-r, --reason [reason]', $('the text you want to appear as the job\'s terminate reason'))
    .appendCommonHeaderFilterOption(true, true)
    .appendBatchAccountOption()
    .execute(terminateJob);

  jobPrepAndReleaseStatus.command('list <jobId>')
    .description($('Lists the execution status of the job preparation and job release task for the specified job across the compute nodes where the job has run'))
    .appendODataFilterOption(true, true, false)
    .appendBatchAccountOption()
    .execute(listJobPrepAndReleaseTaskStatus);

  /**
  * Implement batch job cli
  */

  /**
  * Create a batch job
  * @param {string} [jsonFile] the file containing the job to create in JSON format
  * @param {object} options command line options
  * @param {callback} _ callback function
  */
  function createJob(jsonFile, options, _) {
    if (!jsonFile) {
      jsonFile = options.jsonFile;
    }
    var parsedJson = {};

    if (!jsonFile) {
      if (!options.id) {
        jsonFile = interaction.promptIfNotGiven($('JSON file name: '), jsonFile, _);
      } else {
        parsedJson = { 'id' : options.id };
        
        var poolId = options.poolId;
        if (!poolId) {
          poolId = cli.interaction.promptIfNotGiven($('Pool id: '), poolId, _);
        }
        __.extend(parsedJson, { 'poolInfo' : { 'poolId' : poolId } });

        if (options.priority) {
          __.extend(parsedJson, { 'priority' : Number(options.priority) });
        }

        var constraintsJson = {};
        if (options.maxWallClockTime) {
          __.extend(constraintsJson, { 'maxWallClockTime' : options.maxWallClockTime });
        }

        if (options.maxTaskRetryCount) {
          __.extend(constraintsJson, { 'maxTaskRetryCount' : Number(options.maxTaskRetryCount) });
        }

        __.extend(parsedJson, { 'constraints' : constraintsJson });

        if (options.metadata) {
          ref = [];
          options.metadata.split(';').forEach(function(entry) {
            var item = entry.split('=');
            ref.push({ 'name' : item[0], 'value' : item[1] });
          });
          __.extend(parsedJson, { 'metadata' : ref });
        }
      }
    }

    if (jsonFile) {
      var objJson = fs.readFileSync(jsonFile).toString();
      parsedJson = JSON.parse(objJson);
    }

    var client = batchUtil.createBatchServiceClient(options);

    var addJob = null;
    if (parsedJson !== null && parsedJson !== undefined) {
      var resultMapper = new client.models['JobAddParameter']().mapper();
      addJob = client.deserialize(resultMapper, parsedJson, 'result');
    }

    var tips = $('Creating Batch job');
    var batchOptions = {};
    batchOptions.jobAddOptions = batchUtil.getBatchOperationDefaultOption();

    startProgress(tips);
    try {
      client.job.add(addJob, batchOptions, _);
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

    logger.verbose(util.format($('Job %s has been created successfully'), addJob.id));
    showJob(addJob.id, options, _);
  }

  /**
  * Show the details of the specified Batch job
  * @param {string} [jobId] job id
  * @param {object} options command line options
  * @param {callback} _ callback function
  */
  function showJob(jobId, options, _) {
    var client = batchUtil.createBatchServiceClient(options);
    if (!jobId) {
      jobId = options.id;
    }
    jobId = interaction.promptIfNotGiven($('Job id: '), jobId, _);
    var tips = $('Getting Batch job information');

    var batchOptions = {};
    batchOptions.jobGetOptions = batchUtil.getBatchOperationDefaultOption();

    if (options.selectClause) {
      batchOptions.jobGetOptions.select = options.selectClause;
    }
    if (options.expandClause) {
      batchOptions.jobGetOptions.expand = options.expandClause;
    }

    var job = null;

    startProgress(tips);
    try {
      job = client.job.get(jobId, batchOptions, _);
    } catch (e) {
      if (batchUtil.isNotFoundException(e)) {
        throw new Error(util.format($('Job %s does not exist'), jobId));
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
    
    batchShowUtil.showCloudJob(job, cli.output);
  }

  /**
  * List batch jobs
  * @param {object} options command line options
  * @param {callback} _ callback function
  */
  function listJobs(options, _) {
    var client = batchUtil.createBatchServiceClient(options);
    var tips = $('Listing Batch jobs');
    var batchOptions = {};

    var jobOptions = batchUtil.getBatchOperationDefaultOption();
    if (options.selectClause) {
      jobOptions.select = options.selectClause;
    }
    if (options.expandClause) {
      jobOptions.expand = options.expandClause;
    }
    if (options.filterClause) {
      jobOptions.filter = options.filterClause;
    }   

    if (options.jobScheduleId) {
      batchOptions.jobListFromJobScheduleOptions = jobOptions;
    } else {
      batchOptions.jobListOptions = jobOptions;
    }

    var jobs = [];
    startProgress(tips);

    try {
      if (options.jobScheduleId) {
        result = client.job.listFromJobSchedule(options.jobScheduleId, batchOptions, _);
      } else {
        result = client.job.list(batchOptions, _);
      }
      result.forEach(function (job) {
        jobs.push(job);
      });
      var nextLink = result.odatanextLink;
            
      while (nextLink) {
        batchOptions = {};
        jobOptions = batchUtil.getBatchOperationDefaultOption();
        
        if (options.jobScheduleId) {
          batchOptions.jobListFromJobScheduleOptions = jobOptions;
          result = client.job.listFromJobScheduleNext(nextLink, batchOptions, _);
        } else {
          batchOptions.jobListOptions = jobOptions;
          result = client.job.listNext(nextLink, batchOptions, _);
        }
        result.forEach(function (job) {
          jobs.push(job);
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

    cli.interaction.formatOutput(jobs, function (outputData) {
      if (outputData.length === 0) {
        logger.info($('No job found'));
      } else {
        logger.table(outputData, function(row, item) {
          row.cell($('Id'), item.id);
          row.cell($('State'), item.state);
        });
      }
    });
  }

  /**
  * Delete the specified batch job
  * @param {string} [jobId] job Id
  * @param {object} options command line options
  * @param {callback} _ callback function
  */
  function deleteJob(jobId, options, _) {
    var client = batchUtil.createBatchServiceClient(options);
    if (!jobId) {
      jobId = options.id;
    }
    jobId = interaction.promptIfNotGiven($('Job id: '), jobId, _);
    var tips = util.format($('Deleting job %s'), jobId);
    var batchOptions = {};
    batchOptions.jobDeleteMethodOptions = batchUtil.getBatchOperationDefaultOption();

    if (options.ifMatch) {
      batchOptions.jobDeleteMethodOptions.ifMatch = options.ifMatch;
    }
    if (options.ifNoneMatch) {
      batchOptions.jobDeleteMethodOptions.ifNoneMatch = options.ifNoneMatch;
    }
    if (options.ifModifiedSince) {
      batchOptions.jobDeleteMethodOptions.ifModifiedSince = options.ifModifiedSince;
    }
    if (options.ifUnmodifiedSince) {
      batchOptions.jobDeleteMethodOptions.ifUnmodifiedSince = options.ifUnmodifiedSince;
    }

    if (!options.quiet) {
      if (!interaction.confirm(util.format($('Do you want to delete job %s? [y/n]: '), jobId), _)) {
        return;
      }
    }
    
    startProgress(tips);

    try {
      client.job.deleteMethod(jobId, batchOptions, _);
    } catch (err) {
      if (batchUtil.isNotFoundException(err)) {
        throw new Error(util.format($('Job %s does not exist'), jobId));
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

    logger.info(util.format($('Job %s has been deleted successfully'), jobId));
  }

  /**
   * Update/Patch the specified batch job
   * @param {string} [jobId] job Id
   * @param {string} [jsonFile] file containing the job properties to update in JSON format
   * @param {object} options command line options
   * @param {callback} _ callback function
   */
  function updateJob(jobId, jsonFile, options, _) {
    if (!jobId) {
      jobId = options.id;
    }
    jobId = interaction.promptIfNotGiven($('Job id: '), jobId, _);
    if (!jsonFile) {
      jsonFile = options.jsonFile;
    }

    var parsedJson = {};

    if (!jsonFile) {
      if (!options.poolId && !options.priority && !options.maxWallClockTime && !options.maxTaskRetryCount && !options.metadata) {
        jsonFile = interaction.promptIfNotGiven($('JSON file name: '), jsonFile, _);
      } else {
        var poolId = options.poolId;
        if (options.poolId) {
          __.extend(parsedJson, { 'poolInfo' : { 'poolId' : poolId } });
        }

        if (options.priority) {
          __.extend(parsedJson, { 'priority' : Number(options.priority) });
        }

        var constraintsJson = {};
        if (options.maxWallClockTime) {
          __.extend(constraintsJson, { 'maxWallClockTime' : options.maxWallClockTime });
        }

        if (options.maxTaskRetryCount) {
          __.extend(constraintsJson, { 'maxTaskRetryCount' : Number(options.maxTaskRetryCount) });
        }

        __.extend(parsedJson, { 'constraints' : constraintsJson });

        if (options.metadata) {
          ref = [];
          options.metadata.split(';').forEach(function(entry) {
            var item = entry.split('=');
            ref.push({ 'name' : item[0], 'value' : item[1] });
          });
          __.extend(parsedJson, { 'metadata' : ref });
        }
      }
    }

    if (jsonFile) {
      var objJson = fs.readFileSync(jsonFile).toString();
      parsedJson = JSON.parse(objJson);
    }

    var client = batchUtil.createBatchServiceClient(options);

    var resultMapper;
    var tips;

    var jobOptions = batchUtil.getBatchOperationDefaultOption();
    if (options.ifMatch) {
      jobOptions.ifMatch = options.ifMatch;
    }
    if (options.ifNoneMatch) {
      jobOptions.ifNoneMatch = options.ifNoneMatch;
    }
    if (options.ifModifiedSince) {
      jobOptions.ifModifiedSince = options.ifModifiedSince;
    }
    if (options.ifUnmodifiedSince) {
      jobOptions.ifUnmodifiedSince = options.ifUnmodifiedSince;
    }
    
    var batchOptions = {};

    if (options.replace) {
      if (parsedJson !== null && parsedJson !== undefined) {
        resultMapper = new client.models['JobUpdateParameter']().mapper();
        updateJobParam = client.deserialize(resultMapper, parsedJson, 'result');
      }

      tips = util.format($('Updating job %s'), jobId);

      batchOptions.jobUpdateOptions = jobOptions;

      startProgress(tips);

      try {
        client.job.update(jobId, updateJobParam, batchOptions, _);
      } catch (err) {
        if (batchUtil.isNotFoundException(err)) {
          throw new Error(util.format($('Job %s does not exist'), jobId));
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
    } else {
      if (parsedJson !== null && parsedJson !== undefined) {
        resultMapper = new client.models['JobPatchParameter']().mapper();
        updateJobParam = client.deserialize(resultMapper, parsedJson, 'result');
      }

      tips = util.format($('Patching job %s'), jobId);

      batchOptions.jobPatchOptions = jobOptions;

      startProgress(tips);

      try {
        client.job.patch(jobId, updateJobParam, batchOptions, _);
      } catch (err) {
        if (batchUtil.isNotFoundException(err)) {
          throw new Error(util.format($('Job %s does not exist'), jobId));
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
    }

    logger.verbose(util.format($('Job %s has been updated/patched successfully'), jobId));
    showJob(jobId, options, _);
  }

  /**
   * Enable the specified batch job
   * @param {string} <jobId> job Id
   * @param {object} options command line options
   * @param {callback} _ callback function
   */
  function enableJob(jobId, options, _) {
    var client = batchUtil.createBatchServiceClient(options);

    var tips = util.format($('Enabling job %s'), jobId);
    var batchOptions = {};
    batchOptions.jobEnableOptions = batchUtil.getBatchOperationDefaultOption();

    if (options.ifMatch) {
      batchOptions.jobEnableOptions.ifMatch = options.ifMatch;
    }
    if (options.ifNoneMatch) {
      batchOptions.jobEnableOptions.ifNoneMatch = options.ifNoneMatch;
    }
    if (options.ifModifiedSince) {
      batchOptions.jobEnableOptions.ifModifiedSince = options.ifModifiedSince;
    }
    if (options.ifUnmodifiedSince) {
      batchOptions.jobEnableOptions.ifUnmodifiedSince = options.ifUnmodifiedSince;
    }

    startProgress(tips);

    try {
      client.job.enable(jobId, batchOptions, _);
    } catch (err) {
      if (batchUtil.isNotFoundException(err)) {
        throw new Error(util.format($('Job %s does not exist'), jobId));
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

    logger.info(util.format($('Job %s has been enabled'), jobId));
  }

  /**
   * Disable the specified batch job
   * @param {string} <jobId> job Id
   * @param {object} options command line options
   * @param {callback} _ callback function
   */
  function disableJob(jobId, options, _) {
    var client = batchUtil.createBatchServiceClient(options);

    var disableOption = options.disableOption;
    if (!disableOption) {
      disableOption = interaction.promptIfNotGiven($('Job disable option: '), disableOption, _);
    }

    var tips = util.format($('Disabling job %s'), jobId);
    var batchOptions = {};
    batchOptions.jobDisableOptions = batchUtil.getBatchOperationDefaultOption();

    if (options.ifMatch) {
      batchOptions.jobDisableOptions.ifMatch = options.ifMatch;
    }
    if (options.ifNoneMatch) {
      batchOptions.jobDisableOptions.ifNoneMatch = options.ifNoneMatch;
    }
    if (options.ifModifiedSince) {
      batchOptions.jobDisableOptions.ifModifiedSince = options.ifModifiedSince;
    }
    if (options.ifUnmodifiedSince) {
      batchOptions.jobDisableOptions.ifUnmodifiedSince = options.ifUnmodifiedSince;
    }

    startProgress(tips);

    try {
      client.job.disable(jobId, disableOption, batchOptions, _);
    } catch (err) {
      if (batchUtil.isNotFoundException(err)) {
        throw new Error(util.format($('Job %s does not exist'), jobId));
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

    logger.info(util.format($('Job %s has been disabled'), jobId));
  }

  /**
   * Terminate the specified batch job
   * @param {string} <jobId> job Id
   * @param {object} options command line options
   * @param {callback} _ callback function
   */
  function terminateJob(jobId, options, _) {
    var client = batchUtil.createBatchServiceClient(options);

    var tips = util.format($('Terminating job %s'), jobId);
    var batchOptions = {};
    batchOptions.jobTerminateOptions = batchUtil.getBatchOperationDefaultOption();

    if (options.ifMatch) {
      batchOptions.jobTerminateOptions.ifMatch = options.ifMatch;
    }
    if (options.ifNoneMatch) {
      batchOptions.jobTerminateOptions.ifNoneMatch = options.ifNoneMatch;
    }
    if (options.ifModifiedSince) {
      batchOptions.jobTerminateOptions.ifModifiedSince = options.ifModifiedSince;
    }
    if (options.ifUnmodifiedSince) {
      batchOptions.jobTerminateOptions.ifUnmodifiedSince = options.ifUnmodifiedSince;
    }

    if (options.terminateReason) {
      batchOptions.terminateReason = options.terminateReason;
    }

    startProgress(tips);

    try {
      client.job.terminate(jobId, batchOptions, _);
    } catch (err) {
      if (batchUtil.isNotFoundException(err)) {
        throw new Error(util.format($('Job %s does not exist'), jobId));
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

    logger.info(util.format($('Job %s has been terminated'), jobId));
  }

 /**
  * List batch job prep and release task status
  * @param {string} <jobId> job id
  * @param {object} options command line options
  * @param {callback} _ callback function
  */
  function listJobPrepAndReleaseTaskStatus(jobId, options, _) {
    var client = batchUtil.createBatchServiceClient(options);

    var tips = util.format($('Listing Batch job preparation and release task status for job %s'), jobId);
    var batchOptions = {};

    batchOptions.jobListPreparationAndReleaseTaskStatusOptions = batchUtil.getBatchOperationDefaultOption();

    if (options.selectClause) {
      batchOptions.jobListPreparationAndReleaseTaskStatusOptions.select = options.selectClause;
    }
    if (options.filterClause) {
      batchOptions.jobListPreparationAndReleaseTaskStatusOptions.filter = options.filterClause;
    } 

    var jobPrepReleaseExecutionInfos = [];
    startProgress(tips);

    try {
      result = client.job.listPreparationAndReleaseTaskStatus(jobId, batchOptions, _);
      result.forEach(function (jobPrepReleaseExecutionInfo) {
        jobPrepReleaseExecutionInfos.push(jobPrepReleaseExecutionInfo);
      });
      var nextLink = result.odatanextLink;
            
      while (nextLink) {
        batchOptions = batchUtil.getBatchOperationDefaultOption();
        
        batchOptions.jobListPreparationAndReleaseTaskStatusNextOptions = batchOptions;
        result = client.job.listPreparationAndReleaseTaskStatusNext (nextLink, batchOptions, _);
        result.forEach(function (jobPrepReleaseExecutionInfo) {
          jobPrepReleaseExecutionInfos.push(jobPrepReleaseExecutionInfo);
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

    cli.interaction.formatOutput(jobPrepReleaseExecutionInfos, function (outputData) {
      if (outputData.length === 0) {
        logger.info($('No job preparation or job release task execution details found'));
      } else {
        logger.table(outputData, function(row, item) {
          row.cell($('Pool id'), item.poolId);
          row.cell($('Node id'), item.nodeId);
          if (item.jobPreparationTaskExecutionInfo) {
            row.cell($('Job Prep State'), item.jobPreparationTaskExecutionInfo.state);
          }
          if (item.jobReleaseTaskExecutionInfo) {
            row.cell($('Job Release State'), item.jobReleaseTaskExecutionInfo.state);
          }
        });
      }
    });
  }
};