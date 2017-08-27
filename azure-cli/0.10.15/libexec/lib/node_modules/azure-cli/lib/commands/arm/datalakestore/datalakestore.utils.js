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

function _padSpaces(tabs) {
  if (tabs > 0) {
    return '  ' + _padSpaces(tabs - 1);
  }

  return '';
}

// Shows the objects as lists of fieldName: fieldValue
exports.showObject = function(log, object, indentationTabs) {
  var tabs = __.isNumber(indentationTabs) ? indentationTabs : 0;
  var spaces = _padSpaces(tabs);
  var recursiveCaller = function (element) { 
    // puts dividers between each element in an array to make visualization much easier.
    exports.showObject(log, element, tabs + 1); 
    log.data(spaces + '  ------------------------------------------------------------------------------------');
  };
  
  // Test if the object to log is just a string. If so, simply log it at the current level
  // This works around the situation where a string object ends up being indexed one letter at a time
  if(__.isString(object)) {
    log.data(spaces + object);
  }
  else {
    for (var propertyName in object) {
      if (__.isNull(object[propertyName]) || __.isUndefined(object[propertyName])) {
        log.data(spaces + propertyName + ':');
      } else if (__.isArray(object[propertyName])) {
        log.data(spaces + propertyName + ':');
        __.each(object[propertyName], recursiveCaller);
      } else if (!__.isFunction(object[propertyName])) { // Do not recurse if the object[propertyName] is a function
        if (object[propertyName].toISOString !== undefined) { // Special case for TimeGrain objects returned by server
          log.data(spaces + propertyName + ': ' + object[propertyName].toISOString());
        } else if (__.isObject(object[propertyName])) {
          log.data(spaces + propertyName + ':');
          exports.showObject(log, object[propertyName], tabs + 1);
        } else {
          log.data(spaces + propertyName + ': ' + object[propertyName]);
        }
      }
    }
  }
};

exports.formatOutputList = function (cli, log, options, values) {
  log.silly(values !== undefined ? 'values is NOT undefined' : 'values is undefined');
  if (options.json) {
    cli.output.json(values);
  } else {
    var elementDisplayer = function(element) {
      exports.showObject(log, element);
      log.data('------------------------------------------------------------------------------------');
    };
    __.each(values, elementDisplayer);
  }
};

exports.formatOutput = function (cli, log, options, value) {
  log.silly(value !== undefined ? 'value is NOT undefined' : 'value is undefined');
  if (options.json) {
    cli.output.json(value);
  } else {
    exports.showObject(log, value);
  }
};

exports.convertStringToByteArray = function(str) {
    var result = [];
    for (var i = 0; i < str.length; i++) {
      result.push(str.charCodeAt(i).toString(2));
    }
    return result;
};
  
exports.convertByteArrayToString = function(array) {
    var result = '';
    for (var i = 0; i < array.length; i++) {
      result += String.fromCharCode(parseInt(array[i], 2));
    }
    return result;
};

exports.waitForRetry = function(attemptCount, useBackOffRetryStrategy) {
  var maximumBackoffWaitSeconds = 32;
  if(!useBackOffRetryStrategy) {
    return;
  }
  
  var intervalInSeconds = Math.max(maximumBackoffWaitSeconds, Math.pow(2, attemptCount));
  setTimeout(function() {
    return;
  }, intervalInSeconds * 1000); // multiplied by 1000 to convert to milliseconds.
};