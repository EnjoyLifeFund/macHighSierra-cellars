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

var underscore = require('underscore');

var adUtils = require('../ad/adUtils');
var resourceUtils = require('../resource/resourceUtils');
var utils = require('../../../util/utils');
var $ = utils.getLocaleString;
var util = require('util');
var roleUtils = require('./roleUtils');

exports = module.exports = RoleAssignments;

function RoleAssignments(authzClient, graphClient) {
  this.authzClient = authzClient;
  this.graphClient = graphClient;
}

underscore.extend(RoleAssignments.prototype, {

  queryAssignmentsForList: function (principal, scope, roleName, roleId, shouldExpandPrincipalGroups, shouldIncludeClassicAdmins, cli, subscription, _) {
    var assignments;
    var objectType = {};
    var principalId;
    var shouldRetrieveObjectType = shouldIncludeClassicAdmins;

    if(principal !== null){
      principalId = adUtils.getObjectId(principal, this.graphClient, false, shouldRetrieveObjectType, objectType, _);
    }

    var parameters = { atScope: false };
    
    if (principalId) {
      if (shouldExpandPrincipalGroups) {
        if (objectType.value && !utils.ignoreCaseEquals(objectType.value, 'user')) {
          throw new Error($('expandprincipalgroups option is only supported for a user principal. Given principal is a ' + objectType.value));
        }
        parameters['assignedToPrincipalId'] = principalId;
      } else {
        parameters['principalId'] = principalId;
      }

      assignments = this.getAssignmentsList(parameters, _);

      // If assignments are for Get then filter on AtOrAbove Scope
      assignments = this.filterByScopeAtOrAbove(assignments, scope);

    } else if (scope) {
      parameters.atScope = true;
      assignments = this.getAssignmentsListForScope(scope, parameters, _);
    } 
    else {
      assignments = this.getAssignmentsList(parameters, _);
    }

    var scopeForRoleDefinitions = scope;
    if (!scopeForRoleDefinitions) {
      scopeForRoleDefinitions = '/subscriptions/' + subscription.id;
    }
    var filterParameters = { atScopeAndBelow: true };
    var roleDefinitions = this.authzClient.roleDefinitions.list(scopeForRoleDefinitions, filterParameters, _).roleDefinitions;
    
    if (roleName) {
      assignments = this.filterByRoleName(assignments, roleName, roleDefinitions);
    }
    
    var excludeAssignmentsForDeletedPrincipals = true;
    assignments = this.filterForDeletedPrincipalsAndFillInPrincipalInfo(assignments, excludeAssignmentsForDeletedPrincipals, _);
    assignments = this.fillInRoleDetails(assignments, roleDefinitions);

    if (roleId) {
      // filter assignments by roleId
      assignments = assignments.filter(function (r) {
        return utils.ignoreCaseEquals(r.properties.roleDefinitionId, roleId);
      });
    }
    
    if (shouldIncludeClassicAdmins) {
      var admins = this.authzClient.classicAdministrators.list(_);
      var adminsAsAssignments = this.convertAdminsToAssignments(admins, subscription);

      // Filter by principal name if provided
      if (this.optionIsSet(principal) && principalId) {
        if (objectType.value && !utils.ignoreCaseEquals(objectType.value, 'user')) {
          throw new Error($('includeClassicAdministrators option is only supported for a user principal. Given principal is a ' + objectType.value));
        }

        var objects = adUtils.getObjectsByObjectIds(this.graphClient, new Array(principalId), true, _);
        
        if (objects && objects.length > 0) {
          adminsAsAssignments = adminsAsAssignments.filter(function(r) {
            return utils.ignoreCaseEquals(r.properties.aADObject.displayName, objects[0].userPrincipalName);
          });
        } else { // Display warning and do not filter
          console.log('Warning: failed to retrieve graph object details for principal:%s. Falling back to non-filtered list of classic administrators.', principalId);
        }
      }
      assignments = assignments.concat(adminsAsAssignments);
    }
    
    return assignments;
  },
  
  
  queryAssignmentsForDelete: function (principal, scope, roleName, roleId, cli, subscription, _) {

    var assignments;
    var objectType = {};
    var principalId = adUtils.getObjectId(principal, this.graphClient, false, false, objectType, _);
    var parameters = { atScope: false };
    
    if (principalId) {
      parameters['principalId'] = principalId;
      assignments = this.getAssignmentsList(parameters, _);

      // If assignments are for Delete then filter on Exact Scope
      assignments = this.filterByScopeExact(assignments, scope);
    }

    var roleDefinitions = [];

    if (roleName) {
      // Get RoleDefinition by name
      var filterParameters = { roleName: roleName };
      roleDefinitions = this.authzClient.roleDefinitions.list(scope, filterParameters, _).roleDefinitions;
    }
    else {
      // Get role definition by Id Guid
      var roleDefinition = this.authzClient.roleDefinitions.get(roleId, scope, _).roleDefinition;
      roleDefinitions.push(roleDefinition);
    }

    assignments = this.filterByRoleName(assignments, roleName, roleDefinitions);
    var excludeAssignmentsForDeletedPrincipals = false;
    assignments = this.filterForDeletedPrincipalsAndFillInPrincipalInfo(assignments, excludeAssignmentsForDeletedPrincipals, _);
    assignments = this.fillInRoleDetails(assignments, roleDefinitions);

    return assignments;
  },

  // Used by both list and delete of RAs
  getAssignmentsList: function (parameter, _) {
    var assignmentsToReturn = [];
    var nextLink;
    var tempResult = this.authzClient.roleAssignments.list(parameter, _);
    if(tempResult)
    {
      assignmentsToReturn = assignmentsToReturn.concat(tempResult.roleAssignments);
      nextLink = tempResult.nextLink;
    }

    while (nextLink) {
      tempResult = this.authzClient.roleAssignments.listNext(nextLink, _);
      assignmentsToReturn = assignmentsToReturn.concat(tempResult.roleAssignments);
      nextLink = tempResult.nextLink;
    }
    return assignmentsToReturn;
  },

  convertAdminsToAssignments: function (classicAdmins, subscription) {
    var roleAssignments = [];
    if (classicAdmins && classicAdmins.classicAdministrators) {
      for (var i = 0; i < classicAdmins.classicAdministrators.length; i++) {
        var ra = {};
        ra.properties = {};
        ra.properties.aADObject = {};
        ra.properties.roleName = classicAdmins.classicAdministrators[i].properties.role;
        ra.properties.scope = '/subscriptions/' + subscription.id;
        ra.properties.aADObject.displayName = classicAdmins.classicAdministrators[i].properties.emailAddress;
        ra.properties.aADObject.userPrincipalName = classicAdmins.classicAdministrators[i].properties.emailAddress;
        ra.properties.aADObject.objectType = 'User';
        roleAssignments.push(ra);
      }
    }

    return roleAssignments;
  },

  getAssignmentsListForScope: function (scope, parameter, _) {
    var assignmentsToReturn = [];
    var tempResult = this.authzClient.roleAssignments.listForScope(scope, parameter, _);
    assignmentsToReturn = assignmentsToReturn.concat(tempResult.roleAssignments);
    var nextLink = tempResult.nextLink;
  
    while (nextLink) {
      tempResult = this.authzClient.roleAssignments.listForScopeNext(nextLink, _);
      assignmentsToReturn = assignmentsToReturn.concat(tempResult.roleAssignments);
      nextLink = tempResult.nextLink;
    }

    return assignmentsToReturn;
  },

  filterByScopeAtOrAbove: function (assignments, scope) {
    if (scope) {
      assignments = assignments.filter(function (assignment) {
        return utils.stringStartsWith(scope, assignment.properties.scope, true);
      });
    }
    return assignments;
  },

  filterByScopeExact: function (assignments, scope) {
    if (scope) {
      assignments = assignments.filter(function (assignment) {
        return utils.ignoreCaseEquals(scope, assignment.properties.scope);
      });
    }
    return assignments;
  },

  filterForDeletedPrincipalsAndFillInPrincipalInfo: function (assignments, excludeAssignmentsForDeletedPrincipals, _) {
    var allIds = underscore.map(assignments, function (assignment) {
      return assignment.properties.principalId;
    });
    var graphCallSucceeded = true;

    if (allIds.length > 0) {
      var objects = [];

      try {
        objects = adUtils.getObjectsByObjectIds(this.graphClient, allIds, true, _);
      } catch (ex) {
        graphCallSucceeded = false;
      }

      var assignmentsForValidPrincipals = [];
      assignments.forEach(function (assignment) {
        var adObjectDetails = underscore.chain(objects)
            .where({ objectId: assignment.properties.principalId })
            .first().value();


        if (graphCallSucceeded && adObjectDetails) {
          assignment.properties.aADObject = adObjectDetails;
          assignmentsForValidPrincipals.push(assignment);
        }
        // If Graph Call failed  OR if Graph call succeeded but assignment is to a deleted principal, and exclude such assignments is set to false
        else if (!graphCallSucceeded || !excludeAssignmentsForDeletedPrincipals) {
          assignment.properties.aADObject = {
            objectId: assignment.properties.principalId,
            objectType: '',
            displayName: '',
            signInName: ''
          };
          assignmentsForValidPrincipals.push(assignment);
        }
      });
      assignments = assignmentsForValidPrincipals;
    }
    return assignments;
  },

  filterByRoleName: function (assignments, roleName, roleDefinitions) {
    if (roleName) {
      
      // multiple roles can be with the same name
      var roleDefinitionNames = [];
      
      for (var i = 0; i < roleDefinitions.length; i++) {
        if (utils.ignoreCaseEquals(roleDefinitions[i].properties.roleName, roleName)) {
          roleDefinitionNames.push(roleDefinitions[i].name);
        }
      }
      if (!roleDefinitionNames || roleDefinitionNames.length === 0) {
        throw new Error(util.format($('Role with name \'%s\' was not found'), roleName));
      }
      assignments = assignments.filter(function (assignment) {
        for (var i = 0; i < roleDefinitionNames.length; i++) {
          if (utils.ignoreCaseEquals(roleUtils.getRoleDefinitionName(assignment.properties.roleDefinitionId), roleDefinitionNames[i])) {
            return true;
          }
        }
        return false;
      });
    }
    return assignments;
  },

  fillInRoleDetails: function (assignments, roleDefinitions) {
    if (assignments && assignments.length > 0) {
      var roleNames = [];
      var roleDefinitionId;
      for (var i = 0; i < roleDefinitions.length; i++) {
        var roleDefinition = roleDefinitions[i];
        roleDefinitionId = roleDefinition.name; //Note, the 'name' field here really means the 'id' (guid)
        roleNames[roleDefinitionId] = roleDefinition.properties.roleName;
      }

      assignments.forEach(function (assignment) {
        roleDefinitionId = assignment.properties.roleDefinitionId;
        assignment.properties.roleName = roleNames[roleUtils.getRoleDefinitionName(roleDefinitionId)];
        assignment.properties.roleDefinitionId = roleUtils.getRoleDefinitionName(roleDefinitionId);
      });
    }

    return assignments;
  },

  fillRoleAndPrincipalDetailsForAssignment: function (assignment, roleDefinition, _) {
    var assignments = this.filterForDeletedPrincipalsAndFillInPrincipalInfo(new Array(assignment), true, _);
    assignment = assignments[0];
    assignment.properties.roleName = roleDefinition.properties.roleName;
    assignment.properties.roleDefinitionId = roleDefinition.name; // Name here is actually the guid
    return assignment;
  },

  activeFilterADObject: function (principal) {
    if (principal.objectId) {
      return principal.objectId;
    }
    else if (principal.signInName) {
      return principal.signInName;
    }
    else if (principal.spn) {
      return principal.spn;
    }
    return null;
  },

  optionIsSet: function (option) {
    var properties = option ? Object.keys(option) : [];
    var propertyValues = properties.filter(function (p) {
      return !!option[p];
    });
    return (propertyValues.length > 0);
  },
});

