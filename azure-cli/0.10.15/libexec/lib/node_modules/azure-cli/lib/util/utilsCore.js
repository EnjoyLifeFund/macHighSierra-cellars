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

var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var read = require('read');
var wrap = require('wordwrap').hard(0, 75);
var util = require('util');
var Constants = require('./constants');
var userHome = require('user-home');

exports.camelcase = function (flag) {
  return flag.split('-').reduce(function (str, word) {
    return str + word[0].toUpperCase() + word.slice(1);
  });
};

exports.ignoreCaseEquals = function (a, b) {
  return a === b ||
    (a !== null && a !== undefined &&
    b !== null && b !== undefined &&
    (a.toLowerCase() === b.toLowerCase())) === true;
};

exports.azureDir = function () {
  if (!process.env.AZURE_CONFIG_DIR && !userHome) {
    throw new Error('No Azure_CONFIG_DIR or HOME path is available');
  }
  var dir = process.env.AZURE_CONFIG_DIR ||
    path.join(userHome, '.azure');
  if (!exports.pathExistsSync(dir)) {
    fs.mkdirSync(dir, 502); // 0766
  }

  return dir;
};

exports.stringStartsWith = function (text, prefix, ignoreCase) {
  if (_.isNull(prefix)) {
    return true;
  }
  
  if (ignoreCase) {
    return text.toLowerCase().substr(0, prefix.toLowerCase().length) === prefix.toLowerCase();
  } else {
    return text.substr(0, prefix.length) === prefix;
  }
};

exports.pathExistsSync = fs.existsSync ? fs.existsSync : path.existsSync;

/**
 * Read azure cli config
 */
exports.readConfig = function () {
  var azureConfigPath = path.join(exports.azureDir(), 'config.json');
  
  var cfg = {};
  
  if (exports.pathExistsSync(azureConfigPath)) {
    try {
      cfg = JSON.parse(fs.readFileSync(azureConfigPath));
    } catch (err) {
      cfg = {};
    }
  }
  
  return cfg;
};

exports.writeConfig = function (cfg) {
  var azurePath = exports.azureDir();
  var azureConfigPath = path.join(exports.azureDir(), 'config.json');
  
  if (!exports.pathExistsSync(azurePath)) {
    fs.mkdirSync(azurePath, 502); //0766
  }
  
  fs.writeFileSync(azureConfigPath, JSON.stringify(cfg, null, 2));
};

exports.getMode = function () {
  var config = exports.readConfig();
  return config.mode ? config.mode : Constants.API_VERSIONS.ARM;
};

exports.getFiles = function (scanPath, recursively) {
  var results = [];

  var list = fs.readdirSync(scanPath);

  var pending = list.length;
  if (!pending) {
    return results;
  }

  for (var i = 0; i < list.length; i++) {
    var file = list[i];

    file = scanPath + '/' + file;

    var stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (recursively) {
        var res = exports.getFiles(file);
        results = results.concat(res);
      }
    } else {
      results.push(file);
    }
  }

  return results;
};

exports.readTelemetry = function () {
  var azureTelemetryPath = path.join(exports.azureDir(), Constants.TELEMETRY);
  
  var telemetry = {};
  
  if (exports.pathExistsSync(azureTelemetryPath)) {
    try {
      telemetry = JSON.parse(fs.readFileSync(azureTelemetryPath));
    } catch (err) {
      telemetry = {};
    }
  }
  
  return telemetry;
};

exports.writeTelemetry = function (telemetry) {
  var azurePath = exports.azureDir();
  var azureTelemetryPath = path.join(exports.azureDir(), Constants.TELEMETRY);
  
  if (!exports.pathExistsSync(azurePath)) {
    fs.mkdirSync(azurePath, 502); //0766
  }
  
  fs.writeFileSync(azureTelemetryPath, JSON.stringify(telemetry, null, 2));
};

/**
 * Determines whether telemtry is enabled or not. If this is the first time, that this decision 
 * needs to be made, then it prompts the user for data collection. It will timeout in 60 seconds 
 * with default response being 'n' i.e. telemetry is disabled.
 *
 * @returns {function} callback(err, result)
 *
 *                      {null}    err      - Always null.
 *
 *                      {boolean} result   - true if telemetry is enabled, false otherwise.
 */
exports.isTelemetryEnabled = function (callback) {
  var telemetryInfo = exports.readTelemetry();
  var outcome = false;
  if (telemetryInfo.telemetry !== null && telemetryInfo.telemetry !== undefined && typeof telemetryInfo.telemetry === 'boolean') {
    return callback(null, telemetryInfo.telemetry);
  } else if (process.argv[2] && process.argv[2].toLowerCase() === 'telemetry') {
    return callback(null, outcome);
  } else {
    // we've determined that this is not a telemetry command and we do not have user's telemetry preference.
    // we proceed to read out the telemetry prompt and get user preference. But, before that check if we're
    // in non interactive mode. If so, do not prompt, assume default response of 'no'.
    // This behavior is intended to make scripting scenarios better. E.g: running azure cli on a CI server.
    if (process.env['AZURE_NON_INTERACTIVE_MODE']) {
      return callback(null, outcome);
    }

    var telemetryPromptText = wrap('\nMicrosoft Azure CLI would like to collect data about how users use CLI commands and some problems they encounter.  ' + 
      'Microsoft uses this information to improve our CLI commands.  Participation is voluntary and when you choose to participate your device ' + 
      'automatically sends information to Microsoft about how you use Azure CLI. ' + 
      '\n\nIf you choose to participate, you can stop at any time later by using Azure CLI as follows: ' +
      '\n1.  Use the azure telemetry command to turn the feature Off. ' +
      '\nTo disable data collection, execute: azure telemetry --disable' +
      '\n\nIf you choose to not participate, you can enable at any time later by using Azure CLI as follows: ' +
      '\n1.  Use the azure telemetry command to turn the feature On. ' +
      '\nTo enable data collection, execute: azure telemetry --enable' +
      '\n\nSelect y to enable data collection :(y/n) ');
    
    var telemetryOptions = {
      prompt : telemetryPromptText,
      timeout : 30000,
      edit : false,
      silent : false
    };

    read(telemetryOptions, function(err, result) {
      if ((err && err.message === 'timed out') || (result && result.match(/^no?$/i))) {
        exports.writeTelemetry({telemetry: false});
        console.log('\nYou choose not to participate in Microsoft Azure CLI data collection.\n\n');
      } else if (result && result.match(/^y?(es)?$/i)) {
        exports.writeTelemetry({telemetry: true});
        outcome = true;
        console.log('\nYou choose to participate in Microsoft Azure CLI data collection.\n\n');
      } else {
        exports.writeTelemetry({telemetry: false});
        console.log(wrap(util.format('\nYou provided \'%s\' which is an invalid input. This translates ' + 
          'to you choosing not to participate in Microsoft Azure CLI data collection.\n\n', result)));
      }
      return callback(null, outcome);
    });
  }
};