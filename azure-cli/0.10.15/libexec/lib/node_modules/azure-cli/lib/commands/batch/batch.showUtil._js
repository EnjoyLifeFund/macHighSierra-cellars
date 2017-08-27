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

var utils = require('../../util/utils');
var batchUtil = require('./batch.util');

var $ = utils.getLocaleString;

var batchShowUtil = {};
var nameLength = 32;
var UTCFormat = 'YYYY-MM-DDTHH:MI:SSZ';

batchShowUtil.showNameValue = function (name, value, discardNullValue, output, indent) {
  var key;
  if (typeof value !== 'undefined' && value !== null) {
    key = _spaces(indent) + name;
    key += _spaces(nameLength - key.length);
    output.data(key + ': ' + value);
  } else if (!discardNullValue) {
    key = _spaces(indent) + name;
    key += _spaces(nameLength - key.length);
    output.data(key + ': ' + '""');
  }
};

batchShowUtil.showDictionary = function (title, kvPairs, output, indent) {
  if (!kvPairs) {
    return;
  }

  for (var key in kvPairs) {
    if (kvPairs.hasOwnProperty(key)) {
      if (kvPairs[key]) {
        batchShowUtil.showNameValue(title, key + ' ' + kvPairs[key], true, output, indent);
      }
    }
  }
};

batchShowUtil.showArray = function(list, func, title1, title2, output, indent) {
  if (!list) {
    return;
  }

  batchShowUtil.showHeader(title1, false, output, indent);
  indent += 2;

  var i = 1;
  list.forEach(function (item) {
    batchShowUtil.showHeader(title2 + ' # ' + i, false, output, indent);
    func(item, output, indent);
    i++;
  });
};

batchShowUtil.showHeader = function (header, newline, output, indent) {
  if (newline) {
    output.data('');
  }
  output.data(_spaces(indent) + header);
};

function _spaces(count) {
  var space = '';
  for (var i = 0; i < count; i++) {
    space += ' ';
  }

  return space;
}

/**********************************************
 * Show utilities
 **********************************************/


batchShowUtil.showBatchAccount = function(account, output) {
  if (!account) {
    return;
  }

  if (output.format().json) {
    output.json(account);
    return;
  }

  var indent = 0;
  var showNameValue = batchShowUtil.showNameValue;

  showNameValue($('Name'), account.name, true, output, indent);
  showNameValue($('URL'), account.id, true, output, indent);
  showNameValue($('Resource Group'), batchUtil.parseResourceGroupNameFromId(account.id), true, output, indent);
  showNameValue($('Location'), account.location, true, output, indent);
  showNameValue($('Endpoint'), 'https://' + account.accountEndpoint, true, output, indent);
  showNameValue($('Provisioning State'), account.provisioningState, true, output, indent);
  showNameValue($('Core Quota'), account.coreQuota, true, output, indent);
  showNameValue($('Pool Quota'), account.poolQuota, true, output, indent);
  showNameValue($('Active Job and Job Schedule Quota'), account.activeJobAndJobScheduleQuota, true, output, indent);
  if (account.tags) {
    batchShowUtil.showDictionary($('Tags'), account.tags, output, indent);
  }
  batchShowUtil.showAutoStorage(account.autoStorage, output, indent);
};

batchShowUtil.showAutoStorage = function(autoStorage, output) {
  if (!autoStorage) {
    return;
  }

  var indent = 0;
  var showNameValue = batchShowUtil.showNameValue;

  batchShowUtil.showHeader($('Auto Storage'), false, output, indent);
  indent += 2;
  showNameValue($('Account Id'), autoStorage.storageAccountId, true, output, indent);
  if (autoStorage.lastKeySync) {
    showNameValue($('Last Key Sync'), autoStorage.lastKeySync.toUTCFormat(UTCFormat), true, output, indent);
  }
};

batchShowUtil.showCloudJob = function(job, output) {
  if (!job) {
    return;
  }

  if (output.format().json) {
    output.json(job);
    return;
  }

  var indent = 0;
  var showNameValue = batchShowUtil.showNameValue;

  showNameValue($('Id'), job.id, true, output, indent);
  showNameValue($('Display Name'), job.displayName, true, output, indent);
  showNameValue($('State'), job.state, true, output, indent);
  if (job.creationTime) {
    showNameValue($('Creation Time'), job.creationTime.toUTCFormat(UTCFormat), true, output, indent);
  }
  showNameValue($('Priority'), job.priority, true, output, indent);
  showNameValue($('Uses Task Dependencies'), job.usesTaskDependencies, true, output, indent);
  batchShowUtil.showArray(job.commonEnvironmentSettings, batchShowUtil.showEnvironmentSetting, $('Common Environment Settings'), $('Environment Setting'), output, indent);
  batchShowUtil.showArray(job.metadata, batchShowUtil.showMetadataItem, $('Metadata'), $('Metadata Item'), output, indent);
  batchShowUtil.showJobConstraints(job.constraints, output, indent);
  batchShowUtil.showJobManagerTask(job.jobManagerTask, output, indent);
  batchShowUtil.showJobPreparationTask(job.jobPreparationTask, output, indent);
  batchShowUtil.showJobReleaseTask(job.jobReleaseTask, output, indent);
  batchShowUtil.showPoolInformation(job.poolInfo, output, indent);
  batchShowUtil.showJobExecutionInformation(job.executionInfo, output, indent);
  batchShowUtil.showJobStats(job.stats, output, indent);
};

