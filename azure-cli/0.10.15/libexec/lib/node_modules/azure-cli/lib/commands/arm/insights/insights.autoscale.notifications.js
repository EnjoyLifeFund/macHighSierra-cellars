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
  var insightsAutoscaleNotificationsCommand = cli.category('insights').category('autoscale').category('notifications')
    .description($('Creates autoscale notifications'));

  insightsAutoscaleNotificationsCommand._prepareAndExecuteNotification = function (options) {
    log.silly(util.inspect(options));
    
    // Figure out what the customEmails options contains: string (csv)
    var customEmails;
    if (__.isString(options.customEmails)) {
      customEmails = options.customEmails.split(',');
    } else {
      throw new Error(util.format($('Incorrect value for customEmails: %s'), options.customEmails));
    }

    log.silly(util.format('Split e-mails: %s', util.inspect(customEmails)));

    var internalWebhooks = [];
    if (!__.isUndefined(options.webhooks) && !__.isNull(options.webhooks)) {
      internalWebhooks = JSON.parse(options.webhooks);
      log.silly(util.format('Parsed webhooks: %s', util.inspect(internalWebhooks)));
      if (!__.isArray(internalWebhooks)) {
        throw new Error($('Invalid webhooks argument: array expected.'));
      }
    }

    if (!(options.sendEmailToSubscriptionAdministrator || options.sendEmailToSubscriptionCoAdministrators) && 
      ((!internalWebhooks || internalWebhooks.length < 1) && (!customEmails || customEmails.length < 1))) {
      throw new Error($('At least one Webhook or one CustomeEmail must be present, or the notification must be sent to the admin or co-admin'));
    }

    var eMailNotification = {
      customEmails: customEmails,
      sendToSubscriptionAdministrator: options.sendEmailToSubscriptionAdministrator,
      sendToSubscriptionCoAdministrators: options.sendEmailToSubscriptionCoAdministrators
    };

    var notification = {
      email: eMailNotification,
      operation: 'Scale',
      webhooks: internalWebhooks
    };

    if (options.json) {
      cli.output.json(notification);
    } else {
      log.data(JSON.stringify(notification).replace(/"/g, '\\"'));
    }
  };

  insightsAutoscaleNotificationsCommand.command('create')
      .description($('Creates an autoscale notification.'))
      .usage('[options]')
      .option('-e --customEmails <customEmails>', $('A string with the list of custom e-mails in comma-separated format.'))
      .option('-o --sendEmailToSubscriptionAdministrator', $('Flag to send em-mail to the subscription administrator when the rule fires.'))
      .option('-p --sendEmailToSubscriptionCoAdministrators', $('Flag to send em-mail to the subscription coadministrators when the alert fires.'))
      .option('-w --webhooks <webhooks>', $('List of webhooks in the escaped json format'))
      .execute(function (options, _) {
        log.silly('Unused callback: ' + _);
        insightsAutoscaleNotificationsCommand._prepareAndExecuteNotification(options);
      });
  
  var insightsAlertsWebhookActionsCommand = insightsAutoscaleNotificationsCommand.category('webhook')
    .description($('Creates autoscale webhook notifications'));

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

  insightsAlertsWebhookActionsCommand._prepareAndExecuteWebhook = function (serviceUri, options) {
    log.silly(serviceUri);
    log.silly(util.inspect(options));

    if (!__.isString(serviceUri)) {
      cli.missingArgument('serviceUri');
    }
    
    var properties = this._processPropertiesArgument(options);    

    var webhookAction = {
      serviceUri: serviceUri,
      properties: properties
    };

    if (options.json) {
      cli.output.json(webhookAction);
    } else {
      log.data(JSON.stringify(webhookAction).replace(/"/g, '\\"'));
    }
  };

  insightsAlertsWebhookActionsCommand.command('create <serviceUri>')
      .description($('Creates an autoscale webhook notification.'))
      .usage('[options] <serviceUri>')
      .option('-e --serviceUri <serviceUri>', $('The service Uri.'))
      .option('-o --properties <properties>', $('A string with the list of key / value pairs in comma-separated format. Example: \"key1=value1;key2=value2\".'))
      .execute(function (serviceUri, options, _) {
        log.silly('Unused callback: ' + _);
        insightsAlertsWebhookActionsCommand._prepareAndExecuteWebhook(serviceUri, options);
      });
};
