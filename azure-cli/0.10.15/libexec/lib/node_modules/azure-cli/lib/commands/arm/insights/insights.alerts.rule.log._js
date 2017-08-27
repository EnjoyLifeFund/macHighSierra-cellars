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
var utils = require('../../../util/utils');
var insightsUtils = require('./insights.utils');

var $ = utils.getLocaleString;

exports.init = function (cli) {
  var log = cli.output;
  var insightsLogAlertsRulesCommand = cli.category('insights').category('alerts').category('rule').category('log')
    .description($('Creates event-based alerts rules'));

  // ** Defining the commands for this category
  insightsLogAlertsRulesCommand.command('set <ruleName> <location> <resourceGroup> <operationName>')
    .description($('Create or set an event-based alert rule.'))
    .usage('[options] <ruleName> <location> <resourceGroup> <operationName>')

    // Generic options
    .option('-x --disable', $('Flag to disable the rule.'))
    .option('-s --subscription <subscription>', $('The subscription identifier.'))

    // Common required
    .option('-n --ruleName <ruleName>', $('The name of the rule.'))
    .option('-d --description <description>', $('The description of the rule.'))
    .option('-l --location <location>', $('The location.'))
    .option('-g --resourceGroup <resourceGroup>', $('The resource group.'))

    .option('-p --operationName <operationName>', $('The operation name.'))

    .option('-z --actions <actions>', $('The list of alert rule actions. The list must be a json object (string) of an array. Example: \"[{\\\"customEmails\\\":[\\\"gu@ms.com\\\"]},{\\\"serviceUri\\\":\\\"http://foo.com\\\",\\\"properties\\\":[{\\\"key\\\":\\\"key1\\\",\\\"value\\\":\\\"value1\\\"},{\\\"key\\\":\\\"value1\\\",\\\"value\\\":\\\"key2\\\"}]}]'))
    .option('-i --targetResourceId <targetResourceId>', $('The target resource Id.'))
    .option('-k --targetResourceProvider <targetResourceProvider>', $('The target resource provider.'))
    .option('-z --targetResourceGroup <targetResourceGroup>', $('The target resource group.'))
    .option('-f --level <level>', $('The level for the rule.'))
    .option('-u --status <status>', $('The status.'))
    .option('-b --subStatus <subStatus>', $('The substatus.'))

    .execute(function (ruleName, location, resourceGroup, operationName, options, _) {
      insightsLogAlertsRulesCommand._prepareAndExecuteSet(ruleName, location, resourceGroup, operationName, options, _);
    });

  // ** The Prepare and Execute functions
  insightsLogAlertsRulesCommand._prepareAndExecuteSet = function (ruleName, location, resourceGroup, operationName, options, _) {
    log.silly(util.format('ruleName: %s', ruleName));
    log.silly(util.format('location: %s', location));
    log.silly(util.format('resourceGroup: %s', resourceGroup));
    log.silly(util.format('operationName: %s', operationName));
    log.silly(util.format('options: %s', util.inspect(options)));

    if (!__.isString(ruleName)) {
      cli.missingArgument('ruleName');
    }

    if (!__.isString(location)) {
      cli.missingArgument('location');
    }

    if (!__.isString(resourceGroup)) {
      cli.missingArgument('resourceGroup');
    }

    if (!__.isString(operationName)) {
      cli.missingArgument('operationName');
    }

    var client = insightsUtils.createInsightsManagementClient(log, options);
    var parameters = this._createSdkCallParameters(ruleName, location, operationName, options);

    this._executeSetCmd(client, ruleName, resourceGroup, parameters, options, _);
  };

  insightsLogAlertsRulesCommand._createEventRuleCondition = function (operationName, options) {
    if (!__.isString(operationName)) {
      cli.missingArgument('operationName');
    }

    return {
      dataSource: {
        level: options.level,
        operationName: operationName,
        resourceGroupName: options.targetResourceGroup,
        resourceProviderName: options.targetResourceProvider,
        resourceUri: options.targetResourceId,
        status: options.status,
        subStatus: options.subStatus,
        type: 'Microsoft.Azure.Management.Insights.Models.RuleManagementEventDataSource'
      },
      type: 'Microsoft.Azure.Management.Insights.Models.ManagementEventRuleCondition'
    };
  };

  insightsLogAlertsRulesCommand._createSdkCallParameters = function (ruleName, location, operationName, options) {
    var internalActions = [];
    if (!__.isUndefined(options.actions) && !__.isNull(options.actions)) {
      internalActions = JSON.parse(options.actions);
      log.silly(util.format('Parsed actions: %s', util.inspect(internalActions)));
      if (!__.isArray(internalActions)) {
        throw new Error($('Invalid actions argument: array expected.'));
      }
    }

    var condition = this._createEventRuleCondition(operationName, options);
    var parameters = {
      location: location,
      properties: {
        name: ruleName,
        isEnabled: !options.disabled,
        description: options.description,
        lastUpdatedTime: new Date(),
        condition: condition,
        actions: internalActions
      },
      tags: {}
    };

    if (options.targetResourceId && options.targetResourceId !== '') {
      parameters.tags['$type'] = 'Microsoft.WindowsAzure.Management.Common.Storage.CasePreservedDictionary,Microsoft.WindowsAzure.Management.Common.Storage';
      parameters.tags['hidden-link:' + options.targetResourceId] = 'Resource';
    }

    return parameters;
  };

  insightsLogAlertsRulesCommand._executeSetCmd = function (client, ruleName, resourceGroup, parameters, options, _) {
    var progress = cli.interaction.progress(util.format($('Creating or updating a log alert rule \"%s\"'), ruleName));
    var response = null;
    try {
      response = client.alertOperations.createOrUpdateRule(resourceGroup, parameters, _);

      // These are debugging messages
      log.silly(!response ? util.inspect(response) : 'nothing in response');
    } finally {
      progress.end();
    }

    insightsUtils.formatOutput(cli, log, options, response);
  };
};