batchShowUtil.showCloudTask = function(task, subTasks, output) {
  if (!task) {
    return;
  }

  if (output.format().json) {
    if (subTasks && subTasks.value && subTasks.value.length > 0) {
      var result = {};
      result.task = task;
      result.subTasks = subTasks;
      output.json(result);
    } else {
      output.json(task);
    }
    return;
  }

  var indent = 0;
  var showNameValue = batchShowUtil.showNameValue;

  showNameValue($('Id'), task.id, true, output, indent);
  showNameValue($('Display Name'), task.displayName, true, output, indent);
  showNameValue($('State'), task.state, true, output, indent);
  if (task.creationTime) {
    showNameValue($('Creation Time'), task.creationTime.toUTCFormat(UTCFormat), true, output, indent);
  }
  showNameValue($('Command Line'), task.commandLine, true, output, indent);
  showNameValue($('Run Elevated'), task.runElevated, true, output, indent);
  batchShowUtil.showArray(task.resourceFiles, batchShowUtil.showResourceFile, $('Resource Files'), $('Resource File'), output, indent);
  batchShowUtil.showArray(task.environmentSettings, batchShowUtil.showEnvironmentSetting, $('Environment Settings'), $('Environment Setting'), output, indent);
  batchShowUtil.showTaskConstraints(task.constraints, output, indent);
  batchShowUtil.showComputeNodeInformation(task.nodeInfo, output, indent);
  batchShowUtil.showMultiInstanceSettings(task.multiInstanceSettings, output, indent);
  batchShowUtil.showTaskStats(task.stats, output, indent);
  
  if (subTasks && subTasks.value && subTasks.value.length > 0) {
    batchShowUtil.showHeader($('Subtasks Information'), true, output, indent);
    output.table(subTasks.value, function(row, item) {
      row.cell($('Id'), item.id);
      row.cell($('State'), item.state);
      row.cell($('Node Id'), item.nodeInfo ? item.nodeInfo.nodeId : '');
      row.cell($('Exit code'), item.exitCode);
    });
  }
};

batchShowUtil.showCloudJobSchedule = function(jobSchedule, output) {
  if (!jobSchedule) {
    return;
  }

  if (output.format().json) {
    output.json(jobSchedule);
    return;
  }

  var indent = 0;
  var showNameValue = batchShowUtil.showNameValue;

  showNameValue($('Id'), jobSchedule.id, true, output, indent);
  showNameValue($('Display Name'), jobSchedule.displayName, true, output, indent);
  showNameValue($('State'), jobSchedule.state, true, output, indent);
  if (jobSchedule.creationTime) {
    showNameValue($('Creation Time'), jobSchedule.creationTime.toUTCFormat(UTCFormat), true, output, indent);
  }
  batchShowUtil.showArray(jobSchedule.metadata, batchShowUtil.showMetadataItem, $('Metadata'), $('Metadata Item'), output, indent);
  batchShowUtil.showJobSpecification(jobSchedule.jobSpecification, output, indent);
  batchShowUtil.showSchedule(jobSchedule.schedule, output, indent);
  batchShowUtil.showJobScheduleExecutionInfo(jobSchedule.executionInfo, output, indent);
  batchShowUtil.showJobScheduleStats(jobSchedule.stats, output, indent);
};

batchShowUtil.showJobExecutionInformation = function(executionInfo, output, indent) {
  if (!executionInfo) {
    return;
  }

  var showNameValue = batchShowUtil.showNameValue;

  batchShowUtil.showHeader($('Execution Info'), false, output, indent);
  indent += 2;
  if (executionInfo.startTime) {
    showNameValue($('Start Time'), executionInfo.startTime.toUTCFormat(UTCFormat), true, output, indent);
  }  
  if (executionInfo.endTime) {
    showNameValue($('End Time'), executionInfo.endTime.toUTCFormat(UTCFormat), true, output, indent);
  }
  showNameValue($('Pool Id'), executionInfo.poolId, true, output, indent);
  showNameValue($('Terminate Reason'), executionInfo.terminateReason, true, output, indent);
  batchShowUtil.showJobSchedulingError(executionInfo.schedulingError, output, indent);
};

batchShowUtil.showJobSchedulingError = function(schedulingError, output, indent) {
  if (!schedulingError) {
    return;
  }

  var showNameValue = batchShowUtil.showNameValue;

  batchShowUtil.showHeader($('Scheduling Error'), false, output, indent);
  indent += 2;
  showNameValue($('Category'), schedulingError.category, true, output, indent);
  showNameValue($('Code'), schedulingError.code, true, output, indent);
  showNameValue($('Message'), schedulingError.message, true, output, indent);
  batchShowUtil.showArray(schedulingError.details, batchShowUtil.showNameValuePair, $('Details'), $('Detail'), output, indent);
};

batchShowUtil.showJobStats = function(stats, output, indent) {
  if (!stats) {
    return;
  }

  var showNameValue = batchShowUtil.showNameValue;

  batchShowUtil.showHeader($('Stats'), false, output, indent);
  indent += 2;

  if (stats.startTime) {
    showNameValue($('Start Time'), stats.startTime.toUTCFormat(UTCFormat), true, output, indent);
  }
  showNameValue($('User CPU Time'), stats.userCPUTime, true, output, indent);
  showNameValue($('Kernel CPU Time'), stats.kernelCPUTime, true, output, indent);
  showNameValue($('Wall Clock Time'), stats.wallClockTime, true, output, indent);
  showNameValue($('Read IOps'), stats.readIOps, true, output, indent);
  showNameValue($('Write IOps'), stats.writeIOps, true, output, indent);
  showNameValue($('Read IO(GiB)'), stats.readIOGiB, true, output, indent);
  showNameValue($('Write IO(GiB)'), stats.writeIOGiB, true, output, indent);
  showNameValue($('Num Succeeded Tasks'), stats.numSucceededTasks, true, output, indent);
  showNameValue($('Num Failed Tasks'), stats.numFailedTasks, true, output, indent);
  showNameValue($('Num Task Retries'), stats.numTaskRetries, true, output, indent);
  showNameValue($('Wait Time'), stats.waitTime, true, output, indent);
};

