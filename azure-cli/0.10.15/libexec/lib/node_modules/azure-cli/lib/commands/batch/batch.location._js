//
// Copyright (c) Microsoft and contributors.  All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//
// See the License for the specific language governing permissions and
// limitations under the License.
//

var utils = require('../../util/utils');
var batchUtil = require('./batch.util');

var $ = utils.getLocaleString;

exports.init = function (cli) {
  var log = cli.output;

  var batch = cli.category('batch');

  var batchLocation = batch.category('location')
    .description($('Commands to manage Batch service options for a subscription at the region level'));

  var batchLocationQuotas = batchLocation.category('quotas')
    .description($('Commands to manage Batch service quotas at the region level'));

  function getQuotas(batchClient, location, options, _) {
    var quotas = batchClient.location.getQuotas(location, options, _);
    return quotas;
  }

  batchLocationQuotas.getCommand = function (location, options, _) {
    var batchClient = batchUtil.createBatchManagementClient(options.subscription);

    var quotas = getQuotas(batchClient, location, options, _);

    if (quotas) {
      cli.interaction.formatOutput(quotas, function(outputData) {
        log.data($('Account Quota:'), outputData.accountQuota);
      });
    } else {
      log.info($('No quotas retrieved'));
    }
  };

  // Command: azure batch location quotas show
  batchLocationQuotas.command('show <location>')
    .description($('Get the Batch service quotas for the specified subscription at the given region'))
    .option('-s, --subscription <id>', $('the subscription id'))
    .execute(batchLocationQuotas.getCommand);
};