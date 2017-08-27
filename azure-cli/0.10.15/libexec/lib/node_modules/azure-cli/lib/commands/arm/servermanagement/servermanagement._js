'use strict';

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

/// <reference path="../../../../typings/main.d.ts" />

var util = require('util');
var profile = require('../../../util/profile');
var utils = require('../../../util/utils');
var help = require('./help');

var $ = utils.getLocaleString;
var SMC = function SMC(options) {
  return utils.createServerManagementClient(profile.current.getSubscription(options.subscription));
};

exports.init = function(cli) {
  var log = cli.output;

  var sm = cli.category('servermanagement')
    .description($('Commands to manage Azure Server Managment resources'));

  var gateway = sm.category('gateway')
    .description($('Commands to manage Azure Server Management Tools Gateway instances'));
  var node = sm.category('node')
    .description($('Commands to manage Azure Server Management Tools Node instances'));
  var session = sm.category('session')
    .description($('Commands to manage Azure Server Management Tools Sessions'));
  var powershell = sm.category('powershell')
    .description($('Commands to invoke powershelll commands on a Azure Server Management Tools node'));

  gateway.command('create [resource-group] [location] [name]')
    .description($('Create a server management gateway'))
    .usage('[options] <resource-group> <location> <name>')
    .option(help.resourceGroup.option, $(help.resourceGroup.description))
    .option(help.location.option, $(help.location.description))
    .option(help.gatewayName.option, $(help.gatewayName.description))
    .option(help.autoUpgrade.option, $(help.autoUpgrade.description))
    .option(help.subscription.option, $(help.subscription.description))
    .option(help.tags.option, $(help.tags.create))
    .execute(function(resourceGroup, location, gatewayName, options, _) {
      // verify required parameters.
      if (!resourceGroup) {
        return cli.missingArgument('resource-group');
      }
      if (!location) {
        return cli.missingArgument('location');
      }
      if (!gatewayName) {
        return cli.missingArgument('name');
      }

      // options to call.
      options = options || {};
      options.location = location;
      var result;
      var progress = cli.interaction.progress(util.format($('Creating server management gateway %s'), gatewayName));
      try {
        result = SMC(options)
          .gateway.create(resourceGroup, gatewayName, options, _);
      } finally {
        progress.end();
      }

      cli.interaction.formatOutput(result, function(data) {
        if (options.json) {
          log.json(data);
        } else {
          log.table([data], formatGateway);
        }
      });
    });

  gateway.command('list [resource-group]')
    .description($('List registered gateways'))
    .option(help.resourceGroup.option, $(help.resourceGroup.description))
    .option(help.subscription.option, $(help.subscription.description))
    .execute(function(resourceGroup, options, _) {
      var progress = cli.interaction.progress($('Listing registered gateways'));
      var result;
      try {
        if (resourceGroup) {
          result = SMC(options)
            .gateway.listForResourceGroup(resourceGroup, options, _);
        } else {
          result = SMC(options)
            .gateway.list(options, _);
        }
      } finally {
        progress.end();
      }

      cli.interaction.formatOutput(result, function(data) {
        if (options.json) {
          log.json(data);
        } else {
          log.table(data, formatGateway);
        }
      });
    });

  gateway.command('show <resource-group> <name>')
    .description($('Show detailed gateway information'))
    .usage('[options] <resource-group> <name>')
    .option(help.resourceGroup.option, $(help.resourceGroup.description))
    .option(help.gatewayName.option, $(help.gatewayName.description))
    .option(help.subscription.option, $(help.subscription.description))
    .execute(function(resourceGroup, gatewayName, options, _) {
      var progress = cli.interaction.progress($('Showing gateway details'));
      var result;
      try {
        options.expand = 'status';
        result = SMC(options)
          .gateway.get(resourceGroup, gatewayName, options, _);
      } finally {
        progress.end();
      }

      cli.interaction.formatOutput(result, function(data) {
        if (options.json) {
          log.json(data);
        } else {
          log.table([data], formatGatewayDetailed);
        }
      });
    });

  gateway.command('delete <resource-group> <name>')
    .description($('Delete a gateway'))
    .option(help.resourceGroup.option, $(help.resourceGroup.description))
    .option(help.gatewayName.option, $(help.gatewayName.description))
    .option(help.subscription.option, $(help.subscription.description))
    .execute(function(resourceGroup, gatewayName, options, _) {
      var progress = cli.interaction.progress(util.format($('Deleting gateway %s'), gatewayName));

      var result;
      try {
        result = SMC(options)
          .gateway.deleteMethod(resourceGroup, gatewayName, options, _);
      } finally {
        progress.end();
      }
    });

  node.command('create [resource-group] [location] [gateway-name] [name]')
    .description($('Create a server management node'))
    .usage('[options] <resource-group> <location> <gateway-name> <name>')
    .option(help.resourceGroup.option, $(help.resourceGroup.description))
    .option(help.location.option, $(help.location.description))
    .option(help.gatewayName.option2, $(help.gatewayName.description))
    .option(help.nodeName.option, $(help.nodeName.description))
    .option(help.userName.option, $(help.userName.description))
    .option(help.password.option, $(help.password.description))
    .option(help.connection.option, $(help.connection.description))
    .option(help.tags.option, $(help.tags.create))
    .option(help.subscription.option, $(help.subscription.description))
    .execute(function(resourceGroup, location, gatewayName, nodeName, options, _) {
      // verify required parameters.
      options = options || {};
      if (!resourceGroup) {
        return cli.missingArgument('resource-group');
      }
      if (!location) {
        return cli.missingArgument('location');
      }
      if (!gatewayName) {
        return cli.missingArgument('gateway-name');
      }
      if (!nodeName) {
        return cli.missingArgument('name');
      }
      if (!options.userName) {
        return cli.missingArgument('user-name');
      }
      if (!options.connectionName) {
        options.connectionName = nodeName;
      }

      options.password = cli.interaction.promptPasswordIfNotGiven($(help.password.description), options.password, _);
      // options to call.
      options.location = location;

      var result;
      var progress = cli.interaction.progress(util.format($('Creating server management node %s'), nodeName));
      try {
        // go grab the gateway id for the specified gateway.
        var gw = SMC(options)
          .gateway.get(resourceGroup, gatewayName, _);
        options.gatewayId = gw.id;

        result = SMC(options)
          .node.create(resourceGroup, nodeName, options, _);
      } finally {
        progress.end();
      }

      cli.interaction.formatOutput(result, function(data) {
        if (options.json) {
          log.json(data);
        } else {
          log.table([data], formatNode);
        }
      });
    });

  node.command('list [resource-group]')
    .description($('List registered nodes'))
    .option(help.resourceGroup.option, $(help.resourceGroup.description))
    .option(help.subscription.option, $(help.subscription.description))
    .execute(function(resourceGroup, options, _) {
      var progress = cli.interaction.progress($('Listing registered nodes'));
      var result;
      try {
        if (resourceGroup) {
          result = SMC(options)
            .node.listForResourceGroup(resourceGroup, options, _);
        } else {
          result = SMC(options)
            .node.list(options, _);
        }
      } finally {
        progress.end();
      }

      cli.interaction.formatOutput(result, function(data) {
        if (options.json) {
          log.json(data);
        } else {
          log.table(data, formatNode);
        }
      });
    });

  node.command('show <resource-group> <name>')
    .description($('Show node information'))
    .usage('[options] <resource-group> <name>')
    .option(help.resourceGroup.option, $(help.resourceGroup.description))
    .option(help.nodeName.option, $(help.nodeName.description))
    .option(help.subscription.option, $(help.subscription.description))
    .execute(function(resourceGroup, nodeName, options, _) {
      var progress = cli.interaction.progress($('Showing node details'));
      var result;
      try {
        result = SMC(options)
          .node.get(resourceGroup, nodeName, options, _);
      } finally {
        progress.end();
      }

      cli.interaction.formatOutput(result, function(data) {
        if (options.json) {
          log.json(data);
        } else {
          log.table([data], formatNode);
        }
      });
    });

  node.command('delete <resource-group> <name>')
    .description($('Delete a node'))
    .option(help.resourceGroup.option, $(help.resourceGroup.description))
    .option(help.nodeName.option, $(help.nodeName.description))
    .option(help.subscription.option, $(help.subscription.description))
    .execute(function(resourceGroup, nodeName, options, _) {
      var progress = cli.interaction.progress(util.format($('Deleting node %s'), nodeName));

      var result;
      try {
        result = SMC(options)
          .node.deleteMethod(resourceGroup, nodeName, options, _);
      } finally {
        progress.end();
      }
    });

  session.command('create [resource-group] [node-name] [name]')
    .description($('Create a server management session'))
    .usage('[options] <resource-group> <node-name> <name>')
    .option(help.resourceGroup.option, $(help.resourceGroup.description))
    .option(help.nodeName.option2, $(help.nodeName.description))
    .option(help.sessionName.option, $(help.sessionName.description))
    .option(help.userName.option, $(help.userName.description))
    .option(help.password.option, $(help.password.description))
    .option(help.subscription.option, $(help.subscription.description))
    .execute(function(resourceGroup, nodeName, sessionName, options, _) {
      // verify required parameters.
      if (!resourceGroup) {
        return cli.missingArgument('resource-group');
      }
      if (!nodeName) {
        return cli.missingArgument('node-name');
      }
      if (!sessionName) {
        return cli.missingArgument('name');
      }
      if (!options.userName) {
        return cli.missingArgument('user-name');
      }

      options.password = cli.interaction.promptPasswordIfNotGiven($(help.password.description), options.password, _);

      // options to call.
      options = options || {};
      options.location = nodeName;
      var result;
      var progress = cli.interaction.progress(util.format($('Creating server management session %s'), sessionName));
      try {
        result = SMC(options)
          .session.create(resourceGroup, nodeName, sessionName, options, _);
      } finally {
        progress.end();
      }

      cli.interaction.formatOutput(result, function(data) {
        if (options.json) {
          log.json(data);
        } else {
          log.table([data], formatSession);
        }
      });
    });

  session.command('show <resource-group> <node-name> <name>')
    .description($('Show detailed session information'))
    .usage('[options] <resource-group> <node-name> <name>')
    .option(help.resourceGroup.option, $(help.resourceGroup.description))
    .option(help.nodeName.option2, $(help.nodeName.description))
    .option(help.sessionName.option, $(help.sessionName.description))
    .option(help.subscription.option, $(help.subscription.description))
    .execute(function(resourceGroup, nodeName, sessionName, options, _) {
      var progress = cli.interaction.progress($('Showing session details'));
      var result;
      try {
        options.expand = 'status';
        result = SMC(options)
          .session.get(resourceGroup, nodeName, sessionName, options, _);
      } finally {
        progress.end();
      }

      cli.interaction.formatOutput(result, function(data) {
        if (options.json) {
          log.json(data);
        } else {
          log.table([data], formatSession);
        }
      });
    });

  session.command('delete <resource-group> <node-name> <name>')
    .description($('Delete a session'))
    .option(help.resourceGroup.option, $(help.resourceGroup.description))
    .option(help.nodeName.option2, $(help.nodeName.description))
    .option(help.sessionName.option, $(help.sessionName.description))
    .option(help.subscription.option, $(help.subscription.description))
    .execute(function(resourceGroup, sessionName, options, _) {
      var progress = cli.interaction.progress(util.format($('Deleting session %s'), sessionName));

      var result;
      try {
        result = SMC(options)
          .session.deleteMethod(resourceGroup, sessionName, options, _);
      } finally {
        progress.end();
      }
    });

  powershell.command('create <resource-group> <node-name> <session-name>')
    .description($('Create a powershell session'))
    .option(help.resourceGroup.option, $(help.resourceGroup.description))
    .option(help.nodeName.option2, $(help.nodeName.description))
    .option(help.sessionName.option2, $(help.sessionName.description))
    .option(help.subscription.option, $(help.subscription.description))
    .execute(function(resourceGroup, nodeName, sessionName, options, _) {
      var progress = cli.interaction.progress($('Creating powershell session'));

      var result;
      try {
        result = SMC(options)
          .powerShell.createSession(resourceGroup, nodeName, sessionName, '00000000-0000-0000-0000-000000000000', _);
      } finally {
        progress.end();
      }

      cli.interaction.formatOutput(result, function(data) {
        if (options.json) {
          log.json(data);
        } else {
          log.table([data], formatPsSession);
        }
      });
    });

  powershell.command('invoke <resource-group> <node-name> <session-name> <powershell-sessionid>')
    .description($('Invoke a powershell script on a session'))
    .option(help.resourceGroup.option, $(help.resourceGroup.description))
    .option(help.nodeName.option2, $(help.nodeName.description))
    .option(help.sessionName.option2, $(help.sessionName.description))
    .option(help.powershellSessionId.option, $(help.powershellSessionId.description))
    .option(help.command.option, $(help.command.description))
    .option(help.subscription.option, $(help.subscription.description))
    .execute(function(resourceGroup, nodeName, sessionName, powershellSessionId, options, _) {
      var progress = cli.interaction.progress($('Invoking powershell script'));

      var result;
      try {
        result = SMC(options)
          .powerShell.invokeCommand(resourceGroup, nodeName, sessionName, powershellSessionId, options, _);
      } finally {
        progress.end();
      }

      cli.interaction.formatOutput(result, function(data) {
        if (options.json) {
          log.json(data);
        } else {
          log.data(data.results[0].value);
        }
      });
    });
};

