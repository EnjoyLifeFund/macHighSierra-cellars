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
  
  var application = serviceFabric.category('application')
    .description($('Commands to manage your application'));
  
  application.command('show')
    .description($('Show application'))
    .option('-n --application-name <applicationName>', $('the name of the application'))
    .option('--select <fields>', $('select fields to show, call without this parameter to see all fields'))
    .execute(function (options, _) {
      var progress = cli.interaction.progress($('Show application'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        options.applicationName = serviceFabricUtils.parseUrl(options.applicationName, _);
        var res = null;
        if (!options.applicationName) {
          res = client.applications.list(options, _);
        }
        else {
          res = client.applications.get(options.applicationName, options, _);
        }
        if (options.select) {
          res = serviceFabricUtils.pick(res, options.select, _);
        }
        serviceFabricUtils.setApplicationEnumVal(res);
        
        progress.end();
        
        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  application.command('create [applicationName] [applicationTypeName] [applicationTypeVersion]')
    .description($('Create application, Example: azure servicefabric application create --application-name fabric:/app --application-type-name type1 --application-type-version 1.0'))
    .option('-n --application-name <applicationName>', $('the name of the application'))
    .option('-t --application-type-name <applicationTypeName>', $('the name of the application type'))
    .option('-a --application-type-version <applicationTypeVersion>', $('the version of the application type'))
    .option('-p --application-parameter <applicationParameter>', $('the parameter of the application, json string "{"Key": "key1", "Value": "value1"}"'))
    .execute(function (applicationName, applicationTypeName, applicationTypeVersion, options, _) {
      var progress = cli.interaction.progress($('Create application'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        var applicationDescription = {};
        if (applicationName) applicationDescription.name = applicationName;
        if (applicationTypeName) applicationDescription.typeName = applicationTypeName;
        if (applicationTypeVersion) applicationDescription.typeVersion = applicationTypeVersion;
        if (options.applicationParameter) applicationDescription.parameterList = JSON.parse(options.applicationParameter);
        var res = client.applications.create(applicationDescription, options, _);
        
        progress.end();
        
        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  application.command('delete [applicationName]')
    .description($('Delete application'))
    .option('-n --application-name <applicationName>', $('the name of the application'))
    .execute(function (applicationName, options, _) {
      var progress = cli.interaction.progress($('Delete application'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        applicationName = serviceFabricUtils.parseUrl(applicationName, _);
        var res = client.applications.remove(applicationName, options, _);
        
        progress.end();

        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  var applicationManifest = application.category('manifest')
    .description($('Commands to manage your application manifest'));
  
  applicationManifest.command('show [applicationTypeName] [applicationTypeVersion]')
    .description($('Show application manifest'))
    .option('-n --application-type-name <applicationTypeName>', $('the name of the application type'))
    .option('-t --application-type-version <applicationTypeVersion>', $('the type of the application version'))
    .execute(function (applicationTypeName, applicationTypeVersion, options, _) {
      var progress = cli.interaction.progress($('Show application manifest'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        var res = client.applicationManifests.get(applicationTypeName, applicationTypeVersion, options, _);
        serviceFabricUtils.setApplicationEnumVal(res);
        
        progress.end();
        
        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  var applicationType  = application.category('type')
    .description($('Commands to manage your application type'));
  
  applicationType.command('show')
    .description($('Show application type, Example: azure servicefabric application type show --application-type-name type1'))
    .option('-n --application-type-name <applicationTypeName>', $('the type of the application'))
    .option('--select <fields>', $('select fields to show, call without this parameter to see all fields'))
    .execute(function (options, _) {
      var progress = cli.interaction.progress($('Show application type'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        var res = null;
        if (!options.applicationTypeName) {
          res = client.applicationTypes.list(options, _);
        }
        else {
          res = client.applicationTypes.get(options.applicationTypeName, options, _);
        }
        if (options.select) {
          res = serviceFabricUtils.pick(res, options.select, _);
        }
        serviceFabricUtils.setApplicationEnumVal(res);
        
        progress.end();
        
        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  applicationType.command('register [applicationTypeBuildPath]')
    .description($('Register application type, Example: azure servicefabric application type register --application-type-build-path Package1'))
    .option('-p --application-type-build-path <applicationTypeBuildPath>', $('the path of the application type build'))
    .option('-t --timeout <timeout>', $('the timeout, seconds'))
    .execute(function (applicationTypeBuildPath, options, _) {
      applicationTypeBuildPath = cli.interaction.promptIfNotGiven('applicationTypeBuildPath: ', applicationTypeBuildPath, _);
      
      var progress = cli.interaction.progress($('Register application type'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        var registerApplicationType = {};
        registerApplicationType.applicationTypeBuildPath = applicationTypeBuildPath;
        if (options.timeout) options.timeout = Number(options.timeout);
        var res = client.applicationTypes.register(registerApplicationType, options, _);
        
        progress.end();
        
        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  applicationType.command('unregister [applicationTypeName] [applicationTypeVersion]')
    .description($('Unregister application type, Example: azure servicefabric application type unregister --application-type-name type1 --application-type-version 1.0'))
    .option('-n --application-type-name <applicationTypeName>', $('the name of the application type'))
    .option('-t --application-type-version <applicationTypeVersion>', $('the version of the application type'))
    .execute(function (applicationTypeName, applicationTypeVersion, options, _) {
      applicationTypeName = cli.interaction.promptIfNotGiven('applicationTypeName:', applicationTypeName, _);
      applicationTypeVersion = cli.interaction.promptIfNotGiven('applicationTypeVersion: ', applicationTypeVersion, _);
      
      var progress = cli.interaction.progress($('Unregister application type'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        var unregisterApplicationType = {};
        unregisterApplicationType.applicationTypeVersion = applicationTypeVersion;
        var res = client.applicationTypes.unregister(applicationTypeName, unregisterApplicationType, options, _);
        
        progress.end();
        
        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  var applicationHealth = application.category('health')
    .description($('Commands to send your application health'));
  
  applicationHealth.command('show [applicationName]')
    .description($('Show application health'))
    .option('-n --application-name <applicationName>', $('the name of the application'))
    .option('-e --events-health-state-filter <eventsHealthStateFilter>', $('the filter of the event health state, values are [Default|None|Ok|Warning|Error|All]'))
    .option('-f --deployed-applications-health-state-filter <deployedapplicationsHealthStateFilter>', $('the filter of the deployed applications health state, values are [Default|None|Ok|Warning|Error|All]'))
    .option('--select <fields>', $('select fields to show, call without this parameter to see all fields'))
    .execute(function (applicationName, options, _) {
      var progress = cli.interaction.progress($('Show application health'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        applicationName = serviceFabricUtils.parseUrl(applicationName, _);
        var res = client.applicationHealths.get(applicationName, options, _);
        if (options.select) {
          res = serviceFabricUtils.pick(res, options.select, _);
        }
        serviceFabricUtils.setApplicationEnumVal(res);
        
        progress.end();
        
        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  applicationHealth.command('send [applicationName] [sourceId] [property] [healthState]')
    .description($('Send application health, Example: azure servicefabric application health send --application-name fabric:app --source-id monitor --property pc --health-state Ok --description healthy'))
    .option('-n --application-name <applicationName>', $('the name of the application'))
    .option('-i --source-id <sourceId>', $('the id of the source'))
    .option('-p --property <property>', $('the property'))
    .option('-e --health-state <healthState>', $('the state of the health, values are [Ok|Warning|Error|Unknown]'))
    .option('-d --description <description>', $('the description'))
    .option('-m --time-to-live-in-milliSeconds <timeToLiveInMilliSeconds>', $('the time in milliseconds for live'))
    .option('-q --sequence-number <sequenceNumber>', $('the number of the sequence'))
    .option('-w --remove-when-expired', $('the boolean of the remove when expired'))
    .option('--select <fields>', $('select fields to show, call without this parameter to see all fields'))
    .execute(function (applicationName, sourceId, property, healthState, options, _) {
      var progress = cli.interaction.progress($('Send application health'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        var applicationHealthReport = {};
        if (sourceId) applicationHealthReport.sourceId = sourceId;
        if (property) applicationHealthReport.property = property;
        if (healthState) applicationHealthReport.healthState = serviceFabricUtils.getEnumVal('healthState', healthState);
        if (options.description) applicationHealthReport.description = options.description;
        if (options.timeToLiveInMilliSeconds) applicationHealthReport.timeToLiveInMilliSeconds = options.timeToLiveInMilliSeconds;
        if (options.sequenceNumber) applicationHealthReport.sequenceNumber = options.sequenceNumber;
        if (options.removeWhenExpired) {
          applicationHealthReport.removeWhenExpired = true;
        }
        var res = client.applicationHealths.send(applicationName, applicationHealthReport, options, _);
        if (options.select) {
          res = serviceFabricUtils.pick(res, options.select, _);
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
  
  var applicationDeployed = application.category('deployed')
    .description($('Commands to manage your deployed application'));
  
  applicationDeployed.command('show [nodeName]')
    .description($('Show deployed application'))
    .option('-n --node-name <nodeName>', $('the name of the node'))
    .option('-a --application-name <applicationName>', $('the name of the application'))
    .option('--select <fields>', $('select fields to show, call without this parameter to see all fields'))
    .execute(function (nodeName, options, _) {
      var progress = cli.interaction.progress($('Show deployed application'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        var res = null;
        if (!options.applicationName) {
          res = client.deployedApplications.list(nodeName, options, _);
        }
        else {
          options.applicationName = serviceFabricUtils.parseUrl(options.applicationName, _);
          res = client.deployedApplications.get(nodeName, options.applicationName, options, _);
        }
        if (options.select) {
          res = serviceFabricUtils.pick(res, options.select, _);
        }
        serviceFabricUtils.setApplicationEnumVal(res);
        
        progress.end();
        
        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  var applicationDeployedHealth = applicationDeployed.category('health')
    .description($('Commands to manage your deployed application health'));
  
  applicationDeployedHealth.command('show [nodeName] [applicationName]')
    .description($('Show deployed application health'))
    .option('-n --node-name <nodeName>', $('the name of the node'))
    .option('-a --application-name <applicationName>', $('the name of the application'))
    .option('-f --events-health-state-filter <eventsHealthStateFilter>', $('the filter of the event health state, values are [Default|None|Ok|Warning|Error|All]'))
    .option('-p --deployed-service-packages-health-state-filter <deployedServicePackagesHealthStateFilter>', $('the filter of the deployed service packages health state, values are [Default|None|Ok|Warning|Error|All]'))
    .option('--select <fields>', $('select fields to show, call without this parameter to see all fields'))
    .execute(function (nodeName, applicationName, options, _) {
      var progress = cli.interaction.progress($('Show deployed application health'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        applicationName = serviceFabricUtils.parseUrl(applicationName, _);
        var res = client.deployedApplicationHealths.get(nodeName, applicationName, options, _);
        if (options.select) {
          res = serviceFabricUtils.pick(res, options.select, _);
        }
        serviceFabricUtils.setApplicationEnumVal(res);
        
        progress.end();
        
        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  applicationDeployedHealth.command('send [nodeName] [applicationName] [sourceId] [property] [healthState]')
    .description($('Send deployed application health, Example: azure servicefabric deployed application health send --node-name node1 --application-name fabric:app --source-id monitor --property pc --health-state Ok --description healthy'))
    .option('-n --node-name <nodeName>', $('the name of the node'))
    .option('-a --application-name <applicationName>', $('the name of the application'))
    .option('-i --source-id <sourceId>', $('the id of the source'))
    .option('-p --property <property>', $('the property'))
    .option('-e --health-state <healthState>', $('the state of the health, values are [Ok|Warning|Error|Unknown]'))
    .option('-d --description <description>', $('the description'))
    .option('-t --time-to-live-in-milliseconds <timeToLiveInMilliseconds>', $('the time in milliseconds for live'))
    .option('-q --sequence-number <sequenceNumber>', $('the number of the sequence'))
    .option('-r --remove-when-expired', $('the boolean of the remove when expired'))
    .execute(function (nodeName, applicationName, sourceId, property, healthState, options, _) {
      var progress = cli.interaction.progress($('Send cluster health'));
      
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
        if (options.removeWhenExpired) applicationHealthReport.removeWhenExpired = true;
        var res = client.deployedApplicationHealths.send(nodeName, applicationName, applicationHealthReport, options, _);
        
        progress.end();
        
        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  var applicationUpgrade = application.category('upgrade')
    .description($('Commands to manage your application upgrade'));
  
  applicationUpgrade.command('show [applicationName]')
    .description($('Show application upgrade'))
    .option('-n --application-name <applicationName>', $('the name of the application'))
    .execute(function (applicationName, options, _) {
      var progress = cli.interaction.progress($('Show application upgrade'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        applicationName = serviceFabricUtils.parseUrl(applicationName, _);
        var res = client.applicationUpgrades.get(applicationName, options, _);
        serviceFabricUtils.setApplicationEnumVal(res);
        
        progress.end();
        
        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  applicationUpgrade.command('start [applicationName] [targetApplicationTypeVersion] [rollingUpgradeMode]')
    .description($('Start application upgrade, Example: azure servicefabric application upgrade start --application-name fabric:/app --target-application-type-version 1.1 --rolling-upgrade-mode Monitored --force-restart true'))
    .option('-n --application-name <applicationName>', $('the name of the application'))
    .option('-t --target-application-type-version <targetApplicationTypeVersion>', $('the version of the target application type'))
    .option('-p --parameters <parameters>', $('the parameters, json string "{"Key": "key1", "Value": "value1"}"'))
    .option('-m --rolling-upgrade-mode <rollingUpgradeMode>', $('the mode of the rolling upgrade, values are [UnmonitoredAuto|UnmonitoredManual|Monitored]'))
    .option('-r --upgrade-replica-set-check-timeout-in-seconds <upgradeReplicaSetCheckTimeoutInSeconds>', $('the name of the upgrade domain'))
    .option('-f --force-restart', $('the force restart'))
    .option('-o --monitoring-policy <monitoringPolicy>', $('the policy of the monitoring'))
    .option('-a --application-health-policy <applicationHealthPolicy>', $('the policy of the health application'))
    .execute(function (applicationName, targetApplicationTypeVersion, rollingUpgradeMode, options, _) {
      applicationName = cli.interaction.promptIfNotGiven('applicationName: ', applicationName, _);
      targetApplicationTypeVersion = cli.interaction.promptIfNotGiven('targetApplicationTypeVersion: ', targetApplicationTypeVersion, _);
      rollingUpgradeMode = cli.interaction.promptIfNotGiven('rollingUpgradeMode: ', rollingUpgradeMode, _);
      
      var progress = cli.interaction.progress($('Start application upgrade'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        var startApplicationUpgradeDescription = {};
        startApplicationUpgradeDescription.name = applicationName;
        startApplicationUpgradeDescription.targetApplicationTypeVersion = targetApplicationTypeVersion;
        if (options.parameters) {
          startApplicationUpgradeDescription.parameters = JSON.parse(options.parameters);
        }
        startApplicationUpgradeDescription.upgradeKind = 'Rolling';// TODO
        startApplicationUpgradeDescription.rollingUpgradeMode = serviceFabricUtils.getEnumVal('rollingUpgradeMode', rollingUpgradeMode);
        if (options.upgradeReplicaSetCheckTimeoutInSeconds) {
          startApplicationUpgradeDescription.upgradeReplicaSetCheckTimeoutInSeconds = Number(options.upgradeReplicaSetCheckTimeoutInSeconds);
        }
        if (options.forceRestart) {
          startApplicationUpgradeDescription.forceRestart = true;
        }
        if (options.monitoringPolicy) {
          startApplicationUpgradeDescription.monitoringPolicy = JSON.parse(options.monitoringPolicy);
          if (options.failureAction) {
            startApplicationUpgradeDescription.monitoringPolicy.failureAction = serviceFabricUtils.getEnumVal('failureAction', options.failureAction);
          }
        }
        if (options.applicationHealthPolicy) {
          startApplicationUpgradeDescription.applicationHealthPolicy = JSON.parse(options.applicationHealthPolicy);
        }
        var res = client.applicationUpgrades.start(serviceFabricUtils.parseUrl(applicationName, _), startApplicationUpgradeDescription, options, _);
        
        progress.end();
        
        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  applicationUpgrade.command('update [applicationName]')
    .description($('Update application upgrade, Example: azure servicefabric application upgrade update --application-name fabric:/app --rolling-upgrade-mode Monitored'))
    .option('-n --application-name <applicationName>', $('the name of the application'))
    .option('-m --rolling-upgrade-mode <rollingUpgradeMode>', $('the mode of the rolling upgrade, values are [UnmonitoredAuto|UnmonitoredManual|Monitored]'))
    .option('-r --force-restart', $('the boolean of the force restart'))
    .option('-a --failure-action <failureAction>', $('the mode of the failure action, values are [Rollback|Manual]'))
    .option('-i --upgrade-replica-set-check-timeout-in-seconds <upgradeReplicaSetCheckTimeoutInSeconds>', $('the mode of the rolling upgrade'))
    .option('-d --health-check-wait-duration-in-milliseconds <healthCheckWaitDurationInMilliseconds>', $('the mode of the rolling upgrade'))
    .option('-c --health-check-stable-duration-in-milliseconds <healthCheckStableDurationInMilliseconds>', $('the mode of the rolling upgrade'))
    .option('-e --health-check-retry-timeout-in-milliseconds <healthCheckRetryTimeoutInMilliseconds>', $('the mode of the rolling upgrade'))
    .option('-u --upgrade-timeout-in-milliseconds <upgradeTimeoutInMilliseconds>', $('the mode of the rolling upgrade'))
    .option('-p --upgrade-domain-timeout-in-milliseconds <upgradeDomainTimeoutInMilliseconds>', $('the mode of the rolling upgrade'))
    .option('-l --application-health-policy <applicationHealthPolicy>', $('the policy of the health application'))
    .execute(function (applicationName, options, _) {
      applicationName = cli.interaction.promptIfNotGiven('applicationName:', applicationName, _);
      
      var progress = cli.interaction.progress($('Update application upgrade'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        var updateApplicationUpgradeDescription = {};
        updateApplicationUpgradeDescription.name = applicationName;
        updateApplicationUpgradeDescription.upgradeKind = 'Rolling';
        updateApplicationUpgradeDescription.updateDescription = {};
        if (options.rollingUpgradeMode) {
          updateApplicationUpgradeDescription.updateDescription.rollingUpgradeMode = serviceFabricUtils.getEnumVal('rollingUpgradeMode', options.rollingUpgradeMode);
        }
        if (options.forceRestart) {
          updateApplicationUpgradeDescription.updateDescription.forceRestart = true;
        }
        if (options.failureAction) {
          updateApplicationUpgradeDescription.updateDescription.failureAction = serviceFabricUtils.getEnumVal('failureAction', options.failureAction);
        }
        if (options.upgradeReplicaSetCheckTimeoutInSeconds) {
          updateApplicationUpgradeDescription.updateDescription.upgradeReplicaSetCheckTimeoutInSeconds = Number(options.upgradeReplicaSetCheckTimeoutInSeconds);
        }
        if (options.healthCheckWaitDurationInMilliseconds) {
          updateApplicationUpgradeDescription.updateDescription.healthCheckWaitDurationInMilliseconds = options.healthCheckWaitDurationInMilliseconds;
        }
        if (options.healthCheckStableDurationInMilliseconds) {
          updateApplicationUpgradeDescription.updateDescription.healthCheckStableDurationInMilliseconds = options.healthCheckStableDurationInMilliseconds;
        }
        if (options.healthCheckRetryTimeoutInMilliseconds) {
          updateApplicationUpgradeDescription.updateDescription.healthCheckRetryTimeoutInMilliseconds = options.healthCheckRetryTimeoutInMilliseconds;
        }
        if (options.upgradeTimeoutInMilliseconds) {
          updateApplicationUpgradeDescription.updateDescription.upgradeTimeoutInMilliseconds = options.upgradeTimeoutInMilliseconds;
        }
        if (options.upgradeDomainTimeoutInMilliseconds) {
          updateApplicationUpgradeDescription.updateDescription.upgradeDomainTimeoutInMilliseconds = options.upgradeDomainTimeoutInMilliseconds;
        }
        if (options.applicationHealthPolicy) {
          updateApplicationUpgradeDescription.applicationHealthPolicy = JSON.parse(options.applicationHealthPolicy);
        }
        var res = client.applicationUpgrades.update(serviceFabricUtils.parseUrl(applicationName, _), updateApplicationUpgradeDescription, options, _);
        
        progress.end();
        
        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  applicationUpgrade.command('resume [applicationName] [upgradeDomainName]')
    .description($('Resume application upgrade'))
    .option('-n --application-name <applicationName>', $('the name of the application'))
    .option('-d --upgrade-domain-name <upgradeDomainName>', $('the name of the upgrade domain'))
    .execute(function (applicationName, upgradeDomainName, options, _) {
      applicationName = cli.interaction.promptIfNotGiven('applicationName:', applicationName, _);
      upgradeDomainName = cli.interaction.promptIfNotGiven('upgradeDomainName:', upgradeDomainName, _);
      
      var progress = cli.interaction.progress($('Resume application upgrade'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        applicationName = serviceFabricUtils.parseUrl(applicationName, _);
        var resumeApplicationUpgrade = {};
        resumeApplicationUpgrade.upgradeDomainName = upgradeDomainName;
        var res = client.applicationUpgrades.resume(applicationName, resumeApplicationUpgrade, options, _);
        
        progress.end();
        
        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  applicationUpgrade.command('rollback [applicationName]')
    .description($('Start application upgrade rollback'))
    .option('-n --application-name <applicationName>', $('the name of the application'))
    .execute(function (applicationName, options, _) {
      applicationName = cli.interaction.promptIfNotGiven('applicationName:', applicationName, _);
      
      var progress = cli.interaction.progress($('Start application upgrade rollback'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        applicationName = serviceFabricUtils.parseUrl(applicationName, _);
        var res = client.applicationRollbacks.start(applicationName, options, _);
        
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
