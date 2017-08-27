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
  
  var node = serviceFabric.category('node')
    .description($('Commands to manage your node'));
  
  node.command('show')
    .description($('Show node'))
    .option('-n --node-name <nodeName>', $('the name of the node'))
    .option('--select <fields>', $('select fields to show, call without this parameter to see all fields'))
    .execute(function (options, _) {
      var progress = cli.interaction.progress($('Show node'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        var res = null;
        if (!options.nodeName) {
          res = client.nodes.list(options, _);
        }
        else {
          res = client.nodes.get(options.nodeName, options, _);
        }
        if (options.select) {
          res = serviceFabricUtils.pick(res, options.select, _);
        }
        serviceFabricUtils.setNodeEnumVal(res);
        
        progress.end();
        
        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  node.command('enable [nodeName]')
    .description($('Enable node, Example: azure servicefabric node enable --node-name node1'))
    .option('-n --node-name <nodeName>', $('the name of the node'))
    .execute(function (nodeName, options, _) {
      nodeName = cli.interaction.promptIfNotGiven($('nodeName: '), nodeName, _);
      
      var progress = cli.interaction.progress($('Enable node'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        var res = client.nodes.enable(nodeName, options, _);
        
        progress.end();
        
        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  node.command('disable [nodeName] [deactivationIntent]')
    .description($('Disable node, Example: azure servicefabric node enable --node-name node1 --deactivation-intent Pause'))
    .option('-n --node-name <nodeName>', $('the name of the node'))
    .option('-i --deactivation-intent <deactivationIntent>', $('the intent of the deactivation, values are [Pause|Restart|RemoveData|RemoveNode]'))
    .execute(function (nodeName, deactivationIntent, options, _) {
      nodeName = cli.interaction.promptIfNotGiven($('nodeName: '), nodeName, _);
      deactivationIntent = cli.interaction.promptIfNotGiven($('deactivationIntent: '), deactivationIntent, _);
      
      var progress = cli.interaction.progress($('Disable node'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        var disableNode = {};
        if (deactivationIntent) disableNode.deactivationIntent = serviceFabricUtils.getEnumVal('deactivationIntent', deactivationIntent);
        var res = client.nodes.disable(nodeName, disableNode, options, _);
        
        progress.end();
        
        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  var nodeState = node.category('state')
    .description($('Commands to manage your node load state'));
  
  nodeState.command('delete [nodeName]')
    .description($('Delete node state'))
    .option('-n --node-name <nodeName>', $('the name of the node'))
    .execute(function (nodeName, options, _) {
      nodeName = cli.interaction.promptIfNotGiven($('nodeName: '), nodeName, _);
      
      var progress = cli.interaction.progress($('Delete node state'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        
        var client = new serviceFabricClient('3.0-preview', config.connectionEndpoint ? config.connectionEndpoint : null, config);
        var res = client.nodeStates.remove(nodeName, options, _);
        
        progress.end();
        
        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  var nodeLoad = node.category('load')
    .description($('Commands to manage your node load'));
  
  nodeLoad.command('show [nodeName]')
    .description($('Show node load information'))
    .option('-n --node-name <nodeName>', $('the name of the node'))
    .option('--select <fields>', $('select fields to show, call without this parameter to see all fields'))
    .execute(function (nodeName, options, _) {
      var progress = cli.interaction.progress($('Show node load'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        var res = client.nodeLoadInformations.get(nodeName, options, _);
        if (options.select) {
          res = serviceFabricUtils.pick(res, options.select, _);
        }
        serviceFabricUtils.setNodeEnumVal(res);
        
        progress.end();
        
        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  var nodeHealth = node.category('health')
    .description($('Commands to manage your node health'));
  
  nodeHealth.command('show [nodeName]')
    .description($('Show node health'))
    .option('-n --node-name <nodeName>', $('the name of the node'))
    .option('-f --events-health-state-filter <eventsHealthStateFilter>', $('the filter of the event health state, values are [Default|None|Ok|Warning|Error|All]'))
    .option('--select <fields>', $('select fields to show, call without this parameter to see all fields'))
    .execute(function (nodeName, options, _) {
      var progress = cli.interaction.progress($('Show node health'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        var res = client.nodeHealths.get(nodeName, options, _);
        if (options.select) {
          res = serviceFabricUtils.pick(res, options.select, _);
        }
        serviceFabricUtils.setNodeEnumVal(res);
        
        progress.end();
        
        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  nodeHealth.command('send [nodeName] [sourceId] [property] [healthState]')
    .description($('Send node health, Example: azure servicefabric node health send --node-name node1 fabric:app --source-id monitor --property pc --health-state Ok --description healthy'))
    .option('-n --node-name <nodeName>', $('the name of the node'))
    .option('-i --source-id <sourceId>', $('the id of the source'))
    .option('-p --property <property>', $('the property'))
    .option('-e --health-state <healthState>', $('the state of the health, values are [Ok|Warning|Error|Unknown]'))
    .option('-d --description <description>', $('the description'))
    .option('-m --time-to-live-in-milliseconds <timeToLiveInMilliseconds>', $('the time in milliseconds for live'))
    .option('-q --sequence-number <sequenceNumber>', $('the number of the sequence'))
    .option('-w --remove-when-expired', $('the boolean of the remove when expired'))
    .execute(function (nodeName, sourceId, property, healthState, options, _) {
      var progress = cli.interaction.progress($('Send node health'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        var nodeHealthReport = {};
        if (sourceId) nodeHealthReport.sourceId = sourceId;
        if (property) nodeHealthReport.property = property;
        if (healthState) nodeHealthReport.healthState = serviceFabricUtils.getEnumVal('healthState', healthState);
        if (options.description) nodeHealthReport.description = options.description;
        if (options.timeToLiveInMilliseconds) nodeHealthReport.timeToLiveInMilliSeconds = options.timeToLiveInMilliseconds;
        if (options.sequenceNumber) nodeHealthReport.sequenceNumber = options.sequenceNumber;
        if (options.removeWhenExpired) {
          nodeHealthReport.removeWhenExpired = true;
        }
        var res = client.nodeHealths.send(nodeName, nodeHealthReport, options, _);
        
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
