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
  
  var replica = serviceFabric.category('replica')
    .description($('Commands to manage your replica'));
  
  replica.command('show [partitionId]')
    .description($('Show replica'))
    .option('-i --partition-id <partitionId>', $('the id of the partition'))
    .option('-r --replica-id <replicaId>', $('the id of the replica'))
    .option('--select <fields>', $('select fields to show, call without this parameter to see all fields'))
    .execute(function (partitionId, options, _) {
      var progress = cli.interaction.progress($('Show replica'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        var res = null;
        if (!options.replicaId) {
          res = client.replicas.list(partitionId, options, _);
        }
        else {
          res = client.replicas.get(partitionId, options.replicaId, options, _);
        }
        if (options.select) {
          res = serviceFabricUtils.pick(res, options.select, _);
        }
        serviceFabricUtils.setReplicaEnumVal(res);
        
        progress.end();
        
        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  var replicaDeployed = replica.category('deployed')
    .description($('Commands to manage your deployed replica'));
  
  replicaDeployed.command('show [nodeName] [applicationName]')
    .description($('Show deployed replica'))
    .option('-n --node-name <nodeName>', $('the name of the node'))
    .option('-a --application-name <applicationName>', $('the name of the application'))
    .option('--select <fields>', $('select fields to show, call without this parameter to see all fields'))
    .execute(function (nodeName, applicationName, options, _) {
      var progress = cli.interaction.progress($('ShowDeployedReplica'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        applicationName = serviceFabricUtils.parseUrl(applicationName, _);
        var res = client.deployedReplicas.get(nodeName, applicationName, options, _);
        if (options.select) {
          res = serviceFabricUtils.pick(res, options.select, _);
        }
        serviceFabricUtils.setReplicaEnumVal(res);
        
        progress.end();
        
        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  replicaDeployed.command('detail [nodeName] [partitionName] [replicaId]')
    .description($('Show deployed replica detail'))
    .option('-n --node-name <nodeName>', $('the name of the node'))
    .option('-p --partition-name <partitionName>', $('the name of the partition'))
    .option('-i --replica-id <replicaId>', $('the id of the replica'))
    .option('--select <fields>', $('select fields to show, call without this parameter to see all fields'))
    .execute(function (nodeName, partitionName, replicaId, options, _) {
      var progress = cli.interaction.progress($('ShowDeployedReplicaDetail'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        var res = client.deployedReplicaDetails.get(nodeName, partitionName, replicaId, options, _);
        if (options.select) {
          res = serviceFabricUtils.pick(res, options.select, _);
        }
        serviceFabricUtils.setReplicaEnumVal(res);
        
        progress.end();
        
        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  var replicaHealth = replica.category('health')
    .description($('Commands to manage your replica health'));
  
  replicaHealth.command('show [partitionId] [replicaId]')
    .description($('Show replica health'))
    .option('-i --partition-id <partitionId>', $('the id of the partition'))
    .option('-r --replica-id <replicaId>', $('the id of the replicas'))
    .option('-f --events-health-state-filter <eventsHealthStateFilter>', $('the filter of the events health state, values are [Default|None|Ok|Warning|Error|All]'))
    .option('--select <fields>', $('select fields to show, call without this parameter to see all fields'))
    .execute(function (partitionId, replicaId, options, _) {
      var progress = cli.interaction.progress($('Show partition health'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        var res = client.replicaHealths.get(partitionId, replicaId, options, _);
        if (options.select) {
          res = serviceFabricUtils.pick(res, options.select, _);
        }
        serviceFabricUtils.setReplicaEnumVal(res);
        
        progress.end();
        
        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  replicaHealth.command('send [partitionId] [replicaId] [sourceId] [property] [healthState]')
    .description($('Send replica health, Example: azure servicefabric replica health send --partition-id 1234 fabric:app --source-id monitor --property pc --health-state Ok --description healthy'))
    .option('-i --partition-id <partitionId>', $('the id of the partition'))
    .option('-r --replica-id <replicaId>', $('the id of the replica'))
    .option('-o --source-id <sourceId>', $('the id of the source'))
    .option('-p --property <property>', $('the property'))
    .option('-e --health-state <healthState>', $('the state of the health, values are [Ok|Warning|Error|Unknown]'))
    .option('-d --description <description>', $('the description'))
    .option('-m --time-to-live-in-milliseconds <timeToLiveInMilliseconds>', $('the time in milliseconds for live'))
    .option('-n --sequence-number <sequenceNumber>', $('the number of the sequence'))
    .option('-w --remove-when-expired', $('the boolean of the remove when expired'))
    .execute(function (partitionId, replicaId, sourceId, property, healthState, options, _) {
      var progress = cli.interaction.progress($('Send replica health'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        var replicaHealthReport = {};
        if (sourceId) replicaHealthReport.sourceId = sourceId;
        if (property) replicaHealthReport.property = property;
        if (healthState) replicaHealthReport.healthState = serviceFabricUtils.getEnumVal('healthState', healthState);
        if (options.description) replicaHealthReport.description = options.description;
        if (options.timeToLiveInMilliseconds) replicaHealthReport.timeToLiveInMilliSeconds = options.timeToLiveInMilliseconds;
        if (options.sequenceNumber) replicaHealthReport.sequenceNumber = options.sequenceNumber;
        if (options.removeWhenExpired) {
          replicaHealthReport.removeWhenExpired = true;
        }
        var res = client.replicaHealths.send(partitionId, replicaId, replicaHealthReport, options, _);
        
        progress.end();
        
        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  var replicaLoad = replica.category('load')
    .description($('Commands to manage your replica load information'));
  
  replicaLoad.command('show [partitionId] [replicaId]')
    .description($('Show replica load information'))
    .option('-i --partition-id <partitionId>', $('the id of the partition'))
    .option('-r --replica-id <replicaId>', $('the id of the replica'))
    .option('--select <fields>', $('select fields to show, call without this parameter to see all fields'))
    .execute(function (partitionId, replicaId, options, _) {
      var progress = cli.interaction.progress($('Show replica load information'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        var res = client.replicaLoadInformations.get(partitionId, replicaId, options, _);
        if (options.select) {
          res = serviceFabricUtils.pick(res, options.select, _);
        }
        serviceFabricUtils.setReplicaEnumVal(res);
        
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
