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

//Fetch the resource group from profile id using regex
exports.getResourceGroupFromProfileId = function (id) {
  var resourceGroupMatchRegexPattern = /(?:^|\/)resourcegroups\/(.*?)(?:\/providers|$)/g;	
  var match = resourceGroupMatchRegexPattern.exec(id);
  return match[1];
};

//Create a string of origin names by the list of origins from endpoint
exports.getOriginNamesString = function (originList) {
	var nameArray = [];
	for (var i = 0; i < originList.length; i++) {
		nameArray.push(originList[i].name);
	}
	return nameArray.join(',');
};

//Convert command input boolean string to boolean
exports.getBooleanFromString = function (booleanString) {
	if (booleanString.toLowerCase() === 'true') {
		return true;
	}
	return false;
};