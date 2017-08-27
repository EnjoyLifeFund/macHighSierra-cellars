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

var __ = require('underscore');
var util = require('util');

var groupUtils = require('../group/groupUtils');
var permissionsUtils = require('../role/permissionsUtils');
var rbacClients = require('../role/rbacClients');
var profile = require('../../../util/profile');
var resourceUtils = require('./resourceUtils');
var tagUtils = require('../tag/tagUtils');
var utils = require('../../../util/utils');
var jsonlint = require('jsonlint');

var $ = utils.getLocaleString;

exports.init = function (cli) {
  var log = cli.output;
  var resource = cli.category('resource')
    .description($('Commands to manage your resources'));

  resource.command('create [resource-group] [name] [resource-type] [api-version]')
    .description($('Creates a resource in a resource group'))
    .usage('[options] <resource-group> <name> <resource-type> <location> <api-version>')
    .option('-g --resource-group <resource-group>', $('the resource group name'))
    .option('-n --name <name>', $('the resource name'))
    .option('-r --resource-type <resource-type>', $('the resource type'))
    .option('-o --api-version <api-version>', $('the API version of the resource provider'))
    .option('--parent <parent>', $('the name of the parent resource (if needed), in path/path/path format'))
    .option('-p --properties <properties>', $('a JSON-formatted string containing properties'))
    .option('--sku <sku>', $('a JSON-formatted string containing sku properties'))
    .option('-l --location <location>', $('the location where we will create the resource'))
    .option('--plan <plan>', $('a JSON-formatted string containing plan properties'))
    .option('--isFullObject', $('Indicates that the property object includes other options such as location, tags, sku, and/or plan.'))
    .option('-t --tags <tags>', $('Tags to set to the resource group. Can be mutliple. ' +
            'In the format of \'name=value\'. Name is required and value is optional. For example, -t tag1=value1;tag2'))
    .option('--subscription <subscription>', $('the subscription identifier'))
    .execute(function (resourceGroup, name, resourceType, apiVersion, options, _) {
      var values = getValuesForCommand(resourceGroup, name, resourceType, apiVersion, options);
      resource.createResource(values.resourceGroup, values.resourceName, values.resourceType, values.apiVersion, options.properties, values.options, _);
    });

  resource.command('set [resource-group] [name] [resource-type] [properties] [api-version]')
    .usage('[options] <resource-group> <name> <resource-type> <properties> <api-version>')
    .description($('Updates a resource in a resource group without any templates or parameters'))
    .option('-g --resource-group <resource-group>', $('the resource group name'))
    .option('-n --name <name>', $('the resource name'))
    .option('-r --resource-type <resource-type>', $('the resource type'))
    .option('-p --properties <properties>', $('a JSON-formatted string containing properties'))
    .option('-o --api-version <api-version>', $('the API version of the resource provider'))
    .option('-i --resource-id <resource-id>', $('the resource id'))
    .option('--sku <sku>', $('a JSON-formatted string containing sku properties'))
    .option('--plan <plan>', $('a JSON-formatted string containing plan properties'))
    .option('--isFullObject', $('Indicates that the property object includes other options such as location, tags, sku, and/or plan.'))
    .option('--parent <parent>', $('the name of the parent resource (if needed), in path/path/path format'))
    .option('-t --tags <tags>', $('Tags to set to the resource. Can be multiple. ' +
      'In the format of \'name=value\'. Name is required and value is optional. For example, -t tag1=value1;tag2'))
    .option('--no-tags', $('remove all existing tags'))
    .option('--subscription <subscription>', $('the subscription identifier'))
    .execute(function (resourceGroup, name, resourceType, properties, apiVersion, options, _) {
      var values = getValuesForCommand(resourceGroup, name, resourceType, apiVersion, options);
      resource.createResource(values.resourceGroup, values.resourceName, values.resourceType, values.apiVersion, options.properties, values.options, _);
    });

  resource.createResource = function (resourceGroup, name, resourceType, apiVersion, propertiesParam, options, _) {
    var subscription = profile.current.getSubscription(options.subscription);
    var client = utils.createResourceClient(subscription);
    var requestProperties = {};
    var identity = {
      resourceName: name,
      resourceProviderNamespace: resourceUtils.getProviderName(resourceType),
      resourceProviderApiVersion: apiVersion,
      resourceType: resourceUtils.getResourceTypeName(resourceType),
      // TODO: parent should be optional in the API. temporary workaround.
      parentResourcePath: __.isString(options.parent) ? options.parent : ''
    };
    var resourceGroupObj = groupUtils.getGroup(client, resourceGroup, _);
    if(!resourceGroupObj) {
      throw new Error('Resource group \'' + resourceGroup + '\' could not be found.');
    }
    resourceGroupObj = resourceGroupObj || {};
    var properties = {};
    if (propertiesParam) {
      properties = parsed(propertiesParam, 'properties');
    }
    if(!options.isFullObject){
      var tags = {};
      tags = tagUtils.buildTagsParameter(tags, options);
      var resourceLocation = options.location || resourceGroupObj.location;
      if (!resourceLocation){
        cli.missingArgument('location');
      }
      if (options.sku) {
        requestProperties.sku = parsed(options.sku, 'sku');
      }
      if (options.plan) {
        requestProperties.plan = parsed(options.plan, 'plan');
      }
      requestProperties.location = resourceLocation;
      requestProperties.tags = tags;
      requestProperties.properties = properties;
    } else {
      requestProperties = properties;
    }
    var message = util.format($('Creating resource %s'), name);
    var doneMessage = util.format($('Created resource %s'), name);
    if (resourceGroupObj) {
      message = util.format($('Updating resource %s'), name);
      doneMessage = util.format($('Resource %s is updated'), name);
    }
    var newResource;
    cli.interaction.withProgress(util.format($('Creating resource %s'), name),
      function (log, _) {
        newResource = client.resources.createOrUpdate(resourceGroup,
          identity.resourceProviderNamespace,
          identity.parentResourcePath,
          identity.resourceType,
          identity.resourceName,
          apiVersion,
          requestProperties,
          _);
      }, _);

    log.info(doneMessage);
    //Handle 202 response where RPs don't send Id in the response object
    if (!newResource.id) {
        newResource = client.resources.get(resourceGroup,
          identity.resourceProviderNamespace,
          identity.parentResourcePath,
          identity.resourceType,
          identity.resourceName,
          apiVersion,
          _);
    }
    showResource(newResource);
  };

  resource.command('list [resource-group]')
    .description($('Lists the resources'))
    .option('-g --resource-group <resource-group>', $('the resource group name'))
    .option('-r --resource-type <resource-type>', $('the resource type'))
    .option('--details', $('show details such as permissions, etc.'))
    .option('-t --tags <tags>', $('Tag to use to filter to the resource group. Can only take 1 tag. ' +
        'In the format of "name=value". Name is required and value is optional. ' +
        'For example, -t tag1 or -t tag1=value1.'))
    .option('--subscription <subscription>', $('the subscription identifier'))
    .execute(function (resourceGroup, options, _) {
      var subscription = profile.current.getSubscription(options.subscription);
      var client = utils.createResourceClient(subscription);
      var progress = cli.interaction.progress(util.format($('Listing resources')));

      var resources;
      try {
        var parameters = {};
        if (options) {
          if (options.resourceType) {
            parameters.filter = 'resourceType eq \'' + options.resourceType + '\'';
          }
          if (options.tags) {
            var tagsInfo = {};
            var filterString = parameters.filter || '';
            tagUtils.populateQueryFilterWithTagInfo(options.tags, tagsInfo);
            if (parameters.filter) {
              if (tagsInfo.tagName) {
                filterString += ' and  tagname eq \'' + tagsInfo.tagName + '\'';
              }
              if (tagsInfo.tagValue) {
                filterString += ' and  tagvalue eq \'' + tagsInfo.tagValue + '\'';
              }
            } else {
              if (tagsInfo.tagName) {
                filterString += 'tagname eq \'' + tagsInfo.tagName + '\'';
              }
              if (tagsInfo.tagValue) {
                filterString += ' and  tagvalue eq \'' + tagsInfo.tagValue + '\'';
              }
            }
            parameters.filter = filterString;
          }
        }
        // If resourcegroup is provided then resourceGroups.listResources should be called
        if (resourceGroup) {
          resources = client.resourceGroups.listResources(resourceGroup, parameters, _);
        } else {
          resources = client.resources.list(parameters, _);
        }
      } finally {
        progress.end();
      }

      if (options.details) {
        var authzClient = rbacClients.getAuthzClient(subscription);
        for (var i = 0; i < resources.length; i++) {
          var resourceInformation = resourceUtils.getResourceInformation(resources[i].id);
          resources[i].permissions = authzClient.permissions.listForResource(resourceInformation.resourceGroup, {
            resourceName: resourceInformation.resourceName,
            resourceType: resourceUtils.getResourceTypeName(resourceInformation.resourceType),
            resourceProviderNamespace: resourceUtils.getProviderName(resourceInformation.resourceType),
            parentResourcePath: resourceInformation.parentResource ? resourceInformation.parentResource : '',
          },
          _).permissions;
        }
      }

      if (resources.length === 0) {
        log.info($('No matched resources were found.'));
      } else {
        log.table(resources, function (row, item) {
          var resourceInformation = resourceUtils.getResourceInformation(item.id);
          row.cell($('Id'), item.id);
          row.cell($('Name'), resourceInformation.resourceName || item.name );
          row.cell($('Resource Group'), resourceInformation.resourceGroup || '');
          row.cell($('Type'), resourceInformation.resourceType || item.type);
          row.cell($('Parent'), resourceInformation.parentResource ?  resourceInformation.parentResource : '');
          row.cell($('Location'), item.location);
          row.cell($('Tags'), tagUtils.getTagsInfo(item.tags));
          if (item.permissions) {
            var permissionDetails = permissionsUtils.getPermissionDetails(item.permissions);
            row.cell($('Actions'), permissionDetails.actions);
            row.cell($('NotActions'), permissionDetails.notActions);
          }
        });
      }
    });

  resource.command('show [resource-group] [name] [resource-type] [api-version]')
    .description($('Gets one resource within a resource group or subscription'))
    .usage('[options] <resource-group> <name> <resource-type> <api-version>')
    .option('-g --resource-group <resource-group>', $('the resource group name'))
    .option('-n --name <name>', $('the resource name'))
    .option('-r --resource-type <resource-type>', $('the resource type'))
    .option('-i --resource-id <resource-id>', $('the resource id'))
    .option('-o --api-version <api-version>', $('the API version of the resource provider'))
    .option('--parent <parent>', $('the name of the parent resource (if needed), in path/path/path format'))
    .option('--subscription <subscription>', $('the subscription identifier'))
    .execute(function (resourceGroup, name, resourceType, apiVersion, options, _) {
      var values = getValuesForCommand(resourceGroup, name, resourceType, apiVersion, options);
      var subscription = profile.current.getSubscription(options.subscription);
      var client = utils.createResourceClient(subscription);
      var authzClient = rbacClients.getAuthzClient(subscription);
      var progress = cli.interaction.progress(util.format($('Getting resource %s'), values.resourceName));
      var resource;
      try {
        var identity = {
          resourceName: values.resourceName,
          resourceProviderNamespace: resourceUtils.getProviderName(values.resourceType),
          resourceProviderApiVersion: values.apiVersion,
          resourceType: resourceUtils.getResourceTypeName(values.resourceType),
          // TODO: parent should be optional in the API. temporary workaround.
          parentResourcePath: __.isString(options.parent) ? options.parent : ''
        };
        resource = client.resources.get(values.resourceGroup,
          identity.resourceProviderNamespace,
          identity.parentResourcePath,
          identity.resourceType,
          values.resourceName,
          values.apiVersion, _);
        resource.permissions = authzClient.permissions.listForResource(values.resourceGroup, identity, _).permissions;
      } finally {
        progress.end();
      }
      cli.interaction.formatOutput(resource, function (resource) {
        showResource(resource, true);
      });
    });

  resource.command('delete [resource-group] [name] [resource-type] [api-version]')
    .description($('Deletes a resource in a resource group'))
    .usage('[options] <resource-group> <name> <resource-type> <api-version>')
    .option('-g --resource-group <resource-group>', $('the resource group name'))
    .option('-n --name <name>', $('the resource name'))
    .option('-r --resource-type <resource-type>', $('the resource type'))
    .option('-i --resource-id <resource-id>', $('the resource id'))
    .option('-o --api-version <api-version>', $('the API version of the resource provider'))
    .option('--parent <parent>', $('the name of the parent resource (if needed), in path/path/path format'))
    .option('-q, --quiet', $('quiet mode (do not ask for delete confirmation)'))
    .option('--subscription <subscription>', $('the subscription identifier'))
    .execute(function (resourceGroup, name, resourceType, apiVersion, options, _) {
      var values = getValuesForCommand(resourceGroup, name, resourceType, apiVersion, options);
      if (!options.quiet && !cli.interaction.confirm(util.format($('Delete resource %s? [y/n] '), values.resourceName), _)) {
        return;
      }
      var subscription = profile.current.getSubscription(options.subscription);
      var client = utils.createResourceClient(subscription);
      var progress = cli.interaction.progress(util.format($('Deleting resource %s'), values.resourceName));
      deleteResource(values.resourceType, values.resourceGroup, values.apiVersion, values.resourceName, values.options, client, progress, _);
    });

  resource.command('move [ids] [destination-group] [api-version]')
    .description($('Moves resources from one resource group to another'))
    .usage('[options] <ids> <destination-group> <api-version>')
    .option('-i --ids <ids>', $('the comma-delimitied resource ids to be moved'))
    .option('-d --destination-group <destination-group>', $('the destination resource group name'))
    .option('--destination-subscriptionId <destination-subscriptionId>', $('the destination subscription identifier'))
    .option('-o --api-version <api-version>', $('the API version of the resource provider'))
    .option('-q, --quiet', $('quiet mode (do not ask for move confirmation)'))
    .option('--subscription <subscription>', $('the subscription identifier'))
    .execute(function (ids, destinationGroup, apiVersion, options, _) {
      if (!ids) {
        return cli.missingArgument('ids');
      } else if (!destinationGroup) {
        return cli.missingArgument('destinationGroup');
      } else if (!apiVersion) {
        apiVersion = false;
      }
      //Create a list of ids and validate all the resources are in the same resource group
      var resources = ids ? ids.split(',') : [];
      var sourceGroup = resourceUtils.getSourceResourceGroupForMove(resources);
      if (!options.quiet && !cli.interaction.confirm(util.format($('Move selected resources in %s to %s? [y/n] '), sourceGroup, destinationGroup), _)) {
        return;
      }
      var subscription = profile.current.getSubscription(options.subscription);
      var client = utils.createResourceClient(subscription);
      apiVersion = validateApiVersion(apiVersion);
      client.apiVersion = apiVersion ? apiVersion : client.apiVersion;
      var progress = cli.interaction.progress(util.format($('Moving selected resources to %s'), destinationGroup));
      try {
        var destinationSubId = subscription.id;
        if (options.destinationSubscriptionId) {
          destinationSubId = options.destinationSubscriptionId;
        }
        var parameters = {
          targetResourceGroup: '/subscriptions/' + destinationSubId + '/resourceGroups/' + destinationGroup,
          resources: resources
        };

        client.resources.moveResources(sourceGroup, parameters, _);
      }
      catch (e) {
        if (e.details) {
          e.details.forEach(function (detail) {
            if (detail.Message) {
              log.error(detail.Message);
            }
          });
        }
        throw (e);
      }
      finally {
        progress.end();
      }
    });

  function getValuesForCommand(resourceGroup, name, resourceType, apiVersion, options){
    var values = {};
    if((resourceGroup || name || resourceType) && options.resourceId){
      throw new Error('Cannot use both resource parameters {resourceGroup, name, resourceType} and {resource id} in the same operation. Please provide one of the two.');
    }
    // If no resourceId provided then proceed like normal checking for other parameters
    if(!options.resourceId) {
      checkMissingParameters(resourceGroup, name, resourceType, apiVersion);
      values.resourceGroup = resourceGroup;
      values.resourceName = name;
      values.resourceType = resourceType;
    } else {
      var valuesFromId = extractAllValues(options.resourceId);
      values.resourceGroup = valuesFromId['resourceGroup'];
      values.resourceType = valuesFromId['providerList'];
      values.resourceName = valuesFromId['resourceName'];
    }
      values.apiVersion = apiVersion;
      values.options = options;
      checkMissingParameters(values.resourceGroup, values.resourceName, values.resourceType, values.apiVersion);
      return values;
  }

  function parsed(obj, type){
    try{
      return jsonlint.parse(obj);
    } catch(e){
      throw new Error('Error when parsing the input value for ' + type + ': ' + e);
    }
  } 

  function deleteResource(resourceType, resourceGroup, apiVersion, name, options, client, progress, _){
    try {
      var identity = {
        resourceName: name,
        resourceProviderNamespace: resourceUtils.getProviderName(resourceType),
        resourceProviderApiVersion: apiVersion,
        resourceType: resourceUtils.getResourceTypeName(resourceType),
        // TODO: parent should be optional in the API. temporary workaround.
        parentResourcePath: __.isString(options.parent) ? options.parent : ''
      };

      client.resources.deleteMethod(resourceGroup,
        identity.resourceProviderNamespace,
        identity.parentResourcePath,
        identity.resourceType,
        identity.resourceName,
        apiVersion, _);

    } catch(e) { 
      return e;
    } finally {
      progress.end();
    }
  } 

  function extractAllValues(resourceId){
    var values = {};
    var segments = resourceId.split('/');
    var firstValue = segments[0];
    segments = segments.slice(segments.indexOf(firstValue), segments.length)
                 .filter(function(element){ 
                   return element !== '';
                 });
    if(segments.indexOf('providers') === -1) {
      return cli.missingArgument('providers');
    }
    var providerList = segments.slice(segments.indexOf('providers') + 1, segments.length-1);
    if(firstValue === 'subscriptions'){
      values['subscription'] = segments[segments.indexOf('subscriptions') + 1];
    }
    values['resourceGroup'] = segments.indexOf('resourceGroups') >= 0 ? segments[segments.indexOf('resourceGroups') + 1] : false;
    if(segments.length > 4) {
      values['providerList'] = providerList.join('/');
      values['provider'] = providerList[0];
      values['resourceType'] = providerList.slice(1, providerList.length).join('/');
      values['resourceName'] = segments[segments.length - 1]; 
    }
    checkMissingParameters(values['resourceGroup'], values['resourceName'], values['resourceType'], true);
    return values;
  }

  function checkMissingParameters(resourceGroup, resourceName, resourceType, apiVersion){
    if (!resourceGroup) {
      return cli.missingArgument('resourceGroup');
    } else if (!resourceName) {
      return cli.missingArgument('resourceName');
    } else if (!resourceType) {
      return cli.missingArgument('resourceType');
    } else if (!apiVersion) {
      return cli.missingArgument('apiVersion');
    }
  }

  function validateApiVersion(dateString) {
    var dateFormat = /^(19|20)\d\d([- /.])(0[1-9]|1[012])\2(0[1-9]|[12][0-9]|3[01])/;
    if (dateFormat.exec(dateString)) {
      return dateString;
    } else {
      log.warn('Incorrect Format. Please enter in the following format (YYYY-MM-DD). Defaulting to Resource Client api version.');
      return false;
    }
  }

  function showResource(resource, showDetail) {
    cli.interaction.formatOutput(resource, function (resource) {
      var resourceInformation = resourceUtils.getResourceInformation(resource.id);
      log.data($('Id:       '), resource.id);
      log.data($('Name:     '), resourceInformation.resourceName || resource.name);
      log.data($('Type:     '), resourceInformation.resourceType || resource.type);
      log.data($('Parent:   '), resourceInformation.parentResource || '');
      log.data($('Location: '), resource.location);
      log.data($('Tags:     '), tagUtils.getTagsInfo(resource.tags));
      log.data('');
      if (showDetail) {
        log.data($('Properties:'));
        cli.interaction.logEachData($('Property'), resource.properties);
        log.data('');
        var permissionDetails = permissionsUtils.getPermissionDetails(resource.permissions);
        log.data($('Permissions:'));
        log.data($('  Actions: ') + permissionDetails.actions);
        log.data($('  NotActions: ') + permissionDetails.notActions);
      }
    });
  }
};