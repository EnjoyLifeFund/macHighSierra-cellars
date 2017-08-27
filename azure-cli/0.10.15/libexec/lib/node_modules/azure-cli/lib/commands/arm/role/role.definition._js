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

var profile = require('../../../util/profile');
var utils = require('../../../util/utils');
var util = require('util');
var adUtils = require('../ad/adUtils');
var rbacClients = require('./rbacClients');
var roleUtils = require('./roleUtils');
var rbacConstants = require('./rbacConstants');

var $ = utils.getLocaleString;

exports.init = function (cli) {
  var log = cli.output;
  var role = cli.category('role')
    .description($('Commands to manage role definitions'));

  role.command('list [scope]')
    .description($('Lists Azure RBAC roles available for assignment. Use this command to determine what actions on what resource types an Azure RBAC role allows.'))
    .usage('[scope]' +
      '\n' +
      '\n           -----    Example 1   -------' +
      '\n           azure role list' +
      '\n           Lists all RBAC role definitions.' +
      '\n')
    .option('--custom', $('If specified, display only the custom role definitions instead of all role definitions.'))
    .option('--scope <scope>', $('Role definition scope. For e.g. /subscriptions/4004a9fd-d58e-48dc-aeb2-4a4aec58606f'))
    .option('--atScopeAndBelow', $('If specified, displays all role definitions.'))
    .option('-d --detailed', $('If specified, displays all the properties of a role definition'))
    .option('--subscription <subscription>', $('Name or identifier of the subscription to list the roles for.'))
    .execute(function (scope, options, _) {
    var subscription = profile.current.getSubscription(options.subscription);
    var client = rbacClients.getAuthzClient(subscription);
    var progress = cli.interaction.progress($('Listing role definitions'));
    var result;

    if (!scope) {
      scope = roleUtils.getSubscriptionScope(subscription.id);
    }
    else {
      roleUtils.validateScope(scope);
    }

    try {
      var filterParameters = null;
      if (options.atScopeAndBelow) {
        filterParameters = { atScopeAndBelow: true };
      }
      result = client.roleDefinitions.list(scope, filterParameters, _);

    } finally {
      progress.end();
    }

    if (options.custom) {
      result.roleDefinitions = result.roleDefinitions.filter(function (r) {
        return utils.ignoreCaseEquals(r.properties.type, rbacConstants.CUSTOM_ROLE_TYPE);
      });
    }
    
    var hideDetails = true;
    if (options.detailed) {
      hideDetails = false;
    }

    var roles = result.roleDefinitions;
    var normalizedRoles = [];

    roles.forEach(function (role) {
      // extract guid from fully qualified id
      role.id = roleUtils.getRoleDefinitionName(role.id);
      normalizedRoles.push(roleUtils.NormalizeRoleDefinitionObject(role));
    });

    cli.interaction.formatOutput(normalizedRoles, function (data) {
      if (data.length === 0) {
        log.info($('No role definitions of specified type were found'));
      } else {
        data.forEach(function (role) {
          roleUtils.showRoleDefinition(role, log, hideDetails);
        });
      }
    });
  });

  role.command('show [name] [id] [scope]')
    .description($('Search for a role definition with role name or id to view its details. To inspect individual operations that a role grants access to, review the Actions and NotActions properties of the role.'))
    .usage('[name] [id] [scope]' +
      '\n' +
      '\n           -----    Example 1   -------' +
      '\n           azure role show --name Reader' +
      '\n           Get the Reader role definition.' +
      '\n           -----    Example 2   -------' +
      '\n           azure role show --id 52a6cc13-ff92-47a8-a39b-2a8205c3087e' +
      '\n           Get the Reader role definition.' +
      '\n')
    .option('-n --name <name>', $('Role definition name. For e.g. Reader, Contributor, Virtual Machine Contributor.'))
    .option('--id <id>', $('Role definition Id.'))
    .option('--scope <scope>', $('Role definition scope. For e.g. /subscriptions/4004a9fd-d58e-48dc-aeb2-4a4aec58606f'))
    .option('--atScopeAndBelow', $('If specified, displays all role definitions.'))
    .option('--subscription <subscription>', $('Name or identifier of the subscription to search the role definition in.'))
    .execute(function (name, id, scope, options, _) {

    adUtils.validateParameters({
      id: id,
      name: name
    });

    if (id && options.atScopeAndBelow) {
      throw new Error($('AtScopeAndBelow switch is not allowed with id.'));
    }

    var subscription = profile.current.getSubscription(options.subscription);
    var client = rbacClients.getAuthzClient(subscription);
    var progress = cli.interaction.progress($('Searching for role definitions'));
    var result = [];

    if (!scope)
    {
      scope = roleUtils.getSubscriptionScope(subscription.id);
    }
    else 
    {
      roleUtils.validateScope(scope);
    }

    var scopeAndBelow = false;
    if (options.atScopeAndBelow)
    {
      scopeAndBelow = true;
    }

      try {
        if (name) {
          var filterParameters = { roleName: name, atScopeAndBelow: scopeAndBelow };
          result = client.roleDefinitions.list(scope, filterParameters, _).roleDefinitions;
        }
        else {
          result.push(client.roleDefinitions.get(id, scope, _).roleDefinition);
        }
    } finally {
      progress.end();
    }

    var roles = result;
    var normalizedRoles = [];

    roles.forEach(function (role) {
      // extract guid from fully qualified id
      role.id = roleUtils.getRoleDefinitionName(role.id);

      // normalize role object
      normalizedRoles.push(roleUtils.NormalizeRoleDefinitionObject(role));
    });

    cli.interaction.formatOutput(normalizedRoles, function (data) {
      if (data.length === 0) {
        log.info($('No role definition matching the search criteria was found'));
      } else {
        data.forEach(function (role) {
          roleUtils.showRoleDefinition(role, log);
        });
      }
    });
  });

  role.command('create [inputfile] [roledefinition]')
    .description($('Creates a custom role in Azure RBAC. Provide either a JSON role definition file or a JSON-formatted string containing the role definition as input.'+
    '\n     The input role definition MUST contain the following properties:' +
    '\n     1) DisplayName: the name of the custom role' +
    '\n     2) Description: a short description of the role that summarizes the access that the role grants.' +
    '\n     3) Actions: the set of operations to which the custom role grants access. Use "azure provider operations show" with operationSearchString to get the operation for Azure resource providers that can be secured using Azure RBAC. Following are some valid operation strings' +
    '\n       - "*/read" grants access to read operations of all Azure resource providers.' +
    '\n       - "Microsoft.Network/*/read" grants access to read operations for all resource types in the Microsoft.Network resource provider of Azure.' +
    '\n       - "Microsoft.Compute/virtualMachines/*" grants access to all operations of virtual machines and its child resource types.' +
    '\n     4) AssignableScopes: the set of scopes (Azure subscriptions or resource groups) in which the custom role will be available for assignment. Using AssignableScopes you can make the custom role available for assignment in only the subscriptions or resource groups that need it, and not clutter the user experience for the rest of the subscriptions or resource groups. Following are some valid assignable scopes' +
    '\n       - "/subscriptions/c276fc76-9cd4-44c9-99a7-4fd71546436e", "/subscriptions/e91d47c4-76f3-4271-a796-21b4ecfe3624": makes the role available for assignment in two subscriptions.' +
    '\n       - "/subscriptions/c276fc76-9cd4-44c9-99a7-4fd71546436e": makes the role available for assignment in a single subscription.' +
    '\n       - "/subscriptions/c276fc76-9cd4-44c9-99a7-4fd71546436e/resourceGroups/Network": makes the role available for assignment only in the Network resource group.' +
    '\n' +
    '\n     The input role definition MAY contain the following properties:' +
    '\n     1) NotActions: the set of operations that must be excluded from the Actions to determine the effective actions for the custom role. If there is a specific operation that you do not wish to grant access to in a custom role, it is convenient to use NotActions to exclude it, rather than specifying all operations other than that specific operation in Actions.' +
    '\n' +
    '\n     NOTE: If a user is assigned a role that specifies an operation in NotActions and also assigned another role grants access to the same operation, the user will be able to perform that operation. NotActions is not a deny rule, it is simply a convenient way to create a set of allowed operations when specific operations need to be excluded.' +
    '\n' +
    '\n     Following is a sample json role definition that can be provided as input: ' +
    '\n     {' +
    '\n     "Name": "Contoso On-call",' +
    '\n     "Description": "Can monitor compute, network and storage, and restart virtual machines",' +
    '\n     "Actions": [' +
    '\n       "Microsoft.Compute/*/read",' +
    '\n       "Microsoft.Compute/virtualMachines/start/action",' +
    '\n       "Microsoft.Compute/virtualMachines/restart/action",' +
    '\n       "Microsoft.Compute/virtualMachines/downloadRemoteDesktopConnectionFile/action",' +
    '\n       "Microsoft.Network/*/read",' +
    '\n       "Microsoft.Storage/*/read",' +
    '\n       "Microsoft.Authorization/*/read",' +
    '\n       "Microsoft.Resources/subscriptions/resourceGroups/read",' +
    '\n       "Microsoft.Resources/subscriptions/resourceGroups/resources/read",' +
    '\n       "Microsoft.Insights/alertRules/*",' +
    '\n       "Microsoft.Support/*"' +
    '\n     ],' +
    '\n     "AssignableScopes": ["/subscriptions/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx","/subscriptions/yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy"]' +
    '\n     }'))
    .usage('[inputfile] [roledefinition]' +
    '\n     --------------------------  Create using JSON file  --------------------------' +
    '\n     azure role create --inputfile C:\\Temp\\roleDefinition.json')
    .option('-f --inputfile <inputfile>', $('File name containing a single role definition.'))
    .option('-r --roledefinition <roledefinition>', $('A JSON-formatted string containing the role definition.'))
    .option('--subscription <subscription>', $('The subscription identifier'))
    .execute(function (inputfile, roledefinition, options, _) {
    if (inputfile && roledefinition) {
      throw new Error($('Either inputfile or roledefinition need to be specified. Not both.'));
    }
    
    if (!inputfile && !roledefinition) {
      throw new Error($('At least one of inputfile or roledefinition need to be specified.'));
    }
    
    var roleToCreate = roleUtils.getRoleToCreateOrUpdate(inputfile, roledefinition);
    var parameters = roleUtils.validateAndConstructCreateParameters(cli, roleToCreate);

    var scope = parameters.roleDefinition.properties.assignableScopes[0];

    roleUtils.validateScope(scope);
    
    var subscription = profile.current.getSubscription(options.subscription);
    var authzClient = rbacClients.getAuthzClient(subscription);
    
    var roleDefinitionIdGuid = parameters.roleDefinition.name;
    var doneMessage = util.format($('Created role definition %s'), roleDefinitionIdGuid);
    var roleDef = null;
    cli.interaction.withProgress(util.format($('Creating role definition "%s"'), roleDefinitionIdGuid),
        function (log, _) {
      roleDef = authzClient.roleDefinitions.createOrUpdate(roleDefinitionIdGuid, scope, parameters, _);
    }, _);

    // Normalize role definition id
    roleDef.roleDefinition.id = roleUtils.getRoleDefinitionName(roleDef.roleDefinition.id);
    log.info(doneMessage);
    var normalizedRole = roleUtils.NormalizeRoleDefinitionObject(roleDef.roleDefinition);

    cli.interaction.formatOutput(normalizedRole, function (role) {
      if (role) {
        roleUtils.showRoleDefinition(role, log);
      }
    });
  });

  role.command('set [inputfile] [roledefinition]')
    .description($('Modifies a custom role in Azure RBAC. Provide the modified role definition either as a JSON file or as a JSON-formatted string containing the role definition.' +
    '\n     The role definition for the updated custom role MUST contain the Id and all other required properties of the role even if they are not updated: Name, Description, Actions, AssignableScopes. NotActions is optional.' +
    '\n' +
    '\n     Following is a sample updated role definition json that can be provided as input:' +
    '\n' +
    '\n     {' +
    '\n     "Id": "52a6cc13-ff92-47a8-a39b-2a8205c3087e",' +
    '\n     "Name": "Updated Role",' +
    '\n     "Description": "Can monitor all resources and start and restart virtual machines",' +
    '\n     "Actions": [' +
    '\n       "*/read",' +
    '\n       "Microsoft.ClassicCompute/virtualmachines/restart/action",' +
    '\n       "Microsoft.ClassicCompute/virtualmachines/start/action"' +
    '\n     ],' +
    '\n     "AssignableScopes": ["/subscriptions/4004a9fd-d58e-48dc-aeb2-4a4aec58606f"]' +
    '\n     }'))
    .usage('[inputfile] [roledefinition]' +
    '\n     --------------------------  Create using JSON file  --------------------------' +
    '\n     azure role set --inputfile C:\\Temp\\roleDefinition.json')
    .option('-f --inputfile <inputfile>', $('File name containing a single json role definition to be updated. Id, Name, Description, Actions and AssignableScopes are required.'))
    .option('-r --roledefinition <roledefinition>', $('A JSON-formatted string containing the role definition. For e.g. {"Id": "52a6cc13-ff92-47a8-a39b-2a8205c3087e","Description": "Updated role","Actions": ["Microsoft.Support/*/read"],"Notactions": [],"AssignableScopes": ["/subscriptions/5004a9fd-d58e-48dc-aeb2-4a4aec58606f"]}'))
    .option('--subscription <subscription>', $('The subscription identifier'))
    .execute(function (inputfile, roledefinition, options, _) {
    if (inputfile && roledefinition) {
      throw new Error($('Either inputfile or roledefinition need to be specified. Not both.'));
    }
    
    if (!inputfile && !roledefinition) {
      throw new Error($('At least one of inputfile or roledefinition need to be specified.'));
    }
    
    var inputRole = roleUtils.getRoleToCreateOrUpdate(inputfile, roledefinition);

    var subscription = profile.current.getSubscription(options.subscription);
    var authzClient = rbacClients.getAuthzClient(subscription);

    var parameters = roleUtils.validateAndConstructUpdateParameters(cli, inputRole);
    var scope = parameters.roleDefinition.properties.assignableScopes[0];
    
    roleUtils.validateScope(scope);
    
    var roleDefinitionIdGuid = parameters.roleDefinition.name;

    var progress = cli.interaction.progress($('Getting role definition'));
    try {
      var getResult = authzClient.roleDefinitions.get(roleDefinitionIdGuid, scope, _).roleDefinition;

      if (!getResult) {
        throw new Error(util.format($('Cannot find roledefinition with id: %s'), roleDefinitionIdGuid));
      }

    } finally {
      progress.end();
    }

    var roleDef = null;
    cli.interaction.withProgress(util.format($('Updating role definition "%s"'), roleDefinitionIdGuid),
        function (log, _) {
      roleDef = authzClient.roleDefinitions.createOrUpdate(roleDefinitionIdGuid, scope, parameters, _);
    }, _);
    
    // Normalize role definition id
    roleDef.roleDefinition.id = roleUtils.getRoleDefinitionName(roleDef.roleDefinition.id);

    var normalizedRole = roleUtils.NormalizeRoleDefinitionObject(roleDef.roleDefinition);

    cli.interaction.formatOutput(normalizedRole, function (role) {
      if (role) {
        roleUtils.showRoleDefinition(role, log);
      }
    });
  });

  role.command('delete [id] [name] [scope]')
    .description($('Deletes a custom role in Azure RBAC. The role to be deleted is specified using the Id or Name property of the role. Delete will fail if there are existing role assignments made to the custom role.'))
    .usage('[id] [name] [scope]' +
    '\n' +
    '\n     --------------------------  Example 1  --------------------------' +
    '\n     azure role delete --name "Contoso On-call"' +
    '\n' +
    '\n     --------------------------  Example 2  --------------------------' +
    '\n     azure role delete --id "52a6cc13-ff92-47a8-a39b-2a8205c3087e"')
    .option('--id <id>', $('Id of the Role definition to be deleted'))
    .option('-n --name <name>', $('Name of the Role definition to be deleted.'))
    .option('--scope <scope>', $('Role definition scope.  For e.g. /subscriptions/4004a9fd-d58e-48dc-aeb2-4a4aec58606f'))
    .option('-q --quiet', $('If set, does not prompt for a confirmation before deleting the custom role'))
    .option('--passthru', $('If set, displays the properties of deleted custom role'))
    .option('--subscription <subscription>', $('The subscription identifier'))
    .execute(function (id, name, scope, options, _) {

    adUtils.validateParameters({
      id: id,
      name: name
    });

    var subscription = profile.current.getSubscription(options.subscription);
    var client = rbacClients.getAuthzClient(subscription);
    var role = name ? name : id;

    if (!scope) {
      scope = roleUtils.getSubscriptionScope(subscription.id);
    }
    else {
      roleUtils.validateScope(scope);
    }
    
    if (!options.quiet && !cli.interaction.confirm(util.format($('Delete role definition "%s"? [y/n] '), role), _)) {
      return;
    }

    var progress;

    if (id) {
      var roleDefinition = client.roleDefinitions.get(id, scope, _).roleDefinition;

      if (roleDefinition === null) {
        throw new Error(util.format($('Cannot find role definition with id "%s"'), id));
      }
      progress = cli.interaction.progress(util.format($('Deleting role definition with id "%s"'), id));
    }
    else {
      var filterParameters = { roleName: name };
      var roles = client.roleDefinitions.list(scope, filterParameters, _).roleDefinitions;

      if (roles.length === 0) {
        throw new Error(util.format($('Cannot find role definition with name "%s"'), name));
      }
      else if (roles.length > 1) {
        throw new Error(util.format($('More than one role definition found with name "%s". Please specify by id.'), name));
      }

      // Use the GUID as the Id to pass to Delete
      id = roles[0].name;
      progress = cli.interaction.progress(util.format($('Deleting role definition with name "%s"'), name));
    }

    var deleteResult;
    try {
      deleteResult = client.roleDefinitions.deleteMethod(id, scope, _);
    } finally {
      progress.end();
    }

    // Normalize role definition id
    deleteResult.roleDefinition.id = roleUtils.getRoleDefinitionName(deleteResult.roleDefinition.id);

    if (options.passthru && deleteResult.roleDefinition) {
      var normalizedRole = roleUtils.NormalizeRoleDefinitionObject(deleteResult.roleDefinition);

      cli.interaction.formatOutput(normalizedRole, function (data) {
        roleUtils.showRoleDefinition(data, log);
      });
    }
  });
};
