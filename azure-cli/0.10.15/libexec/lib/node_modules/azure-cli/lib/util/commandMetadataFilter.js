// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

'use strict';

var Constants = require('./constants');

/**
* Creates a filter to add the command name and parameter set in separate headers in a request.
*
* @param {object} cmdMetadata The command metadata to be added to the request header.
*
* @param {string} cmdMetadata.commandName - The command executed by the customer
*
* @param {string} cmdMetadata.parameterSetName The parameterSet used by the customer while executing the command
*/
exports.create = function (cmdMetadata) {
  return function handle (resource, next, callback) {
    exports._tagRequest(resource, cmdMetadata);
    return next(resource, callback);
  };
};

exports._tagRequest = function (requestOptions, cmdMetadata) {
  requestOptions.headers[Constants.XMS_COMMAND_NAME] = cmdMetadata.commandName;
  requestOptions.headers[Constants.XMS_PARAMETER_SET_NAME] = cmdMetadata.parameterSetName;
};

exports = module.exports;