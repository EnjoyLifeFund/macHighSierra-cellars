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
var url = require('url');
var path = require('path');
var util = require('util');


exports.init = function (cli) {
  var log = cli.output;
  
  var serviceFabric = cli.category('servicefabric')
    .description($('Commands to manage your Azure Service Fabric'));
  
  var cluster = serviceFabric.category('cluster')
    .description($('Commands to manage your cluster'));
  
  cluster.command('connect [connectionEndpoint]')
    .description($('Connect cluster, Example: azure servicefabric cluster connect --connection-endpoint http://127.0.0.1:19080'))
    .option('-e --connection-endpoint <connectionEndpoint>', $('the url of the connection endpoint, value is [http|https]://[ip_address]'))
    .option('-p --client-key-path <clientKeyPath>', $('the path of the client key'))
    .option('-c --client-cert-path <clientCertPath>', $('the path of the client cert'))
    .option('-a --ca-cert-path <caCertPath>', $('the path of the ca cert, comma separated if multiple'), serviceFabricUtils.list)
    .option('-t --strict-ssl-false', $('the boolean of the strict ssl, false to disable CN verification'))
    .option('-u --reject-unauthorized-false', $('the boolean of the reject unauthorized, false to disable CA verification'))
    .execute(function (connectionEndpoint, options, _) {
      var progress = cli.interaction.progress($('Connect cluster'));
      
      try {
        var data = {};
        var httpUrlObj = null;
        if (!connectionEndpoint) {
          httpUrlObj = url.parse('http://localhost:19080');
        }
        else {
          httpUrlObj = url.parse(connectionEndpoint);
        }
        if (!httpUrlObj.protocol || !httpUrlObj.hostname || !httpUrlObj.port) {
          throw util.format('Invalid url %s', connectionEndpoint);
        }
        data.connectionEndpoint = url.format(httpUrlObj);
        if ((options.clientKeyPath && !serviceFabricUtils.isFileExist(options.clientKeyPath, _)) ||
          (options.clientCertPath && !serviceFabricUtils.isFileExist(options.clientCertPath, _))) {
          throw 'Client key or cert certificate file does not exist.';
        }
        if (options.caCertPath) {
          options.caCertPath.forEach_(_, function (_, path) {
            if (!serviceFabricUtils.isFileExist(path, _)) {
              throw 'CA certificate file does not exist.';
            }
          });
        }
        if (options.clientKeyPath) {
          data.clientKeyPath = path.resolve(options.clientKeyPath);
        }
        if (options.clientCertPath) {
          data.clientCertPath = path.resolve(options.clientCertPath);
        }
        if (options.caCertPath) {
          options.caCertPath.forEach_(_, function (_, caPath, index) {
            options.caCertPath[index] = path.resolve(caPath);
          });
          data.caCertPaths = options.caCertPath;
        }
        if (options.strictSslFlase) {
          data.strictSsl = false;
        }
        if (options.rejectUnauthorizedFalse) {
          data.rejectUnauthorized = false;
        }
        serviceFabricUtils.writeConfigFile(data, _);
        
        // Test connect to cluster
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        var res;
        try {
          res = client.clusterManifests.get(options, _);
        } catch (e) {
          serviceFabricUtils.deleteServiceFabricConfig();
          throw util.format('Error connecting to the cluster %s. Please check the connection.', config.connectionEndpoint);
        }
        
        serviceFabricUtils.writeConfigFile(data, _);
        
        progress.end();
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  cluster.command('show')
    .description($('Show cluster'))
    .option('--select <fields>', $('select fields to show, call without this parameter to see all fields'))
    .execute(function (options, _) {
      var progress = cli.interaction.progress($('Show cluster'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        if (options.select) {
          config = serviceFabricUtils.pick(config, options.select, _);
        }
        
        progress.end();
        
        cli.interaction.formatOutput(config, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  var clusterManifest = cluster.category('manifest')
    .description($('Commands to manage your cluster manifest'));
  
  clusterManifest.command('show')
    .description($('Show cluster manifest'))
    .execute(function (options, _) {
      var progress = cli.interaction.progress($('Show cluster manifest'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        var res = client.clusterManifests.get(options, _);
        serviceFabricUtils.setClusterEnumVal(res);
        
        progress.end();
        
        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  var clusterHealth = cluster.category('health')
    .description($('Commands to manage your cluster health'));
  
  clusterHealth.command('show')
    .description($('Show cluster health'))
    .option('-f --events-health-state-filter <eventsHealthStateFilter>', $('the filter of the event health state, values are [Default|None|Ok|Warning|Error|All]'))
    .option('-n --nodes-health-state-filter <nodesHealthStateFilter>', $('the filter of the nodes health state, values are [Default|None|Ok|Warning|Error|All]'))
    .option('-a --applications-health-state-filter <applicationsHealthStateFilter>', $('the filter of the applications health state, values are [Default|None|Ok|Warning|Error|All]'))
    .option('--select <fields>', $('select fields to show, call without this parameter to see all fields'))
    .execute(function (options, _) {
      var progress = cli.interaction.progress($('Show cluster health'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        var res = client.clusterHealths.get(options, _);
        if (options.select) {
          res = serviceFabricUtils.pick(res, options.select, _);
        }
        serviceFabricUtils.setClusterEnumVal(res);
        
        progress.end();
        
        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  clusterHealth.command('send [sourceId] [property] [healthState]')
    .description($('Send cluster health, Example: azure servicefabric cluster health send --source-id monitor --property pc --health-state Ok --description healthy'))
    .option('-i --source-id <sourceId>', $('the id of the source'))
    .option('-p --property <property>', $('the property'))
    .option('-e --health-state <healthState>', $('the state of the health, values are [Ok|Warning|Error|Unknown]'))
    .option('-d --description <description>', $('the description'))
    .option('-m --time-to-live-in-milliseconds <timeToLiveInMilliseconds>', $('the time in milliseconds for live'))
    .option('-n --sequence-number <sequenceNumber>', $('the number of the sequence'))
    .option('-o --remove-when-expired', $('the boolean of the remove when expired'))
    .execute(function (sourceId, property, healthState, options, _) {
      var progress = cli.interaction.progress($('Send cluster health'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        var clusterHealthReport = {};
        if (sourceId) clusterHealthReport.sourceId = sourceId;
        if (property) clusterHealthReport.property = property;
        if (healthState) clusterHealthReport.healthState = serviceFabricUtils.getEnumVal('healthState', healthState);
        if (options.description) clusterHealthReport.description = options.description;
        if (options.timeToLiveInMilliseconds) clusterHealthReport.timeToLiveInMilliSeconds = options.timeToLiveInMilliseconds;
        if (options.sequenceNumber) clusterHealthReport.sequenceNumber = options.sequenceNumber;
        if (options.removeWhenExpired) {
          clusterHealthReport.removeWhenExpired = true;
        }
        var res = client.clusterHealths.send(clusterHealthReport, options, _);
        
        progress.end();
        
        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  var clusterLoad = cluster.category('load')
    .description($('Commands to manage your cluster load information'));
  
  clusterLoad.command('show')
    .description($('Show load information'))
    .option('--select <fields>', $('select fields to show, call without this parameter to see all fields'))
    .execute(function (options, _) {
      var progress = cli.interaction.progress($('Show load information'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        var res = client.clusterLoadInformations.get(options, _);
        if (options.select) {
          res = serviceFabricUtils.pick(res, options.select, _);
        }
        serviceFabricUtils.setClusterEnumVal(res);
        
        progress.end();
        
        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  var clusterUpgrade = cluster.category('upgrade')
    .description($('Commands to manage your cluster upgrade'));
  
  clusterUpgrade.command('show')
    .description($('Show cluster upgrade'))
    .execute(function (options, _) {
      var progress = cli.interaction.progress($('Show cluster upgrade'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        var res = client.upgradeProgresses.get(options, _);
        serviceFabricUtils.setClusterEnumVal(res);
        
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
