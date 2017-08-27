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

var os = require('os');
var fs = require('fs');
var crypto = require('crypto');
var _appInsights = require('applicationinsights');
var profile = require('./profile');
var utilsCore = require('./utilsCore');
var Constants = require('./constants');
var userAgentCore = require('./userAgentCore');

var _event;
var _isEnabled = false;
var _currentCommand;
var _rawCommand;
var _subscription;

var _Data = (function () {
  var Data = function () {
  };
  return Data;
})();

var _PageViewData = (function () {
  var PageViewData = function () {
    this.ver = 2;
    this.properties = {};
    this.measurements = {};
  };
  return PageViewData;
})();

var _AzureCliQosEvent = function () {
  return {
    startTime: Date.now(),
    duration: 0,
    isSuccess: true,
    commandName: '',
    command: '',
    mode: '', // arm or asm
    nodeVersion: '',
    userId: '',
    userType: '',
    installationType: 'NONE', //NONE, INSTALLER or NPM
    osType: os && os.type(),
    osVersion: os && os.release()
  };
};

var _getInstallationType = function (command) {
  var type = 'NONE';
  var osType = os.type();
  if (osType === 'Windows_NT') {
    if (command) {
      type = command.indexOf('Microsoft SDKs\\Azure') > -1 ? 'INSTALLER' : 'NPM';
    }
  } else if (osType === 'Darwin') {
    try {
      // If azure-cli is installed using npm, '/usr/local/bin/azure' is a symbolic link to node_modules
      // If installed by installer, '/usr/local/bin/azure' is an executable file instead.
      var lstat = fs.lstatSync('/usr/local/bin/azure');
      type = lstat.isSymbolicLink() ? 'NPM' : 'INSTALLER';
    } catch (e) {
      // Not able to figure out installation type.
    }
  } else {
    // On Linux, no installer provided currently.
    type = 'NPM';
  }
  return type;
};

var _getCurrentSubscription = function () {
  var thumbprint = function (cert) {
    if (!cert) {
      // default value
      return 'none';
    }
    return crypto.createHash('sha1')
      .update(new Buffer(cert, 'base64').toString('binary'))
      .digest('hex');
  };

  var subscription = {
    id: 'none',
    user: {
      id: 'none',
      type: 'none'
    }
  };

  var sub;
  try {
    sub = profile.current.getSubscription();
  } catch (e) {

  }

  if (sub) {
    subscription.id = sub.id;
    if (sub.user) {
      subscription.user.id = crypto.createHash('sha256').update(sub.user.name).digest('hex');
      subscription.user.type = sub.user.type;
    } else if (sub.managementCertificate) {
      subscription.user.id = thumbprint(sub.managementCertificate.cert);
      subscription.user.type = 'managementCertificate';
    }
  }
  return subscription;
};

var _filterCommand = function (commandName, rawCommand) {
  var outCmd = '';
  if (rawCommand && commandName) {
    outCmd = commandName;
    // Starting from 3rd argv is the command
    var filterStartIndex = 2 + outCmd.split(/\s+/).length;
    for (var i = filterStartIndex; i < rawCommand.length; i++) {
      var token = rawCommand[i];
      if (!utilsCore.stringStartsWith(token, '-')) {
        token = (token.length > 40) ? '***' : token.replace(/./g, '*');
      }
      outCmd += ' ' + token;
    }
  }
  return outCmd;
};

var _stop = function (qosEvent) {
  if (qosEvent) {
    qosEvent.duration = Date.now() - qosEvent.startTime;
  }
};

// helper for Application Insights
var _msToTimeSpan = function (totalms) {
  if (isNaN(totalms) || totalms < 0) {
    totalms = 0;
  }
  var ms = '' + totalms % 1000;
  var sec = '' + Math.floor(totalms / 1000) % 60;
  var min = '' + Math.floor(totalms / (1000 * 60)) % 60;
  var hour = '' + Math.floor(totalms / (1000 * 60 * 60)) % 24;
  ms = ms.length === 1 ? '00' + ms : ms.length === 2 ? '0' + ms : ms;
  sec = sec.length < 2 ? '0' + sec : sec;
  min = min.length < 2 ? '0' + min : min;
  hour = hour.length < 2 ? '0' + hour : hour;
  return hour + ':' + min + ':' + sec + '.' + ms;
};

var _trackPageView = function (data) {
  var pageView = new _PageViewData();
  pageView.name = data.commandName;
  if (!isNaN(data.duration)) {
    pageView.duration = _msToTimeSpan(data.duration);
  }
  pageView.properties = data;
  var _data = new _Data();
  _data.baseType = 'PageViewData';
  _data.baseData = pageView;
  _appInsights.client.track(_data);
};

var _flush = function (callback) {
  if (_isEnabled) {
    _appInsights.client.sendPendingData(callback);
  }
};

var _stripUsername = function (str) {
  if (str) {
    var re = /(.*users[\\|\/])(.*?)([\\|\/].*)/gi;
    return str.replace(re, '$1***$3');
  } else {
    return str;
  }
};

