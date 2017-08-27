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
var util = require('util');
var utils = require('../../../util/utils');
var $ = utils.getLocaleString;

function RouteTable(cli, networkManagementClient) {
  this.networkManagementClient = networkManagementClient;
  this.output = cli.output;
  this.interaction = cli.interaction;
}
__.extend(RouteTable.prototype, {
  /**
   * Route Table methods
   */
  get: function (resourceGroupName, routeTableName, _) {
    var self = this;
    var progress = self.interaction.progress(util.format($('Looking up Route Table "%s"'), routeTableName));
    try {
      var routeTable = self.networkManagementClient.routeTables.get(resourceGroupName, routeTableName, null, _);
      return routeTable;
    } catch (e) {
      if (e.statusCode === 404) {
        return null;
      }
      throw e;
    } finally {
      progress.end();
    }
  }
});

module.exports = RouteTable;