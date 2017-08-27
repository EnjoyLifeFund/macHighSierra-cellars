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
var utils = require('../../../util/utils');
var utilsCore = require('../../../util/utilsCore');
var permissionsUtils = require('./permissionsUtils');
var util = require('util');
var fs = require('fs');
var rbacConstants = require('./rbacConstants');

var $ = utils.getLocaleString;

function validateRole(role) {
  if (__.isEmpty(role.name)) {
   throw new Error($('RoleDefinition Name is invalid'));
 }
  
  if (__.isEmpty(role.description)) {
    throw new Error($('RoleDefinition Description is invalid'));
  }

  if (__.isEmpty(role.assignableScopes)) {
    throw new Error($('RoleDefinition AssignableScopes is invalid'));
  }

  role.assignableScopes.forEach(function(assignableScope) {
    if (__.isEmpty(assignableScope)) {
      throw new Error($('RoleDefinition AssignableScope value is null or empty'));
    }
  });

  if (__.isEmpty(role.actions)) {
    throw new Error($('RoleDefinition Actions is invalid'));
  }
}

function toCamelCase(obj) {
  var key, destKey, value;
  var camelCasedObj = {};
  if (obj && typeof obj === 'object')
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      destKey = (key.charAt(0).toLowerCase() + key.substring(1)).toString();
      value = obj[key];
      camelCasedObj[destKey] = value;
    }
  }

  return camelCasedObj;
}

exports.showRoleDefinition = function (role, log, hideDetails) {
  log.data($('Name             :'), role.Name);
  if (!hideDetails) {
    log.data($('Id               :'), role.Id);
    log.data($('Description      :'), role.Description);
    log.data($('AssignableScopes :'), role.AssignableScopes);
  }
  log.data($('Actions          :'), role.Actions);
  log.data($('NotActions       :'), role.NotActions);
  log.data($('IsCustom         :'), role.IsCustom);
  log.data('');
};

exports.NormalizeRoleDefinitionObject = function (role) {
  if (role) {
    var normalizedRole = {};
    var permissionDetails = permissionsUtils.getPermissionDetails(role.properties.permissions);
    normalizedRole.Name = role.properties.roleName;
    normalizedRole.Actions = permissionDetails.actions;
    normalizedRole.NotActions = permissionDetails.notActions;
    normalizedRole.Id = role.id;
    normalizedRole.AssignableScopes = role.properties.assignableScopes;
    normalizedRole.Description = role.properties.description;
    normalizedRole.IsCustom = utilsCore.ignoreCaseEquals(role.properties.type, rbacConstants.CUSTOM_ROLE_TYPE) ? 'true' : 'false';
    return normalizedRole;
  }
};

exports.getRoleDefinitionName = function (roleDefintionResourceID) {
  // to extract out the <guid> from definition id like '/subscriptions/358f3860-9dbe-4ace-b0c0-3d4f2d861014/providers/.../<guid>'
  return roleDefintionResourceID.substring(roleDefintionResourceID.lastIndexOf('/') + 1);
};

exports.getSubscriptionScope = function (subscriptionId) {
  // to generate subscription scope.
  return util.format(rbacConstants.SubscriptionPrefixFormat, subscriptionId);
};

exports.validateScope = function (scope) {
  var lowerCaseScope = scope.toLowerCase();
  if (lowerCaseScope !== '/') {
    if (lowerCaseScope.length === 0 || !(lowerCaseScope.startsWith('/subscriptions') || lowerCaseScope.startsWith('/providers'))) {
      throw new Error($('Scope \'' + scope + '\' should begin with \'/subscriptions\' or \'/providers\'.'));
    }
    var parts = lowerCaseScope.substr(1).split('/');  // skip the leading '/'
    if (parts.indexOf('') !== -1){
      throw new Error($('Scope \'' + scope + '\' should not have any empty part.'));
    }
    
    if (parts.length % 2) {
      throw new Error($('Scope \'' + scope + '\' should have even number of parts.'));
    }
    
    if (parts[0] === 'subscriptions') {
      if (parts.length >= 4 && parts[2] !== 'resourcegroups'){
        throw new Error($('Scope \'' + scope + '\' should begin with \'/subscriptions/<subid>/resourceGroups\'.'));
      }
      
      if (parts.length >= 6) {
        if (parts[4] !== 'providers') {
          throw new Error($('Scope \'' + scope + '\' should begin with \'/subscriptions/<subid>/resourceGroups/<groupname>/providers\'.'));
        }
        if (parts.length < 8) {
          throw new Error($('Scope \'' + scope + '\' should have at least one pair of resource type and resource name. e.g. \'/subscriptions/<subid>/resourceGroups/<groupname>/providers/<providername>/<resourcetype>/<resourcename>\'.'));
        }        
      }
    }
  }
};

exports.getRoleToCreateOrUpdate = function(inputfile, roledefinition) {
  var roleToCreateOrUpdate;
  if (inputfile) {
    var exists = fs.existsSync(inputfile);

    if (exists) {
      var filecontent = fs.readFileSync(inputfile);
      try {
        roleToCreateOrUpdate = JSON.parse(filecontent);
      } catch (e) {
        throw new Error($('Deserializing the input role definition failed'));
      }
    } else {
      // exists = false
      throw new Error(util.format($('File %s does not exist'), inputfile));
    }
  } else {
    // no inputfile, JSON string provided
    try {
      roleToCreateOrUpdate = JSON.parse(roledefinition);
    } catch (e) {
      throw new Error($('Deserializing the input role definition failed'));
    }
  }

  return toCamelCase(roleToCreateOrUpdate);
};

exports.validateAndConstructCreateParameters = function (cli, inputrole) {
  var newRoleDefinitionNameGuid = utils.uuidGen();
  return constructRoleDefinitionCreateOrUpdateParameters(cli, inputrole, newRoleDefinitionNameGuid);
};

exports.validateAndConstructUpdateParameters = function (cli, inputrole) {
  return constructRoleDefinitionCreateOrUpdateParameters(cli, inputrole, inputrole.id);
};

function constructRoleDefinitionCreateOrUpdateParameters(cli, inputrole, roleIdGuid) {

  // Attempts to convert property names to camelCase by lower-casing the first letter of the property
  // i.e. If user specifies "AssignableScopes" or "assignableScopes" as property-name this will work,
  // but not if "assignablescopes" is specified
  var newRole = toCamelCase(inputrole);

  cli.output.info($('Validating role definition'));
  validateRole(newRole);

  var roleProperties = {
    assignableScopes: newRole.assignableScopes,
    description: newRole.description,
    permissions: [
      {
        actions: newRole.actions,
        notActions: newRole.notActions
      }
    ],
    roleName: newRole.name,
    type: rbacConstants.CUSTOM_ROLE_TYPE
  };

  var parameters = {
    roleDefinition: {
      name: roleIdGuid,
      properties: roleProperties
    }
  };

  return parameters;
}