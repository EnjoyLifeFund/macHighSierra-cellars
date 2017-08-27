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
  
  var service = serviceFabric.category('service')
    .description($('Commands to manage your service'));
  
  service.command('show [applicationName]')
    .description($('Show service'))
    .option('-n --application-name <serviceName>', $('the name of the application'))
    .option('-e --service-name <serviceName>', $('the name of the service'))
    .option('--select <fields>', $('select fields to show, call without this parameter to see all fields'))
    .execute(function (applicationName, options, _) {
      var progress = cli.interaction.progress($('Show service'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        applicationName = serviceFabricUtils.parseUrl(applicationName, _);
        var res = null;
        if (!options.serviceName) {
          res = client.services.list(applicationName, options, _);
        }
        else {
          options.serviceName = serviceFabricUtils.parseUrl(options.serviceName, _);
          res = client.services.get(applicationName, options.serviceName, options, _);
        }
        if (options.select) {
          res = serviceFabricUtils.pick(res, options.select, _);
        }
        serviceFabricUtils.setServiceEnumVal(res);
        
        progress.end();
        
        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      }
      catch (e) {
        progress.end();
        throw e;
      }
    });
  
  service.command('create [applicationName] [serviceName] [serviceTypeName] [serviceKind] [partitionScheme]')
    .description($('Create service, Example: servicefabric service create --application-name fabric:/app --service-name fabric:/app/service --service-type-name ServiceType1 --service-kind Stateless --instance-count 1 --partition-scheme Singleton'))
    .option('-n --application-name <applicationName>', $('the name of the application'))
    .option('-e --service-name <serviceName>', $('the name of the service'))
    .option('-t --service-type-name <serviceTypeName>', $('the name of the service type'))
    .option('-k --service-kind <serviceKind>', $('the kind of the service, values are [Stateless|Stateful]'))
    .option('-c --instance-count <instanceCount>', $('the count of the instance'))
    .option('-r --target-replica-set-size <targetReplicaSetSize>', $('the size of the target replica set'))
    .option('-m --min-replica-set-size <minReplicaSetSize>', $('the size of the min replica set'))
    .option('-p --has-persisted-state', $('the state of the persisted'))
    .option('-a --partition-scheme <partitionScheme>', $('the scheme of the partition'))
    .option('-i --partition-count <partitionCount>', $('the count of the partition'))
    .option('-o --partition-names <partitionNames>', $('the names of the partition'))
    .option('-l --partition-low-key <partitionLowKey>', $('the key of the partition low'))
    .option('-g --partition-high-key <partitionHighKey>', $('the key of the partition high'))
    .option('-b --placement-constraints <placementConstraints>', $('the constraints of the placement'))
    .option('-c --correlation-schema <correlationSchema>', $('the schema of the correlation, json string'))
    .option('-d --service-load-metrics <serviceLoadMetrics>', $('the metrics of the service load, json string'))
    .option('-f --service-placement-policy-description <servicePlacementPolicyDescription>', $('the description of the service placement policy, json string'))
    .execute(function (applicationName, serviceName, serviceTypeName, serviceKind, partitionScheme, options, _) {
      applicationName = cli.interaction.promptIfNotGiven('applicationName:', applicationName, _);
      serviceName = cli.interaction.promptIfNotGiven('serviceName:', serviceName, _);
      serviceTypeName = cli.interaction.promptIfNotGiven('serviceTypeName:', serviceTypeName, _);
      serviceKind = cli.interaction.promptIfNotGiven('serviceKind:', serviceKind, _);
      if (serviceKind === 'Stateless') {
        options.instanceCount = cli.interaction.promptIfNotGiven('instanceCount:', options.instanceCount, _);
      }
      else if (serviceKind === 'Stateful') {
        options.targetReplicaSetSize = cli.interaction.promptIfNotGiven('targetReplicaSetSize:', options.targetReplicaSetSize, _);
        options.minReplicaSetSize = cli.interaction.promptIfNotGiven('minReplicaSetSize:', options.minReplicaSetSize, _);
      }
      partitionScheme = cli.interaction.promptIfNotGiven('partitionScheme:', partitionScheme, _);
      if (!serviceFabricUtils.isSubPath(applicationName, serviceName, _)) {
        throw 'ServiceName is not a sub-path of the applicationName';
      }
      
      var progress = cli.interaction.progress($('Create service'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        var serviceDescription = {};
        serviceDescription.applicationName = applicationName;
        serviceDescription.serviceName = serviceName;
        serviceDescription.serviceTypeName = serviceTypeName;
        serviceDescription.ServiceKind = serviceFabricUtils.getEnumVal('serviceKind', serviceKind);// bug in autorest, needs capital
        if (serviceKind === 'Stateless') {
          serviceDescription.instanceCount = Number(options.instanceCount);
        }
        else if (serviceKind === 'Stateful') {
          serviceDescription.targetReplicaSetSize = Number(options.targetReplicaSetSize);
          serviceDescription.minReplicaSetSize = Number(options.minReplicaSetSize);
          if (options.hasPersistedState) {
            serviceDescription.hasPersistedState = true;
          }
          else {
            serviceDescription.hasPersistedState = false;
          }
        }
        serviceDescription.partitionDescription = {
          partitionScheme: serviceFabricUtils.getEnumVal('partitionScheme', partitionScheme)
        };
        if (options.partitionCount) serviceDescription.partitionDescription.count = Number(options.partitionCount);
        if (options.partitionNames) serviceDescription.partitionDescription.names = JSON.parse(options.partitionNames);
        if (options.partitionLowKey) serviceDescription.partitionDescription.lowKey = options.partitionLowKey;
        if (options.partitionHighKey) serviceDescription.partitionDescription.highKey = options.partitionHighKey;
        if (options.placementConstraints) serviceDescription.placementConstraints = options.placementConstraints;
        if (options.correlationSchema) {
          serviceDescription.correlationSchema = JSON.parse(options.correlationSchema);
          serviceDescription.correlationSchema.forEach(function (element) {
            if (element.serviceCorrelationScheme) {
              element.serviceCorrelationScheme = serviceFabricUtils.getEnumVal('serviceCorrelationScheme', element.serviceCorrelationScheme);
            }
          });
        }
        if (options.serviceLoadMetrics) serviceDescription.serviceLoadMetrics = JSON.parse(options.serviceLoadMetrics);
        if (options.servicePlacementPolicyDescription) {
          serviceDescription.servicePlacementPolicyDescription = JSON.parse(options.servicePlacementPolicyDescription);
          serviceDescription.servicePlacementPolicyDescription.forEach(function (element) {
            if (element.type) {
              element.type = serviceFabricUtils.getEnumVal('servicePlacementPolicyType', element.type);
            }
          });
        }
        var res = client.services.create(serviceFabricUtils.parseUrl(applicationName, _), serviceDescription, options, _);
        
        progress.end();
        
        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  service.command('update [serviceName] [serviceKind]')
    .description($('Update service, Example: azure servicefabric service update --service-name fabric:/app --instance-count 1'))
    .option('-n --service-name <serviceName>', $('the name of the service'))
    .option('-k --service-kind <serviceKind>', $('the kind of the service, values are [Stateless|Stateful]'))
    .option('-c --instance-count <instanceCount>', $('the count of the instance'))
    .option('-r --target-replica-set-size <targetReplicaSetSize>', $('the size of the target replica set'))
    .option('-m --min-replica-set-size <minReplicaSetSize>', $('the size of the min replica set'))
    .option('-i --replica-restart-wait-duration-in-milliseconds <replicaRestartWaitDurationInMilliseconds>', $('the milliseconds of the replica restart wait duration'))
    .option('-d --quorum-loss-wait-duration-in-milliseconds <quorumLossWaitDurationInMilliseconds>', $('the milliseconds of the quorum loss wait duration'))
    .option('-t --stand-by-replica-keep-duration-in-milliseconds <standByReplicaKeepDurationInMilliseconds>', $('the milliseconds of the stand by replica keep duration'))
    .execute(function (serviceName, serviceKind, options, _) {
      serviceName = cli.interaction.promptIfNotGiven('serviceName:', serviceName, _);
      serviceKind = cli.interaction.promptIfNotGiven('serviceKind:', serviceKind, _);
      
      var progress = cli.interaction.progress($('Update service'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        serviceName = serviceFabricUtils.parseUrl(serviceName, _);
        var updateServiceDescription = {};
        if (serviceKind) updateServiceDescription.ServiceKind = serviceFabricUtils.getEnumVal('serviceKind', serviceKind);
        updateServiceDescription.flags = 0;
        if (options.targetReplicaSetSize || options.instanceCount) {
          updateServiceDescription.flags |= 1;
        }
        if (options.replicaRestartWaitDurationInMilliseconds) {
          updateServiceDescription.flags |= 2;
        }
        if (options.quorumLossWaitDurationInMilliseconds) {
          updateServiceDescription.flags |= 4;
        }
        if (options.standByReplicaKeepDurationInMilliseconds) {
          updateServiceDescription.flags |= 8;
        }
        if (options.minReplicaSetSize) {
          updateServiceDescription.flags |= 16;
        }
        if (serviceKind === 'Stateless') {
          updateServiceDescription.instanceCount = Number(options.instanceCount);
        }
        else if (serviceKind === 'Stateful') {
          updateServiceDescription.targetReplicaSetSize = Number(options.targetReplicaSetSize);
          updateServiceDescription.minReplicaSetSize = Number(options.minReplicaSetSize);
        }
        if (options.replicaRestartWaitDurationInMilliseconds) updateServiceDescription.replicaRestartWaitDurationInMilliseconds = Number(options.replicaRestartWaitDurationInMilliseconds);
        if (options.quorumLossWaitDurationInMilliseconds) updateServiceDescription.quorumLossWaitDurationInMilliseconds = Number(options.quorumLossWaitDurationInMilliseconds);
        if (options.standByReplicaKeepDurationInMilliseconds) updateServiceDescription.standByReplicaKeepDurationInMilliseconds = Number(options.standByReplicaKeepDurationInMilliseconds);
        var res = client.services.update(serviceName, updateServiceDescription, options, _);
        
        progress.end();
        
        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  service.command('delete [serviceName]')
    .description($('Delete service'))
    .option('-n --service-name <serviceName>', $('the name of the service'))
    .execute(function (serviceName, options, _) {
      serviceName = cli.interaction.promptIfNotGiven('serviceName', serviceName, _);
      
      var progress = cli.interaction.progress($('Delete service'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        serviceName = serviceFabricUtils.parseUrl(serviceName, _);
        var res = client.services.remove(serviceName, options, _);
        
        progress.end();

        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  service.command('resolve [serviceName]')
    .description($('Resolve service'))
    .option('-n --service-name <serviceName>', $('the name of the service'))
    .option('-t --partition-key-type <partitionKeyType>', $('the type of the partition key, values are [Singleton|Int64Range|Named]'))
    .option('-k --partition-key-value <partitionKeyValue>', $('the value of the partition key'))
    .option('-r --previous-rsp-version <previousRspVersion>', $('the version of the previous rsp'))
    .option('--select <fields>', $('select fields to show, call without this parameter to see all fields'))
    .execute(function (serviceName, options, _) {
      serviceName = cli.interaction.promptIfNotGiven('serviceName', serviceName, _);
      
      var progress = cli.interaction.progress($('Resolve service'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        serviceName = serviceFabricUtils.parseUrl(serviceName, _);
        var res = client.services.resolve(serviceName, options, _);
        if (options.select) {
          res = serviceFabricUtils.pick(res, options.select, _);
        }
        serviceFabricUtils.setServiceEnumVal(res);
        
        progress.end();
        
        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  var serviceTemplate = service.category('template')
    .description($('Commands to manage your service template'));
  
  serviceTemplate.command('create [applicationName] [serviceName] [serviceTypeName]')
    .description($('Create service from template'))
    .option('-n --application-name <applicationName>', $('the name of the application'))
    .option('-e --service-name <serviceName>', $('the name of the service'))
    .option('-t --service-type-name <serviceTypeName>', $('the name of the service type'))
    .execute(function (applicationName, serviceName, serviceTypeName, options, _) {
      applicationName = cli.interaction.promptIfNotGiven('applicationName', applicationName, _);
      serviceName = cli.interaction.promptIfNotGiven('serviceName', serviceName, _);
      serviceTypeName = cli.interaction.promptIfNotGiven('serviceTypeName', serviceTypeName, _);
      
      var progress = cli.interaction.progress($('Create service from template'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        applicationName = serviceFabricUtils.parseUrl(applicationName, _);
        var serviceTemplate = {};
        if (serviceName) serviceTemplate.serviceName = serviceName;
        if (serviceTypeName) serviceTemplate.serviceTypeName = serviceTypeName;
        var res = client.serviceFromTemplates.create(applicationName, serviceTemplate, options, _);
        
        progress.end();
        
        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  var serviceType = service.category('type')
    .description($('Commands to manage your service manifest'));
  
  serviceType.command('show [applicationTypeName] [applicationTypeVersion]')
    .description($('Show service type'))
    .option('-n --application-type-name <applicationTypeName>', $('the type of the application type'))
    .option('-t --application-type-version <applicationTypeVersion>', $('the version of the application type'))
    .option('--select <fields>', $('select fields to show, call without this parameter to see all fields'))
    .execute(function (applicationTypeName, applicationTypeVersion, options, _) {
      var progress = cli.interaction.progress($('Show service type'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        var res = client.serviceTypes.get(applicationTypeName, applicationTypeVersion, options, _);
        if (options.select) {
          res = serviceFabricUtils.pick(res, options.select, _);
        }
        serviceFabricUtils.setServiceEnumVal(res);
        
        progress.end();
        
        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  var serviceTypeDeployed  = serviceType.category('deployed')
    .description($('Commands to manage your deployed service type'));
  
  // TODO: document missing
  serviceTypeDeployed.command('show [nodeName] [applicationName]')
    .description($('Show deployed service type'))
    .option('-n --node-name <nodeName>', $('the name of the node'))
    .option('-a --application-name <applicationName>', $('the name of the application'))
    .option('-p --service-package-name <servicePackageName>', $('the name of the service package'))
    .option('-l --application-name <applicationName>', $('the name of the application'))
    .option('--select <fields>', $('select fields to show, call without this parameter to see all fields'))
    .execute(function (nodeName, applicationName, options, _) {
      var progress = cli.interaction.progress($('ShowDeployedServicePackage'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        applicationName = serviceFabricUtils.parseUrl(applicationName, _);
        var res = client.deployedServicePackages.get(nodeName, applicationName, options, _);
        if (options.select) {
          res = serviceFabricUtils.pick(res, options.select, _);
        }
        serviceFabricUtils.setServiceEnumVal(res);
        
        progress.end();
        
        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  var serviceManifest = service.category('manifest')
    .description($('Commands to manage your service manifest'));
  
  serviceManifest.command('show [applicationTypeName] [applicationTypeVersion] [serviceManifestName]')
    .description($('Show service manifest'))
    .option('-n --application-type-name <applicationTypeName>', $('the type of the application type'))
    .option('-t --application-type-version <applicationTypeVersion>', $('the version of the application type'))
    .option('-m --service-manifest-name <serviceManifestName>', $('the name of the service manifest'))
    .execute(function (applicationTypeName, applicationTypeVersion, serviceManifestName, options, _) {
      var progress = cli.interaction.progress($('Show service manifest'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        var res = client.serviceManifests.get(applicationTypeName, applicationTypeVersion, serviceManifestName, options, _);
        if (options.select) {
          res = serviceFabricUtils.pick(res, options.select, _);
        }
        serviceFabricUtils.setServiceEnumVal(res);
        
        progress.end();
        
        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  var serviceDescription = service.category('description')
    .description($('Commands to manage your service'));
  
  serviceDescription.command('show [serviceName]')
    .description($('Show service description'))
    .option('-n --service-name <serviceName>', $('the name of the service'))
    .option('--select <fields>', $('select fields to show, call without this parameter to see all fields'))
    .execute(function (serviceName, options, _) {
      var progress = cli.interaction.progress($('Show service description'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        serviceName = serviceFabricUtils.parseUrl(serviceName, _);
        var res = client.serviceDescriptions.get(serviceName, options, _);
        if (options.select) {
          res = serviceFabricUtils.pick(res, options.select, _);
        }
        serviceFabricUtils.setServiceEnumVal(res);
        
        progress.end();
        
        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  var serviceHealth = service.category('health')
    .description($('Commands to manage your service'));
  
  serviceHealth.command('show [serviceName]')
    .description($('Show service health'))
    .option('-n --service-name <serviceName>', $('the name of the service'))
    .option('--select <fields>', $('select fields to show, call without this parameter to see all fields'))
    .execute(function (serviceName, options, _) {
      var progress = cli.interaction.progress($('Show service description'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        serviceName = serviceFabricUtils.parseUrl(serviceName, _);
        var res = client.serviceHealths.get(serviceName, options, _);
        if (options.select) {
          res = serviceFabricUtils.pick(res, options.select, _);
        }
        serviceFabricUtils.setServiceEnumVal(res);
        
        progress.end();
        
        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  serviceHealth.command('send [serviceName] [sourceId] [property] [healthState]')
    .description($('Send service health, Example: azure servicefabric service health send --service-name fabric:/app/svc fabric:app --source-id monitor --property pc --health-state Ok --description healthy'))
    .option('-n --service-name <serviceName>', $('the id of the partition'))
    .option('-i --source-id <sourceId>', $('the id of the source'))
    .option('-p --property <property>', $('the property'))
    .option('-e --health-state <healthState>', $('the state of the health, values are [Ok|Warning|Error|Unknown]'))
    .option('-d --description <description>', $('the description'))
    .option('-m --time-to-live-in-milliseconds <timeToLiveInMilliSeconds>', $('the time in milliseconds for live'))
    .option('-q --sequence-number <sequenceNumber>', $('the number of the sequence'))
    .option('-w --remove-when-expired', $('the boolean of the remove when expired'))
    .execute(function (serviceName, sourceId, property, healthState, options, _) {
      var progress = cli.interaction.progress($('Send service health'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        serviceName = serviceFabricUtils.parseUrl(serviceName, _);
        var serviceHealthReport = {};
        if (sourceId) serviceHealthReport.sourceId = sourceId;
        if (property) serviceHealthReport.property = property;
        if (healthState) serviceHealthReport.healthState = serviceFabricUtils.getEnumVal('healthState', healthState);
        if (options.description) serviceHealthReport.description = options.description;
        if (options.timeToLiveInMilliseconds) serviceHealthReport.timeToLiveInMilliSeconds = options.timeToLiveInMilliseconds;
        if (options.sequenceNumber) serviceHealthReport.sequenceNumber = options.sequenceNumber;
        if (options.removeWhenExpired) {
          serviceHealthReport.removeWhenExpired = true;
        }
        var res = client.serviceHealths.send(serviceName, serviceHealthReport, options, _);
        
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
