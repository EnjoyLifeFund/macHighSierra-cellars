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

var profile = require('../../../util/profile');
var utils = require('../../../util/utils');
var providerUtils = require('../providers/providerUtils');
var locationUtils = require('./locationUtils');

var $ = utils.getLocaleString;

exports.init = function (cli) {
  var log = cli.output;
  var withProgress = cli.interaction.withProgress.bind(cli.interaction);

  var location = cli.category('location')
    .description($('Commands to get the available locations'));
  
  location.command('list')
    .description($('list the available locations'))
    .option('--subscription <subscription>', $('the subscription identifier'))
    .option('--details', $('shows full provider list with latitude and longitude'))
    .execute(function (client, options, _) {
      var providers;
      var subscription = profile.current.getSubscription(options.subscription);
      var resourceClient = utils.createResourceClient(subscription);
      var subscriptionClient = utils.createSubscriptionClient(subscription);
      var listOfLocations = subscriptionClient.subscriptions.listLocations(subscription.id, _); 
    
      withProgress($('Getting ARM registered providers'),
        function (log, _) {
          providers = providerUtils.getAllProviders(resourceClient, _);
          listOfLocations = locationUtils.addProviders(listOfLocations, providers);
        }, _);
      if (!options.json) {
        log.warn('The "location list" commands is changed to list subscription\'s locations. ' + 
        'For old information, use "provider list or show" commands.');
        log.info('Getting locations...');
      }    
      var listLength = options.details ? 'all' : 4;
      cli.interaction.formatOutput(listOfLocations, function (data) {
        if (data.length === 0) {
          log.info($('No location found'));
        } else {
          data.forEach(function(location){
            log.data('');
            log.data($('Location    : '), location.name);
            log.data($('DisplayName : '), location.displayName);
            if(options.details){
              log.data($('Latitude  : '), location.latitude);
              log.data($('Longitude : '), location.longitude);
            }
            log.data($('Providers   : '), locationUtils.showList(location.providers, listLength));
          });
        }
      });
  });
};

