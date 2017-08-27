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
var util = require('util');
var path = require('path');
var fs = require('fs');
var request = require('request');
var url = require('url');
var async = require('async');
var $ = utils.getLocaleString;


exports.init = function (cli) {
  var log = cli.output;
  
  var serviceFabric = cli.category('servicefabric')
    .description($('Commands to manage your Azure Service Fabric'));
  
  var application = serviceFabric.category('application')
    .description($('Commands to manage your application'));
  
  var applicationPackage = application.category('package')
    .description($('Commands to manage your application package'));
  
  // bug, applicationPackagePathInImageStore isn't used
  applicationPackage.command('copy [applicationPackagePath] [imageStoreConnectionString]')
    .description($('Copy application package, Example: azure servicefabric application package copy --application-package-path /tmp/package1 --image-store-connection-string fabric:ImageStore'))
    .option('-p --application-package-path <applicationPackagePath>', $('the path of the application package'))
    .option('-c --image-store-connection-string <imageStoreConnectionString>', $('the string of the image store connection'))
    .execute(function (applicationPackagePath, imageStoreConnectionString, options, _) {
      applicationPackagePath = cli.interaction.promptIfNotGiven($('applicationPackagePath:'), applicationPackagePath, _);
      imageStoreConnectionString = cli.interaction.promptIfNotGiven($('imageStoreConnectionString:'), imageStoreConnectionString, _);
      applicationPackagePath = path.resolve(applicationPackagePath);

      var progress = cli.interaction.progress($('Copy application package'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);

        var connectionUrl = serviceFabricUtils.createConnectionUrl(config, _);
        var clientOptions = serviceFabricUtils.getClientOptions(config, _).requestOptions;
        
        var files = serviceFabricUtils.walkDirTree(applicationPackagePath);
        var totalSize = 0;
        files.forEach_(_, function (_, file) {
          totalSize += file.size;
        });
        var isApplicationPackagePathDir = fs.statSync(applicationPackagePath).isDirectory();// Special case, applicationPackagePath is file
        var currentTotalSize = 0;
        var currentSize = 0;
        var currentFilesCount = 0;
        var res = async.eachSeries(files, function (file, callback) {
          var finalPath = url.resolve('/ImageStore/', (isApplicationPackagePathDir ? path.join(path.basename(applicationPackagePath), file.path) : file.path) + '?api-version=1.0');
          var finalUrl = url.resolve(connectionUrl, finalPath);
          clientOptions.url = finalUrl;
          clientOptions.headers = {
            'Content-Type': 'application/octet-stream'
          };
          clientOptions.forever = true;
          var updateProgress = function () {
            progress.write(function () {}, util.format('[%d%%] %d/%d files, %d/%d KBs', Math.floor((currentTotalSize + currentSize) / totalSize * 100), currentFilesCount, files.length, Math.round((currentTotalSize + currentSize) / 1024), Math.round(totalSize /1024)));
          };
          if (file.path.endsWith('_.dir')) {
            request.put(clientOptions, function () {
              currentFilesCount++;
              updateProgress();
              callback();
            });
          }
          else {
            var fullFilePath = isApplicationPackagePathDir ? path.join(applicationPackagePath, file.path) : path.join(path.dirname(applicationPackagePath), file.path);
            var readStream = fs.createReadStream(fullFilePath);
            var writeStream = readStream.pipe(request.put(clientOptions));
            var progressInterval = setInterval(function () {
              if (!writeStream.req || !writeStream.req.connection || !writeStream.req.connection._bytesDispatched) {
                return;
              }
              currentSize = writeStream.req.connection._bytesDispatched - currentTotalSize;
              updateProgress();
            }, 100);
            writeStream.on('end', function () {
              currentSize = writeStream.req.connection._bytesDispatched - currentTotalSize;
              var bytesDiff = currentSize - file.size;
              totalSize += bytesDiff;
              currentSize = 0;
              currentTotalSize = writeStream.req.connection._bytesDispatched;
              currentFilesCount++;
              clearInterval(progressInterval);
              updateProgress();
              callback();
            });
            writeStream.on('error', function (err) {
              callback(err);
            });
          }
        }, _);
        
        progress.end();
        
        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  var code = serviceFabric.category('code')
    .description($('Commands to manage your code'));
  
  var codePackage = code.category('package')
    .description($('Commands to manage your code package'));
  
  var codePackageDeployed = codePackage.category('deployed')
    .description($('Commands to manage your deployed code package'));
  
  codePackageDeployed.command('show [nodeName] [applicationName]')
    .description($('Show deployed application health'))
    .option('-n --node-name <nodeName>', $('the name of the node'))
    .option('-a --application-name <applicationName>', $('the name of the application'))
    .option('--select <fields>', $('select fields to show, call without this parameter to see all fields'))
    .execute(function (nodeName, applicationName, options, _) {
      var progress = cli.interaction.progress($('Show deployed code package'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        applicationName = serviceFabricUtils.parseUrl(applicationName, _);
        var res = client.deployedCodePackages.get(nodeName, applicationName, options, _);
        if (options.select) {
          res = serviceFabricUtils.pick(res, options.select, _);
        }
        serviceFabricUtils.setPackageEnumVal(res);
        
        progress.end();
        
        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  var service = serviceFabric.category('service')
    .description($('Commands to manage your service'));
  
  var servicePackage = service.category('package')
    .description($('Commands to send your service package'));
  
  var servicePackageDeployed = servicePackage.category('deployed')
    .description($('Commands to send your deployed service package'));
  
  servicePackageDeployed.command('show [nodeName] [applicationName]')
    .description($('Show deployed service package'))
    .option('-n --node-name <nodeName>', $('the name of the node'))
    .option('-a --application-name <applicationName>', $('the name of the application'))
    .option('--select <fields>', $('select fields to show, call without this parameter to see all fields'))
    .execute(function (nodeName, applicationName, options, _) {
      var progress = cli.interaction.progress($('Show deployed service package'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        applicationName = serviceFabricUtils.parseUrl(applicationName, _);
        var res = client.deployedServicePackages.get(nodeName, applicationName, options, _);
        if (options.select) {
          res = serviceFabricUtils.pick(res, options.select, _);
        }
        serviceFabricUtils.setPackageEnumVal(res);
        
        progress.end();
        
        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  var servicePackageDeployedHealth  = servicePackageDeployed.category('health')
    .description($('Commands to manage your deployed service package health'));
  
  servicePackageDeployedHealth.command('show [nodeName] [applicationName] [servicePackageName]')
    .description($('Show deployed service package health'))
    .option('-n --node-name <nodeName>', $('the name of the node'))
    .option('-a --application-name <applicationName>', $('the name of the application'))
    .option('-p --service-package-name <servicePackageName>', $('the name of the service package'))
    .option('-f --events-health-state-filter <eventsHealthStateFilter>', $('the filter of the events health state, values are [Default|None|Ok|Warning|Error|All]'))
    .option('--select <fields>', $('select fields to show, call without this parameter to see all fields'))
    .execute(function (nodeName, applicationName, servicePackageName, options, _) {
      var progress = cli.interaction.progress($('Show deployed service package'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        applicationName = serviceFabricUtils.parseUrl(applicationName, _);
        if (servicePackageName) options.servicePackageName = servicePackageName;
        var res = client.deployedServicePackageHealths.get(nodeName, applicationName, options, _);
        if (options.select) {
          res = serviceFabricUtils.pick(res, options.select, _);
        }
        serviceFabricUtils.setPackageEnumVal(res);
        
        progress.end();
        
        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  servicePackageDeployedHealth.command('send [nodeName] [applicationName] [serviceManifestName] [sourceId] [property] [healthState]')
    .description($('Send deployed service package health, Example: azure servicefabric application health send --node-name node1 fabric:app --source-id monitor --property pc --health-state Ok --description healthy'))
    .option('-n --node-name <nodeName>', $('the name of the node'))
    .option('-a --application-name <applicationName>', $('the name of the application'))
    .option('-m --service-manifest-name <serviceManifestName>', $('the name of the service manifest'))
    .option('-i --source-id <sourceId>', $('the id of the source'))
    .option('-p --property <property>', $('the property'))
    .option('-e --health-state <healthState>', $('the state of the health, values are [Ok|Warning|Error|Unknown]'))
    .option('-d --description <description>', $('the description'))
    .option('-l --time-to-live-in-milliseconds <timeToLiveInMilliseconds>', $('the time in milliseconds for live'))
    .option('-q --sequence-number <sequenceNumber>', $('the number of the sequence'))
    .option('-w --remove-when-expired', $('the boolean of the remove when expired'))
    .execute(function (nodeName, applicationName, serviceManifestName, sourceId, property, healthState, options, _) {
      var progress = cli.interaction.progress($('Send deployed service package health'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        applicationName = serviceFabricUtils.parseUrl(applicationName, _);
        var applicationHealthReport = {};
        if (sourceId) applicationHealthReport.sourceId = sourceId;
        if (property) applicationHealthReport.property = property;
        if (healthState) applicationHealthReport.healthState = serviceFabricUtils.getEnumVal('healthState', healthState);
        if (options.description) applicationHealthReport.description = options.description;
        if (options.timeToLiveInMilliseconds) applicationHealthReport.timeToLiveInMilliSeconds = options.timeToLiveInMilliseconds;
        if (options.sequenceNumber) applicationHealthReport.sequenceNumber = options.sequenceNumber;
        if (options.removeWhenExpired) {
          applicationHealthReport.removeWhenExpired = true;
        }
        var res = client.deployedServicePackageHealths.send(nodeName, applicationName, serviceManifestName, applicationHealthReport, options, _);
        serviceFabricUtils.setPackageEnumVal(res);
        
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