function formatGateway(row, gateway) {
  var resourceGroup = gateway.id.match(/\/resourcegroups\/(.+?)\/(.*)/)[1];
  row.cell($('Gateway'), gateway.name);
  row.cell($('Resource Group'), resourceGroup);
  row.cell($('Location'), gateway.location);
  row.cell($('Auto Upgrade'), gateway.autoUpgrade);
}

function formatGatewayDetailed(row, gateway) {
  for (var each in gateway.instances) {
    row.cell($('Gateway'), gateway.name);
    row.cell($('Instance'), gateway.instances[each].name);
    row.cell($('Mem Avail (MB)'), gateway.instances[each].availableMemoryMByte);
    row.cell($('CPU (gateway)'), gateway.instances[each].gatewayCpuUtilizationPercent);
    row.cell($('CPU (total)'), gateway.instances[each].totalCpuUtilizationPercent);
    row.cell($('Version'), gateway.instances[each].gatewayVersion);
    row.cell($('CPUs'), gateway.instances[each].logicalProcessorCount);
    row.cell($('Working Set (MB)'), gateway.instances[each].gatewayWorkingSetMByte);
  }
}

function formatNode(row, node) {
  var resourceGroup = node.id.match(/\/resourcegroups\/(.+?)\/(.*)/)[1];
  var gatewayName = node.gatewayId.match(/\/gateways\/(.*)/)[1];
  row.cell($('Node'), node.name);
  row.cell($('Connection'), node.connectionName);
  row.cell($('Resource Group'), resourceGroup);
  row.cell($('Gateway'), gatewayName);
  row.cell($('Location'), node.location);
}

function formatSession(row, session) {
  row.cell($('Session'), session.name);
  row.cell($('User Name'), session.userName);
}

function formatPsSession(row, session) {
  row.cell($('SessionId'), session.sessionId);
}