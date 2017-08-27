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

var profile = require('../util/profile');
var utils = require('../util/utils');

var $ = utils.getLocaleString;

exports.init = function(cli) {
  cli.command('portal')
    .description($('Open the portal in a browser'))
    .option('-e, --environment <environment>', $('the publish settings download environment'))
    .option('-r, --realm <realm>', $('the organization\'s realm'))
    .execute(function (options, _) {
      // If the environment option is specified, fetch that specific environment
      // If it is left unspecified, fetch the one associated with current account
      // If all else fails, fetch the default environment.
      var environmentName = options.environment;
      var targetEnvironment;
      if(!environmentName) {
        var subscription = profile.current.getSubscription(options.subscription);
        if(subscription) {
          targetEnvironment = subscription.environment;
        }
        else{
          targetEnvironment = profile.current.getDefaultEnvironment();
        }
      }
      else{
        targetEnvironment = profile.current.getEnvironment(environmentName);
      }

      var targetUrl = targetEnvironment.getPortalUrl(options.realm);
      cli.interaction.launchBrowser(targetUrl, _);
    });
};