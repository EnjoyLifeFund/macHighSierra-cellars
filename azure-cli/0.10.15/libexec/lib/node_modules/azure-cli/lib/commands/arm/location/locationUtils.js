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

exports.addProviders = function (locations, providers) {
  return locations.map(function(location){ 
    return { 
             'id'           : location.id, 
             'name'         : location.name, 
             'displayName'  : location.displayName, 
             'latitude'     : location.latitude,
             'longitude'    : location.longitude,
             'providers'    : getProvidersForLocation(providers, location.displayName) 
            };
  });
};

exports.showList = function (providerArr, numToShow){ 
  var smallerList = numToShow === 'all' ? providerArr.join(', ') : providerArr.slice(0, numToShow).join(', ');
  var ellipse =  (providerArr.length > 4 && numToShow !== 'all') ? '...' : '';
    return smallerList + ellipse;
};

 function getProvidersForLocation(providers, displayName) {
  var providersByLocation = providers.filter(function(provider) {
    if (amountOfResourcesInLocation(provider, displayName).length > 0 && provider.registrationState === 'Registered') {
      return true;
    }
  }).map(function(provider) {
      return provider.namespace; 
  });
  return providersByLocation;
}

function amountOfResourcesInLocation(provider, displayName) {
  return provider.resourceTypes.filter(function(resourceType) { 
      return ifLocationMatches(resourceType, displayName);
    });
}

function ifLocationMatches(resourceType, displayName) {
  return resourceType.locations.filter(function(locationName) { 
        return locationName.toLowerCase() === displayName.toLowerCase(); 
      });
}