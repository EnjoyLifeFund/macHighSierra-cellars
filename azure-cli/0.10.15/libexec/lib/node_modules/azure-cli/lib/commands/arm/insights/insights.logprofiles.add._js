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

var utils = require('../../../util/utils');
var insightsUtils = require('./insights.utils');

var $ = utils.getLocaleString;

exports.init = function (cli) {
  var log = cli.output;
  var insightsDiagnosticCommand = cli.category('insights').category('logprofile')
    .description($('Configure log profiles'))
    .command('add')
      .description($('Add a new log profile.'))
      .usage('[options]')
      .option('-n, --name <name>', $('resource Id.'))
      .option('-a, --storageId <storageId>', $('storage account Id.'))
      .option('-b, --serviceBusRuleId <servicesBusRuleId>', $('the authorization rule id of the service bus.'))
      .option('-c, --categories <categories>', $('comma separated list of categories to be included in the captured logs.'))
      .option('-l, --locations <locations>', $('comma separated list of locations of the resources to be included in the log profile.'))
      .option('-t, --retentionInDays <retentionInDays>', $('the number of days the logs will be kept before being delete.'))
      .execute(function (options, _) {
        insightsDiagnosticCommand._prepareAndExecute(options, _);
      });

  insightsDiagnosticCommand._prepareAndExecute = function (options, _) {
    var client = insightsUtils.createInsightsManagementClient(log, options);

    if (options.categories) {
      options.categories = options.categories.split(',');
    }
    else {
      options.categories = [ 'Action', 'Delete', 'Write' ];
    }

    if (options.locations) {
      options.locations = options.locations.split(',');
    }

    this._executeCmd(client, cli, log, options, _);
  };

  insightsDiagnosticCommand._executeCmd = function (client, cli, log, options, _) {
    var retentionPolicy = {
      enabled: false,
      days: 0
    };

    if (options.retentionInDays) {
      retentionPolicy.enabled = true;
      retentionPolicy.days = parseInt(options.retentionInDays);
    }

    var properties = {
      categories: options.categories,
      locations: options.locations,
      retentionPolicy: retentionPolicy,
      serviceBusRuleId: options.serviceBusRuleId,
      storageAccountId: options.storageId
    };
    
    var putParameters = {
      properties: properties
    };

    client.logProfilesOperations.createOrUpdate(options.name, putParameters, _);

    putParameters.properties.name = options.name;
    putParameters.properties.id = '/subscriptionId/' + client.credentials.subscriptionId + '/providers/microsoft.insights/logprofiles/' + options.name;

    insightsUtils.formatOutput(cli, log, options, putParameters.properties);
  };
};
