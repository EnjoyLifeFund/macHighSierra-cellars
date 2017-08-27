/**
* Copyright (c) Microsoft.  All rights reserved.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

'use strict';

var utils = require('../../util/utils');
var serviceFabricUtils = require('./serviceFabricUtils');
var serviceFabricClient = require('azure-servicefabric');
var $ = utils.getLocaleString;


exports.init = function (cli) {
  var log = cli.output;
  
  var serviceFabric = cli.category('servicefabric')
    .description($('Commands to manage your Azure Service Fabric'));
  
  var partition = serviceFabric.category('partition')
    .description($('Commands to manage your partition'));
  
  partition.command('show [serviceName]')
    .description($('Show partition'))
    .option('-n --service-name <serviceName>', $('the name of the service'))
    .option('-i --partition-id <partitionId>', $('the id of the partition'))
    .option('--select <fields>', $('select fields to show, call without this parameter to see all fields'))
    .execute(function (serviceName, options, _) {
      var progress = cli.interaction.progress($('Show partition'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        serviceName = serviceFabricUtils.parseUrl(serviceName, _);
        var res = null;
        if (!options.partitionId) {
          res = client.partitions.list(serviceName, options, _);
        }
        else {
          res = client.partitions.get(serviceName, options.partitionId, options, _);
        }
        if (options.select) {
          res = serviceFabricUtils.pick(res, options.select, _);
        }
        serviceFabricUtils.setPartitionEnumVal(res);
        
        progress.end();
        
        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  partition.command('repair')
    .description($('Repair partition'))
    .option('-n --service-name <serviceName>', $('the name of the service'))
    .option('-i --partition-id <partitionId>', $('the id of the partition'))
    .execute(function (options, _) {
      if (!options.serviceName && !options.partitionId) {
        throw $('The serviceName or partitionId is required');
      }
      
      var progress = cli.interaction.progress($('Repair partition'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        
        var res = null;
        if (!options.partitionId) {
          options.serviceName = serviceFabricUtils.parseUrl(options.serviceName, _);
          res = client.partitionLists.repair(options.serviceName, options, _);
        }
        else if (!options.serviceName) {
          res = client.partitions.repair(options.partitionId, options, _);
        }
        
        progress.end();
        
        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  var partitionHealth = partition.category('health')
    .description($('Commands to manage your partition health'));
  
  partitionHealth.command('show [partitionId]')
    .description($('Show partition health'))
    .option('-i --partition-id <partitionId>', $('the id of the partition'))
    .option('-f --events-health-state-filter <eventsHealthStateFilter>', $('the filter of the events health state, values are [Default|None|Ok|Warning|Error|All]'))
    .option('-r --replicas-health-state-filter <replicasHealthStateFilter>', $('the filter of the replicas health state, values are [Default|None|Ok|Warning|Error|All]'))
    .option('--select <fields>', $('select fields to show, call without this parameter to see all fields'))
    .execute(function (partitionId, options, _) {
      var progress = cli.interaction.progress($('Show partition health'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        var res = client.partitionHealths.get(partitionId, options, _);
        if (options.select) {
          res = serviceFabricUtils.pick(res, options.select, _);
        }
        serviceFabricUtils.setPartitionEnumVal(res);
        
        progress.end();
        
        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  partitionHealth.command('send [partitionId] [sourceId] [property] [healthState]')
    .description($('Send partition health, Example: azure servicefabric partition health send --partition-id 1234 fabric:app --source-id monitor --property pc --health-state Ok --description healthy'))
    .option('-i --partition-id <partitionId>', $('the id of the partition'))
    .option('-o --source-id <sourceId>', $('the id of the source'))
    .option('-p --property <property>', $('the property'))
    .option('-e --health-state <healthState>', $('the state of the health, values are [Ok|Warning|Error|Unknown]'))
    .option('-d --description <description>', $('the description'))
    .option('-m --time-to-live-in-milliseconds <timeToLiveInMilliseconds>', $('the time in milliseconds for live'))
    .option('-n --sequence-number <sequenceNumber>', $('the number of the sequence'))
    .option('-w --remove-when-expired', $('the boolean of the remove when expired'))
    .execute(function (partitionId, sourceId, property, healthState, options, _) {
      var progress = cli.interaction.progress($('Send partition health'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        var partitionHealthReport = {};
        if (sourceId) partitionHealthReport.sourceId = sourceId;
        if (property) partitionHealthReport.property = property;
        if (healthState) partitionHealthReport.healthState = serviceFabricUtils.getEnumVal('healthState', healthState);
        if (options.description) partitionHealthReport.description = options.description;
        if (options.timeToLiveInMilliseconds) partitionHealthReport.timeToLiveInMilliSeconds = options.timeToLiveInMilliseconds;
        if (options.sequenceNumber) partitionHealthReport.sequenceNumber = options.sequenceNumber;
        if (options.removeWhenExpired) {
          partitionHealthReport.removeWhenExpired = true;
        }
        var res = client.partitionHealths.send(partitionId, partitionHealthReport, options, _);
        
        progress.end();
        
        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  var partitionLoad = partition.category('load')
  .description($('Commands to manage your partition load information'));
  
  partitionLoad.command('show [partitionId]')
    .description($('Show partition load information'))
    .option('-i --partition-id <partitionId>', $('the id of the partition'))
    .option('--select <fields>', $('select fields to show, call without this parameter to see all fields'))
    .execute(function (partitionId, options, _) {
      var progress = cli.interaction.progress($('Show partition load information'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        var res = client.partitionLoadInformations.get(partitionId, options, _);
        if (options.select) {
          res = serviceFabricUtils.pick(res, options.select, _);
        }
        serviceFabricUtils.setPartitionEnumVal(res);
        
        progress.end();
        
        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  partitionLoad.command('reset [partitionId]')
    .description($('Reset partition'))
    .option('-i --partition-id <partitionId>', $('the id of the partition'))
    .execute(function (partitionId, options, _) {
      partitionId = cli.interaction.promptIfNotGiven($('partitionId:'), partitionId, _);
      
      var progress = cli.interaction.progress($('Reset partition'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        var res = client.partitionLoads.reset(partitionId, options, _);
        
        progress.end();
        
        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
};
