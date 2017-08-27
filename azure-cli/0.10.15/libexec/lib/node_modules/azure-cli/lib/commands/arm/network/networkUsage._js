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

var __ = require('underscore');
var utils = require('../../../util/utils');
var $ = utils.getLocaleString;

function NetworkUsage(cli, networkManagementClient) {
  this.networkManagementClient = networkManagementClient;
  this.output = cli.output;
  this.interaction = cli.interaction;
}

__.extend(NetworkUsage.prototype, {
  /**
   * Public methods
   */

  list: function(location, options, _) {
	var self = this;
	var output = self.output;
	var usages = self.networkManagementClient.usages.list(location, _);

    self.interaction.formatOutput(usages, function (outputData) {
      output.table(outputData, function (row, item) {
        row.cell($('Name'), item.name.localizedValue);
        row.cell($('Unit'), item.unit);
        row.cell($('CurrentValue'), item.currentValue);
        row.cell($('Limit'), item.limit);
      });
    });

  }

  /**
   * Private methods
   */
});

module.exports = NetworkUsage;