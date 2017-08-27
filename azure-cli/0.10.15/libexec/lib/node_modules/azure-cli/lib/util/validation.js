/*jshint camelcase: false */

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

/**
 * This module wraps 'validator' package,
 * details here https://www.npmjs.com/package/validator
 */
var validator = require('validator');
var _ = require('underscore');
var util = require('util');

/**
 * Check if the string is in a array of allowed values, case insensitive.
 *
 * Return true:  'ARM', ['arm', 'asm']
 * Return false: 'ftp', ['HTTP', 'HTTPS']
 */
exports.isValidEnumValue = function (str, values, paramName) {
  paramName = paramName || '';

  if (!values.some(function (val) {
      return val.toLowerCase() === str.toLowerCase();
    })) {
    throw new Error(util.format('Given %s "%s" is invalid, supported values are: %s', paramName, str, values.join(', ')));
  }
};

/**
 * Check if the string is in a array of allowed values, case insensitive.
 *
 * Return true:  'ARM', ['arm', 'asm']
 * Return false: 'ftp', ['HTTP', 'HTTPS']
 */
exports.isIn = function (str, values, paramName) {
  paramName = paramName || '';

  var valuesLowered = _.map(values, function (v) {
    return v.toLowerCase();
  });

  var index = _.indexOf(valuesLowered, str.toLowerCase());
  if (index === -1) {
    throw new Error(util.format('Given %s "%s" is invalid, supported values are: %s', paramName, str, values.join(', ')));
  }
  return values[index];
};

/**
 * Check if the string is an URL.
 *
 * Valid:     'https://azure.microsoft.com/', 'https://192.168.1.1'
 * Not valid: 'azure.microsoft.com', '192.168.1.1'
 *
 * Returns: true/false
 */
exports.isURL = function (url, options) {
  options = options || {require_protocol: true, require_valid_protocol: true};
  return validator.isURL(url, options);
};

/**
 * Check if the string is an integer.
 * options is an object which can contain the keys min and/or max to check the integer is within boundaries.
 *
 * Valid:     '5', { min: 1, max: 7 }
 * Not valid: 'foobar'
 */
exports.isInt = function (str, options, paramName) {
  str = str.toString();
  options = options || {};
  paramName = paramName || '';

  if (validator.isInt(str, options)) {
    return parseInt(str, 10);
  } else if (options.min && options.max) {
    throw new Error(util.format('Given %s "%s" is not valid integer between %s and %s', paramName, str, options.min, options.max));
  } else {
    throw new Error(util.format('Given %s "%s" is not valid integer', paramName, str));
  }
};

/**
 * Check if a string is a boolean, case insensitive.
 *
 * Valid:     TRUE, false
 * Not valid: foo, 123
 *
 * Returns: true/false
 */
exports.isBool = function (str, paramName) {
  paramName = paramName || '';

  var valueLowered = str.toLowerCase();
  if (!validator.isBoolean(valueLowered)) {
    throw new Error(util.format('Given %s "%s" is not valid boolean, supported values are: true, false', paramName, str));
  }
  return valueLowered === 'true';
};

/**
 * Check if the string is an IP (version 4 or 6).
 *
 * Valid:     '192.168.1.1', 'FE80::0202:B3FF:FE1E:8329'
 * Not valid: 'foo.bar', '192.168.0'
 */
exports.isIP = function (str, paramName) {
  paramName = paramName || '';

  if (validator.isIP(str)) {
    return str;
  } else {
    throw new Error(util.format('Given %s "%s" is not valid IP address', paramName, str));
  }
};

/**
 * Check if the string is an IP (version 4 or 6) in cidr format (---.---.---.---/cidr)
 *
 * Valid:     '192.168.1.1/15', 'FE80::0202:B3FF:FE1E:8329/32'
 * Not valid: 'foo.bar', '192.168.1.1'
 */
exports.isCIDR = function (str, paramName) {
  paramName = paramName || '';

  var isValid = true;
  if (str.indexOf('/') === -1) {
    isValid = false;
  } else {
    var parts = str.split('/');
    if (parts.length !== 2) {
      isValid = false;
    } else {
      var ip = parts[0];
      if (!validator.isIP(ip)) {
        isValid = false;
      } else {
        var cidr = parts[1];
        if (!validator.isInt(cidr)) {
          isValid = false;
        }
      }
    }
  }

  if (isValid === true) {
    return str;
  } else {
    throw new Error(util.format('Given %s "%s" is not valid CIDR', paramName, str));
  }
};

/**
 * Check if the string's length falls in a range
 *
 * Valid:     [2, 4], 'foo'
 * Not valid: [1, 2], 'bar'
 */
exports.isLength = function (str, options, paramName) {
  options = options || {};
  paramName = paramName || '';

  if (validator.isLength(str, options)) {
    return str;
  } else {
    throw new Error(util.format('Given %s "%s" must be no longer than %s characters', paramName, str.trunc(5), options.max));
  }
};

/**
 * Check if the string is in range format
 *
 * Valid:     '80-81'
 * Not valid: '80', '80-', '-81'
 */
exports.isRange = function (str, paramName) {
  var pattern = /^[\d]+\s*-\s*[\d]+$/;
  var match = pattern.test(str);
  if (match) {
    return str;
  } else {
    throw new Error(util.format('Given %s "%s" must be in range format "x-y"', paramName, str));
  }
};

/**
 * Check if the string is a UUID
 */
exports.isUUID = function (str) {
  if (validator.isUUID(str)) {
    return str;
  } else {
    throw new Error(util.format('Given string "%s" is not valid UUID', str));
  }
};