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

'use strict';

var Constants = require('./constants');

/**
* Creates a filter to add the user agent header in a request.
*
* @param {string} userAgent The user agent string to use.
*/
exports.create = function (userAgent) {
  return function handle(resource, next, callback) {
    // regardless of whether the UA has been set by someone,
    // just set it flatly to xplat-cli's UA. The app takes care of
    // constructing the right string, see utils.js
    resource.headers[Constants.USER_AGENT] = userAgent;
    return next(resource, callback);
  };
};
