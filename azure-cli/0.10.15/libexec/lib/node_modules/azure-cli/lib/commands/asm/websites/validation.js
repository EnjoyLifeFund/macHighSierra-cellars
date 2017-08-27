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

// common functions for validating arguments

function throwMissingArgument(name, func) {
  throw new Error('Required argument ' + name + ' for function ' + func + ' is not defined');
}

function ArgumentValidator(functionName) {
  this.func = functionName;
}

_.extend(ArgumentValidator.prototype, {
  string: function (val, name) {
    if (typeof val.valueOf() !== 'string' || val.length === 0) {
      throwMissingArgument(name, this.func);
    }
  },

  object: function (val, name) {
    if (!val) {
      throwMissingArgument(name, this.func);
    }
  },

  exists: function (val, name) {
    this.object(val, name);
  },

  function: function (val, name) {
    if (typeof val !== 'function') {
      throw new Error('Parameter ' + name + ' for function ' + this.func + ' should be a function but is not');
    }
  },

  value: function (val, name) {
    if (!val) {
      throwMissingArgument(name, this.func);
    }
  },

  nonEmptyArray: function (val, name) {
    if (!Array.isArray(val) || val.length === 0) {
      throw new Error('Required array argument ' + name + ' for function ' + this.func + ' is either not defined or empty');
    }
  },

  callback: function (val) {
    this.object(val, 'callback');
    this.function(val, 'callback');
  },

  test: function (predicate, message) {
    if (!predicate()) {
      throw new Error(message + ' in function ' + this.func);
    }
  },

  tableNameIsValid: exports.tableNameIsValid,
  containerNameIsValid: exports.containerNameIsValid,
  blobNameIsValid: exports.blobNameIsValid,
  pageRangesAreValid: exports.pageRangesAreValid,
  queueNameIsValid: exports.queueNameIsValid
});

function validateArgs(functionName, validationRules) {
  var validator = new ArgumentValidator(functionName);
  validationRules(validator);
}

exports.ArgumentValidator = ArgumentValidator;
exports.validateArgs = validateArgs;