batchShowUtil.showTaskStats = function(stats, output, indent) {
  if (!stats) {
    return;
  }

  var showNameValue = batchShowUtil.showNameValue;

  batchShowUtil.showHeader($('Stats'), false, output, indent);
  indent += 2;

  if (stats.startTime) {
    showNameValue($('Start Time'), stats.startTime.toUTCFormat(UTCFormat), true, output, indent);
  }
  showNameValue($('User CPU Time'), stats.userCPUTime, true, output, indent);
  showNameValue($('Kernel CPU Time'), stats.kernelCPUTime, true, output, indent);
  showNameValue($('Wall Clock Time'), stats.wallClockTime, true, output, indent);
  showNameValue($('Read IOps'), stats.readIOps, true, output, indent);
  showNameValue($('Write IOps'), stats.writeIOps, true, output, indent);
  showNameValue($('Read IO(GiB)'), stats.readIOGiB, true, output, indent);
  showNameValue($('Write IO(GiB)'), stats.writeIOGiB, true, output, indent);
  showNameValue($('Wait Time'), stats.waitTime, true, output, indent);
};

batchShowUtil.showSchedule = function(schedule, output, indent) {
  if (!schedule) {
    return;
  }

  var showNameValue = batchShowUtil.showNameValue;

  batchShowUtil.showHeader($('Schedule'), false, output, indent);
  indent += 2;
  if (schedule.doNotRunUntil) {
    showNameValue($('Do Not Run Until'), schedule.doNotRunUntil.toUTCFormat(UTCFormat), true, output, indent);
  }
  if (schedule.doNotRunAfter) {
    showNameValue($('Do Not Run After'), schedule.doNotRunAfter.toUTCFormat(UTCFormat), true, output, indent);
  }
  showNameValue($('Start Window'), schedule.startWindow, true, output, indent);
  showNameValue($('Recurrence Interval'), schedule.recurrenceInterval, true, output, indent);
};

batchShowUtil.showJobSpecification = function(jobSpec, output, indent) {
  if (!jobSpec) {
    return;
  }

  var showNameValue = batchShowUtil.showNameValue;

  batchShowUtil.showHeader($('Job Specification'), false, output, indent);
  indent += 2;
  showNameValue($('Display Name'), jobSpec.displayName, true, output, indent);
  showNameValue($('Priority'), jobSpec.priority, true, output, indent);
  showNameValue($('Uses Task Dependencies'), jobSpec.usesTaskDependencies, true, output, indent);
  batchShowUtil.showArray(jobSpec.commonEnvironmentSettings, batchShowUtil.showEnvironmentSetting, $('Common Environment Settings'), $('Environment Setting'), output, indent);
  batchShowUtil.showArray(jobSpec.metadata, batchShowUtil.showMetadataItem, $('Metadata'), $('Metadata Item'), output, indent);
  batchShowUtil.showJobConstraints(jobSpec.constraints, output, indent);
  batchShowUtil.showJobManagerTask(jobSpec.jobManagerTask, output, indent);
  batchShowUtil.showJobPreparationTask(jobSpec.jobPreparationTask, output, indent);
  batchShowUtil.showJobReleaseTask(jobSpec.jobReleaseTask, output, indent);
  batchShowUtil.showPoolInformation(jobSpec.poolInfo, output, indent);
};

batchShowUtil.showJobConstraints = function(constraints, output, indent) {
  if (!constraints) {
    return;
  }

  var showNameValue = batchShowUtil.showNameValue;

  batchShowUtil.showHeader($('Constraints'), false, output, indent);
  indent += 2;
  showNameValue($('Max Wall Clock Time'), constraints.maxWallClockTime, true, output, indent);
  showNameValue($('Max Task Retry Count'), constraints.maxTaskRetryCount, true, output, indent);
};

batchShowUtil.showJobManagerTask = function(jobManagerTask, output, indent) {
  if (!jobManagerTask) {
    return;
  }

  var showNameValue = batchShowUtil.showNameValue;

  batchShowUtil.showHeader($('Job Manager Task'), false, output, indent);
  indent += 2;
  showNameValue($('Id'), jobManagerTask.id, true, output, indent);
  showNameValue($('Display Name'), jobManagerTask.displayName, true, output, indent);
  showNameValue($('Command Line'), jobManagerTask.commandLine, true, output, indent);
  batchShowUtil.showArray(jobManagerTask.resourceFiles, batchShowUtil.showResourceFile, $('Resource Files'), $('Resource File'), output, indent);
  batchShowUtil.showArray(jobManagerTask.environmentSettings, batchShowUtil.showEnvironmentSetting, $('Environment Settings'), $('Environment Setting'), output, indent);
  batchShowUtil.showTaskConstraints(jobManagerTask.constraints, output, indent);
  showNameValue($('Kill Job On Completion'), jobManagerTask.killJobOnCompletion, true, output, indent);
  showNameValue($('Run Elevated'), jobManagerTask.runElevated, true, output, indent);
  showNameValue($('Run Exclusive'), jobManagerTask.runExclusive, true, output, indent);
};

batchShowUtil.showJobPreparationTask = function(jobPrepTask, output, indent) {
  if (!jobPrepTask) {
    return;
  }

  var showNameValue = batchShowUtil.showNameValue;

  batchShowUtil.showHeader($('Job Preparation Task'), false, output, indent);
  indent += 2;
  showNameValue($('Id'), jobPrepTask.id, true, output, indent);
  showNameValue($('Command Line'), jobPrepTask.commandLine, true, output, indent);
  batchShowUtil.showArray(jobPrepTask.resourceFiles, batchShowUtil.showResourceFile, $('Resource Files'), $('Resource File'), output, indent);
  batchShowUtil.showArray(jobPrepTask.environmentSettings, batchShowUtil.showEnvironmentSetting, $('Environment Settings'), $('Environment Setting'), output, indent);
  batchShowUtil.showTaskConstraints(jobPrepTask.constraints, output, indent);
  showNameValue($('Wait for Success'), jobPrepTask.waitForSuccess, true, output, indent);
  showNameValue($('Run Elevated'), jobPrepTask.runElevated, true, output, indent);
  showNameValue($('Rerun on Node Reboot After Success'), jobPrepTask.rerunOnNodeRebootAfterSuccess, true, output, indent);
};