/*
* initialize app insights telemetry only if telemetry is
* enabled by the end user. But do populate common info which is
* required to construct user agent string for request headers.
*/
exports.init = function (isEnabled) {
  _isEnabled = isEnabled;
  _subscription = _getCurrentSubscription();

  if (_isEnabled) {
    _appInsights.setup(Constants.TELEMETRY_INSTRUMENTATION_KEY)
      .setAutoCollectRequests(false)
      .setAutoCollectPerformance(false)
      .setAutoCollectExceptions(false);

    // Overwrite appinsight default values.
    var context = _appInsights.client.context;
    context.tags[context.keys.userId] = _subscription.user.id;

    _appInsights.start();
  }
};

exports.currentCommand = function (command) {
  if (command && typeof command === 'object') {
    _currentCommand = command;

    if (_event) {
      _event.commandName = command.fullName();
      _event.command = _filterCommand(_event.commandName, _rawCommand);

      // update user agent info about the current command
      userAgentCore.setCommandInfo(_event.commandName, _filterCommand(' ', _rawCommand));
    }
  }
};

/*
* populate command info and system diagnostics. This data is common
* to app insights telemetry and user agent string that goes into the request headers.
*/
exports.start = function (command) {
  if (command) {
    _rawCommand = command;
  }

  _event = _AzureCliQosEvent();
  _event.installationType = _getInstallationType(command);
  _event.nodeVersion = process.version;
  _event['Azure.Subscription.Id'] = _subscription.id;
  _event.userId = _subscription.user.id;
  _event.userType = _subscription.user.type;

  var macAddressHash = _getMacAddressHash();
  if (macAddressHash) {
    _event.macAddressHash = macAddressHash;
  }

  // set user agent information.
  userAgentCore.setUserAgentData(constructUserAgentData());
};

exports.setAppInsights = function (appInsights) {
  _appInsights = appInsights;
};

exports.setMode = function (mode) {
  if (_event) {
    _event.mode = mode;
  }
};

exports.onError = function (err, callback) {
  if (_isEnabled && _event) {
    _stop(_event);
    _event.isSuccess = false;
    _event.stacktrace = _stripUsername(err.stack);
    _event.errorCategory = err.statusCode ? 'HTTP_Error_' + err.statusCode : 'CLI_Error';
    _appInsights.client.trackEvent('CmdletError', _event);
    _flush(callback);
  } else {
    callback();
  }
};

/*
* report telemetry only if it is enabled.
*/
exports.onFinish = function (callback) {
  if (_isEnabled && _event) {
    _stop(_event);
    _trackPageView(_event);
    _flush(callback);
  } else {
    callback();
  }
};

/*
* construct user agent info for request header.
*/
function constructUserAgentData() {
  if (_event) {
    return {
      osType: _event.osType,
      osVersion: _event.osVersion,
      nodeVersion: _event.nodeVersion,
      installationType: _event.installationType,
      userType: _event.userType,
      macAddressHash: _event.macAddressHash ? _event.macAddressHash : ''
    };
  }
}


var _getMacAddressHash = function () {
  var networkInterfaces, macAddressHash, macAddress;

  try {
    networkInterfaces = os.networkInterfaces();
    var interfaceKeys = Object.keys(networkInterfaces);

    var nicPattern;
    if (os.platform().startsWith('win')) {
      nicPattern = /ethernet/i;
    } else {
      nicPattern = /en[0-9]/i;
    }

    var index = interfaceKeys.findIndex(function (intf) {
      return nicPattern.test(intf);
    });

    if (index < 0) {
      // didnt find a group named `ethernet` or `en[0-1]`. 
      // iterate through all interfaces and get the first one that has a valid mac.
      macAddress = _getMacOfFirstInterface(networkInterfaces);
    } else {
      // if we found a `ethernet` or `en[0-1]` group, then just get the `mac` from the group.
      // This cannot be invalid as this would have been set by the NIC's manufacturer.
      var interfaceGroup = networkInterfaces[interfaceKeys[index]];
      macAddress = interfaceGroup[0].mac;
    }
  } catch (err) {
    //On win10 bash currently os.networkInterfaces() throws an error. Thus we catch the error and 
    // do nothing about it. For such scenarios we do not send the hashed mac address.
  }

  if (macAddress) {
    macAddressHash = crypto.createHash('sha256').update(macAddress).digest('hex');
  }

  return macAddressHash;
};

var _getMacOfFirstInterface = function (interfaces) {
  var nic;
  var validMacPattern = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
  var skipPattern = /^(0{2}[:-]){5}(0{2})$/;
  for (var key in interfaces) {
    if (interfaces.hasOwnProperty(key)) {
      nic = interfaces[key];

      var index = nic.findIndex(function (n) {
        return validMacPattern.test(n.mac) && !skipPattern.test(n.mac);
      });

      if (index >= 0) {
        return nic[index].mac;
      }
    }
  }
};