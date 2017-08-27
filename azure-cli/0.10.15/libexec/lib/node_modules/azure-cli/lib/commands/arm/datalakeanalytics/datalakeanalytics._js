/**
* Copyright (c) Microsoft.  All rights reserved.
*
* Licensed under the Apache License, Version 2.0 (the 'License');
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an 'AS IS' BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

'use strict';
var util = require('util');

var profile = require('../../../util/profile');
var utils = require('../../../util/utils');
var dataLakeAnalyticsUtils = require('./datalakeanalytics.utils');
var tagUtils = require('../tag/tagUtils');
var path = require('path');
var fs = require('fs');

var $ = utils.getLocaleString;

exports.init = function (cli) {
  var log = cli.output;
  var withProgress = cli.interaction.withProgress.bind(cli.interaction);
  
  // This includes the following three categories:
  // Account Management (category of 'dataLakeAnalyticsaccount')
  // Job Management (category of 'dataLakeAnalyticsjob')
  // Catalog Management (category of 'dataLakeAnalyticscatlog')
  var dataLakeCommands = cli.category('datalake')
    .description($('Commands to manage your Data Lake objects'));
  
  var dataLakeAnalyticsCommands = dataLakeCommands.category('analytics')
    .description($('Commands to manage your Data Lake Analytics objects'));
  
  var dataLakeAnalyticsJob = dataLakeAnalyticsCommands.category('job')
    .description($('Commands to manage your Data Lake Analytics Jobs'));
  
  dataLakeAnalyticsJob.command('create [accountName] [jobName] [script]')
    .description($('Submits a job to the specified Data Lake Analytics account.'))
    .usage('[options] <accountName> <jobName> <script>')
    .option('-n --accountName <accountName>', $('the Data Lake Analytics account name to execute the action on'))
    .option('-j --jobName <jobName>', $('the name for this job submission'))
    .option('-t --script <script>', $('the script to run. This can be either the script contents, a relative path or the full path to a UTF-8 encoded script file'))
    .option('-r --runtime <runtime>', $('optionally indicates the runtime to use. The default runtime is the currently deployed production runtime.' +
                                        'Use this if you have uploaded a custom runtime to your account and want job execution to go through that one instead of the one deployed by Microsoft.'))
    .option('-m --compileMode <compileMode>', $('optionally specify the type of compilation to do. Valid values are \'Semantic\', \'Full\', and \'SingleBox\' Default is Full.'))
    .option('-c --compileOnly', $('optionally indicates that this job should only be compiled and not run.'))
    .option('-d --degreeOfParallelism <degreeOfParallelism>', $('optionally specify the degree of parallelism for the job in a range from 1 to 50. Default value is 1.'))
    .option('-p --priority <priority>', $('optionally specify the priority for the job. Default value is 1000, with lower, positive, non-zero values having higher priority. 1 is the highest priority and int.maxValue is the lowest.'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (accountName, jobName, script, options, _) {
    var subscription = profile.current.getSubscription(options.subscription);
    var client = utils.createDataLakeAnalyticsJobManagementClient(subscription);
    
    if (!accountName) {
      return cli.missingArgument('accountName');
    }
    
    if (!jobName) {
      return cli.missingArgument('jobName');
    }
    
    if (!script) {
      return cli.missingArgument('script');
    }
    
    var scriptAsPath = true;
    var scriptContents;
    
    try {
      var normalPath = path.normalize(script);
      scriptContents = fs.readFile(normalPath, 'utf8', _);
    }
      catch (err) {
      // this means it is not a file, treat it as script contents, 
      // which will fail if the contents are not a valid script
      scriptAsPath = false;
    }
    
    if (!scriptAsPath) {
      scriptContents = script;
    }
    
    var degreeOfParallelism = 1;
    if (options.degreeOfParallelism) {
      degreeOfParallelism = parseInt(options.degreeOfParallelism);
    }
    
    var priority = 1000; 
    if (options.priority) {
      priority = parseInt(options.priority);
    }
    
    if (priority < 1) {
      throw new Error('priority (-p or --priority) must be >= 1. Priority passed in: ' + priority);
    }
    
    var jobId = utils.uuidGen();
    var job = {
      name: jobName,
      type: 'USql', // NOTE: We do not support hive jobs yet.
      degreeOfParallelism: degreeOfParallelism,
      priority: priority
    };
    
    var properties = {
      type: 'USql',
      script: scriptContents
    };
    
    if (options.compileMode) {
      properties.compileMode = options.compileMode;
    }
    
    if (options.runtime) {
      properties.runtimeVersion = options.runtime;
    }
    
    job.properties = properties;
    var jobResponse = {};
    if (options.compileOnly) {
      jobResponse = client.job.build(accountName, job, _);
    }
    else {
      jobResponse = client.job.create(accountName, jobId, job, _);
    }
    
    dataLakeAnalyticsUtils.formatOutput(cli, log, options, jobResponse);
  });
  
  dataLakeAnalyticsJob.command('show [accountName] [jobId]')
    .description($('shows the specified job and additional data if desired.'))
    .usage('[options] <accountName> <jobId>')
    .option('-n --accountName <accountName>', $('the Data Lake Analytics account name to execute the action on'))
    .option('-j --jobId <jobId>', $('the job ID of the job to retrieve.'))
    .option('-d --includeDebugInfo', $('optionally indicates that debug info should be output for the job as well.'))
    .option('-t --includeStatistics', $('optionally indicates that statistics for the job should be output as well.'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (accountName, jobId, options, _) {
    var subscription = profile.current.getSubscription(options.subscription);
    var client = utils.createDataLakeAnalyticsJobManagementClient(subscription);
    
    if (!accountName) {
      return cli.missingArgument('accountName');
    }
    
    if (!jobId) {
      return cli.missingArgument('jobId');
    }
    
    var jobResponse = client.job.get(accountName, jobId, _);
    
    if (options.includeStatistics) {
      try {
        var statistics = client.job.getStatistics(accountName, jobId, _);
        jobResponse.properties.statistics = statistics;
      }
        catch (err) {
        log.info('Could not recover statistics info for the job. This happens if the job failed to start. Error reported: ' + err);
      }
    }
    
    if (options.includeDebugInfo) {
      try {
        var debugData = client.job.getDebugDataPath(accountName, jobId, _).paths;
        jobResponse.properties.debugData = debugData;
      }
        catch (err) {
        log.info('Could not recover debug info for the job. This happens if the job completed successfully. If the job did not complete successfully, please run with verbose output for more details.');
      }
    }
    
    dataLakeAnalyticsUtils.formatOutput(cli, log, options, jobResponse);
  });
  
  dataLakeAnalyticsJob.command('cancel [accountName] [jobId]')
    .description($('cancels the specified job.'))
    .usage('[options] <accountName> <jobId>')
    .option('-n --accountName <accountName>', $('the Data Lake Analytics account name to execute the action on'))
    .option('-j --jobId <jobId>', $('the job ID of the job to cancel.'))
    .option('-q, --quiet', $('quiet mode (do not ask for cancel confirmation)'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (accountName, jobId, options, _) {
    var subscription = profile.current.getSubscription(options.subscription);
    var client = utils.createDataLakeAnalyticsJobManagementClient(subscription);
    
    if (!accountName) {
      return cli.missingArgument('accountName');
    }
    
    if (!jobId) {
      return cli.missingArgument('jobId');
    }
    
    if (!options.quiet && !cli.interaction.confirm(util.format($('Cancel Job with id %s in account %s? [y/n] '), jobId, accountName), _)) {
      return;
    }
    
    client.job.cancel(accountName, jobId, _);
    
    log.data($('Successfully canceled the job with ID: ' + jobId));
  });
  
  dataLakeAnalyticsJob.command('wait [accountName] [jobId]')
    .description($('waits for the specified job to complete and outputs the finished job result.'))
    .usage('[options] <accountName> <jobId>')
    .option('-n --accountName <accountName>', $('the Data Lake Analytics account name to execute the action on'))
    .option('-j --jobId <jobId>', $('the job identifier of the job to wait for completion.'))
    .option('-w --waitInterval <wait in seconds>', $('the optional amount of time to wait between each poll of the job, in seconds. Default is five seconds.'))
    .option('-t --timeout <max time to wait in seconds>', $('the optional maximum amount of time to wait for the job to complete, in seconds. Default is to never timeout.'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (accountName, jobId, options) {
    var subscription = profile.current.getSubscription(options.subscription);
    var client = utils.createDataLakeAnalyticsJobManagementClient(subscription);
    
    if (!accountName) {
      return cli.missingArgument('accountName');
    }
    
    if (!jobId) {
      return cli.missingArgument('jobId');
    }
    
    // will result in polling forever.
    var maxAttempts = -1;
    var waitInterval = 5;
    if (options.waitInterval) {
      waitInterval = parseInt(options.waitInterval);
    }

    
    if (options.timeout && parseInt(options.timeout) > 0) {
      maxAttempts = Math.ceil(parseInt(options.timeout )/ waitInterval);
    }
    
    listPoll(client, accountName, jobId, waitInterval, maxAttempts, maxAttempts, function (jobToCheck) {
      dataLakeAnalyticsUtils.formatOutput(cli, log, options, jobToCheck);
    });
  });
  
  dataLakeAnalyticsJob.command('list [accountName]')
    .description($('lists the jobs in the specified account given the specified filters and criteria.'))
    .usage('[options] <accountName>')
    .option('-n --accountName <accountName>', $('the Data Lake Analytics account name to execute the action on'))
    .option('-j --jobName <jobName>', $('An optional filter which returns jobs with only the specified friendly name.'))
    .option('-u, --submitter <submitter>', $('An optional filter which returns jobs only by the specified submitter in the format user@domain'))
    .option('-a, --submittedAfter <submittedAfter>', $('An optional filter which returns jobs only submitted after the specified time (as a date time offset).'))
    .option('-b, --submittedBefore <submittedAfter>', $('An optional filter which returns jobs only submitted before the specified time (as a date time offset).'))
    .option('-t, --state <comma delmited string of states>', $('An optional filter which returns jobs with only the specified states (as comma delmited string). Valid states are: ' +
                                       'accepted, compiling, ended, new, queued, running, scheduling, starting and paused'))
    .option('-r, --result <comma delmited string of results>', $('An optional filter which returns jobs with only the specified results (as comma delmited string). Valid results are: ' +
                                         'none, succeeded, cancelled and failed'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (accountName, options, _) {
    var subscription = profile.current.getSubscription(options.subscription);
    var client = utils.createDataLakeAnalyticsJobManagementClient(subscription);
    log.info('client created');
    if (!accountName) {
      return cli.missingArgument('accountName');
    }
    
    var filter = [];
    if (options.submitter) {
      filter.push('submitter eq \'' + options.submitter + '\'');
    }
    
    if (options.jobName) {
      filter.push('name eq \'' + options.jobName + '\'');
    }
    
    if (options.submittedAfter) {
      filter.push('submitTime ge datetimeoffset\'' + options.submittedAfter + '\'');
    }
    
    if (options.submittedBefore) {
      filter.push('submitTime lt datetimeoffset\'' + options.submittedBefore + '\'');
    }
    
    if (options.state && options.state.length > 0) {
      var intermediateStateArray = options.state.split(',');
      var stateString = '(';
      var stateArray = [];
      for (var i = 0; i < intermediateStateArray.length; i++) {
        stateArray.push('state eq \'' + intermediateStateArray[i] + '\'');
      }
      
      stateString += stateArray.join(' or ') + ')';
      filter.push(stateString);
    }
    
    if (options.result && options.result.length > 0) {
      var intermediateResultArray = options.result.split(',');
      var resultString = '(';
      var resultArray = [];
      for (var j = 0; j < intermediateResultArray.length; j++) {
        resultArray.push('result eq \'' + intermediateResultArray[j] + '\'');
      }
      
      resultString += resultArray.join(' or ') + ')';
      filter.push(resultString);
    }
    
    var parameters;
    if (filter && filter.length > 0) {
      var filterString = filter.join(' and ');
      parameters = {
        filter: filterString
      };
    }
    
    var jobList = [];
    
    withProgress(util.format($('Retrieving job list for account: %s'), accountName),
        function (log, _) {
      var response = client.job.list(accountName, parameters, _);
      jobList = response;
      var pushJobs = function (eachValue) { jobList.push(eachValue); };
      while (response.nextLink && response.nextLink.length > 0) {
        response = client.job.listNext(response.nextLink, _);
        response.forEach(pushJobs, jobList);
      }
    }, _);
    
    dataLakeAnalyticsUtils.formatOutputList(cli, log, options, jobList);
  });
  
  var dataLakeAnalyticsCatalog = dataLakeAnalyticsCommands.category('catalog')
    .description($('Commands to manage your Data Lake Analytics Catalog'));
  
  dataLakeAnalyticsCatalog.command('list [accountName] [itemType] [itemPath]')
    .description($('Lists all of the specified catalog item types under the path or, if the full path is given, just the single catalog item at that path.'))
    .usage('[options] <accountName> <itemType> <itemPath>')
    .option('-n --accountName <accountName>', $('The Data Lake Analytics account name to perform the action on.'))
    .option('-t --itemType <itemType>', $('The catalog item type to return. Valid values are (case insensitive): database, schema, secret, credential, assembly, externaldatasource, table, tablevaluedfunction, view, procedure, types, tablepartition or tablestatistics'))
    .option('-p --itemPath <itemPath>', $('The path to the catalog item(s) to get or list in the format: <FirstPart>.<OptionalSecondPart>.<OptionalThirdPart>.<OptionalFourthPart>. This MUST be null when listing all databases.'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (accountName, itemType, itemPath, options, _) {
    if (!accountName) {
      return cli.missingArgument('accountName');
    }
    
    if (!itemType) {
      return cli.missingArgument('itemType');
    }
    
    var subscription = profile.current.getSubscription(options.subscription);
    
    var output = getCatalogItem(subscription, accountName, itemPath, itemType, _);
    dataLakeAnalyticsUtils.formatOutputList(cli, log, options, output);
  });
  
  var dataLakeAnalyticsCatalogCredential = dataLakeAnalyticsCatalog.category('credential')
    .description($('Commands to manage your Data Lake Analytics Catalog credentials.'));
  
  dataLakeAnalyticsCatalogCredential.command('create [accountName] [databaseName] [hostUri] [credentialName] [credentialUserName]')
    .description($('Creates the specified credential for the specified database.'))
    .usage('[options] <accountName> <databaseName> <hostUri> <credentialName> <credentialUserName>')
    .option('-n --accountName <accountName>', $('The Data Lake Analytics account name to perform the action on.'))
    .option('-d --databaseName <databaseName>', $('The name of the database in which the credential will be created.'))
    .option('-u --hostUri <hostUri>', $('The full host URI associated with the external data source. The credential will authenticate against this host URI.'))
    .option('-e --credentialName <credentialName>', $('name of the credential to be created in the specified database'))
    .option('-a --credentialUserName <credentialUserName>', $('the user name of the credential to authenticate with. Will prompt if not given'))
    .option('-p --password <password>', $('the password that matches with the credentialUserName, will prompt if not given'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (accountName, databaseName, hostUri, credentialName, credentialUserName, options, _) {
    if (!accountName) {
      return cli.missingArgument('accountName');
    }
    
    if (!databaseName) {
      return cli.missingArgument('databaseName');
    }
    
    if (!hostUri) {
      return cli.missingArgument('hostUri');
    }
    
    if (!credentialName) {
      return cli.missingArgument('credentialName');
    }
    
    var subscription = profile.current.getSubscription(options.subscription);
    
    credentialUserName = cli.interaction.promptIfNotGiven('Credential username: ', credentialUserName, _);
    var password = cli.interaction.promptPasswordOnceIfNotGiven('Password: ', options.password, _);
    
    var client = utils.createDataLakeAnalyticsCatalogManagementClient(subscription);
    var params = {
      userId: credentialUserName,
      password: password,
      uri: hostUri
    };
    
    var response = client.catalog.createCredential(accountName, databaseName, credentialName, params, _);
    dataLakeAnalyticsUtils.formatOutput(cli, log, options, response);
  });
  
  dataLakeAnalyticsCatalogCredential.command('set [accountName] [databaseName] [hostUri] [credentialName] [credentialUserName]')
    .description($('Updates the password of the specified credential in the specified database.'))
    .usage('[options] <accountName> <databaseName> <hostUri> <credentialName> <credentialUserName>')
    .option('-n --accountName <accountName>', $('The Data Lake Analytics account name to perform the action on.'))
    .option('-d --databaseName <databaseName>', $('The name of the database in which the credential will be updated.'))
    .option('-u --hostUri <hostUri>', $('The full host URI associated with the external data source. This must be the same as the hostUri used to create the credential.'))
    .option('-e --credentialName <credentialName>', $('credential name to update.'))
    .option('-a --credentialUserName <credentialUserName>', $('the user name of the credential to authenticate with. Will prompt if not given'))
    .option('-p --password <password>', $('the original password that matches with the credentialUserName, will prompt if not given'))
    .option('-w --newPassword <password>', $('the new password to update the credential with, will prompt if not given'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (accountName, databaseName, hostUri, credentialName, credentialUserName, options, _) {
    if (!accountName) {
      return cli.missingArgument('accountName');
    }
    
    if (!databaseName) {
      return cli.missingArgument('databaseName');
    }
    
    if (!hostUri) {
      return cli.missingArgument('hostUri');
    }
    
    if (!credentialName) {
      return cli.missingArgument('credentialName');
    }
    
    var subscription = profile.current.getSubscription(options.subscription);
    
    credentialUserName = cli.interaction.promptIfNotGiven('Credential username: ', credentialUserName, _);
    var password = cli.interaction.promptPasswordOnceIfNotGiven('Old password: ', options.password, _);
    var newPassword = cli.interaction.promptPasswordOnceIfNotGiven('New password: ', options.newPassword, _);
    
    var client = utils.createDataLakeAnalyticsCatalogManagementClient(subscription);
    var params = {
      userId: credentialUserName,
      password: password,
      newPassword: newPassword,
      uri: hostUri
    };
    
    var response = client.catalog.updateCredential(accountName, databaseName, credentialName, params, _);
    dataLakeAnalyticsUtils.formatOutput(cli, log, options, response);
  });
  
  dataLakeAnalyticsCatalogCredential.command('delete [accountName] [databaseName] [credentialName]')
    .description($('Deletes the specified credential in the specified database.'))
    .usage('[options] <accountName> <databaseName> <credentialName>')
    .option('-n --accountName <accountName>', $('The Data Lake Analytics account name to perform the action on.'))
    .option('-d --databaseName <databaseName>', $('The name of the database in which the credential(s) will be deleted.'))
    .option('-e --credentialName <credentialName>', $('Credential name to delete.'))
    .option('-p --password <password>', $('the password that matches with the username inside the specified credential. Required if the caller is not the owner of the Data Lake Analytics account.'))
    .option('-q, --quiet', $('quiet mode (do not ask for delete confirmation)'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (accountName, databaseName, credentialName, options, _) {
    if (!accountName) {
      return cli.missingArgument('accountName');
    }
    
    if (!databaseName) {
      return cli.missingArgument('databaseName');
    }
    
    if (!credentialName) {
      return cli.missingArgument('credentialName');
    }
    
    if (!options.quiet && !cli.interaction.confirm(util.format($('Delete Credential %s in database %s? [y/n] '), credentialName, databaseName), _)) {
      return;
    }
    
    var subscription = profile.current.getSubscription(options.subscription);
    
    var client = utils.createDataLakeAnalyticsCatalogManagementClient(subscription);
    var params = {};
    if (options.password) {
      params.parameters = {
        password: options.password
      };
    }
    
    client.catalog.deleteCredential(accountName, databaseName, credentialName, params, _);
  });
  
  var dataLakeAnalyticsCatalogSecret = dataLakeAnalyticsCatalog.category('secret')
    .description($('DEPRECATED: Commands to manage your Data Lake Analytics Catalog secrets. This category will be removed in a future release. Please use the credential commands instead'));
  
  dataLakeAnalyticsCatalogSecret.command('create [accountName] [databaseName] [hostUri] [secretName]')
    .description($('DEPRECATED: Creates the specified secret for the specified database. This command will be removed in a future release. Please use \'credential create\' instead.'))
    .usage('[options] <accountName> <databaseName> <hostUri> <secretName>')
    .option('-n --accountName <accountName>', $('The Data Lake Analytics account name to perform the action on.'))
    .option('-d --databaseName <databaseName>', $('The name of the database in which the secret will be created.'))
    .option('-u --hostUri <hostUri>', $('The full host URI associated with the external data source. The secret will be used with this host URI.'))
    .option('-e --secretName <secretName>', $('secret name, will prompt if not given'))
    .option('-p --password <password>', $('secret password, will prompt if not given'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (accountName, databaseName, hostUri, secretName, options, _) {
    if (!accountName) {
      return cli.missingArgument('accountName');
    }
    
    if (!databaseName) {
      return cli.missingArgument('databaseName');
    }
    
    if (!hostUri) {
      return cli.missingArgument('hostUri');
    }
    
    var subscription = profile.current.getSubscription(options.subscription);
    
    secretName = cli.interaction.promptIfNotGiven('SecretName: ', secretName, _);
    var password = cli.interaction.promptPasswordOnceIfNotGiven('Password: ', options.password, _);
    
    var client = utils.createDataLakeAnalyticsCatalogManagementClient(subscription);
    var params = {
      secretName: secretName,
      password: password,
      uri: hostUri
    };
    
    var response = client.catalog.createSecret(accountName, databaseName, params.secretName, params, _);
    dataLakeAnalyticsUtils.formatOutput(cli, log, options, response);
  });
  
  dataLakeAnalyticsCatalogSecret.command('set [accountName] [databaseName] [hostUri] [secretName]')
    .description($('DEPRECATED: Updates the password and/or hostUri of the specified secret in the specified database. This command will be removed in a future release. Please use \'credential set\' instead.'))
    .usage('[options] <accountName> <databaseName> <hostUri> <secretName>')
    .option('-n --accountName <accountName>', $('The Data Lake Analytics account name to perform the action on.'))
    .option('-d --databaseName <databaseName>', $('The name of the database in which the secret will be updated.'))
    .option('-u --hostUri <hostUri>', $('The full host URI associated with the external data source. The secret will be used with this host URI.'))
    .option('-e --secretName <secretName>', $('secret name, will prompt if not given'))
    .option('-p --password <password>', $('secret password, will prompt if not given'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (accountName, databaseName, hostUri, secretName, options, _) {
    if (!accountName) {
      return cli.missingArgument('accountName');
    }
    
    if (!databaseName) {
      return cli.missingArgument('databaseName');
    }
    
    if (!hostUri) {
      return cli.missingArgument('hostUri');
    }
    
    var subscription = profile.current.getSubscription(options.subscription);
    
    secretName = cli.interaction.promptIfNotGiven('SecretName: ', secretName, _);
    var password = cli.interaction.promptPasswordOnceIfNotGiven('Password: ', options.password, _);
    
    var client = utils.createDataLakeAnalyticsCatalogManagementClient(subscription);
    var params = {
      secretName: secretName,
      password: password,
      uri: hostUri
    };
    
    var response = client.catalog.updateSecret(accountName, databaseName, params.secretName, params, _);
    dataLakeAnalyticsUtils.formatOutput(cli, log, options, response);
  });
  
  dataLakeAnalyticsCatalogSecret.command('delete [accountName] [databaseName] [secretName]')
    .description($('DEPRECATED: Deletes the specified secret in the specified database. This command will be removed in a future release. Please use \'credential delete\' instead.'))
    .usage('[options] <accountName> <databaseName> <hostUri> <secretName>')
    .option('-n --accountName <accountName>', $('The Data Lake Analytics account name to perform the action on.'))
    .option('-d --databaseName <databaseName>', $('The name of the database in which the secret(s) will be deleted.'))
    .option('-e --secretName <secretName>', $('Optional secret name to delete, if not specified will delete all secrets in the specified database'))
    .option('-q, --quiet', $('quiet mode (do not ask for delete confirmation)'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (accountName, databaseName, secretName, options, _) {
    if (!accountName) {
      return cli.missingArgument('accountName');
    }
    
    if (!databaseName) {
      return cli.missingArgument('databaseName');
    }
    
    if (!options.quiet && !cli.interaction.confirm(util.format($('Delete Secret(s) in database %s? [y/n] '), databaseName), _)) {
      return;
    }
    
    var subscription = profile.current.getSubscription(options.subscription);
    
    var client = utils.createDataLakeAnalyticsCatalogManagementClient(subscription);
    
    if (!secretName) {
      client.catalog.deleteAllSecrets(accountName, databaseName, _);
    }
    else {
      client.catalog.deleteSecret(accountName, databaseName, secretName, _);
    }
  });
  
  var dataLakeAnalyticsAccount = dataLakeAnalyticsCommands.category('account')
    .description($('Commands to manage your Data Lake Analytics accounts'));
  
  dataLakeAnalyticsAccount.command('list')
    .description($('List all Data Lake Analytics accounts available for your subscription or subscription and resource group'))
    .usage('[options]')
    .option('-g --resource-group <resource-group>', $('the optional resource group to list the accounts in'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (options, _) {
    var subscription = profile.current.getSubscription(options.subscription);
    var accounts = listAllDataLakeAnalyticsAccounts(subscription, options.resourceGroup, _);
    dataLakeAnalyticsUtils.formatOutputList(cli, log, options, accounts);
  });
  
  dataLakeAnalyticsAccount.command('show [accountName]')
    .description($('Shows a Data Lake Analytics account based on account name'))
    .usage('[options] <accountName>')
    .option('-n --accountName <accountName>', $('the Data Lake Analytics account name to retrieve'))
    .option('-g --resource-group <resource-group>', $('the optional resource group to list the accounts in'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (accountName, options, _) {
    if (!accountName) {
      return cli.missingArgument('accountName');
    }
    
    var subscription = profile.current.getSubscription(options.subscription);
    var client = utils.createDataLakeAnalyticsManagementClient(subscription);
    
    if (!options.resourceGroup) {
      options.resourceGroup = getResourceGroupByAccountName(subscription, options.resourceGroup, accountName, _);
    }
    
    var dataLakeAnalyticsAccount = client.account.get(options.resourceGroup, accountName, _);
    dataLakeAnalyticsUtils.formatOutput(cli, log, options, dataLakeAnalyticsAccount);
  });
  
  dataLakeAnalyticsAccount.command('delete [accountName]')
    .description($('Deletes a Data Lake Analytics Account based on account name'))
    .usage('[options] <accountName>')
    .option('-n --accountName <accountName>', $('the Data Lake Analytics account name to delete'))
    .option('-g --resource-group <resource-group>', $('the optional resource group to force the command to find the Data Lake Analytics account to delete in.'))
    .option('-q, --quiet', $('quiet mode (do not ask for delete confirmation)'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (accountName, options, _) {
    if (!accountName) {
      return cli.missingArgument('accountName');
    }
    
    if (!options.quiet && !cli.interaction.confirm(util.format($('Delete Data Lake Analytics Account %s? [y/n] '), accountName), _)) {
      return;
    }
    
    var subscription = profile.current.getSubscription(options.subscription);
    var client = utils.createDataLakeAnalyticsManagementClient(subscription);
    
    if (!options.resourceGroup) {
      options.resourceGroup = getResourceGroupByAccountName(subscription, options.resourceGroup, accountName, _);
    }
    
    client.account.deleteMethod(options.resourceGroup, accountName, _);
    log.info($('Successfully deleted the specified Data Lake Analytics Account.'));
  });
  
  dataLakeAnalyticsAccount.command('create [accountName] [location] [resource-group] [defaultDataLakeStore]')
    .description($('Creates a Data Lake Analytics Account'))
    .usage('[options] <accountName> <location> <resource-group> <defaultDataLakeStore>')
    .option('-n --accountName <accountName>', $('The Data Lake Analytics account name to create'))
    .option('-l --location <location>', $('the location the Data Lake Analytics account will be created in. Valid values are: North Central US, South Central US, Central US, West Europe, North Europe, West US, East US, East US 2, Japan East, Japan West, Brazil South, Southeast Asia, East Asia, Australia East, Australia Southeast'))
    .option('-g --resource-group <resource-group>', $('the resource group to create the account in'))
    .option('-d --defaultDataLakeStore <defaultDataLakeStore>', $('the default Data Lake Store to associate with this account.'))
    .option('-p --maxDegreeOfParallelism <1 to the account limit>', $('Optional, the maximum supported degree of parallelism for this account, from 1 to the account defined limit. Default is 30'))
    .option('-r --queryStoreRetentionTime <1 to 180>', $('Optional, the number of days that job metadata is retained, from 1 to 180. Default is 30'))
    .option('-j --maxJobCount <1 to account limit>', $('Optional, the maximum supported jobs running under the account at the same time., from 1 to the account defined limit. Default is 3'))
    .option('-t --tags <tags>', $('Tags to set to the the Data Lake Analytics account. Can be mutliple. ' +
            'In the format of \'name=value\'. Name is required and value is optional. For example, -t tag1=value1;tag2'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (accountName, location, resourceGroup, defaultDataLakeStore, options, _) {
    var subscription = profile.current.getSubscription(options.subscription);
    var tags = {};
    tags = tagUtils.buildTagsParameter(tags, options);
    var dataLakeAnalyticsAccount = createOrUpdateDataLakeAnalyticsAccount(subscription, accountName, resourceGroup, location, defaultDataLakeStore, options.maxDegreeOfParallelism, options.queryStoreRetentionTime, options.maxJobCount, tags, _);
    dataLakeAnalyticsUtils.formatOutput(cli, log, options, dataLakeAnalyticsAccount);
  });
  
  dataLakeAnalyticsAccount.command('set [accountName]')
    .description($('Updates the properties of an existing Data Lake Analytics Account'))
    .usage('[options] <accountName>')
    .option('-n --accountName <accountName>', $('The Data Lake Analytics Account name to perform the action on.'))
    .option('-g --resource-group <resource-group>', $('the optional resource group to forcibly look for the account to update in'))
    .option('-p --maxDegreeOfParallelism <1 to the account limit>', $('Optionally update the maximum supported degree of parallelism for this account, from 1 to the account defined limit.'))
    .option('-r --queryStoreRetentionTime <1 to 180>', $('Optionally update the number of days that job metadata is retained, from 1 to 180.'))
    .option('-j --maxJobCount <1 to account limit>', $('Optionally update the maximum supported jobs running under the account at the same time., from 1 to the account defined limit.'))
    .option('-t --tags <tags>', $('Tags to set to the Data Lake Analytics account group. Can be mutliple. ' +
            'In the format of \'name=value\'. Name is required and value is optional. For example, -t tag1=value1;tag2'))
    .option('--no-tags', $('remove all existing tags'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (accountName, defaultDataLakeStore, options, _) {
    var subscription = profile.current.getSubscription(options.subscription);
    var client = utils.createDataLakeAnalyticsManagementClient(subscription);
    
    if (!options.resourceGroup) {
      options.resourceGroup = getResourceGroupByAccountName(subscription, options.resourceGroup, accountName, _);
    }
    
    var dataLakeAnalyticsAccount = client.account.get(options.resourceGroup, accountName, _);
    
    var tags = {};
    if (!options.tags && !options.no-tags) {
      tags = dataLakeAnalyticsAccount.tags;
    }
    else {
      tags = tagUtils.buildTagsParameter(tags, options);
    }
    
    dataLakeAnalyticsAccount = createOrUpdateDataLakeAnalyticsAccount(subscription, accountName, options.resourceGroup, dataLakeAnalyticsAccount.location, null, options.maxDegreeOfParallelism, options.queryStoreRetentionTime, options.maxJobCount, tags, _);
    dataLakeAnalyticsUtils.formatOutput(cli, log, options, dataLakeAnalyticsAccount);
  });
  
  var dataLakeAnalyticsAccountDataSource = dataLakeAnalyticsAccount.category('datasource')
    .description($('Commands to manage your Data Lake Analytics account data sources'));
  
  dataLakeAnalyticsAccountDataSource.command('add [accountName]')
    .description($('Adds an existing data source (Data Lake Store or Azure Blob) to the Data Lake Analytics Account'))
    .usage('[options] <accountName>')
    .option('-n --accountName <accountName>', $('The Data Lake Analytics Account name to perform the action on.'))
    .option('-l --dataLakeStore <dataLakeStore>', $('the Data Lake Store account to add. NOTE: this argument cannot be specified with --azureBlob and --accessKey.'))
    .option('-b --azureBlob <azureBlob>', $('the azure blob to add to the account. NOTE: this argument and --accessKey are part of a parameter set, and cannot be specified with --dataLakeStore.'))
    .option('-k --accessKey <accessKey>', $('the access key associated with the azureBlob. NOTE: this argument and --azureBlob are part of a parameter set, and cannot be specified with --dataLakeStore.'))
    .option('-g --resource-group <resource-group>', $('the optional resource group to forcibly look for the account to update in'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (accountName, options, _) {
    var subscription = profile.current.getSubscription(options.subscription);
    var client = utils.createDataLakeAnalyticsManagementClient(subscription);
    
    if (!options.dataLakeStore && !options.azureBlob) {
      throw new Error($('Either --dataLakeStore or --azureBlob and --accessKey must be specified. They are two separate options and cannot all be specified at once.'));
    }
    
    if (options.dataLakeStore && options.azureBlob) {
      throw new Error($('Either --dataLakeStore or --azureBlob and --accessKey must be specified. They are two separate options and cannot all be specified at once.'));
    }
    
    if (options.dataLakeStore && options.accessKey) {
      throw new Error($('--accessKey can only be specified with --azureBlob.'));
    }
    
    if (options.azureBlob && !options.accessKey) {
      throw new Error($('--accessKey must be specified with --azureBlob.'));
    }
    
    if (!options.resourceGroup) {
      options.resourceGroup = getResourceGroupByAccountName(subscription, options.resourceGroup, accountName, _);
    }
    
    if (options.dataLakeStore) {
      client.dataLakeStoreAccounts.add(options.resourceGroup, accountName, options.dataLakeStore, _);
    }
    else {
      var parameters = {
        accessKey: options.accessKey
      };
      
      client.storageAccounts.add(options.resourceGroup, accountName, options.azureBlob, parameters, _);
    }
    
    log.info($('Successfully added the storage account specified to the Data Lake Analytics account: ' + accountName));
  });
  
  dataLakeAnalyticsAccountDataSource.command('delete [accountName]')
    .description($('removes a data source (Data Lake Store or Azure Blob) from the Data Lake Analytics Account'))
    .usage('[options] <accountName>')
    .option('-n --accountName <accountName>', $('The Data Lake Analytics Account name to perform the action on.'))
    .option('-l --dataLakeStore <dataLakeStore>', $('the Data Lake to remove from the account. NOTE: this argument is part of a parameter set, and cannot be specified with --azureBlob.'))
    .option('-b --azureBlob <azureBlob>', $('the azure blob to remove from the account. NOTE: this argument is part of a parameter set, and cannot be specified with --dataLakeStore.'))
    .option('-g --resource-group <resource-group>', $('the optional resource group to forcibly look for the account to update in'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (accountName, options, _) {
    var subscription = profile.current.getSubscription(options.subscription);
    var client = utils.createDataLakeAnalyticsManagementClient(subscription);
    
    if (!options.dataLakeStore && !options.azureBlob) {
      throw new Error($('Either --dataLakeStore or --azureBlob and --accessKey must be specified. They are two separate options and cannot all be specified at once.'));
    }
    
    if (options.dataLakeStore && options.azureBlob) {
      throw new Error($('Either --dataLakeStore or --azureBlob and --accessKey must be specified. They are two separate options and cannot all be specified at once.'));
    }
    
    if (!options.resourceGroup) {
      options.resourceGroup = getResourceGroupByAccountName(subscription, options.resourceGroup, accountName, _);
    }
    
    if (options.dataLakeStore) {
      client.dataLakeStoreAccounts.deleteMethod(options.resourceGroup, accountName, options.dataLakeStore, _);
    }
    else {
      client.storageAccounts.deleteMethod(options.resourceGroup, accountName, options.azureBlob, _);
    }
    
    log.info($('Successfully removed the storage account specified from Data Lake Analytics account: ' + accountName));
  });
  
  dataLakeAnalyticsAccountDataSource.command('set [accountName] [azureBlob] [accessKey]')
    .description($('Sets an existing data source (Azure Blob) in the Data Lake Analytics Account. Typically used to update the access key (for Azure Blob)'))
    .usage('[options] <accountName> <azureBlob> <accessKey>')
    .option('-n --accountName <accountName>', $('The Data Lake Analytics Account name to perform the action on.'))
    .option('-b --azureBlob <azureBlob>', $('the azure blob to set in the account.'))
    .option('-k --accessKey <accessKey>', $('the updated access key associated with the azureBlob to update.'))
    .option('-g --resource-group <resource-group>', $('the optional resource group to forcibly look for the account to update in'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (accountName, azureBlob, accessKey, options, _) {
    var subscription = profile.current.getSubscription(options.subscription);
    var client = utils.createDataLakeAnalyticsManagementClient(subscription);
    
    if (!azureBlob || !accessKey) {
      throw new Error($('--accessKey must be specified with --azureBlob.'));
    }
    
    if (!options.resourceGroup) {
      options.resourceGroup = getResourceGroupByAccountName(subscription, options.resourceGroup, accountName, _);
    }
    
    var params = {
      parameters: {
        accessKey: accessKey
      }
    };
    
    client.storageAccounts.update(options.resourceGroup, accountName, azureBlob, params, _);
    
    log.info($('Successfully updated the storage account specified for Data Lake Analytics account: ' + accountName));
  });
  
  function createOrUpdateDataLakeAnalyticsAccount(subscription, accountName, resourceGroup, location, defaultDataLakeStore, maxDegreeOfParallelism, queryStoreRetentionTime, maxJobCount, tags, _) {
    if (!accountName) {
      return cli.missingArgument('accountName');
    }
    if (!resourceGroup) {
      return cli.missingArgument('resourceGroup');
    }
    
    var client = utils.createDataLakeAnalyticsManagementClient(subscription);
    var create = false;
    try {
      client.account.get(resourceGroup, accountName, _);
    }
      catch (err) {
      create = true;
    }
    
    var accountParams = {
      tags: tags
    };
    
    if (maxDegreeOfParallelism) {
      accountParams.maxDegreeOfParallelism = maxDegreeOfParallelism;
    }
    
    if (queryStoreRetentionTime) {
      accountParams.queryStoreRetention = queryStoreRetentionTime;
    }
    
    if (maxJobCount) {
      accountParams.maxJobCount = maxJobCount;
    }
    
    if (create) {
      if (!location) {
        return cli.missingArgument('location');
      }
      if (!defaultDataLakeStore) {
        return cli.missingArgument('defaultDataLakeStore');
      }
      
      accountParams.defaultDataLakeStoreAccount = defaultDataLakeStore;
      accountParams.dataLakeStoreAccounts = [{ name: defaultDataLakeStore }];
      accountParams.location = location;
      
      client.account.create(resourceGroup, accountName, accountParams, _);
    }
    else {
      var options = {
        parameters: accountParams
      };
      
      client.account.update(resourceGroup, accountName, options, _);
    }
    
    return client.account.get(resourceGroup, accountName, _);
  }
  
  function getCatalogItem(subscription, accountName, itemPath, itemType, _) {
    var isList = isCatalogItemOrList(itemPath, itemType);
    var client = utils.createDataLakeAnalyticsCatalogManagementClient(subscription);
    var catalogItem = getCatalogItemObject(itemPath);
    var toReturn = [];
    
    switch (itemType.toLowerCase()) {
      case 'database':
        if (isList) {
          toReturn = client.catalog.listDatabases(accountName, _);
        }
        else {
          toReturn.push(client.catalog.getDatabase(accountName, catalogItem.databaseName, _));
        }
        break;
      case 'schema':
        if (isList) {
          toReturn = client.catalog.listSchemas(accountName, catalogItem.databaseName, _);
        }
        else {
          toReturn.push(client.catalog.getSchema(accountName, catalogItem.databaseName, catalogItem.schemaAssemblyOrExternalDataSourceName, _));
        }
        break;
      case 'secret':
        if (isList) {
          throw new Error($('U-SQL Secrets can only be returned by specific database secret name combination. There is no list support.'));
        }
        else {
          toReturn.push(client.catalog.getSecret(accountName, catalogItem.databaseName, catalogItem.schemaAssemblyOrExternalDataSourceName, _));
        }
        break;

      case 'assembly':
        if (isList) {
          toReturn = client.catalog.listAssemblies(accountName, catalogItem.databaseName, _);
        }
        else {
          toReturn.push(client.catalog.getAssembly(accountName, catalogItem.databaseName, catalogItem.schemaAssemblyOrExternalDataSourceName, _));
        }
        break;
      case 'externaldatasource':
        if (isList) {
          toReturn = client.catalog.listExternalDataSources(accountName, catalogItem.databaseName, _);
        }
        else {
          toReturn.push(client.catalog.getExternalDataSource(accountName, catalogItem.databaseName, catalogItem.schemaAssemblyOrExternalDataSourceName, _));
        }
        break;
      case 'credential':
        if (isList) {
          toReturn = client.catalog.listCredentials(accountName, catalogItem.databaseName, _);
        }
        else {
          toReturn.push(client.catalog.getCredential(accountName, catalogItem.databaseName, catalogItem.schemaAssemblyOrExternalDataSourceName, _));
        }
        break;
      case 'table':
        if (isList) {
          toReturn = client.catalog.listTables(accountName, catalogItem.databaseName, catalogItem.schemaAssemblyOrExternalDataSourceName, _);
        }
        else {
          toReturn.push(client.catalog.getTable(accountName, catalogItem.databaseName, catalogItem.schemaAssemblyOrExternalDataSourceName, catalogItem.tableOrTableValuedFunctionName, _));
        }
        break;
      case 'tablevaluedfunction':
        if (isList) {
          toReturn = client.catalog.listTableValuedFunctions(accountName, catalogItem.databaseName, catalogItem.schemaAssemblyOrExternalDataSourceName, _);
        }
        else {
          toReturn.push(client.catalog.getTableValuedFunction(accountName, catalogItem.databaseName, catalogItem.schemaAssemblyOrExternalDataSourceName, catalogItem.tableOrTableValuedFunctionName, _));
        }
        break;
      case 'tablestatistics':
        if (isList) {
          toReturn = client.catalog.listTableStatistics(accountName, catalogItem.databaseName, catalogItem.schemaAssemblyOrExternalDataSourceName, catalogItem.tableOrTableValuedFunctionName, _);
        }
        else {
          toReturn.push(client.catalog.getTableStatistic(accountName, catalogItem.databaseName, catalogItem.schemaAssemblyOrExternalDataSourceName, catalogItem.tableOrTableValuedFunctionName, catalogItem.tableStatisticsName, _));
        }
        break;
      case 'tablepartition':
        if (isList) {
          toReturn = client.catalog.listTablePartitions(accountName, catalogItem.databaseName, catalogItem.schemaAssemblyOrExternalDataSourceName, catalogItem.tableOrTableValuedFunctionName, _);
        }
        else {
          toReturn.push(client.catalog.getTablePartition(accountName, catalogItem.databaseName, catalogItem.schemaAssemblyOrExternalDataSourceName, catalogItem.tableOrTableValuedFunctionName, catalogItem.tableStatisticsName, _));
        }
        break;
      case 'view':
        if (isList) {
          toReturn = client.catalog.listViews(accountName, catalogItem.databaseName, catalogItem.schemaAssemblyOrExternalDataSourceName, _);
        }
        else {
          toReturn.push(client.catalog.getView(accountName, catalogItem.databaseName, catalogItem.schemaAssemblyOrExternalDataSourceName, catalogItem.tableOrTableValuedFunctionName, _));
        }
        break;
      case 'procedure':
        if (isList) {
          toReturn = client.catalog.listProcedures(accountName, catalogItem.databaseName, catalogItem.schemaAssemblyOrExternalDataSourceName, _);
        }
        else {
          toReturn.push(client.catalog.getProcedure(accountName, catalogItem.databaseName, catalogItem.schemaAssemblyOrExternalDataSourceName, catalogItem.tableOrTableValuedFunctionName, _));
        }
        break;
      case 'types':
        if (isList) {
          toReturn = client.catalog.listTypes(accountName, catalogItem.databaseName, catalogItem.schemaAssemblyOrExternalDataSourceName, _);
        }
        else {
          throw new Error($('U-SQL Types can only be returned in a list of all types within a database and schema combination.'));
        }
        break;
      default:
        throw new Error($('Invalid catalog item type: ' + itemType + ' specified. Valid values are (case insensitive): database, schema, assembly, externaldatasource, table, tablevaluedfunction or tablestatistics'));
    }
    
    return toReturn;
  }
  
  function isCatalogItemOrList(itemPath, itemType) {
    var isList = false;
    if (!itemPath || itemPath === '') {
      // in this case, it is a list of ALL catalog items of the specified type across the entire catalog.
      return true;
    }
    
    var catalogItem = getCatalogItemObject(itemPath);
    switch (itemType.toLowerCase()) {
      case 'database':
        if (!catalogItem.databaseName) {
          isList = true;
        }
        break;
      case 'schema':
      case 'assembly':
      case 'externaldatasource':
      case 'credential':
      case 'secret':
        if (!catalogItem.databaseName) {
          throw new Error($('Invalid catalog path: ' + itemPath + 
            '. A catalog path must be in the following format with no empty internal elements:' +
            ' <FirstPart>.<OptionalSecondPart>.<OptionalThirdPart>.<OptionalFourthPart>. For example: Master.dbo.tableName.tableStatisticsName'));
        }
        
        if (!catalogItem.schemaAssemblyOrExternalDataSourceName) {
          isList = true;
        }
        break;
      case 'table':
      case 'tablevaluedfunction':
      case 'procedure':
      case 'view':
      case 'types':
        if (!catalogItem.databaseName || !catalogItem.schemaAssemblyOrExternalDataSourceName) {
          throw new Error($('Invalid catalog path: ' + itemPath + 
            '. A catalog path must be in the following format with no empty internal elements:' +
            ' <FirstPart>.<OptionalSecondPart>.<OptionalThirdPart>.<OptionalFourthPart>. For example: Master.dbo.tableName.tableStatisticsName'));
        }
        
        if (!catalogItem.tableOrTableValuedFunctionName) {
          isList = true;
        }
        break;
      case 'tablestatistics':
      case 'tablepartition':
        if (!catalogItem.databaseName || !catalogItem.schemaAssemblyOrExternalDataSourceName || !catalogItem.tableOrTableValuedFunctionName) {
          throw new Error($('Invalid catalog path: ' + itemPath + 
            '. A catalog path must be in the following format with no empty internal elements:' +
            ' <FirstPart>.<OptionalSecondPart>.<OptionalThirdPart>.<OptionalFourthPart>. For example: Master.dbo.tableName.tableStatisticsName'));
        }
        
        if (!catalogItem.tableStatisticsName) {
          isList = true;
        }
        break;
    }
    
    return isList;
  }
  
  function getCatalogItemObject(itemPath) {
    var toReturn = {
      fullitemPath: itemPath
    };
    
    if (!itemPath || itemPath.indexOf('.') < 0) {
      toReturn.databaseName = itemPath;
      return toReturn;
    }
    
    var regexPattern = /^(\w+|\[.+\])?(\.(\w+|\[.+\]))?(\.(\w+|\[.+\]))?(\.(\w+|\[.+\]))?$/;
    var matches = regexPattern.exec(itemPath);
    if (!matches) {
      throw new Error($('Invalid catalog path: ' + itemPath + 
        '. A catalog path must be in the following format with no empty internal elements:' +
        ' <FirstPart>.<OptionalSecondPart>.<OptionalThirdPart>.<OptionalFourthPart>. For example: Master.dbo.tableName.tableStatisticsName'));
    }
    
    var firstPart = sanitizeitemPath(matches[1], itemPath);
    var secondPart = sanitizeitemPath(matches[3], itemPath);
    var thirdPart = sanitizeitemPath(matches[5], itemPath);
    var fourthPart = sanitizeitemPath(matches[7], itemPath);
    
    toReturn.databaseName = firstPart;
    toReturn.schemaAssemblyOrExternalDataSourceName = secondPart;
    toReturn.tableOrTableValuedFunctionName = thirdPart;
    toReturn.tableStatisticsName = fourthPart;
    
    return toReturn;
  }
  
  function sanitizeitemPath(path, fullPath) {
    if (!path) {
      return path;
    }
    
    if (path.indexOf('[') === 0 && path.lastIndexOf(']') === path.length - 1) {
      path = path.substring(1);
      path = path.substring(0, path.length - 1);
    }
    
    if (path.length < 1) {
      throw new Error($('Invalid catalog path: ' + fullPath + 
        '. A catalog path must be in the following format with no empty internal elements:' +
        ' <FirstPart>.<OptionalSecondPart>.<OptionalThirdPart>.<OptionalFourthPart>. For example: Master.dbo.tableName.tableStatisticsName'));
    }
    
    return path;
  }
  
  function listAllDataLakeAnalyticsAccounts(subscription, resourceGroup, _) {
    var client = utils.createDataLakeAnalyticsManagementClient(subscription);
    var accounts;
    var response;
    if (!resourceGroup) {
      response = client.account.list(_);
      log.info(util.inspect(response));
      accounts = response;
      while (response.nextLink) {
        response = client.account.listNext(response.nextLink);
        accounts.push.apply(accounts, response);
      }
    }
    else {
      response = client.account.listByResourceGroup(resourceGroup, _);
      accounts = response;
      while (response.nextLink) {
        response = client.account.listByResourceGroupNext(response.nextLink);
        accounts.push.apply(accounts, response);
      }
    }
    
    return accounts;
  }
  
  function getResourceGroupByAccountName(subscription, resourceGroup, name, _) {
    var accounts = listAllDataLakeAnalyticsAccounts(subscription, resourceGroup, _);
    for (var i = 0; i < accounts.length; i++) {
      if (accounts[i].name === name) {
        var acctId = accounts[i].id;
        var rgStart = acctId.indexOf('resourceGroups/') + ('resourceGroups/'.length);
        var rgEnd = acctId.indexOf('/providers/');
        return acctId.substring(rgStart, rgEnd);
      }
    }
    
    throw new Error($('Could not find account: ' + name + ' in any resource group in subscription: ' + subscription.name + ' with id: ' + subscription.id));
  }
  
  function listPoll(client, accountName, jobId, waitInterval, attemptsLeft, maxAttempts, callback) {
    if (attemptsLeft === 0) {
      throw new Error($('Data Lake Analytics Job with ID: ' + jobId + ' has not completed in ' + waitInterval * maxAttempts + ' seconds. Check job runtime or increase the value of --timeout'));
    }
    
    var objectFound = false;
    client.job.get(accountName, jobId, function (err, result) {
      objectFound = result.state === 'Ended';
      if (objectFound === true) {
        callback(result);
      }
      else {
        setTimeout(function () {
          listPoll(client, accountName, jobId, waitInterval, attemptsLeft - 1, maxAttempts, callback);
        }, waitInterval * 1000);
      }
    });
  }
};