batchShowUtil.showJobReleaseTask = function(jobReleaseTask, output, indent) {
  if (!jobReleaseTask) {
    return;
  }

  var showNameValue = batchShowUtil.showNameValue;

  batchShowUtil.showHeader($('Job Release Task'), false, output, indent);
  indent += 2;
  showNameValue($('Id'), jobReleaseTask.id, true, output, indent);
  showNameValue($('Command Line'), jobReleaseTask.commandLine, true, output, indent);
  batchShowUtil.showArray(jobReleaseTask.resourceFiles, batchShowUtil.showResourceFile, $('Resource Files'), $('Resource File'), output, indent);
  batchShowUtil.showArray(jobReleaseTask.environmentSettings, batchShowUtil.showEnvironmentSetting, $('Environment Settings'), $('Environment Setting'), output, indent);
  showNameValue($('Max Wall Clock Time'), jobReleaseTask.maxWallClockTime, true, output, indent);
  showNameValue($('Run Elevated'), jobReleaseTask.runElevated, true, output, indent);
  showNameValue($('Retention Time'), jobReleaseTask.retentionTime, true, output, indent);
};

batchShowUtil.showTaskConstraints = function(constraints, output, indent) {
  if (!constraints) {
    return;
  }

  var showNameValue = batchShowUtil.showNameValue;

  batchShowUtil.showHeader($('Constraints'), false, output, indent);
  indent += 2;
  showNameValue($('Max Wall Clock Time'), constraints.maxWallClockTime, true, output, indent);
  showNameValue($('Retention Time'), constraints.retentionTime, true, output, indent);
  showNameValue($('Max Task Retry Count'), constraints.maxTaskRetryCount, true, output, indent);
};

batchShowUtil.showComputeNodeInformation = function(info, output, indent) {
  if (!info) {
    return;
  }

  var showNameValue = batchShowUtil.showNameValue;

  batchShowUtil.showHeader($('Compute Node Information'), false, output, indent);
  indent += 2;
  showNameValue($('Pool Id'), info.poolId, true, output, indent);
  showNameValue($('Compute Node Id'), info.nodeId, true, output, indent);
  showNameValue($('Task Root Directory'), info.taskRootDirectory, true, output, indent);
};

batchShowUtil.showMultiInstanceSettings = function(settings, output, indent) {
  if (!settings) {
    return;
  }

  var showNameValue = batchShowUtil.showNameValue;

  batchShowUtil.showHeader($('Multi-instance Settings'), false, output, indent);
  indent += 2;
  showNameValue($('Number of Instances'), settings.numberOfInstances, true, output, indent);
  showNameValue($('Coordination Command Line'), settings.coordinationCommandLine, true, output, indent);
  batchShowUtil.showArray(settings.commonResourceFiles, batchShowUtil.showResourceFile, $('Common Resource Files'), $('Resource File'), output, indent);
};

batchShowUtil.showPoolInformation = function(poolInfo, output, indent) {
  if (!poolInfo) {
    return;
  }

  var showNameValue = batchShowUtil.showNameValue;

  batchShowUtil.showHeader($('Pool Information'), false, output, indent);
  indent += 2;
  if (poolInfo.poolId) {
    showNameValue($('Pool Id'), poolInfo.poolId, true, output, indent);
  } else {
    batchShowUtil.showAutoPoolSpecification(poolInfo.autoPoolSpecification, output, indent);
  }
};

batchShowUtil.showAutoPoolSpecification = function(autoPoolSpec, output, indent) {
  if (!autoPoolSpec) {
    return;
  }

  var showNameValue = batchShowUtil.showNameValue;

  batchShowUtil.showHeader($('Auto Pool Specification'), false, output, indent);
  indent += 2;
  showNameValue($('Auto Pool Id Prefix'), autoPoolSpec.autoPoolIdPrefix, true, output, indent);
  showNameValue($('Keep Alive'), autoPoolSpec.keepAlive, true, output, indent);
  showNameValue($('Pool Lifetime Option'), autoPoolSpec.poolLifetimeOption, true, output, indent);
  batchShowUtil.showPoolSpecification(autoPoolSpec.pool, output, indent);
};

batchShowUtil.showPoolSpecification = function(poolSpec, output, indent) {
  if (!poolSpec) {
    return;
  }

  var showNameValue = batchShowUtil.showNameValue;

  batchShowUtil.showHeader($('Pool Specification'), false, output, indent);
  indent += 2;
  showNameValue($('Display Name'), poolSpec.displayName, true, output, indent);
  showNameValue($('VM Size'), poolSpec.vmSize, true, output, indent);
  showNameValue($('OS Family'), poolSpec.osFamily, true, output, indent);
  showNameValue($('Target VM Count'), poolSpec.targetDedicated, true, output, indent);
  showNameValue($('Enable AutoScale'), poolSpec.enableAutoScale, true, output, indent);
  showNameValue($('AutoScale Formula'), poolSpec.autoScaleFormula, true, output, indent);
  showNameValue($('Enable Internode Communication'), poolSpec.enableInterNodeCommunication, true, output, indent);
  batchShowUtil.showStartTask(poolSpec.startTask, output, indent);
  showNameValue($('Max Tasks Per Node'), poolSpec.maxTasksPerNode, true, output, indent);
  batchShowUtil.showArray(poolSpec.metadata, batchShowUtil.showMetadataItem, $('Metadata'), $('Metadata Item'), output, indent);
  batchShowUtil.showArray(poolSpec.certificateReferences, batchShowUtil.showCertReference, $('Certificate References'), $('Certificate Reference'), output, indent);
  batchShowUtil.showArray(poolSpec.applicationPackageReferences, batchShowUtil.showAppReference, $('Application References'), $('Application Reference'), output, indent);
};

