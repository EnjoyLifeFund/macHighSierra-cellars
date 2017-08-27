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

var $ = utils.getLocaleString;

exports.init = function (cli) {
  var log = cli.output;

  var usage = cli.category('usage')
    .description($('Command to view your aggregated Azure usage data'));

  usage.command('list [reportedStartTime] [reportedEndTime]')
    .description($('List the usage aggregates for a provided time range. When --json flag is used, it will get the information from all the pages and then provide the final json array.'))
    .option('--reportedStartTime <datetime>', $('The start of the time range to retrieve data for, in \'yyyy-mm-dd\' format.'))
    .option('--reportedEndTime <datetime>', $('The end of the time range to retrieve data for, in \'yyyy-mm-dd\' format.'))
    .option('--granularity <daily/hourly>', $('Value is either daily (default) or hourly to tell the API how to return the results grouped by day or hour.'))
    .option('--showDetails', $('When this boolean flag is provided, the aggregates are broken down into the instance metadata which is more granular.'))
    .option('--continuationToken <url>', $('Retrieved from previous calls, this is the bookmark used for progress when the responses are paged.'))
    .option('--subscription <subscription>', $('the subscription identifier'))
    .option('| more', $('Provides paging support. Press \'Enter\' for more information.'))
    .execute(function (reportedStartTime, reportedEndTime, options, _) {
    var subscription = profile.current.getSubscription(options.subscription);
    var client = utils.createUsageManagementClient(subscription);
    if (!reportedStartTime) {
      reportedStartTime = cli.interaction.promptIfNotGiven($('reportedStartTime: '), reportedStartTime, _);
    }
    if (!reportedEndTime) {
      reportedEndTime = cli.interaction.promptIfNotGiven($('reportedEndTime: '), reportedEndTime, _);
    }
    var usageOptions = {};
    usageOptions.showDetails = options.showDetails;

    if (options.granularity) {
      if (options.granularity.toLowerCase() === 'daily') {
        usageOptions.aggregationGranularity = 'Daily';
      } else if (options.granularity.toLowerCase() === 'hourly') {
        usageOptions.aggregationGranularity = 'Hourly';
      } else {
        throw new Error(util.format('The value "%s" provided for granularity is invalid. Valid values are: "daily, hourly".', options.granularity));
      }
    } else {
      usageOptions.aggregationGranularity = 'Daily';
    }

    if (options.continuationToken) {
      usageOptions.continuationToken = options.continuationToken;
    }
    var progress = cli.interaction.progress($('Listing usage aggregates'));
    var result;
    var usages = [];
    function displayUsages (usages, interaction, log) {
      interaction.formatOutput(usages, function (data) {
        if (data && data.length > 0) {
          log.table(data, function (row, item) {
            row.cell($('Usage Start '), item.usageStartTime);
            row.cell($('Usage End '), item.usageEndTime);
            row.cell($('Meter Category '), item.meterCategory);
            row.cell($('Meter Name '), item.meterName);
            row.cell($('Quantity '), item.quantity + ' ' + item.unit);
          });
        } else {
          log.info($('No usage aggregates found for that time period.'));
        }
      });
    }
    try {
      result = client.usageAggregates.list(reportedStartTime, reportedEndTime, usageOptions, _);
      usages = usages.concat(result);
      if (options.json) {
        while(result.nextLink) {
          result = client.usageAggregates.listNext(result.nextLink, _);
          usages = usages.concat(result);
        }
        displayUsages(usages, cli.interaction, log);
      } else {
        displayUsages(result, cli.interaction, log);
        while(result.nextLink) {
          result = client.usageAggregates.listNext(result.nextLink, _);
          displayUsages(result, cli.interaction, log);
        }
      }
    } finally {
      progress.end();
    }
  });
};

