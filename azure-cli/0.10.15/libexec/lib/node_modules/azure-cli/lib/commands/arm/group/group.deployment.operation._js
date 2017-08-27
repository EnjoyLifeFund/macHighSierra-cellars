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
  var log = cli.output;

  var group = cli.category('group');
  var deployment = group.category('deployment')
      .description($('Commands to manage your deployment in a resource group'));
  var operation = deployment.category('operation')
      .description($('Commands to list deployment operations in a resource group'));

  operation.command('list [resource-group] [name]')
    .description($('Lists operations in a deployment'))
    .option('-g --resource-group <resource-group>', $('the name of the resource group'))
    .option('-n --name <name>', $('the name of the deployment'))
    .option('--subscription <subscription>', $('the subscription identifier'))
    .execute(function (resourceGroup, name, options, _) {
      if (!resourceGroup) {
        return cli.missingArgument('resourceGroup');
      }
      if (!name) {
        return cli.missingArgument('name');
      }

      var subscription = profile.current.getSubscription(options.subscription);
      var client = utils.createResourceClient(subscription);
      var operationsList = [];

      cli.interaction.withProgress($('Getting deployoment operations'),
        function (log, _) {
          var operationsResult = client.deploymentOperations.list(resourceGroup, name, _);
          operationsList.push.apply(operationsList, operationsResult);

          while (operationsResult.nextLink) {
            log.info($('Getting more operations'));
            operationsResult = client.deploymentOperations.listNext(operationsResult.nextLink, _);
            operationsList.push.apply(operationsList, operationsResult);
          }
        },
      _);

      if (log.format().json) {
        log.json(operationsList);
      } else {
        displayOperations(operationsList, log);
      }
    });  
};

function displayOperations(operations, log) {
  for (var index = 0; index < operations.length; ++index) {
    log.data($('Id:                  '), operations[index]['id']);
    log.data($('OperationId:         '), operations[index]['operationId']);

    var operationProperties = operations[index]['properties'];
    log.data($('Provisioning State:  '), operationProperties['provisioningState']);
    log.data($('Timestamp:           '), operationProperties['timestamp']);
    log.data($('Status Code:         '), operationProperties['statusCode']);
    log.data($('Status Message:      '), operationProperties['statusMessage']);

    var operationTargetResource = operationProperties['targetResource'];
    log.data($('Target Resource Id:  '), operationTargetResource['id']);
    log.data($('Target Resource Name:'), operationTargetResource['resourceName']);
    log.data($('Target Resource Type:'), operationTargetResource['resourceType']);
    log.data($('---------------------'));
    log.data($(''));
  }
}