batchShowUtil.showJobScheduleExecutionInfo = function(executionInfo, output, indent) {
  if (!executionInfo) {
    return;
  }

  var showNameValue = batchShowUtil.showNameValue;

  batchShowUtil.showHeader($('Execution Info'), false, output, indent);
  indent += 2;
  if (executionInfo.nextRunTime) {
    showNameValue($('Next Run Time'), executionInfo.nextRunTime.toUTCFormat(UTCFormat), true, output, indent);
  }  
  if (executionInfo.endTime) {
    showNameValue($('End Time'), executionInfo.endTime.toUTCFormat(UTCFormat), true, output, indent);
  }
  batchShowUtil.showRecentJob(executionInfo.recentJob, output, indent);
};

batchShowUtil.showRecentJob = function(recentJob, output, indent) {
  if (!recentJob) {
    return;
  }

  var showNameValue = batchShowUtil.showNameValue;

  batchShowUtil.showHeader($('Recent Job'), false, output, indent);
  indent += 2;

  showNameValue($('Id'), recentJob.id, true, output, indent);
};

batchShowUtil.showJobScheduleStats = function(stats, output, indent) {
  if (!stats) {
    return;
  }

  var showNameValue = batchShowUtil.showNameValue;

  batchShowUtil.showHeader($('Stats'), false, output, indent);
  indent += 2;

  if (stats.startTime) {
    showNameValue($('Start Time'), stats.startTime.toUTCFormat(UTCFormat), true, output, indent);
  }
  showNameValue($('User CPU Time'), stats.userCPUTime, true, output, indent);
  showNameValue($('Kernel CPU Time'), stats.kernelCPUTime, true, output, indent);
  showNameValue($('Wall Clock Time'), stats.wallClockTime, true, output, indent);
  showNameValue($('Read IOps'), stats.readIOps, true, output, indent);
  showNameValue($('Write IOps'), stats.writeIOps, true, output, indent);
  showNameValue($('Read IO(GiB)'), stats.readIOGiB, true, output, indent);
  showNameValue($('Write IO(GiB)'), stats.writeIOGiB, true, output, indent);
  showNameValue($('Num Succeeded Tasks'), stats.numSucceededTasks, true, output, indent);
  showNameValue($('Num Failed Tasks'), stats.numFailedTasks, true, output, indent);
  showNameValue($('Num Task Retries'), stats.numTaskRetries, true, output, indent);
  showNameValue($('Wait Time'), stats.waitTime, true, output, indent);
};

batchShowUtil.showResizeError = function(resizeError, output, indent) {
  if (!resizeError) {
    return;
  }

  var showNameValue = batchShowUtil.showNameValue;

  batchShowUtil.showHeader($('Resize Error'), false, output, indent);
  indent += 2;
  showNameValue($('Code'), resizeError.code, true, output, indent);
  showNameValue($('Message'), resizeError.message, true, output, indent);
  batchShowUtil.showArray(resizeError.details, batchShowUtil.showNameValuePair, $('Details'), $('Detail'), output, indent);
};

batchShowUtil.showAutoScaleRun = function(autoRun, output, indent) {
  if (!autoRun) {
    return;
  }

  if (output.format().json) {
    output.json(autoRun);
    return;
  }

  var showNameValue = batchShowUtil.showNameValue;

  batchShowUtil.showHeader($('AutoScale Run'), false, output, indent);
  indent += 2;
  showNameValue($('Time Stamp'), autoRun.timestamp, true, output, indent);
  showNameValue($('Results'), autoRun.results, true, output, indent);
  batchShowUtil.showResizeError(autoRun.resizeError, output, indent);
};

batchShowUtil.showResourceFile = function(resourceFile, output, indent) {
  var showNameValue = batchShowUtil.showNameValue;

  indent += 2;
  showNameValue($('Blob Source'), resourceFile.blobSource, true, output, indent);
  showNameValue($('File Path'), resourceFile.filePath, true, output, indent);
};

batchShowUtil.showEnvironmentSetting = function(setting, output, indent) {
  var showNameValue = batchShowUtil.showNameValue;

  indent += 2;
  showNameValue($('Name'), setting.name, true, output, indent);
  showNameValue($('Value'), setting.value, true, output, indent);
};

batchShowUtil.showStartTask = function(startTask, output, indent) {
  if (!startTask) {
    return;
  }

  var showNameValue = batchShowUtil.showNameValue;

  batchShowUtil.showHeader($('Start Task'), false, output, indent);
  indent += 2;
  showNameValue($('Command Line'), startTask.commandLine, true, output, indent);
  showNameValue($('Run Elevated'), startTask.runElevated, true, output, indent);
  showNameValue($('Max Task Retry Count'), startTask.maxTaskRetryCount, true, output, indent);
  showNameValue($('Wait For Success'), startTask.waitForSuccess, true, output, indent);
  batchShowUtil.showArray(startTask.resourceFiles, batchShowUtil.showResourceFile, $('Resource Files'), $('Resource File'), output, indent);
  batchShowUtil.showArray(startTask.environmentSettings, batchShowUtil.showEnvironmentSetting, $('Environment Settings'), $('Environment Setting'), output, indent);
};

