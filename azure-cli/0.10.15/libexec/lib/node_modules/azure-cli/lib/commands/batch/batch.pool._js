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
var moment = require('moment');
var batchUtil = require('./batch.util');
var batchShowUtil = require('./batch.showUtil');
var utils = require('../../util/utils');
var startProgress = batchUtil.startProgress;
var endProgress = batchUtil.endProgress;

var $ = utils.getLocaleString;

/**
* Init batch pool command
*/
exports.init = function(cli) {
  
  //Init batchUtil
  batchUtil.init(cli);

  /**
  * Define batch pool command usage
  */
  var batch = cli.category('batch')
    .description($('Commands to manage your Batch objects'));

  var logger = cli.output;

  var interaction = cli.interaction;

  var pool = batch.category('pool')
    .description($('Commands to manage your Batch pools'));

  var autoscale = pool.category('autoscale')
    .description($('Commands to manage autoscale of your Batch pools'));
    
  var allStats = pool.category('all-stats')
    .description($('Commands to manage all the pools under your Batch account'));

  var usageMetrics = pool.category('usage-metrics')
    .description($('Commands to manage usage metrics of your Batch pools'));
    
  var nodeAgentSkus = pool.category('node-agent-skus')
    .description($('Commands to manage node agent skus of IaaS pools'));
    
  pool.command('create [json-file]')
    .description($('Create a Batch pool'))
    .option('-f, --json-file <json-file>', $('the file containing the pool object to create in JSON format, if this parameter is specified, all other pool parameters are ignored'))
    .option('-i, --id <pool-id>', $('the Batch pool id'))
    .option('-S, --vm-size <vm-size>', $('the size of virtual machines in the pool, ex: small, Standard_D14'))
    .option('-t, --target-dedicated <target-dedicated>', $('the desired number of compute nodes in the pool'))
    .option('-F, --autoscale-formula <autoscale-formula>', $('the formula for the desired number of compute nodes in the pool, see https://azure.microsoft.com/en-us/documentation/articles/batch-automatic-scaling/ for more detail'))
    .option('-o, --os-family <os-family>', $('the Azure Guest OS family to be installed on the virtual machines in the pool, this parameter cannot be used with the --image-publisher, --image-offer, --image-sku and --node-agent-id parameters'))
    .option('-p, --image-publisher <image-publisher>', $('the publisher of the Azure Virtual Machines Marketplace image, ex: Canonical or MicrosoftWindowsServer'))
    .option('-O, --image-offer <image-offer>', $('the offer type of the Azure Virtual Machines Marketplace image, ex: UbuntuServer or WindowsServer'))
    .option('-K, --image-sku <image-sku>', $('the SKU of the Azure Virtual Machines Marketplace image, ex: 14.04.0-LTS or 2012-R2-Datacenter'))
    .option('-n, --node-agent-id <node-agent-id>', $('the SKU of Batch Node Agent to be provisioned on the compute node'))
    .option('--resize-timeout <resize-timeout>', $('the timeout for allocation of compute nodes to the pool, in ISO 8601 duration formation'))
    .option('-c, --start-task-cmd <start-task-cmd>', $('the command line of the start task'))
    .option('--certificate-ref <certificate-ref>', $('the semicolon separated list of thumbprints specifying the certificates to be installed on each compute node in the pool'))
    .option('--app-package-ref <app-package-ref>', $('the semicolon separated list of ids specifying the application packages to be installed on each compute node in the pool'))
    .option('--metadata <metadata>', $('the semicolon separated list of name-value pairs associated with the pool as metadata, ex: name1=value1;name2=value'))
    .appendBatchAccountOption()
    .execute(createPool);

  pool.command('list')
    .description($('List Batch pools'))
    .appendODataFilterOption(true, true, true)
    .appendBatchAccountOption()
    .execute(listPool);
  
  usageMetrics.command('list')
   .description($('List Batch pool usage metrics'))
   .option('-s, --start-time <start-time>', $('the earliest time from which to include metrics'))
   .option('-e, --end-time <end-time>', $('the latest time from which to include metrics'))
   .appendODataFilterOption(false, true, false)
   .appendBatchAccountOption()
   .execute(listUsageMetrics);

  pool.command('show [pool-id]')
    .description($('Show information about the specified Batch pool'))
    .option('-i, --id <pool-id>', $('the Batch pool id'))
    .appendODataFilterOption(true, false, true)
    .appendCommonHeaderFilterOption(true, true)
    .appendBatchAccountOption()
    .execute(showPool);

  allStats.command('show')
   .description($('Show lifetime summary statistics for all of the pools'))
   .appendBatchAccountOption()
   .execute(showAllPoolsStats);

  pool.command('delete [pool-id]')
    .description($('Delete the specified Batch pool'))
    .option('-i, --id <pool-Id>', $('the Batch pool id'))
    .option('-q, --quiet', $('remove the specified Batch pool without confirmation'))
    .appendCommonHeaderFilterOption(true, true)
    .appendBatchAccountOption()
    .execute(deletePool);

  pool.command('set [pool-id] [json-file]')
    .description($('Patch/Update the properties of the specified Batch pool'))
    .option('-i, --id <pool-id>', $('the Batch pool id'))
    .option('-f, --json-file <json-file>', $('the file containing the patch/update pool properties to apply in JSON format, if this parameter is specified, all other pool property parameters are ignored'))
    .option('-c, --start-task-cmd <start-task-cmd>', $('the command line of the start task'))
    .option('--certificate-ref <certificate-ref>', $('the semicolon separated list of thumbprints specifying the certificates to be installed on each compute node in the pool'))
    .option('--app-package-ref <app-package-ref>', $('the semicolon separated list of ids specifying the application packages to be installed on each compute node in the pool'))
    .option('--metadata <metadata>', $('the semicolon separated list of name-value pairs associated with the pool as metadata, ex: name1=value1;name2=value'))
    .option('-r, --replace', $('uses update instead of patch'))
    .appendCommonHeaderFilterOption(true, true)
    .appendBatchAccountOption()
    .execute(updatePool);

  nodeAgentSkus.command('list')
    .description($('Lists the node agent SKUs supported by the Azure Batch service'))
    .appendODataFilterOption(false, true, false)
    .appendBatchAccountOption()
    .execute(listNodeAgentSkus);

  autoscale.command('disable [pool-id]')
   .description($('Disable autoscale at the Batch pool'))
   .option('-i, --id <pool-id>', $('the Batch pool id'))
   .appendBatchAccountOption()
   .execute(disablePoolAutoscale);
  
  autoscale.command('enable [pool-id]')
   .description($('Enable autoscale at the Batch pool'))
   .option('-i, --id <pool-id>', $('the Batch pool id'))
   .option('-f, --autoscale-formula <autoscale-formula>', $('the autoscale formula, see https://azure.microsoft.com/en-us/documentation/articles/batch-automatic-scaling/ for more detail'))
   .option('--autoscale-evaluation-interval <autoscale-evaluation-interval>', $('the time interval for the desired autoscale evaluation period, in ISO 8601 duration formation'))
   .appendCommonHeaderFilterOption(true, true)
   .appendBatchAccountOption()
   .execute(enablePoolAutoscale);
  
  autoscale.command('evaluate [pool-id] [autoscale-formula]')
   .description($('Evaluate autoscale at the Batch pool'))
   .option('-i, --id <pool-id>', $('the Batch pool id'))
   .option('-f, --autoscale-formula <autoscale-formula>', $('the autoscale formula, see https://azure.microsoft.com/en-us/documentation/articles/batch-automatic-scaling/ for more detail'))
   .appendBatchAccountOption()
   .execute(evaluatePoolAutoscale);
  
  pool.command('resize [pool-id] [target-dedicated]')
   .description($('Resize (or stop resizing) the Batch pool'))
   .option('-i, --id <pool-id>', $('the Batch pool id'))
   .option('--abort', $('stop resizing'))
   .option('-t, --target-dedicated <target-dedicated>', $('the dedicated VM count to resize'))
   .option('--resize-timeout <resize-timeout>', $('the timeout for allocation of compute nodes to the pool or removal of compute nodes from the pool, in ISO 8601 duration formation'))
   .option('-o, --deallocate-option <deallocate-option>', $('sets when nodes may be removed from the pool, if the pool size is decreasing'))
   .appendCommonHeaderFilterOption(true, true)
   .appendBatchAccountOption()
   .execute(resizePool);

  var node = batch.category('node')
    .description($('Commands to manage your Batch compute nodes'));

  node.command('delete [pool-id] [node-list]')
    .description($('Remove nodes from the Batch pool'))
    .option('-i, --id <pool-id>', $('the Batch pool id'))
    .option('-l, --node-list <node-list>', $('the list of node ids'))
    .option('-q, --quiet', $('remove nodes from the specified Batch pool without confirmation'))
    .option('--resize-timeout <resize-timeout>', $('the timeout for removal of compute nodes from the pool, in ISO 8601 duration format'))
    .option('-o, --deallocate-option <deallocate-option>', $('sets when nodes may be removed from the pool'))
    .appendCommonHeaderFilterOption(true, true)
    .appendBatchAccountOption()
    .execute(removePoolNodes);

  /**
  * Implement batch pool cli
  */

  /**
  * Create a batch pool
  * @param {string} [jsonFile] the file contains Pool to create in JSON format
  * @param {object} options command line options
  * @param {callback} _ callback function
  */
  function createPool(jsonFile, options, _) {
    if (!jsonFile) {
      jsonFile = options.jsonFile;
    }
    
    var parsedJson = {};
    
    if (!jsonFile) {
      if (!options.id) {
        jsonFile = interaction.promptIfNotGiven($('JSON file name: '), jsonFile, _);
      } else {
        parsedJson = { 'id' : options.id };
        var vmSize = options.vmSize;
        if (!vmSize) {
          vmSize = cli.interaction.promptIfNotGiven($('VM Size: '), vmSize, _);
        }
        __.extend(parsedJson, { 'vmSize' : vmSize });
        if ((!options.targetDedicated && !options.autoscaleFormula) || (options.targetDedicated && options.autoscaleFormula)) {
          throw new Error($('You must specify either --target-dedicated or --autoscale-formula, but not both.'));
        }
        if (options.targetDedicated) {
          __.extend(parsedJson, { 'targetDedicated' : Number(options.targetDedicated), 'enableAutoScale' : false });
        }
        if (options.autoscaleFormula) {
          __.extend(parsedJson, { 'autoScaleFormula' : options.autoscaleFormula, 'enableAutoScale' : true });
        }
        
        if (!(options.imagePublisher && options.imageOffer && options.imageSku && options.nodeAgentId)) {
          if (options.imagePublisher || options.imageOffer || options.imageSku || options.nodeAgentId) {
            throw new Error($('You must either specify --os-family or all of the following: --image-publisher, --image-offer, --image-sku and --node-agent-id.'));
          } else {
            var osFamily = options.osFamily;
            if (!osFamily) {
              osFamily = cli.interaction.promptIfNotGiven($('OS Family: '), osFamily, _);
            }
            __.extend(parsedJson, { 'cloudServiceConfiguration' : { 'osFamily' : osFamily }}); 
          }
        } else if (!options.osFamily) {
          __.extend(parsedJson, { 
                'virtualMachineConfiguration' : { 
                    'imageReference' : { 
                        'publisher' : options.imagePublisher, 
                        'offer' : options.imageOffer, 
                        'sku' : options.imageSku,
                        'version': 'latest'},
                    'nodeAgentSKUId' : options.nodeAgentId}});
        } else {
          throw new Error($('You must either specify --os-family or all of the following: --image-publisher, --image-offer, --image-sku and --node-agent-id.'));
        }
        
        if (options.startTaskCmd) {
          __.extend(parsedJson, { 'startTask' : { 'commandLine' : options.startTaskCmd } });
        }

        if (options.resizeTimeout) {
          __.extend(parsedJson, { 'resizeTimeout' : options.resizeTimeout });
        }
         
        var ref;
        if (options.certificateRef) {
          ref = [];
          options.certificateRef.split(';').forEach(function(entry) {
            ref.push({ 'thumbprint' : entry, 'thumbprintAlgorithm' : 'sha1' });
          });
          __.extend(parsedJson, { 'certificateReferences' : ref });
        } 
        if (options.appPackageRef) {
          ref = [];
          options.appPackageRef.split(';').forEach(function(entry) {
            ref.push({ 'applicationId' : entry });
          });
          __.extend(parsedJson, { 'applicationPackageReferences' : ref });
        } 
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

    var addPool = null;
    if (parsedJson !== null && parsedJson !== undefined) {
      var resultMapper = new client.models['PoolAddParameter']().mapper();
      addPool = client.deserialize(resultMapper, parsedJson, 'result');
    }

    var tips = $('Creating Batch pool');
    var batchOptions = {};
    batchOptions.poolAddOptions = batchUtil.getBatchOperationDefaultOption();

    startProgress(tips);
    try {
      client.pool.add(addPool, batchOptions, _);
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

    logger.verbose(util.format($('Pool %s has been created successfully'), addPool.id));
    showPool(addPool.id, options, _);
  }

  /**
  * Show the details of the specified Batch pool
  * @param {string} [poolId] pool id
  * @param {object} options command line options
  * @param {callback} _ callback function
  */
  function showPool(poolId, options, _) {
    var client = batchUtil.createBatchServiceClient(options);
    if (!poolId) {
      poolId = options.id;
    }
    poolId = interaction.promptIfNotGiven($('Pool id: '), poolId, _);
    var tips = $('Getting Batch pool information');
    var batchOptions = {};
    batchOptions.poolGetOptions = batchUtil.getBatchOperationDefaultOption();

    if (options.selectClause) {
      batchOptions.poolGetOptions.select = options.selectClause;
    }
    if (options.expandClause) {
      batchOptions.poolGetOptions.expand = options.expandClause;
    }

    if (options.ifMatch) {
      batchOptions.poolGetOptions.ifMatch = options.ifMatch;
    }
    if (options.ifNoneMatch) {
      batchOptions.poolGetOptions.ifNoneMatch = options.ifNoneMatch;
    }
    if (options.ifModifiedSince) {
      batchOptions.poolGetOptions.ifModifiedSince = options.ifModifiedSince;
    }
    if (options.ifUnmodifiedSince) {
      batchOptions.poolGetOptions.ifUnmodifiedSince = options.ifUnmodifiedSince;
    }

    var pool = null;
    startProgress(tips);

    try {
      pool = client.pool.get(poolId, batchOptions, _);
    } catch (err) {
      if (batchUtil.isNotFoundException(err)) {
        throw new Error(util.format($('Pool %s doesn\'t exist'), poolId));
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

    batchShowUtil.showCloudPool(pool, cli.output);
  }

  /**
   * Show lifetime summary statistics for all of the pools
   * @param {object} options command line options
   * @param {callback} _ callback function
   */
  function showAllPoolsStats(options, _) {
   var client = batchUtil.createBatchServiceClient(options);
   var tips = $('Getting lifetime summary statistics');
   var batchOptions = {};
   batchOptions.poolGetAllPoolsLifetimeStatisticsOptions = batchUtil.getBatchOperationDefaultOption();
   var stats;
  
   startProgress(tips);
   try {
     stats = client.pool.getAllPoolsLifetimeStatistics(batchOptions, _);
   } catch (e) {
     if (e.message) {
       if (typeof e.message === 'object') {
         e.message = e.message.value;
       }
     }
  
     throw e;
   } finally {
     endProgress();
   }
  
   batchShowUtil.showPoolStats(stats, cli.output);
  }

  /**
  * List batch pools
  * @param {object} options command line options
  * @param {callback} _ callback function
  */
  function listPool(options, _) {
    var client = batchUtil.createBatchServiceClient(options);
    var tips = $('Listing Batch pools');
    var batchOptions = {};
    batchOptions.poolListOptions = batchUtil.getBatchOperationDefaultOption();

    if (options.selectClause) {
      batchOptions.poolListOptions.select = options.selectClause;
    }
    if (options.expandClause) {
      batchOptions.poolListOptions.expand = options.expandClause;
    }
    if (options.filterClause) {
      batchOptions.poolListOptions.filter = options.filterClause;
    }

    var pools = [];
    startProgress(tips);

    try {
      var result = client.pool.list(batchOptions, _);
      result.forEach(function (pool) {
        pools.push(pool);
      });
      var nextLink = result.odatanextLink;

      while (nextLink) {
        batchOptions.poolListOptions = batchUtil.getBatchOperationDefaultOption();
        result = client.pool.listNext(nextLink, batchOptions, _);
        result.forEach(function (pool) {
          pools.push(pool);
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

    cli.interaction.formatOutput(pools, function (outputData) {
      if (outputData.length === 0) {
        logger.info($('No pool found'));
      } else {
        logger.table(outputData, function(row, item) {
          row.cell($('Id'), item.id);
          row.cell($('State'), item.state);
          row.cell($('VM Size'), item.vmSize);
          row.cell($('VM Count'), item.currentDedicated);
        });
      }
    });
  }
  
  /**
  * List batch pool usage metrics
  * @param {object} options command line options
  * @param {callback} _ callback function
  */
  function listUsageMetrics(options, _) {
   var client = batchUtil.createBatchServiceClient(options);
   var tips = $('Listing Batch pool usage metrics');
   var batchOptions = {};
   batchOptions.poolListPoolUsageMetricsOptions = batchUtil.getBatchOperationDefaultOption();
  
   if (options.startTime) {
     batchOptions.poolListPoolUsageMetricsOptions.startTime = new Date(options.startTime);
   }
   if (options.endTime) {
     batchOptions.poolListPoolUsageMetricsOptions.endTime = new Date(options.endTime);
   }
   if (options.filterClause) {
     batchOptions.poolListPoolUsageMetricsOptions.filter = options.filterClause;
   }
  
   var metrics = [];
   startProgress(tips);
  
   try {
     var result = client.pool.listPoolUsageMetrics(batchOptions, _);
     result.forEach(function (pool) {
       metrics.push(pool);
     });
     var nextLink = result.odatanextLink;
  
     while (nextLink) {
       batchOptions.poolListPoolUsageMetricsOptions = batchUtil.getBatchOperationDefaultOption();
       result = client.pool.listPoolUsageMetricsNext(nextLink, batchOptions, _);
       result.forEach(function (pool) {
         metrics.push(pool);
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
  
   cli.interaction.formatOutput(metrics, function (outputData) {
     var UTCFormat = 'YYYY-MM-DDTHH:MI:SSZ';
     if (outputData.length === 0) {
       logger.info($('No Usage Metric found'));
     } else {
       logger.table(outputData, function (row, item) {
         row.cell($('Id'), item.poolId);
         if (item.startTime) {
           row.cell($('Start Time'), item.startTime.toUTCFormat(UTCFormat));
         }
         if (item.endTime) {
           row.cell($('End Time'), item.endTime.toUTCFormat(UTCFormat));
         }
         row.cell($('VM Size'), item.vmSize);
         row.cell($('Total Core Hours'), item.totalCoreHours);
       });
     }
   });
  }
  
  /**
  * Delete the specified batch pool
  * @param {string} [poolId] pool Id
  * @param {object} options command line options
  * @param {callback} _ callback function
  */
  function deletePool(poolId, options, _) {
    var client = batchUtil.createBatchServiceClient(options);
    if (!poolId) {
      poolId = options.id;
    }
    poolId = interaction.promptIfNotGiven($('Pool id: '), poolId, _);
    var tips = util.format($('Deleting pool %s'), poolId);
    var batchOptions = {};
    batchOptions.poolDeleteMethodOptions = batchUtil.getBatchOperationDefaultOption();

    if (options.ifMatch) {
      batchOptions.poolDeleteMethodOptions.ifMatch = options.ifMatch;
    }
    if (options.ifNoneMatch) {
      batchOptions.poolDeleteMethodOptions.ifNoneMatch = options.ifNoneMatch;
    }
    if (options.ifModifiedSince) {
      batchOptions.poolDeleteMethodOptions.ifModifiedSince = options.ifModifiedSince;
    }
    if (options.ifUnmodifiedSince) {
      batchOptions.poolDeleteMethodOptions.ifUnmodifiedSince = options.ifUnmodifiedSince;
    }

    if (!options.quiet) {
      if (!interaction.confirm(util.format($('Do you want to delete pool %s? [y/n] '), poolId), _)) {
        return;
      }
    }
    
    startProgress(tips);

    try {
      client.pool.deleteMethod(poolId, batchOptions, _);
    } catch (err) {
      if (batchUtil.isNotFoundException(err)) {
        throw new Error(util.format($('Pool %s doesn\'t exist'), poolId));
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

    logger.info(util.format($('Pool %s has been deleted successfully'), poolId));
  }

  /**
   * Update/Patch the specified batch pool
   * @param {string} [poolId] pool Id
   * @param {string} [jsonFile] file name of pool update json object
   * @param {object} options command line options
   * @param {callback} _ callback function
   */
  function updatePool(poolId, jsonFile, options, _) {
    if (!poolId) {
      poolId = options.id;
    }
    poolId = interaction.promptIfNotGiven($('Pool id: '), poolId, _);
    if (!jsonFile) {
      jsonFile = options.jsonFile;
    }
    
    var parsedJson = {};
    
    if (!jsonFile) {
      if (!options.startTaskCmd && !options.certificateRef && !options.appPackageRef && !options.metadata) {
        jsonFile = interaction.promptIfNotGiven($('JSON file name: '), jsonFile, _);
      } else {
        if (options.startTaskCmd) {
          __.extend(parsedJson, { 'startTask' : { 'commandLine' : options.startTaskCmd } });
        } 
        var ref;        
        if (options.certificateRef) {
          ref = [];
          options.certificateRef.split(';').forEach(function(entry) {
            ref.push({ 'thumbprint' : entry, 'thumbprintAlgorithm' : 'sha1' });
          });
          __.extend(parsedJson, { 'certificateReferences' : ref });
        } 
        if (options.appPackageRef) {
          ref = [];
          options.appPackageRef.split(';').forEach(function(entry) {
            ref.push({ 'applicationId' : entry });
          });
          __.extend(parsedJson, { 'applicationPackageReferences' : ref });
        } 
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

    var tips;
    var resultMapper;
    var batchOptions = {};
    
    var opOptions = {};
    opOptions = batchUtil.getBatchOperationDefaultOption();

    if (options.ifMatch) {
      opOptions.ifMatch = options.ifMatch;
    }
    if (options.ifNoneMatch) {
      opOptions.ifNoneMatch = options.ifNoneMatch;
    }
    if (options.ifModifiedSince) {
      opOptions.ifModifiedSince = options.ifModifiedSince;
    }
    if (options.ifUnmodifiedSince) {
      opOptions.ifUnmodifiedSince = options.ifUnmodifiedSince;
    }

    var updatePoolParam = null;
    
    if (options.replace) {
      if (parsedJson !== null && parsedJson !== undefined) {
        resultMapper = new client.models['PoolUpdatePropertiesParameter']().mapper();
        updatePoolParam = client.deserialize(resultMapper, parsedJson, 'result');
      }
      
      if (!updatePoolParam.certificateReferences) {
        updatePoolParam.certificateReferences = [];
      }
      if (!updatePoolParam.applicationPackageReferences) {
        updatePoolParam.applicationPackageReferences = [];
      }
      if (!updatePoolParam.metadata) {
        updatePoolParam.metadata = [];
      }

      tips = util.format($('Updating pool %s'), poolId);

      batchOptions.poolUpdatePropertiesOptions = opOptions;

      startProgress(tips);

      try {
        client.pool.updateProperties(poolId, updatePoolParam, batchOptions, _);
      } catch (err) {
        if (batchUtil.isNotFoundException(err)) {
          throw new Error(util.format($('Pool %s doesn\'t exist'), poolId));
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
        resultMapper = new client.models['PoolPatchParameter']().mapper();
        updatePoolParam = client.deserialize(resultMapper, parsedJson, 'result');
      }

      tips = util.format($('Patching pool %s'), poolId);
      batchOptions.poolPatchOptions = opOptions;

      startProgress(tips);

      try {
        client.pool.patch(poolId, updatePoolParam, batchOptions, _);
      } catch (err) {
        if (batchUtil.isNotFoundException(err)) {
          throw new Error(util.format($('Pool %s doesn\'t exist'), poolId));
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

    logger.verbose(util.format($('Pool %s has been updated/patched successfully'), poolId));
    showPool(poolId, options, _);
  }

  /**
   * Disable autoscale for the specified batch pool
   * @param {string} [poolId] pool Id
   * @param {object} options command line options
   * @param {callback} _ callback function
   */
  function disablePoolAutoscale(poolId, options, _) {
   var client = batchUtil.createBatchServiceClient(options);
   if (!poolId) {
     poolId = options.id;
   }
   poolId = interaction.promptIfNotGiven($('Pool id: '), poolId, _);
   var tips = util.format($('Disabling autoscale on pool %s'), poolId);
   var batchOptions = {};
   batchOptions.poolDisableAutoScaleOptions = batchUtil.getBatchOperationDefaultOption();
  
   startProgress(tips);
  
   try {
     client.pool.disableAutoScale(poolId, batchOptions, _);
   } catch (err) {
     if (batchUtil.isNotFoundException(err)) {
       throw new Error(util.format($('Pool %s doesn\'t exist'), poolId));
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
  
   logger.info(util.format($('Autoscale has been successfully disabled on pool %s'), poolId));
  }

  /**
   * Enable autoscale for the specified batch pool
   * @param {string} [poolId] pool Id
   * @param {object} options command line options
   * @param {callback} _ callback function
   */
  function enablePoolAutoscale(poolId, options, _) {
   var client = batchUtil.createBatchServiceClient(options);
   if (!poolId) {
     poolId = options.id;
   }
   poolId = interaction.promptIfNotGiven($('Pool id: '), poolId, _);
   var tips = util.format($('Enabling autoscale on pool %s'), poolId);
   var batchOptions = {};
   batchOptions.poolEnableAutoScaleOptions = batchUtil.getBatchOperationDefaultOption();
  
   var param = {};
   if (options.autoscaleFormula) {
     param.autoScaleFormula = options.autoscaleFormula;
   }
   if (options.autoscaleEvaluationInterval) {
     param.autoScaleEvaluationInterval = moment.duration(options.autoscaleEvaluationInterval);
   }
  
   startProgress(tips);
  
   try {
     client.pool.enableAutoScale(poolId, param, batchOptions, _);
   } catch (err) {
     if (batchUtil.isNotFoundException(err)) {
       throw new Error(util.format($('Pool %s doesn\'t exist'), poolId));
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
  
   logger.info(util.format($('Autoscale has been successfully enabled for Pool %s'), poolId));
  }

  /**
   * Evaluate autoscale at the specified batch pool
   * @param {string} [poolId] pool Id
   * @param {object} options command line options
   * @param {callback} _ callback function
   */
  function evaluatePoolAutoscale(poolId, autoscaleFormula, options, _) {
   var client = batchUtil.createBatchServiceClient(options);
   if (!poolId) {
     poolId = options.id;
   }
   poolId = interaction.promptIfNotGiven($('Pool id: '), poolId, _);
   if (!autoscaleFormula) {
     autoscaleFormula = options.autoscaleFormula;
   }
   autoscaleFormula = interaction.promptIfNotGiven($('AutoScale formula: '), autoscaleFormula, _);
   var tips = util.format($('Evaluating autoscale on pool %s'), poolId);
   var batchOptions = {};
   batchOptions.poolEvaluateAutoScaleOptions = batchUtil.getBatchOperationDefaultOption();
  
   startProgress(tips);
  
   var run;
   try {
     run = client.pool.evaluateAutoScale(poolId, autoscaleFormula, batchOptions, _);
   } catch (err) {
     if (batchUtil.isNotFoundException(err)) {
       throw new Error(util.format($('Pool %s doesn\'t exist'), poolId));
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
  
   batchShowUtil.showAutoScaleRun(run, cli.output);
  }

  /**
   * Resize/stop resize the specified batch pool
   * @param {string} [poolId] pool Id
   * @param {object} options command line options
   * @param {callback} _ callback function
   */
  function resizePool(poolId, targetDedicated, options, _) {
   var client = batchUtil.createBatchServiceClient(options);
   if (!poolId) {
     poolId = options.id;
   }
   poolId = interaction.promptIfNotGiven($('Pool id: '), poolId, _);
  
   var tips;
   var batchOptions = {};
  
   if (options.abort) {
     tips = util.format($('Stopping pool %s from resizing'), poolId);
     batchOptions.poolStopResizeOptions = batchUtil.getBatchOperationDefaultOption();
  
     startProgress(tips);
  
     try {
       client.pool.stopResize(poolId, batchOptions, _);
     } catch (err) {
       if (batchUtil.isNotFoundException(err)) {
         throw new Error(util.format($('Pool %s doesn\'t exist'), poolId));
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
  
     logger.info(util.format($('The resizing of pool %s has been stopped successfully'), poolId));
   } else {
     if (!targetDedicated) {
       targetDedicated = options.targetDedicated;
     }
     targetDedicated = interaction.promptIfNotGiven($('Target Dedicated VM Count: '), targetDedicated, _);
     var param = {};
     param.targetDedicated = Number(targetDedicated);
     if (options.resizeTimeout) {
       param.resizeTimeout = moment.duration(options.resizeTimeout);
     }
     if (options.deallocateOption) {
       param.nodeDeallocationOption = options.deallocateOption;
     }
  
     tips = util.format($('Resizing pool %s'), poolId);
     batchOptions.poolResizeOptions = batchUtil.getBatchOperationDefaultOption();
     if (options.ifMatch) {
       batchOptions.poolDeleteMethodOptions.ifMatch = options.ifMatch;
     }
     if (options.ifNoneMatch) {
       batchOptions.poolDeleteMethodOptions.ifNoneMatch = options.ifNoneMatch;
     }
     if (options.ifModifiedSince) {
       batchOptions.poolDeleteMethodOptions.ifModifiedSince = options.ifModifiedSince;
     }
     if (options.ifUnmodifiedSince) {
       batchOptions.poolDeleteMethodOptions.ifUnmodifiedSince = options.ifUnmodifiedSince;
     }
  
     startProgress(tips);
  
     try {
       client.pool.resize(poolId, param, batchOptions, _);
     } catch (err) {
       if (batchUtil.isNotFoundException(err)) {
         throw new Error(util.format($('Pool %s doesn\'t exist'), poolId));
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
  
     logger.info(util.format($('Pool %s has been resized successfully'), poolId));
   }
  }

  /** Lists the node agent SKUs supported by the Azure Batch service
   * @param {object} options command line options
   * @param {callback} _ callback function
   */
  function listNodeAgentSkus(options, _) {
    var client = batchUtil.createBatchServiceClient(options);
    var tips = $('Listing Batch node agent SKUs');
    var batchOptions = {};
    batchOptions.accountListNodeAgentSkusOptions = batchUtil.getBatchOperationDefaultOption();

    if (options.filterClause) {
      batchOptions.accountListNodeAgentSkusOptions.filter = options.filterClause;
    }

    var skus = [];
    startProgress(tips);

    try {
      var result = client.account.listNodeAgentSkus(batchOptions, _);
      result.forEach(function (sku) {
        skus.push(sku);
      });
      var nextLink = result.odatanextLink;

      while (nextLink) {
        batchOptions.accountListNodeAgentSkusNextOptions = batchUtil.getBatchOperationDefaultOption();
        result = client.account.listNodeAgentSkusNext(nextLink, batchOptions, _);
        result.forEach(function (sku) {
          skus.push(sku);
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

    cli.interaction.formatOutput(skus, function (outputData) {
      if (outputData.length === 0) {
        logger.info($('No SKUs found'));
      } else {
        var images = [];
        outputData.forEach(function(agent) {
          agent.verifiedImageReferences.forEach(function(ref) {
            images.push({'id': agent.id, 'publisher': ref.publisher, 'offer': ref.offer, 'sku': ref.sku, 'osType': agent.osType});
          });
        });
        logger.table(images, function(row, item) {
          row.cell($('Agent Id'), item.id);
          row.cell($('Publisher'), item.publisher);
          row.cell($('Offer'), item.offer);
          row.cell($('Sku'), item.sku);
        });
      }
    });
  }

  /**
   * Remove nodes from the specified batch pool
   * @param {string} [poolId] pool Id
   * @param {list} [nodeList] nodes List
   * @param {object} options command line options
   * @param {callback} _ callback function
   */
  function removePoolNodes(poolId, nodeList, options, _) {
    var client = batchUtil.createBatchServiceClient(options);
    if (!poolId) {
      poolId = options.id;
    }
    poolId = interaction.promptIfNotGiven($('Pool id: '), poolId, _);
    if (!nodeList) {
      nodeList = options.nodeList;
    }
    nodeList = interaction.promptIfNotGiven($('Nodes list: '), nodeList, _);

    var tips = util.format($('Removing node(s) \'%s\' from pool %s'), nodeList, poolId);
    var batchOptions = {};
    batchOptions.poolRemoveNodesOptions = batchUtil.getBatchOperationDefaultOption();

    var param = {};
    param.nodeList = nodeList.split(',');
    if (options.resizeTimeout) {
      param.resizeTimeout = options.resizeTimeout;
    }
    if (options.deallocateOption) {
      param.nodeDeallocationOption = options.deallocateOption;
    }
    var resultMapper = new client.models['NodeRemoveParameter']().mapper();
    param = client.deserialize(resultMapper, param, 'result');
    
    if (!options.quiet) {
      if (!interaction.confirm(util.format($('Do you want to remove nodes \'%s\' from pool %s? [y/n] '), param.nodeList.join(','), poolId), _)) {
        return;
      }
    }

    startProgress(tips);

    try {
      client.pool.removeNodes(poolId, param, batchOptions, _);
    } catch (err) {
      if (batchUtil.isNotFoundException(err)) {
        throw new Error(util.format($('Pool %s doesn\'t exist'), poolId));
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

    logger.info(util.format($('Nodes have been removed from pool %s successfully'), poolId));
  }

};
