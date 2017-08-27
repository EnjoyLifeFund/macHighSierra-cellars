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
var _ = require('underscore');

var TokenCredentials = require('./tokenCredentials');
var adalAuth = require('./adalAuth');

function UserTokenCredentials(authConfig, userId) {
  this.authConfig = authConfig;
  this.userId = userId;
}

util.inherits(UserTokenCredentials, TokenCredentials);

UserTokenCredentials.prototype.retrieveTokenFromCache = function (callback) {
  var context = adalAuth.createAuthenticationContext(this.authConfig);
  var self = this;
  context.acquireToken(self.authConfig.resourceId, self.userId, self.authConfig.clientId, function (err, result) {
    if (err && err.message && err.message.indexOf('The specified item could not be found in the keychain') !== -1) {
      //retry, because it could happen when 2 cli commands running at the same time.
      context.acquireToken(self.authConfig.resourceId, self.userId, self.authConfig.clientId, function (err, result) {
        if (err) return callback(_polishError(err));
        return callback(null, result.tokenType, result.accessToken);
      });
    } else if (err) {
      //Removing cached tokens is not necessary per se, because the subsequent 'login' 
      //we suggest will do it. But, we still do the cleaning here just for robustness.
      adalAuth.removeCachedToken(self.userId, function (errOnRemove) {
        if (errOnRemove) {
          return callback(errOnRemove);
        }
        return callback(_polishError(err));
      });
    } else {
      return callback(null, result.tokenType, result.accessToken);
    }
  });
};

function _polishError(err) {
  var betterError = 'We don\'t have a valid access token. Please run "azure login" again.';
  
  //trash an ambiguous & useless error from adal-node which hides at least 
  //3 different root causes.
  if (err.message && err.message !== 'Entry not found in cache.') {
    betterError = betterError + ' Original error:' + err.message;
  }
  return new Error(betterError);
}

function authenticateWithUsernamePassword(authConfig, username, password, callback) {
  var context = adalAuth.createAuthenticationContext(authConfig);
  context.acquireTokenWithUsernamePassword(authConfig.resourceId, username, password, authConfig.clientId, function (err, response) {
    if (err) { return callback(err); }
    callback(null, new exports.UserTokenCredentials(authConfig, response.userId));
  });
}

function acquireUserCode(authConfig, callback) {
  var context = adalAuth.createAuthenticationContext(authConfig);
  return context.acquireUserCode(authConfig.resourceId, authConfig.clientId, null, callback);
}

function authenticateWithDeviceCode(authConfig, userCodeResponse, callback) {
  var context = adalAuth.createAuthenticationContext(authConfig);
  return context.acquireTokenWithDeviceCode(authConfig.resourceId, authConfig.clientId, userCodeResponse, function (err, tokenResponse) {
    if (err) { return callback(err); }
    return callback(null, new exports.UserTokenCredentials(authConfig, tokenResponse.userId));
  });
}

_.extend(exports, {
  UserTokenCredentials: UserTokenCredentials,
  authenticateWithUsernamePassword: authenticateWithUsernamePassword,
  acquireUserCode: acquireUserCode,
  authenticateWithDeviceCode: authenticateWithDeviceCode,
  normalizeUserName: adalAuth.normalizeUserName
});
