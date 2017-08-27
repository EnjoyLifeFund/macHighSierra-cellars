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
    .command('get')
      .description($('Get the log profile.'))
      .usage('[options]')
      .option('-n, --name <name>', $('name of the log profile.'))
      .execute(function (options, _) {
        insightsDiagnosticCommand._prepareAndExecute(options, _);
      });

  insightsDiagnosticCommand._prepareAndExecute = function (options, _) {
    var client = insightsUtils.createInsightsManagementClient(log, options);
    this._executeCmd(client, cli, log, options, _);
  };

  insightsDiagnosticCommand._executeCmd = function (client, cli, log, options, _) {
    var getResponse = client.logProfilesOperations.get(options.name, _);
    var properties = getResponse.properties;

    properties.id = getResponse.id;
    properties.name = getResponse.name;

    insightsUtils.formatOutput(cli, log, options, properties);
  };
};
