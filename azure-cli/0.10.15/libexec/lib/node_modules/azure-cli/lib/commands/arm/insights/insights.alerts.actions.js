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

var $ = utils.getLocaleString;

exports.init = function (cli) {
  var log = cli.output;
  var insightsAlertsActionsCommand = cli.category('insights').category('alerts').category('actions')
    .description($('Creates alert rules actions'));

  // *** Adding the e-mail action command
  var insightsAlertsEmailActionsCommand = insightsAlertsActionsCommand.category('email')
    .description($('Creates alert rule e-mail actions'));

  insightsAlertsEmailActionsCommand._prepareAndExecuteEmailAction = function (options) {
    log.silly('options: ' + util.inspect(options));

    // Figure out what the customEmails options contains: string (csv)
    var customEmails;
    if (__.isString(options.customEmails)) {
      customEmails = options.customEmails.split(',');
    } else {
      throw new Error(util.format($('Incorrect value for customEmails: %s'), options.customEmails));
    }

    if (!options.sendToServiceOwners && (__.isNull(customEmails) || __.isUndefined(customEmails) || customEmails.length < 1)) {
      throw new Error($('Either sendToServiceOwners must be set or at least one custom email must be present'));
    }

    var eMailAction = {
      customEmails: customEmails,
      sendToServiceOwners: options.sendToServiceOwners,
      type: 'Microsoft.Azure.Management.Insights.Models.RuleEmailAction'
    };

    if (options.json) {
      cli.output.json(eMailAction);
    } else {
      log.data(JSON.stringify(eMailAction).replace(/"/g, '\\"'));
    }
  };

  insightsAlertsEmailActionsCommand.command('create')
      .description($('Creates an alert rule e-mail action.'))
      .usage('[options]')
      .option('-e --customEmails <customEmails>', $('A string with the list of custom e-mails in comma-separated format.'))
      .option('-o --sendToServiceOwners', $('Flag to send em-mail to the service owners when the alert fires.'))
      .execute(function (options, _) {
        log.silly('Unused callback: ' + _);
        insightsAlertsEmailActionsCommand._prepareAndExecuteEmailAction(options);
      });
  
  // **** Adding the webhook commands
  var insightsAlertsWebhookActionsCommand = insightsAlertsActionsCommand.category('webhook')
    .description($('Creates alert rule webhook actions'));

  insightsAlertsWebhookActionsCommand._processPropertiesArgument = function(options) {
    // options.properties is optional
    if (__.isUndefined(options.properties) || __.isNull(options.properties)) {
      return [];
    }

    // Value for input optional argument properties must be a comma-separated string with an even length
    if (__.isString(options.properties)) {
      var properties = options.properties.split(';');

      var propObject = {};
      for (var i = 0; i < properties.length; i++) {
        var items = properties[i].split('=');

        if (items.length !== 2) {
          throw new Error(util.format($('Key=value pair expected: %s.', properties[i])));
        }
        var key = items[0];
        var value = items[1];
        propObject[key] = value;
      }

      return propObject;
    } else {
      throw new Error(util.format($('Incorrect value for properties: %s'), options.properties));
    }
  };

  insightsAlertsWebhookActionsCommand._prepareAndExecuteWebhookAction = function (serviceUri, options) {
    log.silly('serviceUri: ' + serviceUri);
    log.silly('options: ' + util.inspect(options));

    if (!__.isString(serviceUri)) {
        cli.missingArgument('serviceUri');
    }

    var properties = this._processPropertiesArgument(options);

    var webhookAction = {
      serviceUri: serviceUri,
      properties: properties,
      type: 'Microsoft.Azure.Management.Insights.Models.RuleWebhookAction'
    };

    if (options.json) {
      cli.output.json(webhookAction);
    } else {
      log.data(JSON.stringify(webhookAction).replace(/"/g, '\\"'));
    }
  };

  insightsAlertsWebhookActionsCommand.command('create <serviceUri>')
      .description($('Creates an alert rule webhook action.'))
      .usage('[options] <serviceUri>')
      .option('-e --serviceUri <serviceUri>', $('The service Uri.'))
      .option('-o --properties <properties>', $('A string with the list of key / value pairs in comma-separated format. Example: \"key1=value1;key2=value2\".'))
      .execute(function (serviceUri, options, _) {
        log.silly('Unused callback: ' + _);
        insightsAlertsWebhookActionsCommand._prepareAndExecuteWebhookAction(serviceUri, options);
      });
};