batchShowUtil.showCertReference = function(certRef, output, indent) {
  var showNameValue = batchShowUtil.showNameValue;

  indent += 2;
  showNameValue($('Thumbprint'), certRef.thumbprint, true, output, indent);
  showNameValue($('Thumbprint Algorithm'), certRef.thumbprintAlgorithm, true, output, indent);
  showNameValue($('Store Location'), certRef.storeLocation, true, output, indent);
  showNameValue($('Store Name'), certRef.storeName, true, output, indent);
  showNameValue($('Visibility'), certRef.visibility, true, output, indent);
};

batchShowUtil.showAppReference = function(appRef, output, indent) {
  var showNameValue = batchShowUtil.showNameValue;

  indent += 2;
  showNameValue($('Application Id'), appRef.applicationId, true, output, indent);
  showNameValue($('Version'), appRef.version, true, output, indent);
};

batchShowUtil.showPoolStats = function(poolStats, output, indent) {
  if (!poolStats) {
    return;
  }

  if (output.format().json) {
    output.json(poolStats);
    return;
  }

  var showNameValue = batchShowUtil.showNameValue;

  batchShowUtil.showHeader($('Pool Stats'), false, output, indent);
  indent += 2;
  if (poolStats.startTime) {
    showNameValue($('Start Time'), poolStats.startTime.toUTCFormat(UTCFormat), true, output, indent);
  }
  batchShowUtil.showResourceStats(poolStats.resourceStats, output, indent);
};

batchShowUtil.showResourceStats = function(resourceStats, output, indent) {
  if (!resourceStats) {
    return;
  }

  var showNameValue = batchShowUtil.showNameValue;

  batchShowUtil.showHeader($('Resource Stats'), false, output, indent);
  indent += 2;
  showNameValue($('Start Time'), resourceStats.avgCPUPercentage, true, output, indent);
  showNameValue($('Avg CPU Percentage'), resourceStats.avgCPUPercentage, true, output, indent);
  showNameValue($('Avg Memory(GiB)'), resourceStats.avgMemoryGiB, true, output, indent);
  showNameValue($('Peak Memory(GiB)'), resourceStats.peakMemoryGiB, true, output, indent);
  showNameValue($('Avg Disk(GiB)'), resourceStats.avgDiskGiB, true, output, indent);
  showNameValue($('Peak Disk(GiB)'), resourceStats.peakDiskGiB, true, output, indent);
  showNameValue($('Disk Read IOps'), resourceStats.diskReadIOps, true, output, indent);
  showNameValue($('Disk Write IOps'), resourceStats.diskWriteIOps, true, output, indent);
  showNameValue($('Disk Read(GiB)'), resourceStats.diskReadGiB, true, output, indent);
  showNameValue($('Disk Write(GiB)'), resourceStats.diskWriteGiB, true, output, indent);
  showNameValue($('Network Read(GiB)'), resourceStats.networkReadGiB, true, output, indent);
  showNameValue($('Network Write(GiB)'), resourceStats.networkWriteGiB, true, output, indent);
};

batchShowUtil.showCloudPool = function(pool, output) {
  if (!pool) {
    return;
  }

  if (output.format().json) {
    output.json(pool);
    return;
  }

  var indent = 0;
  var showNameValue = batchShowUtil.showNameValue;

  showNameValue($('Pool Id'), pool.id, true, output, indent);
  showNameValue($('Display Name'), pool.displayName, true, output, indent);
  if (pool.creationTime) {
    showNameValue($('Creation Time'), pool.creationTime.toUTCFormat(UTCFormat), true, output, indent);
  }
  showNameValue($('State'), pool.state, true, output, indent);
  showNameValue($('Allocation State'), pool.allocationState, true, output, indent);
  showNameValue($('VM Size'), pool.vmSize, true, output, indent);
  batchShowUtil.showCloudServiceConfiguration(pool.cloudServiceConfiguration, output, indent);
  batchShowUtil.showVirtualMachineConfiguration(pool.virtualMachineConfiguration, output, indent);
  showNameValue($('VM Count'), pool.currentDedicated, true, output, indent);
  showNameValue($('Target VM Count'), pool.targetDedicated, true, output, indent);
  batchShowUtil.showResizeError(pool.resizeError, output, indent);
  showNameValue($('Enable AutoScale'), pool.enableAutoScale, true, output, indent);
  showNameValue($('AutoScale Formula'), pool.autoScaleFormula, true, output, indent);
  batchShowUtil.showAutoScaleRun(pool.autoScaleRun, output, indent);
  showNameValue($('Enable Internode Communication'), pool.enableInterNodeCommunication, true, output, indent);
  batchShowUtil.showStartTask(pool.startTask, output, indent);
  showNameValue($('Max Tasks Per Node'), pool.maxTasksPerNode, true, output, indent);
  batchShowUtil.showArray(pool.metadata, batchShowUtil.showMetadataItem, $('Metadata'), $('Metadata Item'), output, indent);
  batchShowUtil.showArray(pool.certificateReferences, batchShowUtil.showCertReference, $('Certificate References'), $('Certificate Reference'), output, indent);
  batchShowUtil.showArray(pool.applicationPackageReferences, batchShowUtil.showAppReference, $('Application References'), $('Application Reference'), output, indent);
  batchShowUtil.showPoolStats(pool.stats, output, indent);
};

batchShowUtil.showCloudServiceConfiguration = function(config, output, indent) {
  if (!config) {
    return;
  }

  var showNameValue = batchShowUtil.showNameValue;

  batchShowUtil.showHeader($('Cloud Service Configuration'), false, output, indent);
  indent += 2;
  showNameValue($('OS Family'), config.osFamily, true, output, indent);
  showNameValue($('Current OS Version'), config.currentOSVersion, true, output, indent);
  showNameValue($('Target OS Version'), config.targetOSVersion, true, output, indent);
};

