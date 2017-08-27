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
var $ = utils.getLocaleString;

exports.init = function (cli) {
  var containerServiceScale = cli.category('acs')
  .description($('Commands to manage your container service.  '));
  containerServiceScale.command('scale [resource-group] [name] [new-agent-count]')
  .description($('The operation to scale a container service.'))
  .usage('[options] <resource-group> <name> <new-agent-count>')
  .option('-g, --resource-group <resource-group>', $('resource-group'))
  .option('-n, --name <name>', $('name'))
  .option('-o, --new-agent-count <new-agent-count>', $('New agent count'))
  .option('-s, --subscription <subscription>', $('The subscription identifier'))
  .execute(function(resourceGroup, name, newAgentCount, options, _) {
    if (!resourceGroup) {
      resourceGroup = cli.interaction.promptIfNotGiven($('resource-group : '), resourceGroup, _);
    }

    cli.output.verbose('resource-group = ' + resourceGroup);
    if (!name) {
      name = cli.interaction.promptIfNotGiven($('name : '), name, _);
    }

    cli.output.verbose('name = ' + name);
	if (!newAgentCount) {
      newAgentCount = cli.interaction.promptIfNotGiven($('new-agent-count : '), newAgentCount, _);
    }

    cli.output.verbose('new-agent-count = ' + newAgentCount);
    var subscription = profile.current.getSubscription(options.subscription);
    var computeManagementClient = utils.createComputeManagementClient(subscription);
    var acs = computeManagementClient.containerServices.get(resourceGroup, name, _);
    if (newAgentCount == acs.agentPoolProfiles[0].count){
      throw new Error('New agent count should be greater than existing count.');
    }
    acs.agentPoolProfiles[0].count = parseInt(newAgentCount);
    var result = computeManagementClient.containerServices.createOrUpdate(resourceGroup, name, acs , _);
    if (result) {
      cli.output.json(result);
    }
  });
};