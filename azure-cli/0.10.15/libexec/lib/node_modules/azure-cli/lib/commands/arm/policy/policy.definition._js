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
var fs = require('fs');
var jsonlint = require('jsonlint');

var $ = utils.getLocaleString;

exports.init = function (cli) {
  var log = cli.output;
  var withProgress = cli.interaction.withProgress.bind(cli.interaction);

  var policy = cli.category('policy')
    .description($('Commands to manage your policies on ARM Resources.'));
  var definition = policy.category('definition')
      .description($('Commands to manage your policy definitions.'));

  definition.command('create [name] [policy]')
    .description($('Creates a new policy definition'))
    .usage('[options] <name> <policy>')
    .option('-n --name <name>', $('the policy definition name'))
    .fileRelatedOption('-p --policy <policy>', $('the rule for policy definition. This should be a path to a file name containing the rule. More information here: https://azure.microsoft.com/en-us/documentation/articles/resource-manager-policy/'))
    .option('--policy-string <policyString>', $('a JSON-formatted string containing the policy rule.'))
    .option('-d --display-name <display-name>', $('the display name for policy definition.'))
    .option('--description <description>', $('the description for policy definition.'))
    .option('--subscription <subscription>', $('the subscription identifier'))
    .execute(function (name, policy, options, _) {
      if (!name) {
        return cli.missingArgument('name');
      }
      if (!policy && !options.policyString) {
        throw new Error('Please specify one of the required parameters: --policy or --policy-string.');
      }

      if (policy && options.policyString) {
        throw new Error('Please specify either --policy or --policy-string, not both.');
      }

      var subscription = profile.current.getSubscription(options.subscription);
      var client = utils.createPolicyClient(subscription);
      var policyContent = policy ? jsonlint.parse(utils.stripBOM(fs.readFileSync(policy))) : jsonlint.parse(options.policyString);
      
      var policyDefinitionParameters = {
        policyRule: policyContent
      };

      if (options.displayName) {
        policyDefinitionParameters.displayName = options.displayName;
      }
      if (options.description) {
        policyDefinitionParameters.description = options.description;
      }

      var policyDefinition = null;
      try {
        policyDefinition = withProgress(util.format($('Creating policy definition %s'), name),
        function (log, _) {
          return client.policyDefinitions.createOrUpdate(name, policyDefinitionParameters, _);
        }, _);
      } catch (ex) {
          throw new Error(util.format($('Policy definition creation failed: %s'), ex));
      }

      cli.interaction.formatOutput(policyDefinition, function (data) {
        if (data) {
          displayAPolicyDefinition(data, log);
        }
      });
    });

  definition.command('set [name]')
    .description($('Updates a policy definition'))
    .usage('[options] <name>')
    .option('-n --name <name>', $('the policy definition name'))
    .fileRelatedOption('-p --policy <policy>', $('the rule for policy definition. This should be a path to a file name containing the rule. More information here: https://azure.microsoft.com/en-us/documentation/articles/resource-manager-policy/'))
    .option('--policy-string <policyString>', $('a JSON-formatted string containing the policy rule.'))
    .option('-d --display-name <display-name>', $('the display name for policy definition.'))
    .option('--description <description>', $('the description for policy definition.'))
    .option('--subscription <subscription>', $('the subscription identifier'))
    .execute(function (name, options, _) {
      if (!name) {
        return cli.missingArgument('name');
      }
      
      if (policy && options.policyString) {
        throw new Error('Please specify either --policy or --policy-string, not both.');
      }

      var subscription = profile.current.getSubscription(options.subscription);
      var client = utils.createPolicyClient(subscription);

      var policyDefinition = null;
      try {
        policyDefinition = withProgress(util.format($('Getting existing policy definition %s'), name),
        function (log, _) {
          return client.policyDefinitions.get(name, null, _);
        }, _);
      } catch (ex) {
        throw new Error(util.format($('Policy definition get failed: %s'), ex));
      }

      var policyDefinitionParameters = {
        policyRule: policyDefinition.policyRule,
        displayName: options.displayName ? options.displayName : policyDefinition.displayName,
        description: options.description ? options.description : policyDefinition.description
      };

      var policyContent;
      if (options.policy) {
        policyContent = jsonlint.parse(utils.stripBOM(fs.readFileSync(options.policy)));
      } else if (options.policyString) {
        policyContent = jsonlint.parse(options.policyString);
      }

      if (policyContent) {
        policyDefinitionParameters.policyRule = policyContent;
      }

      var policyDefinitionUpdated = null;
      try {
        policyDefinitionUpdated = withProgress(util.format($('Updating policy definition %s'), name),
        function (log, _) {
          return client.policyDefinitions.createOrUpdate(name, policyDefinitionParameters, _);
        }, _);
      } catch (ex) {
        throw new Error(util.format($('Policy definition update failed: %s'), ex));
      }

      cli.interaction.formatOutput(policyDefinitionUpdated, function (data) {
        if (data) {
          displayAPolicyDefinition(data, log);
        }
      });
    });

  definition.command('list')
    .description($('Lists all the policy definitions in the subscription.'))
    .option('--subscription <subscription>', $('the subscription identifier'))
    .execute(function (options, _) {
      var subscription = profile.current.getSubscription(options.subscription);
      var client = utils.createPolicyClient(subscription);
      
      var policyDefinitions = null;
      try {
        policyDefinitions = withProgress($('Listing all policy definitions'),
        function (log, _) {
          return client.policyDefinitions.list(null, _);
        }, _);
      } catch (ex) {
        throw new Error(util.format($('Policy definition list failed: %s'), ex));
      }

      cli.interaction.formatOutput(policyDefinitions, function (data) {
        if (data) {
          for (var i = 0; i < data.length; i++) {
            displayAPolicyDefinition(data[i], log);
            log.data('');
          }
        }
      });
    });

  definition.command('show [name]')
    .description($('Shows a policy definition'))
    .usage('[options] <name>')
    .option('-n --name <name>', $('the policy definition name'))
    .option('--subscription <subscription>', $('the subscription identifier'))
    .execute(function (name, options, _) {
      if (!name) {
        return cli.missingArgument('name');
      }
      
      var subscription = profile.current.getSubscription(options.subscription);
      var client = utils.createPolicyClient(subscription);

      var policyDefinition = null;
      try {
        policyDefinition = withProgress(util.format($('Getting policy definition %s'), name),
        function (log, _) {
          return client.policyDefinitions.get(name, null, _);
        }, _);
      } catch (ex) {
        throw new Error(util.format($('Policy definition get failed: %s'), ex));
      }

      cli.interaction.formatOutput(policyDefinition, function (data) {
        if (data) {
          displayAPolicyDefinition(data, log);
        }
      });
    });

  definition.command('delete [name]')
    .description($('Deletes a policy definition'))
    .usage('[options] <name>')
    .option('-n --name <name>', $('the policy definition name'))
    .option('-q, --quiet', $('quiet mode (do not ask for delete confirmation)'))
    .option('--subscription <subscription>', $('the subscription identifier'))
    .execute(function (name, options, _) {
      if (!name) {
        return cli.missingArgument('name');
      }

      if (!options.quiet && !cli.interaction.confirm(util.format($('Delete policy definition %s? [y/n] '), name), _)) {
        return;
      }

      var subscription = profile.current.getSubscription(options.subscription);
      var client = utils.createPolicyClient(subscription);

      var progress = cli.interaction.progress(util.format($('Deleting policy definition %s'), name));
      try {
        client.policyDefinitions.deleteMethod(name, _);
      } finally {
        progress.end();
      }
    });

  function displayAPolicyDefinition(policyDefinition, log) {
    log.data($('PolicyName:            '), policyDefinition.name);
    log.data($('PolicyDefinitionId:    '), policyDefinition.id);
    log.data($('PolicyType:            '), policyDefinition.policyType);
    log.data($('DisplayName:           '), policyDefinition.displayName);
    log.data($('Description:           '), policyDefinition.description);
    log.data($('PolicyRule:            '), policyDefinition.policyRule);
  }

};