batchShowUtil.showVirtualMachineConfiguration = function(config, output, indent) {
  if (!config) {
    return;
  }

  var showNameValue = batchShowUtil.showNameValue;

  batchShowUtil.showHeader($('Virtual Machine Configuration'), false, output, indent);
  indent += 2;
  showNameValue($('Node Agent SKU Id'), config.nodeAgentSKUId, true, output, indent);
  batchShowUtil.showImageReference(config.imageReference, output, indent);
  batchShowUtil.showWindowsConfiguration(config.windowsConfiguration, output, indent);
};

batchShowUtil.showImageReference = function(imageRef, output, indent) {
  if (!imageRef) {
    return;
  }

  var showNameValue = batchShowUtil.showNameValue;

  batchShowUtil.showHeader($('Image Reference'), false, output, indent);
  indent += 2;
  showNameValue($('Publisher'), imageRef.publisher, true, output, indent);
  showNameValue($('Offer'), imageRef.offer, true, output, indent);
  showNameValue($('SKU'), imageRef.sku, true, output, indent);
  showNameValue($('Version'), imageRef.version, true, output, indent);
};

batchShowUtil.showWindowsConfiguration = function(config, output, indent) {
  if (!config) {
    return;
  }

  var showNameValue = batchShowUtil.showNameValue;

  batchShowUtil.showHeader($('Windows Configuration'), false, output, indent);
  indent += 2;
  showNameValue($('Enable Automatic Updates'), config.enableAutomaticUpdates, true, output, indent);

};

batchShowUtil.showRemoteLoginSettings = function(settings, output, indent) {
  if (!settings) {
    return;
  }

  if (output.format().json) {
    output.json(settings);
    return;
  }

  var showNameValue = batchShowUtil.showNameValue;

  batchShowUtil.showHeader($('Remote Login Settings'), false, output, indent);
  indent += 2;
  showNameValue($('Remote Login IP Address'), settings.remoteLoginIPAddress, true, output, indent);
  showNameValue($('Remote Login Port'), settings.remoteLoginPort, true, output, indent);
};

batchShowUtil.showMetadataItem = function(item, output, indent) {
  var showNameValue = batchShowUtil.showNameValue;

  indent += 2;
  showNameValue($('Name'), item.name, true, output, indent);
  showNameValue($('Value'), item.value, true, output, indent);
};

batchShowUtil.showNameValuePair = function(item, output, indent) {
  var showNameValue = batchShowUtil.showNameValue;

  indent += 2;
  showNameValue($('Name'), item.name, true, output, indent);
  showNameValue($('Value'), item.value, true, output, indent);
};

batchShowUtil.showSchedulingError = function(error, output, indent) {
  if (!error) {
    return;
  }

  var showNameValue = batchShowUtil.showNameValue;

  batchShowUtil.showHeader($('Scheduling Error'), false, output, indent);
  indent += 2;
  showNameValue($('Category'), error.category, true, output, indent);
  showNameValue($('Code'), error.code, true, output, indent);
  showNameValue($('Message'), error.message, true, output, indent);
  batchShowUtil.showArray(error.details, batchShowUtil.showNameValuePair, $('Details'), $('Detail'), output, indent);
};

batchShowUtil.showStartTaskInfo = function(info, output, indent) {
  if (!info) {
    return;
  }

  var showNameValue = batchShowUtil.showNameValue;

  batchShowUtil.showHeader($('Start Task Info'), false, output, indent);
  indent += 2;
  showNameValue($('State'), info.state, true, output, indent);
  if (info.startTime) {
    showNameValue($('Start Time'), info.startTime.toUTCFormat(UTCFormat), true, output, indent);
  }
  if (info.endTime) {
    showNameValue($('End Time'), info.endTime.toUTCFormat(UTCFormat), true, output, indent);
  }
  showNameValue($('Exit Code'), info.exitCode, true, output, indent);
  batchShowUtil.showSchedulingError(info.schedulingError, output, indent);
  showNameValue($('Retry Count'), info.retryCount, true, output, indent);
  if (info.lastRetryTime) {
    showNameValue($('Last Retry Time'), info.lastRetryTime.toUTCFormat(UTCFormat), true, output, indent);
  }
};

batchShowUtil.showTaskInfo = function(info, output, indent) {
  var showNameValue = batchShowUtil.showNameValue;

  indent += 2;
  showNameValue($('Job Id'), info.jobId, true, output, indent);
  showNameValue($('Task Id'), info.taskId, true, output, indent);
  showNameValue($('Subtask Id'), info.subtaskId, true, output, indent);
  batchShowUtil.showTaskExecInfo(info.executionInfo, output, indent);
};

batchShowUtil.showTaskExecInfo = function(info, output, indent) {
  if (!info) {
    return;
  }

  var showNameValue = batchShowUtil.showNameValue;

  batchShowUtil.showHeader($('Task Execution Info'), false, output, indent);
  indent += 2;
  if (info.startTime) {
    showNameValue($('Start Time'), info.startTime.toUTCFormat(UTCFormat), true, output, indent);
  }
  if (info.endTime) {
    showNameValue($('End Time'), info.endTime.toUTCFormat(UTCFormat), true, output, indent);
  }
  showNameValue($('Exit Code'), info.exitCode, true, output, indent);
  batchShowUtil.showSchedulingError(info.schedulingError, output, indent);
  showNameValue($('Retry Count'), info.retryCount, true, output, indent);
  if (info.lastRetryTime) {
    showNameValue($('Last Retry Time'), info.lastRetryTime.toUTCFormat(UTCFormat), true, output, indent);
  }
  showNameValue($('Requeue Count'), info.requeueCount, true, output, indent);
  if (info.lastRequeueTime) {
    showNameValue($('Last Requeue Time'), info.lastRequeueTime.toUTCFormat(UTCFormat), true, output, indent);
  }
};

batchShowUtil.showNodeError = function(error, output, indent) {
  var showNameValue = batchShowUtil.showNameValue;

  indent += 2;
  showNameValue($('Code'), error.code, true, output, indent);
  showNameValue($('Message'), error.message, true, output, indent);
  batchShowUtil.showArray(error.details, batchShowUtil.showNameValuePair, $('Details'), $('Detail'), output, indent);
};

