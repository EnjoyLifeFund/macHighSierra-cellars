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

var util = require('util');

var utils = require('../util/utils');
var utilsCore = require('../util/utilsCore');

var $ = utils.getLocaleString;

exports.init = function (cli) {
  var log = cli.output;

  cli.command('telemetry')
  .description($('Manages the data collection preference.'))
  .option('-e, --enable', $('use this flag to enable telemetry'))
  .option('-d, --disable', $('use this flag to disable telemetry'))
  .execute(function (options, callback) {
    if (options.enable && options.disable) {
      throw new Error($('Either --enable or --disable can be used, but not both.'));
    }
    if (!options.enable && !options.disable) {
      throw new Error($('Either --enable or --disable should be provided.'));
    }
    var telemetryInfo = utilsCore.readTelemetry();
    telemetryInfo.telemetry = !!options.enable;
    utilsCore.writeTelemetry(telemetryInfo);
    var isJson = log.format().json;
    if (isJson) {
      log.json(telemetryInfo);
    } else {
      if (telemetryInfo.telemetry) {
        log.info(util.format($('You choose to participate in Microsoft Azure CLI data collection.\n')));
      } else {
        log.info(util.format($('You choose not to participate in Microsoft Azure CLI data collection.\n')));
      }
    }

    callback();
  });
};
