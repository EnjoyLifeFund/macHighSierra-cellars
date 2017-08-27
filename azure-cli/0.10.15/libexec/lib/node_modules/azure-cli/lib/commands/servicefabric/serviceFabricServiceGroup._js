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
  
  var serviceGroup = service.category('group')
    .description($('Commands to manage your service group'));
  
  serviceGroup.command('create [applicationName] [serviceName] [serviceTypeName] [serviceKind] [partitionScheme]')
    .description($('Create service group, Example: servicefabric service create --application-name fabric:/app --service-name fabric:/app/service --service-type-name ServiceType1 --service-kind Stateless --instance-count 1 --partition-scheme Singleton'))
    .option('-n --application-name <applicationName>', $('the name of the application'))
    .option('-e --service-name <serviceName>', $('the name of the service'))
    .option('-t --service-type-name <serviceTypeName>', $('the name of the service type'))
    .option('-k --service-kind <serviceKind>', $('the kind of the service, values are [Stateless|Stateful]'))
    .option('-c --instance-count <instanceCount>', $('the count of the instance'))
    .option('-r --target-replica-set-size <targetReplicaSetSize>', $('the size of the target replica set'))
    .option('-m --min-replica-set-size <minReplicaSetSize>', $('the size of the min replica set'))
    .option('-p --has-persisted-state', $('the state of the persisted'))
    .option('-a --partition-scheme <partitionScheme>', $('the scheme of the partition'))
    .option('-t --partition-count <partitionCount>', $('the count of the partition'))
    .option('-i --partition-names <partitionNames>', $('the names of the partition'))
    .option('-l --partition-low-key <partitionLowKey>', $('the key of the partition low'))
    .option('-g --partition-high-key <partitionHighKey>', $('the key of the partition high'))
    .option('-d --service-group-member-description <serviceGroupMemberDescription>', $('the description of the service group member'))
    .option('-o --placement-constraints <placementConstraints>', $('the constraints of the placement'))
    .option('-n --correlation-schema <correlationSchema>', $('the schema of the correlation, json string'))
    .option('-a --service-load-metrics <serviceLoadMetrics>', $('the metrics of the service load, json string'))
    .option('-y --service-placement-policy-description <servicePlacementPolicyDescription>', $('the description of the service placement policy, json string'))
    .execute(function (applicationName, serviceName, serviceTypeName, serviceKind, partitionScheme, options, _) {
      applicationName = cli.interaction.promptIfNotGiven('applicationName', applicationName, _);
      serviceName = cli.interaction.promptIfNotGiven('serviceName', serviceName, _);
      serviceTypeName = cli.interaction.promptIfNotGiven('serviceTypeName', serviceTypeName, _);
      serviceKind = cli.interaction.promptIfNotGiven('serviceKind', serviceKind, _);
      if (serviceKind === 'Stateless') {
        options.instanceCount = cli.interaction.promptIfNotGiven('instanceCount', options.instanceCount, _);
      }
      else if (serviceKind === 'Stateful') {
        options.targetReplicaSetSize = cli.interaction.promptIfNotGiven('targetReplicaSetSize', options.targetReplicaSetSize, _);
        options.minReplicaSetSize = cli.interaction.promptIfNotGiven('minReplicaSetSize', options.minReplicaSetSize, _);
      }
      partitionScheme = cli.interaction.promptIfNotGiven('partitionScheme', partitionScheme, _);
      options.serviceGroupMemberDescription = cli.interaction.promptIfNotGiven('serviceGroupMemberDescription', options.serviceGroupMemberDescription, _);
      if (!serviceFabricUtils.isSubPath(applicationName, serviceName, _)) {
        throw 'ServiceName is not a sub-path of the applicationName';
      }
      
      var progress = cli.interaction.progress($('Create service group'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        var serviceGroupDescription = {};
        if (applicationName) serviceGroupDescription.applicationName = applicationName;
        if (serviceName) serviceGroupDescription.serviceName = serviceName;
        if (serviceTypeName) serviceGroupDescription.serviceTypeName = serviceTypeName;
        if (serviceKind) serviceGroupDescription.ServiceKind = serviceFabricUtils.getEnumVal('serviceKind', serviceKind);// bug in autorest, needs capital
        if (serviceKind === 'Stateless') {
          serviceGroupDescription.instanceCount = Number(options.instanceCount);
        }
        else if (serviceKind === 'Stateful') {
          serviceGroupDescription.targetReplicaSetSize = Number(options.targetReplicaSetSize);
          serviceGroupDescription.minReplicaSetSize = Number(options.minReplicaSetSize);
          if (options.hasPersistedState) {
            serviceGroupDescription.hasPersistedState = true;
          }
          else {
            serviceGroupDescription.hasPersistedState = false;
          }
        }
        serviceGroupDescription.partitionDescription = {
          partitionScheme: serviceFabricUtils.getEnumVal('partitionScheme', partitionScheme)
        };
        
        if (options.partitionCount) serviceGroupDescription.partitionDescription.count = Number(options.partitionCount);
        if (options.partitionNames) serviceGroupDescription.partitionDescription.names = JSON.parse(options.partitionNames);
        if (options.partitionLowKey) serviceGroupDescription.partitionDescription.lowKey = options.partitionLowKey;
        if (options.partitionHighKey) serviceGroupDescription.partitionDescription.highKey = options.partitionHighKey;
        if (options.serviceGroupMemberDescription) serviceGroupDescription.serviceGroupMemberDescription = JSON.parse(options.serviceGroupMemberDescription);
        if (options.placementConstraints) serviceGroupDescription.placementConstraints = options.placementConstraints;
        if (options.correlationSchema) {
          serviceGroupDescription.correlationSchema = JSON.parse(options.correlationSchema);
          serviceGroupDescription.correlationSchema.forEach(function (element) {
            if (element.serviceCorrelationScheme) {
              element.serviceCorrelationScheme = serviceFabricUtils.getEnumVal('serviceCorrelationScheme', element.serviceCorrelationScheme);
            }
          });
        }
        if (options.serviceLoadMetrics) serviceGroupDescription.serviceLoadMetrics = JSON.parse(options.serviceLoadMetrics);
        if (options.servicePlacementPolicyDescription) {
          serviceGroupDescription.servicePlacementPolicyDescription = JSON.parse(options.servicePlacementPolicyDescription);
          serviceGroupDescription.servicePlacementPolicyDescription.forEach(function (element) {
            if (element.type) {
              element.type = serviceFabricUtils.getEnumVal('servicePlacementPolicyType', element.type);
            }
          });
        }
        var res = client.serviceGroups.create(serviceFabricUtils.parseUrl(applicationName, _), serviceGroupDescription, options, _);
        
        progress.end();
        
        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  serviceGroup.command('update [applicationName] [serviceName] [serviceKind]')
    .description($('Update service group'))
    .option('-n --application-name <applicationName>', $('the name of the application'))
    .option('-e --service-name <serviceName>', $('the name of the service'))
    .option('-k --service-kind <serviceKind>', $('the kind of the service, values are [Stateless|Stateful]'))
    .option('-c --instance-count <instanceCount>', $('the count of the instance'))
    .option('-r --target-replica-set-size <targetReplicaSetSize>', $('the size of the target replica set'))
    .option('-m --min-replica-set-size <minReplicaSetSize>', $('the size of the min replica set'))
    .option('-i --replica-restart-wait-duration-in-milliseconds <replicaRestartWaitDurationInMilliseconds>', $('the milliseconds of the replica restart wait duration'))
    .option('-d --quorum-loss-wait-duration-in-milliseconds <quorumLossWaitDurationInMilliseconds>', $('the milliseconds of the quorum loss wait duration'))
    .option('-b --stand-by-replica-keep-duration-in-milliseconds <standByReplicaKeepDurationInMilliseconds>', $('the milliseconds of the stand by replica keep duration'))
    .execute(function (applicationName, serviceName, serviceKind, options, _) {
      applicationName = cli.interaction.promptIfNotGiven('applicationName:', applicationName, _);
      serviceName = cli.interaction.promptIfNotGiven('serviceName:', serviceName, _);
      serviceKind = cli.interaction.promptIfNotGiven('serviceKind:', serviceKind, _);
      
      var progress = cli.interaction.progress($('Update service group'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        applicationName = serviceFabricUtils.parseUrl(applicationName, _);
        serviceName = serviceFabricUtils.parseUrl(serviceName, _);
        var updateServiceGroupDescription = {};
        updateServiceGroupDescription.ServiceKind = serviceFabricUtils.getEnumVal('serviceKind', serviceKind);
        updateServiceGroupDescription.flags = 0;
        if (options.targetReplicaSetSize || options.instanceCount) {
          updateServiceGroupDescription.flags |= 1;
        }
        if (options.replicaRestartWaitDurationInMilliseconds) {
          updateServiceGroupDescription.flags |= 2;
        }
        if (options.quorumLossWaitDurationInMilliseconds) {
          updateServiceGroupDescription.flags |= 4;
        }
        if (options.standByReplicaKeepDurationInMilliseconds) {
          updateServiceGroupDescription.flags |= 8;
        }
        if (options.minReplicaSetSize) {
          updateServiceGroupDescription.flags |= 16;
        }
        if (serviceKind === 'Stateless') {
          updateServiceGroupDescription.instanceCount = Number(options.instanceCount);
        }
        else if (serviceKind === 'Stateful') {
          updateServiceGroupDescription.targetReplicaSetSize = Number(options.targetReplicaSetSize);
          updateServiceGroupDescription.minReplicaSetSize = Number(options.minReplicaSetSize);
        }
        if (options.replicaRestartWaitDurationInMilliseconds) updateServiceGroupDescription.replicaRestartWaitDurationInMilliseconds = Number(options.replicaRestartWaitDurationInMilliseconds);
        if (options.quorumLossWaitDurationInMilliseconds) updateServiceGroupDescription.quorumLossWaitDurationInMilliseconds = Number(options.quorumLossWaitDurationInMilliseconds);
        if (options.standByReplicaKeepDurationInMilliseconds) updateServiceGroupDescription.standByReplicaKeepDurationInMilliseconds = Number(options.standByReplicaKeepDurationInMilliseconds);
        var res = client.serviceGroups.update(applicationName, serviceName, updateServiceGroupDescription, options, _);
        
        progress.end();
        
        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  serviceGroup.command('delete [applicationName] [serviceName]')
    .description($('Delete service group'))
    .option('-n --application-name <applicationName>', $('the name of the application'))
    .option('-e --service-name <serviceName>', $('the name of the service'))
    .execute(function (applicationName, serviceName, options, _) {
      applicationName = cli.interaction.promptIfNotGiven('applicationName', applicationName, _);
      serviceName = cli.interaction.promptIfNotGiven('serviceName', serviceName, _);
      
      var progress = cli.interaction.progress($('Delete service group'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        applicationName = serviceFabricUtils.parseUrl(applicationName, _);
        serviceName = serviceFabricUtils.parseUrl(serviceName, _);
        var res = client.serviceGroups.remove(applicationName, serviceName, options, _);
        
        progress.end();

        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  var serviceGroupTemplate = serviceGroup.category('template')
    .description($('Commands to manage your service group template'));
  
  serviceGroupTemplate.command('create [applicationName] [serviceName] [serviceTypeName]')
    .description($('Create service group from template'))
    .option('-n --application-name <applicationName>', $('the name of the application'))
    .option('-e --service-name <serviceName>', $('the name of the service'))
    .option('-t --service-type-name <serviceTypeName>', $('the name of the service type'))
    .execute(function (applicationName, serviceName, serviceTypeName, options, _) {
      applicationName = cli.interaction.promptIfNotGiven('applicationName', applicationName, _);
      serviceName = cli.interaction.promptIfNotGiven('serviceName', serviceName, _);
      serviceTypeName = cli.interaction.promptIfNotGiven('serviceTypeName', serviceTypeName, _);
      
      var progress = cli.interaction.progress($('Create service group from template'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        applicationName = serviceFabricUtils.parseUrl(applicationName, _);
        var serviceGroupTemplate = {};
        if (serviceName) serviceGroupTemplate.serviceName = serviceName;
        if (serviceTypeName) serviceGroupTemplate.serviceTypeName = serviceTypeName;
        var res = client.serviceFromTemplates.create(applicationName, serviceGroupTemplate, options, _);
        
        progress.end();
        
        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  var serviceGroupDescription = serviceGroup.category('description')
    .description($('Commands to manage your service group description'));
  
  serviceGroupDescription.command('show [serviceName]')
    .description($('Show service group description'))
    .option('-n --service-name <serviceName>', $('the name of the service'))
    .option('--select <fields>', $('select fields to show, call without this parameter to see all fields'))
    .execute(function (serviceName, options, _) {
      var progress = cli.interaction.progress($('Show service group description'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        serviceName = serviceFabricUtils.parseUrl(serviceName, _);
        var res = client.serviceGroupDescriptions.get('_', serviceName, options, _);
        if (options.select) {
          res = serviceFabricUtils.pick(res, options.select, _);
        }
        serviceFabricUtils.setServiceGroupEnumVal(res);
        
        progress.end();
        
        cli.interaction.formatOutput(res, function (data) {
          log.json(data);
        });
      } catch (e) {
        progress.end();
        throw e;
      }
    });
  
  var serviceGroupMember = serviceGroup.category('member')
    .description($('Commands to manage your service'));
  
  serviceGroupMember.command('show [applicationName] [serviceName]')
    .description($('Show service group member'))
    .option('-n --application-name <applicationName>', $('the name of the application'))
    .option('-e --service-name <serviceName>', $('the name of the service'))
    .option('--select <fields>', $('select fields to show, call without this parameter to see all fields'))
    .execute(function (applicationName, serviceName, options, _) {
      var progress = cli.interaction.progress($('Show service group member'));
      
      try {
        var config = serviceFabricUtils.readServiceFabricConfig(progress, _);
        
        var client = new serviceFabricClient('3.0-preview', serviceFabricUtils.createConnectionUrl(config, _), serviceFabricUtils.getClientOptions(config, _));
        applicationName = serviceFabricUtils.parseUrl(applicationName, _);
        serviceName = serviceFabricUtils.parseUrl(serviceName, _);
        var res = client.serviceGroupMembers.get(applicationName, serviceName, options, _);
        if (options.select) {
          res = serviceFabricUtils.pick(res, options.select, _);
        }
        serviceFabricUtils.setServiceGroupEnumVal(res);
        
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