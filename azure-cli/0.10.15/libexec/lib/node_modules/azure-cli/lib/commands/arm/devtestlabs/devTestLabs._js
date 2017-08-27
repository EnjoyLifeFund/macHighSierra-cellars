'use strict';

var profile = require('../../../util/profile');
var utils = require('../../../util/utils');
var dtlUtils = require('./devTestLabs.utils');

var $ = utils.getLocaleString;

exports.init = function (cli) {
  
  var labCommands = cli.category('lab')
    .description($('Commands to manage your DevTest Labs'));
  
  // vms-per-lab-policy
  var vmsPerLabPolicyCommands = labCommands.category('vms-per-lab-policy')
    .description($('Commands to manage total allowed virtual machines per lab policy'));
  
  vmsPerLabPolicyCommands.command('set')
    .description($('Set max allowed virtual machines per lab policy.'))
    .option('-g, --resource-group <resource-group>', $('the resource group name of the lab'))
    .option('-l, --lab-name <lab-name>', $('the lab name'))
    .option('-c, --vm-count <vm-count>', $('the total vms allowed in the lab'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (options, _) {
    
    var subscription = profile.current.getSubscription(options.subscription);
    var client = utils.createDevTestLabsClient(subscription);
    
    if (!options.labName) {
      return cli.missingArgument('lab-name');
    }
    if (!options.vmCount) {
      return cli.missingArgument('vm-count');
    }
    
    var policy = {
      status: dtlUtils.policyConstants.policyStatus.enabled,
      factName: dtlUtils.policyConstants.factNames.labVmCount,
      threshold: options.vmCount.toString(),
      evaluatorType: dtlUtils.policyConstants.evaluators.maxValuePolicy
    };
    
    var result = client.policyOperations.createOrUpdateResource(options.resourceGroup, options.labName, 
      dtlUtils.policyConstants.defaultPolicySetName, dtlUtils.policyConstants.policyNames.maxVmsAllowedPerLab, policy, _);

    if (result) {
      cli.output.json(result);
    }
  });
  
  vmsPerLabPolicyCommands.command('show')
    .description($('Get allowed virtual machines per lab policy.'))
    .option('-g, --resource-group <resource-group>', $('the resource group name of the lab'))
    .option('-l, --lab-name <lab-name>', $('the lab name'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (options, _) {
    
    var subscription = profile.current.getSubscription(options.subscription);
    var client = utils.createDevTestLabsClient(subscription);
    
    if (!options.labName) {
      return cli.missingArgument('lab-name');
    }
    
    var result = client.policyOperations.getResource(options.resourceGroup, options.labName, 
      dtlUtils.policyConstants.defaultPolicySetName, dtlUtils.policyConstants.policyNames.maxVmsAllowedPerLab, _);

    if (result) {
      cli.output.json(result);
    }
  });
  
  vmsPerLabPolicyCommands.command('delete')
    .description($('Delete allowed virtual machines per lab policy.'))
    .option('-g, --resource-group <resource-group>', $('the resource group name of the lab'))
    .option('-l, --lab-name <lab-name>', $('the lab name'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (options, _) {
    
    var subscription = profile.current.getSubscription(options.subscription);
    var client = utils.createDevTestLabsClient(subscription);
    
    if (!options.labName) {
      return cli.missingArgument('lab-name');
    }
    
    var result = client.policyOperations.deleteResource(options.resourceGroup, options.labName, 
      dtlUtils.policyConstants.defaultPolicySetName, dtlUtils.policyConstants.policyNames.maxVmsAllowedPerLab, _);

    if (result) {
      cli.output.json(result);
    }
  });

  var vmsPerUserPolicyCommands = labCommands.category('vms-per-user-policy')
    .description($('Commands to manage max allowed virtual machines per user policy'));
  
  vmsPerUserPolicyCommands.command('set')
    .description($('Set allowed virtual machines per user policy.'))
    .option('-g, --resource-group <resource-group>', $('the resource group name of the lab'))
    .option('-l, --lab-name <lab-name>', $('the lab name'))
    .option('-c, --vm-count <vm-count>', $('the total vms allowed in the lab'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (options, _) {
    
    var subscription = profile.current.getSubscription(options.subscription);
    var client = utils.createDevTestLabsClient(subscription);
    
    if (!options.labName) {
      return cli.missingArgument('lab-name');
    }
    if (!options.vmCount) {
      return cli.missingArgument('vm-count');
    }
    
    var policy = {
      status: dtlUtils.policyConstants.policyStatus.enabled,
      factName: dtlUtils.policyConstants.factNames.labVmCount,
      threshold: options.vmCount.toString(),
      evaluatorType: dtlUtils.policyConstants.evaluators.maxValuePolicy
    };
    
    var result = client.policyOperations.createOrUpdateResource(options.resourceGroup, options.labName, 
      dtlUtils.policyConstants.defaultPolicySetName, dtlUtils.policyConstants.policyNames.maxVmsAllowedPerUser, policy, _);

    if (result) {
      cli.output.json(result);
    }
  });
  
  vmsPerUserPolicyCommands.command('show')
    .description($('Get allowed virtual machines per user policy.'))
    .option('-g, --resource-group <resource-group>', $('the resource group name of the lab'))
    .option('-l, --lab-name <lab-name>', $('the lab name'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (options, _) {
    
    var subscription = profile.current.getSubscription(options.subscription);
    var client = utils.createDevTestLabsClient(subscription);
    
    if (!options.labName) {
      return cli.missingArgument('lab-name');
    }
    
    var result = client.policyOperations.getResource(options.resourceGroup, options.labName, 
      dtlUtils.policyConstants.defaultPolicySetName, dtlUtils.policyConstants.policyNames.maxVmsAllowedPerUser, _);

    if (result) {
      cli.output.json(result);
    }
  });
  
  vmsPerUserPolicyCommands.command('delete')
    .description($('Delete allowed virtual machines per user policy.'))
    .option('-g, --resource-group <resource-group>', $('the resource group name of the lab'))
    .option('-l, --lab-name <lab-name>', $('the lab name'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (options, _) {
    
    var subscription = profile.current.getSubscription(options.subscription);
    var client = utils.createDevTestLabsClient(subscription);
    
    if (!options.labName) {
      return cli.missingArgument('lab-name');
    }
    
    var result = client.policyOperations.deleteResource(options.resourceGroup, options.labName, 
      dtlUtils.policyConstants.defaultPolicySetName, dtlUtils.policyConstants.policyNames.maxVmsAllowedPerUser, _);

    if (result) {
      cli.output.json(result);
    }
  });

  //   allowed VM size policy 
  var vmSizePolicyCommands = labCommands.category('vm-size-policy')
    .description($('Commands to manage allowed virtual machine sizes policy'));
  
  vmSizePolicyCommands.command('set')
    .description($('Set allowed virtual machine sizes policy.'))
    .option('-g, --resource-group <resource-group>', $('the resource group name of the lab'))
    .option('-l, --lab-name <lab-name>', $('the lab name'))
    .option('-z, --vm-sizes <vm-sizes>', $('allowed virtual machine sizes, example value: Standard_A0,StandardA1'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (options, _) {
    
    var subscription = profile.current.getSubscription(options.subscription);
    var client = utils.createDevTestLabsClient(subscription);
    
    if (!options.labName) {
      return cli.missingArgument('lab-name');
    }
    if (!options.vmSizes) {
      return cli.missingArgument('vm-sizes');
    }
    
    var policy = {
      status: dtlUtils.policyConstants.policyStatus.enabled,
      factName: dtlUtils.policyConstants.factNames.labVmSize,
      threshold: JSON.stringify(options.vmSizes.split(',')),
      evaluatorType: dtlUtils.policyConstants.evaluators.allowedValuesPolicy
    };
    
    var result = client.policyOperations.createOrUpdateResource(options.resourceGroup, options.labName, 
      dtlUtils.policyConstants.defaultPolicySetName, dtlUtils.policyConstants.policyNames.allowedVmSizesInLab, policy, _);
    
    if (result) {
      cli.output.json(result);
    }
  });
  
  vmSizePolicyCommands.command('show')
    .description($('Get allowed virtual machine sizes policy.'))
    .option('-g, --resource-group <resource-group>', $('the resource group name of the lab'))
    .option('-l, --lab-name <lab-name>', $('the lab name'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (options, _) {
    
    var subscription = profile.current.getSubscription(options.subscription);
    var client = utils.createDevTestLabsClient(subscription);
    
    if (!options.labName) {
      return cli.missingArgument('lab-name');
    }
    
    var result = client.policyOperations.getResource(options.resourceGroup, options.labName, 
      dtlUtils.policyConstants.defaultPolicySetName, dtlUtils.policyConstants.policyNames.allowedVmSizesInLab, _);
    
    if (result) {
      cli.output.json(result);
    }
  });
  
  vmSizePolicyCommands.command('delete')
    .description($('Delete allowed virtual machine sizes policy.'))
    .option('-g, --resource-group <resource-group>', $('the resource group name of the lab'))
    .option('-l, --lab-name <lab-name>', $('the lab name'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (options, _) {
    
    var subscription = profile.current.getSubscription(options.subscription);
    var client = utils.createDevTestLabsClient(subscription);
    
    if (!options.labName) {
      return cli.missingArgument('lab-name');
    }
    
    var result = client.policyOperations.deleteResource(options.resourceGroup, options.labName, 
      dtlUtils.policyConstants.defaultPolicySetName, dtlUtils.policyConstants.policyNames.allowedVmSizesInLab, _);
    
    if (result) {
      cli.output.json(result);
    }
  });

  //   Auto-shutdown policy 
  var autoShutdownPolicyCommands = labCommands.category('auto-shutdown-policy')
    .description($('Commands to manage auto-shutdown policy'));
  
  autoShutdownPolicyCommands.command('set')
    .description($('Set virtual machine daily auto-shutdown policy.'))
    .option('-g, --resource-group <resource-group>', $('the resource group name of the lab'))
    .option('-l, --lab-name <lab-name>', $('the lab name'))
    .option('-t, --time <time>', $('the time (in UTC) to shutdown virtual machines everyday, example: 1905 means 7:05pm'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (options, _) {
    
    var subscription = profile.current.getSubscription(options.subscription);
    var client = utils.createDevTestLabsClient(subscription);
    
    if (!options.labName) {
      return cli.missingArgument('lab-name');
    }
    if (!options.time) {
      return cli.missingArgument('time');
    }
    
    var schedule = {
      status: dtlUtils.scheduleConstants.scheduleStatus.enabled,
      taskType: dtlUtils.scheduleConstants.taskTypes.labVmsShutdownTask,
      timeZoneId: 'UTC',
    };

    schedule.dailyRecurrence = {
      time : options.time
    };

    var result = client.scheduleOperations.createOrUpdateResource(options.resourceGroup, options.labName, 
      dtlUtils.scheduleConstants.scheduleNames.labVmsShutdown, schedule, _);
    
    if (result) {
      cli.output.json(result);
    }
  });
  
  autoShutdownPolicyCommands.command('show')
    .description($('Get virtual machine auto-shutdown policy.'))
    .option('-g, --resource-group <resource-group>', $('the resource group name of the lab'))
    .option('-l, --lab-name <lab-name>', $('the lab name'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (options, _) {
    
    var subscription = profile.current.getSubscription(options.subscription);
    var client = utils.createDevTestLabsClient(subscription);
    
    if (!options.labName) {
      return cli.missingArgument('lab-name');
    }
    
    var result = client.scheduleOperations.getResource(options.resourceGroup, options.labName, 
      dtlUtils.scheduleConstants.scheduleNames.labVmsShutdown, _);
    
    if (result) {
      cli.output.json(result);
    }
  });
  
  autoShutdownPolicyCommands.command('delete')
    .description($('Delete virtual machine auto-shutdown policy.'))
    .option('-g, --resource-group <resource-group>', $('the resource group name of the lab'))
    .option('-l, --lab-name <lab-name>', $('the lab name'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (options, _) {
    
    var subscription = profile.current.getSubscription(options.subscription);
    var client = utils.createDevTestLabsClient(subscription);
    
    if (!options.labName) {
      return cli.missingArgument('lab-name');
    }
    
    var result = client.scheduleOperations.deleteResource(options.resourceGroup, options.labName, 
      dtlUtils.scheduleConstants.scheduleNames.labVmsShutdown, _);
    
    if (result) {
      cli.output.json(result);
    }
  });
  
  //   Auto-start policy 
  var autoStartPolicyCommands = labCommands.category('auto-start-policy')
    .description($('Commands to manage auto-start policy'));
  
  autoStartPolicyCommands.command('set')
    .description($('Set virtual machine auto-start policy.'))
    .option('-g, --resource-group <resource-group>', $('the resource group name of the lab'))
    .option('-l, --lab-name <lab-name>', $('the lab name'))
    .option('-w, --weekly <weekly>.', $('selected weekdays to start machines. example: Monday,Friday means start machines on Monday and Friday.'))
    .option('-t, --time <time>', $('the time (in UTC) to start virtual machines on the selected weekday, example: 0815 means 8:15am'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (options, _) {
    
    var subscription = profile.current.getSubscription(options.subscription);
    var client = utils.createDevTestLabsClient(subscription);
    
    if (!options.labName) {
      return cli.missingArgument('lab-name');
    }
    if (!options.time) {
      return cli.missingArgument('time');
    }
    
    var schedule = {
      status: dtlUtils.scheduleConstants.scheduleStatus.enabled,
      taskType: dtlUtils.scheduleConstants.taskTypes.labVmsStartupTask,
      timeZoneId: 'UTC',
    };
    
    schedule.weeklyRecurrence = {
      weekdays : options.weekly.split(','),
      time : options.time
    };
    
    var result = client.scheduleOperations.createOrUpdateResource(options.resourceGroup, options.labName, 
      dtlUtils.scheduleConstants.scheduleNames.labVmsAutoStart, schedule, _);
    
    if (result) {
      cli.output.json(result);
    }
  });
  
  autoStartPolicyCommands.command('show')
    .description($('Get virtual machine auto-start policy.'))
    .option('-g, --resource-group <resource-group>', $('the resource group name of the lab'))
    .option('-l, --lab-name <lab-name>', $('the lab name'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (options, _) {
    
    var subscription = profile.current.getSubscription(options.subscription);
    var client = utils.createDevTestLabsClient(subscription);
    
    if (!options.labName) {
      return cli.missingArgument('lab-name');
    }
    
    var result = client.scheduleOperations.getResource(options.resourceGroup, options.labName, 
      dtlUtils.scheduleConstants.scheduleNames.labVmsAutoStart, _);
    
    if (result) {
      cli.output.json(result);
    }
  });
  
  autoStartPolicyCommands.command('delete')
    .description($('Delete virtual machine auto-start policy.'))
    .option('-g, --resource-group <resource-group>', $('the resource group name of the lab'))
    .option('-l, --lab-name <lab-name>', $('the lab name'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (options, _) {
    
    var subscription = profile.current.getSubscription(options.subscription);
    var client = utils.createDevTestLabsClient(subscription);
    
    if (!options.labName) {
      return cli.missingArgument('lab-name');
    }
    
    var result = client.scheduleOperations.deleteResource(options.resourceGroup, options.labName, 
      dtlUtils.scheduleConstants.scheduleNames.labVmsAutoStart, _);
    
    if (result) {
      cli.output.json(result);
    }
  });
};