batchShowUtil.showComputeNode = function(node, output) {
  if (!node) {
    return;
  }

  if (output.format().json) {
    output.json(node);
    return;
  }

  var indent = 0;
  var showNameValue = batchShowUtil.showNameValue;

  showNameValue($('Node Id'), node.id, true, output, indent);
  showNameValue($('State'), node.state, true, output, indent);
  showNameValue($('Scheduling State'), node.schedulingState, true, output, indent);
  if (node.allocationTime) {
    showNameValue($('Allocation Time'), node.allocationTime.toUTCFormat(UTCFormat), true, output, indent);
  }
  if (node.lastBootTime) {
    showNameValue($('Last Boot Time'), node.lastBootTime.toUTCFormat(UTCFormat), true, output, indent);
  }
  showNameValue($('IP Address'), node.ipAddress, true, output, indent);
  showNameValue($('Affinity Id'), node.affinityId, true, output, indent);
  showNameValue($('VM Size'), node.vmSize, true, output, indent);
  showNameValue($('Total Tasks Run'), node.totalTasksRun, true, output, indent);
  batchShowUtil.showArray(node.recentTasks, batchShowUtil.showTaskInfo, $('Recent Tasks'), $('Task Info'), output, indent);
  batchShowUtil.showStartTask(node.startTask, output, indent);
  batchShowUtil.showStartTaskInfo(node.startTaskInfo, output, indent);
  batchShowUtil.showArray(node.certificateReferences, batchShowUtil.showCertReference, $('Certificate References'), $('Certificate Reference'), output, indent);
  batchShowUtil.showArray(node.recentTasks, batchShowUtil.showNodeError, $('Compute Node Errors'), $('Error'), output, indent);
};

batchShowUtil.showFile = function(file, output) {
  if (!file) {
    return;
  }

  if (output.format().json) {
    output.json(file);
    return;
  }

  var indent = 0;
  var showNameValue = batchShowUtil.showNameValue;

  showNameValue($('Name'), file.name, true, output, indent);
  showNameValue($('Is Directory'), file.isDirectory, true, output, indent);
  if (file.properties) {
    if (file.properties.creationTime) {
      showNameValue($('Creation Time'), file.properties.creationTime.toUTCFormat(UTCFormat), true, output, indent);
    }
    if (file.properties.lastModified) {
      showNameValue($('Last Modified Time'), file.properties.lastModified.toUTCFormat(UTCFormat), true, output, indent);
    }
    showNameValue($('Content Length'), file.properties.contentLength, true, output, indent);
    showNameValue($('Content Type'), file.properties.contentType, true, output, indent);
  }
};

batchShowUtil.showDeleteCertError = function(deleteError, output, indent) {
  if (!deleteError) {
    return;
  }

  var showNameValue = batchShowUtil.showNameValue;

  batchShowUtil.showHeader($('Certificate Deletion Error'), false, output, indent);
  indent += 2;
  showNameValue($('Code'), deleteError.code, true, output, indent);
  showNameValue($('Message'), deleteError.message, true, output, indent);
  batchShowUtil.showKvPairs($('Details'), deleteError.values, output, indent);
};

batchShowUtil.showCertificate = function(cert, output) {
  if (!cert) {
    return;
  }

  if (output.format().json) {
    output.json(cert);
    return;
  }

  var indent = 0;
  var showNameValue = batchShowUtil.showNameValue;

  showNameValue($('Thumbprint'), cert.thumbprint, true, output, indent);
  showNameValue($('Thumbprint Algorithm'), cert.thumbprintAlgorithm, true, output, indent);
  showNameValue($('State'), cert.state, true, output, indent);
  showNameValue($('Previous State'), cert.previousState, true, output, indent);
  showNameValue($('Public Data'), cert.publicData, true, output, indent);
  batchShowUtil.showDeleteCertError(cert.deleteCertificateError, output, indent);
};

batchShowUtil.showAppPackage = function(pkg, output, indent) {
  
  if (output.format().json) {
    output.json(pkg);
    return;
  }
  
  var showNameValue = batchShowUtil.showNameValue;

  indent += 2;
  showNameValue($('Version'), pkg.version, true, output, indent);
  showNameValue($('State'), pkg.state, true, output, indent);
  showNameValue($('Format'), pkg.format, true, output, indent);
  if (pkg.lastActivationTime) {
    showNameValue($('Last Activation Time'), pkg.lastActivationTime.toUTCFormat(UTCFormat), true, output, indent);
  }
};

batchShowUtil.showApplicationSummary = function(app, output) {
  if (!app) {
    return;
  }

  if (output.format().json) {
    output.json(app);
    return;
  }
  
  var indent = 0;
  var showNameValue = batchShowUtil.showNameValue;

  showNameValue($('Id'), app.id, true, output, indent);
  showNameValue($('Display Name'), app.displayName, true, output, indent);
  showNameValue($('Versions'), JSON.stringify(app.versions), true, output, indent);
};

batchShowUtil.showApplication = function(app, output) {
  if (!app) {
    return;
  }

  if (output.format().json) {
    output.json(app);
    return;
  }

  var indent = 0;
  var showNameValue = batchShowUtil.showNameValue;

  showNameValue($('Id'), app.id, true, output, indent);
  showNameValue($('Display Name'), app.displayName, true, output, indent);
  batchShowUtil.showArray(app.packages, batchShowUtil.showAppPackage, $('Application Packages'), $('Package'), output, indent);
  showNameValue($('Allow Updates'), app.allowUpdates, true, output, indent);
  showNameValue($('Default Version'), app.defaultVersion, true, output, indent);
};

module.exports = batchShowUtil;