RoleAssignments.buildScopeString = function (scopeInfo) {
  if (scopeInfo.scope && (scopeInfo.resourceGroup || scopeInfo.resourceName)) {
    throw new Error($('Please specify either scope or resource group and resource name'));
  }
  
  if (scopeInfo.resourceName && !scopeInfo.resourceGroup) {
    throw new Error($('Please specify a valid resourcegroup name'));
  }

  var scope = scopeInfo.scope;
  if (!scope) {    
    if (scopeInfo.subscriptionId) {
      scope = '/subscriptions/' + scopeInfo.subscriptionId;
      if (scopeInfo.resourceGroup) {
        scope = scope + '/resourcegroups/' + scopeInfo.resourceGroup.trim();
        if (scopeInfo.resourceName) {
          if (!scopeInfo.resourceType) {
            throw new Error($('Please specify a valid resource type'));
          }
          var resourceTypeName = resourceUtils.getResourceTypeName(scopeInfo.resourceType);
          var provider = resourceUtils.getProviderName(scopeInfo.resourceType);
          scope = scope + '/providers/' + provider.trim() + '/' + (scopeInfo.parent ? scopeInfo.parent.trim() + '/' + resourceTypeName.trim() : resourceTypeName.trim()) +
          '/' + scopeInfo.resourceName.trim();
        }
      }
    }
    if (!scope) {
      return scope;
    }
  }
 
  roleUtils.validateScope(scope);
  
  return scope;
};