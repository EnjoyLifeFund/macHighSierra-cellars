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
  var insightsMetricAlertsRulesCommand = cli.category('insights').category('alerts').category('rule').category('metric')
    .description($('Creates metric-based alerts rules'));

  insightsMetricAlertsRulesCommand.command('set <ruleName> <location> <resourceGroup> <windowSize> <operator> <threshold> <targetResourceId> <metricName> <timeAggregationOperator>')
    .description($('Create or set a metric alert rule.'))
    .usage('[options] <ruleName> <location> <resourceGroup> <windowSize> <operator> <threshold> <targetResourceId> <metricName> <timeAggregationOperator>')

    // Generic options
    .option('-x --disable', $('Flag to disable the rule.'))
    .option('-s --subscription <subscription>', $('The subscription identifier.'))

    // Common required
    .option('-n --ruleName <ruleName>', $('The name of the rule.'))
    .option('-d --description <description>', $('The description of the rule.'))
    .option('-l --location <location>', $('The location.'))
    .option('-g --resourceGroup <resourceGroup>', $('The resource group.'))

    // Common optional
    .option('--windowSize <windowSize>', $('The time window size. Expected format hh:mm:ss.'))
    .option('-o --operator <operator>', $('The condition operator: GreaterThan, GreaterThanOrEqual, LessThan, LessThanOrEqual. Value is case insensitive.'))
    .option('-a --threshold <threshold>', $('The threshold.'))
    .option('-i --targetResourceId <targetResourceId>', $('The target resource Id.'))
    .option('-m --metricName <metricName>', $('The metric name.'))
    .option('--timeAggregationOperator <timeAggregationOperator>', $('The time aggregation operator: Average, Minimum, Maximum, Total. Value is case insensitve.'))
    .option('-z --actions <actions>', $('The list of alert rule actions. The list must be a json object (string) of an array. Example: \"[{\\\"customEmails\\\":[\\\"gu@ms.com\\\"]},{\\\"serviceUri\\\":\\\"http://foo.com\\\",\\\"properties\\\":[{\\\"key\\\":\\\"key1\\\",\\\"value\\\":\\\"value1\\\"},{\\\"key\\\":\\\"value1\\\",\\\"value\\\":\\\"key2\\\"}]}]'))

    .execute(function (ruleName, location, resourceGroup, windowSize, operator, threshold, targetResourceId, metricName, timeAggregationOperator, options, _) {
      insightsMetricAlertsRulesCommand._prepareAndExecuteSet(ruleName, location, resourceGroup, windowSize, operator, threshold, targetResourceId, metricName, timeAggregationOperator, options, _);
    });

  insightsMetricAlertsRulesCommand._prepareAndExecuteSet = function (ruleName, location, resourceGroup, windowSize, operator, threshold, targetResourceId, metricName, timeAggregationOperator, options, _) {
    log.silly(ruleName);
    log.silly(location);
    log.silly(resourceGroup);
    log.silly(windowSize);
    log.silly(operator);
    log.silly(threshold);
    log.silly(targetResourceId);
    log.silly(metricName);
    log.silly(timeAggregationOperator);
    log.silly(util.inspect(options));

    if (!__.isString(ruleName)) {
      cli.missingArgument('ruleName');
    }

    if (!__.isString(location)) {
      cli.missingArgument('location');
    }

    if (!__.isString(resourceGroup)) {
      cli.missingArgument('resourceGroup');
    }

    var client = insightsUtils.createInsightsManagementClient(log, options);
    var parameters = this._createSdkCallParameters(ruleName, location, metricName, targetResourceId, operator, threshold, timeAggregationOperator, windowSize, options);

    this._executeSetCmd(client, ruleName, resourceGroup, parameters, options, _);
  };

  insightsMetricAlertsRulesCommand._createThresholdRuleCondition = function (metricName, targetResourceId, operator, threshold, timeAggregationOperator, windowSize) {
    if (!__.isString(metricName)) {
      cli.missingArgument('metricName');
    }

    if (!__.isString(targetResourceId)) {
      cli.missingArgument('targetResourceId');
    }

    if (!__.isString(operator)) {
      cli.missingArgument('operator');
    } else {
      var operatorTemp = operator.toLowerCase();
      if (operatorTemp != 'greaterthan' && operatorTemp != 'greaterthanorequal' && operatorTemp != 'lessthan' && operatorTemp != 'lessthanorequal') {
        throw new Error(util.format($('Invalid condition operator: %s'), operator));
      }
    }

    if (!__.isString(threshold)) {
      cli.missingArgument('threshold');
    } else {
      threshold = parseFloat(threshold);
    }

    if (!__.isString(timeAggregationOperator)) {
      timeAggregationOperator = insightsUtils.defaultTimeAggregationOperator;
    } else {
      var tempOperator = timeAggregationOperator.toLowerCase();
      if (tempOperator != 'average' && tempOperator != 'minimum' && tempOperator != 'maximum' && tempOperator != 'total') {
        throw new Error(util.format($('Invalid time aggregation operator: %s'), timeAggregationOperator));
      }
    }

    if (windowSize) {
      windowSize = insightsUtils.validateTimeSpan(windowSize);
    } else {
      windowSize = insightsUtils.defaultWindowSize;
    }

    return {
      dataSource: {
        metricName: metricName,
        resourceUri: targetResourceId,
        type: 'Microsoft.Azure.Management.Insights.Models.RuleMetricDataSource'
      },
      operator: operator,
      threshold: threshold,
      timeAggregation: timeAggregationOperator,
      windowSize: windowSize,
      type: 'Microsoft.Azure.Management.Insights.Models.ThresholdRuleCondition'
    };
  };

  insightsMetricAlertsRulesCommand._createSdkCallParameters = function (ruleName, location, metricName, targetResourceId, operator, threshold, timeAggregationOperator, windowSize, options) {
    var condition = this._createThresholdRuleCondition(metricName, targetResourceId, operator, threshold, timeAggregationOperator, windowSize);

    var internalActions = [];
    if (!__.isUndefined(options.actions) && !__.isNull(options.actions)) {
      internalActions = JSON.parse(options.actions);
      log.silly(util.format('Parsed actions: %s', util.inspect(internalActions)));
      if (!__.isArray(internalActions)) {
        throw new Error($('Invalid actions argument: array expected.'));
      }
    }

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

    if (targetResourceId) {
      parameters.tags['$type'] = 'Microsoft.WindowsAzure.Management.Common.Storage.CasePreservedDictionary,Microsoft.WindowsAzure.Management.Common.Storage';
      parameters.tags['hidden-link:' + targetResourceId] = 'Resource';
    }

    return parameters;
  };

  // *** The execute cmd functions
  insightsMetricAlertsRulesCommand._executeSetCmd = function (client, ruleName, resourceGroup, parameters, options, _) {
    var progress = cli.interaction.progress(util.format($('Creating or updating a metric alert rule \"%s\"'), ruleName));
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
