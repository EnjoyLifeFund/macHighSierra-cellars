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

var util = require('util');

var profile = require('../../../util/profile');
var utils = require('../../../util/utils');

var $ = utils.getLocaleString;

exports.init = function (cli) {
  var log = cli.output;
  var withProgress = cli.interaction.withProgress.bind(cli.interaction);

  var policy = cli.category('policy')
    .description($('Commands to manage your policies on ARM Resources.'));
  var definition = policy.category('assignment')
      .description($('Commands to manage your policy assignments.'));

  definition.command('create [name] [policyDefinitionId] [scope]')
    .description($('Creates a new policy assignment'))
    .usage('[options] <name> <policyDefinitionId> <scope>')
    .option('-n --name <name>', $('the policy assignment name'))
    .option('-p --policy-definition-id <policyDefinitionId>', $('the fully qualified id of existing policy definition. For example: /subscriptions/{mySubId}/providers/Microsoft.Authorization/policyDefinitions/{myPolicy}. Use policy definition list to get a list of existing policy definitions. More information here: https://azure.microsoft.com/en-us/documentation/articles/resource-manager-policy/'))
    .option('-s --scope <scope>', $('the scope for policy assignment. For example, /subscriptions/{mySubId}/resourceGroups/{myGroup}'))
    .option('-d --display-name <display-name>', $('the display name for policy assignment.'))
    .option('--subscription <subscription>', $('the subscription identifier'))
    .execute(function (name, policyDefinitionId, scope, options, _) {
      if (!name) {
        return cli.missingArgument('name');
      }
      if (!policyDefinitionId) {
        return cli.missingArgument('policyDefinitionId');
      }
      if (!scope) {
        return cli.missingArgument('scope');
      }

      var subscription = profile.current.getSubscription(options.subscription);
      var client = utils.createPolicyClient(subscription);
      
      var policyAssignmentParameters = {
        policyDefinitionId: policyDefinitionId,
        scope: scope
      };

      if (options.displayName) {
        policyAssignmentParameters.displayName = options.displayName;
      }
      
      var policyAssignment = null;
      try {
        policyAssignment = withProgress(util.format($('Creating policy assignment %s'), name),
        function (log, _) {
          return client.policyAssignments.create(scope, name, policyAssignmentParameters, _);
        }, _);
      } catch (ex) {
          throw new Error(util.format($('Policy assignment creation failed: %s'), ex));
      }

      cli.interaction.formatOutput(policyAssignment, function (data) {
        if (data) {
          displayAPolicyAssignment(data, log);
        }
      });
    });

  definition.command('set [name] [scope]')
    .description($('Updates a policy assignment'))
    .usage('[options] <name> <scope>')
    .option('-n --name <name>', $('the policy assignment name'))
    .option('-p --policy-definition-id <policyDefinitionId>', $('the fully qualified id of existing policy definition. For example: /subscriptions/{mySubId}/providers/Microsoft.Authorization/policyDefinitions/{myPolicy}. Use policy definition list to get a list of existing policy definitions. More information here: https://azure.microsoft.com/en-us/documentation/articles/resource-manager-policy/'))
    .option('-s --scope <scope>', $('the scope for policy assignment. For example, /subscriptions/{mySubId}/resourceGroups/{myGroup}'))
    .option('-d --display-name <display-name>', $('the display name for policy assignment.'))
    .option('--subscription <subscription>', $('the subscription identifier'))
    .execute(function (name, scope, options, _) {
      if (!name) {
        return cli.missingArgument('name');
      }
      if (!scope) {
        return cli.missingArgument('scope');
      }

      var subscription = profile.current.getSubscription(options.subscription);
      var client = utils.createPolicyClient(subscription);

      var policyAssignment = null;
      try {
        policyAssignment = withProgress(util.format($('Getting existing policy assignment %s'), name),
        function (log, _) {
          return client.policyAssignments.get(scope, name, null, _);
        }, _);
      } catch (ex) {
        throw new Error(util.format($('Policy assignment get failed: %s'), ex));
      }

      var policyAssignmentParameters = {
        policyDefinitionId: options.policyDefinitionId ? options.policyDefinitionId : policyAssignment.policyDefinitionId,
        scope: scope,
        displayName: options.displayName ? options.displayName : policyAssignment.displayName
      };

      var policyAssignmentUpdated = null;
      try {
        policyAssignmentUpdated = withProgress(util.format($('Updating policy assignment %s'), name),
        function (log, _) {
          return client.policyAssignments.create(scope, name, policyAssignmentParameters, _);
        }, _);
      } catch (ex) {
        throw new Error(util.format($('Policy assignment update failed: %s'), ex));
      }

      cli.interaction.formatOutput(policyAssignmentUpdated, function (data) {
        if (data) {
          displayAPolicyAssignment(data, log);
        }
      });
    });

  definition.command('list')
    .description($('Lists all the policy assignments in the subscription.'))
    .option('--subscription <subscription>', $('the subscription identifier'))
    .execute(function (options, _) {
      var subscription = profile.current.getSubscription(options.subscription);
      var client = utils.createPolicyClient(subscription);
      
      var policyAssignments = null;
      try {
        policyAssignments = withProgress($('Listing all policy assignments'),
        function (log, _) {
          return client.policyAssignments.list(null, _);
        }, _);
      } catch (ex) {
        throw new Error(util.format($('Policy assignment list failed: %s'), ex));
      }

      cli.interaction.formatOutput(policyAssignments, function (data) {
        if (data) {
          for (var i = 0; i < data.length; i++) {
            displayAPolicyAssignment(data[i], log);
            log.data('');
          }
        }
      });
    });

  definition.command('show [name] [scope]')
    .description($('Shows a policy assignment'))
    .usage('[options] <name> <scope>')
    .option('-n --name <name>', $('the policy assignment name'))
    .option('-s --scope <scope>', $('the scope for policy assignment. For example, /subscriptions/{mySubId}/resourceGroups/{myGroup}'))
    .option('--subscription <subscription>', $('the subscription identifier'))
    .execute(function (name, scope, options, _) {
      if (!name) {
        return cli.missingArgument('name');
      }
      if (!scope) {
        return cli.missingArgument('scope');
      }

      var subscription = profile.current.getSubscription(options.subscription);
      var client = utils.createPolicyClient(subscription);

      var policyAssignment = null;
      try {
        policyAssignment = withProgress(util.format($('Getting policy assignment %s'), name),
        function (log, _) {
          return client.policyAssignments.get(scope, name, null, _);
        }, _);
      } catch (ex) {
        throw new Error(util.format($('Policy assignment get failed: %s'), ex));
      }

      cli.interaction.formatOutput(policyAssignment, function (data) {
        if (data) {
          displayAPolicyAssignment(data, log);
        }
      });
    });

  definition.command('delete [name] [scope]')
    .description($('Deletes a policy assignment'))
    .usage('[options] <name> <scope>')
    .option('-n --name <name>', $('the policy definition name'))
    .option('-s --scope <scope>', $('the scope for policy assignment. For example, /subscriptions/{mySubId}/resourceGroups/{myGroup}'))
    .option('-q, --quiet', $('quiet mode (do not ask for delete confirmation)'))
    .option('--subscription <subscription>', $('the subscription identifier'))
    .execute(function (name, scope, options, _) {
      if (!name) {
        return cli.missingArgument('name');
      }
      if (!scope) {
        return cli.missingArgument('scope');
      }

      if (!options.quiet && !cli.interaction.confirm(util.format($('Delete policy assignment %s? [y/n] '), name), _)) {
        return;
      }

      var subscription = profile.current.getSubscription(options.subscription);
      var client = utils.createPolicyClient(subscription);

      var progress = cli.interaction.progress(util.format($('Deleting policy definition %s'), name));
      try {
        client.policyAssignments.deleteMethod(scope, name, _);
      } finally {
        progress.end();
      }
    });

  function displayAPolicyAssignment(policyAssignment, log) {
    log.data($('PolicyAssignmentName:    '), policyAssignment.name);
    log.data($('Type:                    '), policyAssignment.type);
    log.data($('DisplayName:             '), policyAssignment.displayName);
    log.data($('PolicyDefinitionId:      '), policyAssignment.policyDefinitionId);
    log.data($('Scope:                   '), policyAssignment.scope);
  }

};


