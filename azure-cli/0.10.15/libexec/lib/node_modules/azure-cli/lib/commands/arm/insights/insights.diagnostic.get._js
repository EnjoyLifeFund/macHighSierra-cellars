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
  var insightsDiagnosticCommand = cli.category('insights').category('diagnostic')
    .description($('Configure diagnostics for resources'))
    .command('get')
      .description($('Get the diagnostics for the resource.'))
      .usage('[options]')
      .option('-i, --resourceId <resourceId>', $('resource Id.'))
      .execute(function (options, _) {
        insightsDiagnosticCommand._prepareAndExecute(options, _);
      });

  insightsDiagnosticCommand._prepareAndExecute = function (options, _) {
    var client = insightsUtils.createInsightsManagementClient(log, options);
    this._executeCmd(client, cli, log, options, _);
  };

  insightsDiagnosticCommand._executeCmd = function (client, cli, log, options, _) {
    if (insightsUtils.isEmptyOrSpaces(options.resourceId))
    {
      throw new Error($('The resourceId parameter is required.'));
    }

    var getResponse = client.serviceDiagnosticSettingsOperations.get(options.resourceId, _);
    var properties = getResponse.properties;

    insightsUtils.removeRetentionPolicy(properties);

    insightsUtils.formatOutput(cli, log, options, properties);
  };
};
