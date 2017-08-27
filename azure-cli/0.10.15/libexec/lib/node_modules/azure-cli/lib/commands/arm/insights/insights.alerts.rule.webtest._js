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
  var insightsWebtestAlertsRulesCommand = cli.category('insights').category('alerts').category('rule').category('webtest')
    .description($('Creates webtest alerts rules'));
  
  insightsWebtestAlertsRulesCommand.command('set <ruleName> <location> <resourceGroup> <windowSize> <failedLocationCount> <metricName> <webtestResourceUri>')
    .description($('Create a webtest alert rule.'))
    .usage('[options] <ruleName> <location> <resourceGroup> <windowSize> <failedLocationCount> <metricName> <webtestResourceUri>')

    // Generic options
    .option('-x --disable', $('Flag to disable the rule.'))
    .option('-s --subscription <subscription>', $('The subscription identifier.'))

    // Common required
    .option('-n --ruleName <ruleName>', $('The name of the rule.'))
    .option('-d --description <description>', $('The description of the rule.'))
    .option('-l --location <location>', $('The location.'))
    .option('-g --resourceGroup <resourceGroup>', $('The resource group.'))
    .option('-m --metricName <metricName>', $('The metric name.'))

    .option('--windowSize <windowSize>', $('The time window size. Expected format hh:mm:ss.'))
    .option('-f --failedLocationCount <failedLocationCount>', $('The failed location count.'))
    .option('-i --webtestResourceUri <webtestResourceUri>', $('The webtest resource Id.'))
    .option('-y --metricNamespace <metricNamespace>', $('The metric namespace.'))
    .option('-z --actions <actions>', $('The list of alert rule actions. The list must be a json object (string) of an array. Example: "[{\\\"customEmails\\\":[\\\"gu@ms.com\\\"]},{\\\"serviceUri\\\":\\\"http://foo.com\\\",\\\"properties\\\":[{\\\"key\\\":\\\"key1\\\",\\\"value\\\":\\\"value1\\\"},{\\\"key\\\":\\\"value1\\\",\\\"value\\\":\\\"key2\\\"}]}]"'))

    .execute(function (ruleName, location, resourceGroup, windowSize, failedLocationCount, metricName, webtestResourceUri, options, _) {
      insightsWebtestAlertsRulesCommand._prepareAndExecuteSet(ruleName, location, resourceGroup, windowSize, failedLocationCount, metricName, webtestResourceUri, options, _);
    });

  // ** The Prepare and Execute functions
  insightsWebtestAlertsRulesCommand._prepareAndExecuteSet = function (ruleName, location, resourceGroup, windowSize, failedLocationCount, metricName, webtestResourceUri, options, _) {
    log.silly(ruleName);
    log.silly(location);
    log.silly(resourceGroup);
    log.silly(windowSize);
    log.silly(failedLocationCount);
    log.silly(metricName);
    log.silly(webtestResourceUri);
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

    if (!__.isString(metricName)) {
      cli.missingArgument('metricName');
    }

    if (!__.isString(webtestResourceUri)) {
      cli.missingArgument('webtestResourceUri');
    }

    var client = insightsUtils.createInsightsManagementClient(log, options);
    var parameters = this._createSdkCallParameters(ruleName, location, windowSize, failedLocationCount, metricName, webtestResourceUri, options);

    log.silly(util.format('Parameters: %s', util.inspect(parameters)));

    this._executeSetCmd(client, ruleName, resourceGroup, parameters, options, _);
  };

  insightsWebtestAlertsRulesCommand._createLocationThresholdRuleCondition = function (windowSize, failedLocationCount, metricName, webtestResourceUri, options) {
    if (windowSize) {
      windowSize = insightsUtils.validateTimeSpan(windowSize);
    } else {
      windowSize = insightsUtils.defaultWindowSize;
    }

    return {
      dataSource: {
        metricName: metricName,
        metricNamespace: options.metricNamespace,
        resourceUri: webtestResourceUri,
        type: 'Microsoft.Azure.Management.Insights.Models.RuleMetricDataSource'
      },
      failedLocationCount: failedLocationCount,
      windowSize: windowSize,
      type: 'Microsoft.Azure.Management.Insights.Models.LocationThresholdRuleCondition'
    };
  };

  insightsWebtestAlertsRulesCommand._createSdkCallParameters = function (ruleName, location, windowSize, failedLocationCount, metricName, webtestResourceUri, options) {
    var internalActions = [];
    if (!__.isUndefined(options.actions) && !__.isNull(options.actions)) {
      internalActions = JSON.parse(options.actions);
      log.silly(util.format('Parsed actions: %s', util.inspect(internalActions)));
      if (!__.isArray(internalActions)) {
        throw new Error($('Invalid actions argument: array expected.'));
      }
    }

    var condition = this._createLocationThresholdRuleCondition(windowSize, failedLocationCount, metricName, webtestResourceUri, options);
    var parameters = {
      location: location,
      properties: {
        name: ruleName,
        isEnabled: !options.disabled,
        description: (__.isUndefined(options.description) || __.isNull(options.description)) ? '' : options.description,
        lastUpdatedTime: new Date(),
        condition: condition,
        actions: internalActions
      },
      tags: {}
    };

    parameters.tags['hidden-link:' + webtestResourceUri] = 'Resource';

    return parameters;
  };

  insightsWebtestAlertsRulesCommand._executeSetCmd = function (client, ruleName, resourceGroup, parameters, options, _) {
    var progress = cli.interaction.progress(util.format($('Creating or updating a webtest alert rule \"%s\"'), ruleName));
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
