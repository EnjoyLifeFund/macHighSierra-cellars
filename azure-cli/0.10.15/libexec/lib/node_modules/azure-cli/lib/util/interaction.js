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

var __ = require('underscore');
var tty = require('tty');
var fs = require('fs');
var util = require('util');
var tty = require('tty');

/*jshint camelcase:false*/
var child_process = require('child_process');
var nonInteractiveMode = process.env['AZURE_NON_INTERACTIVE_MODE'];

//this replaces 'command' package's 'prompt'/'confirm'/'choose', which don't 
//work well with winston's async logging.
var prompt_pkg = require('prompt');

var log = require('./logging');
var utils = require('./utils');

function Interactor(cli) {
  this.cli = cli;
  this.istty1 = tty.isatty(1);

  this._initProgressBars();
}

function checkNonInteractiveMode(requiredVar) {
  if (nonInteractiveMode) {
    throw new Error(util.format('Currently, the CLI is being run in \'Non Interactive Mode\'. ' + 
    'For the current command, \'%s\' is a required parameter (see the help). ' + 
    'Please provide it while executing the command. If you wish '+ 
    'to be in \'Interactive Mode\' so that the CLI can prompt you for ' + 
    'missing required parameters, please unset the environment variable '+ 
    '\'AZURE_NON_INTERACTIVE_MODE\'.', requiredVar));
  }
}

__.extend(Interactor.prototype, {
  
  _initProgressBars: function() {
    var self = this;
    self.progressChars = ['-', '\\', '|', '/'];
    self.progressIndex = 0;

    self.clearBuffer = new Buffer(79);
    self.clearBuffer.fill(' ');
    self.clearBuffer = self.clearBuffer.toString();
  },
  
  _drawAndUpdateProgress: function() {
    var self = this;
    if (nonInteractiveMode) {
      return;
    }

    fs.writeSync(1, '\r');
    process.stdout.write(self.progressChars[self.progressIndex].cyan);

    self.progressIndex++;
    if (self.progressIndex === self.progressChars.length) {
      self.progressIndex = 0;
    }
  },

  clearProgress: function () {
    var self = this;
    // do not output '+' if there is no progress
    if (self.currentProgress) {
      if (self.activeProgressTimer) {
        clearInterval(self.activeProgressTimer);
        self.activeProgressTimer = null;
      }
      if (!nonInteractiveMode) {
        fs.writeSync(1, '\r+\n');
      }
      self.currentProgress = undefined;
    }
  },

  //Not used
  //writeDuringProgress: function(level, message) {
  //  if (this.currentProgress) {
  //    fs.writeSync(1, '\r' + this.clearBuffer + '\r');
  //    log[level](message);
  //    this._drawAndUpdateProgress();
  //  }
  //},

  _pauseProgress: function () {
    if (nonInteractiveMode) {
      return;
    }

    if (this.currentProgress) {
      fs.writeSync(1, '\r' + this.clearBuffer + '\r');
    }
  },

  _restartProgress: function (label) {
    if (nonInteractiveMode) {
      return;
    }

    if (this.currentProgress) {
      this._drawAndUpdateProgress();
      if (label) {
        fs.writeSync(1, ' ' + label);
      }
    }
  },

  progress: function(label, log) {
    var self = this;
    if (!log && self.cli) {
      log = self.cli.output;
    }

    var verbose = log && (log.format().json || log.format().level === 'verbose' || log.format().level === 'silly');
    if (!self.istty1 || verbose)  {
      (verbose ? log.verbose : log.info)(label);
      return {
        write: function (logAction) {
          logAction();
        },
        end: function() {}
      };
    }

    // clear any previous progress
    self.clearProgress();

    // Clear the console
    fs.writeSync(1, '\r' + self.clearBuffer);

    // Draw initial progress
    self._drawAndUpdateProgress();

    // Draw label
    if (label) {
      fs.writeSync(1, ' ' + label);
    }

    self.activeProgressTimer = setInterval(function() {
      self._drawAndUpdateProgress();
    }, 200);

    self.currentProgress = {
      write: function (logAction, newLabel) {
        newLabel = newLabel || label;
        self._pauseProgress();
        logAction();
        self._restartProgress(newLabel);
      },
      end: function() {
        self.clearProgress();
      }
    };

    return self.currentProgress;
  },

  withProgress: function (label, action, callback) {
    var self = this;
    var p = this.progress(label);
    var logMsgs = [];
    var logger = {
      error: function (message) {
        logMsgs.push(function () { self.cli.output.error(message); });
      },
      info: function (message) {
        logMsgs.push(function () { self.cli.output.info(message); });
      },
      data: function (message) {
        logMsgs.push(function () { self.cli.output.data(message); });
      },
      warn: function (message) {
        logMsgs.push(function () { self.cli.output.warn(message); });
      }
    };

    action.call(p, logger, function () {
      p.end();
      logMsgs.forEach(function (lf) { lf(); });
      callback.apply(null, arguments);
    });
  },
  
  //behavior verified
  prompt: function (msg, callback) {
    checkNonInteractiveMode(msg);
    prompt_pkg.start();
    //surpress the default prompt message
    prompt_pkg.message = '';
    prompt_pkg.delimiter = '';
    prompt_pkg.get([{
        name: msg
      }], function (err, result) {
      if (err) return callback(err);
      if (utils.stringIsNullOrEmpty(result[msg])) {
        return callback(new Error(util.format('Please provide a non empty ' + 
          'value for \'%s\'. You provided - \'%s\'.', msg, result[msg])));
      }
      callback(null, result[msg]);
    });
  },
  
  //behavior verified
  confirm: function (msg, callback) {
    checkNonInteractiveMode(msg);
    prompt_pkg.start();
    //surpress the default prompt message
    prompt_pkg.message = '';
    prompt_pkg.delimiter = '';
    prompt_pkg.confirm(msg, callback);
  },
  
  //behavior verified
  promptPassword: function (msg, callback) {
    this.password(msg, '*', function (err, result) {
      callback(err, result);
    });
  },
  
  //behavior verified, "vm quick-create" uses it
  promptPasswordIfNotGiven: function (promptString, currentValue, callback) {
    if (__.isUndefined(currentValue)) {
      return this.promptPassword(promptString, callback);
    } else {
      return callback(null, currentValue);
    }
  },
  
  //behavior verified, 'promptPasswordOnceIfNotGiven' below uses it.
  promptPasswordOnce: function (msg, callback) {
    this.passwordOnce(msg, '*', function (err, result) {
      callback(err, result);
    });
  },
  
  //behavior verified, 'login' uses this
  promptPasswordOnceIfNotGiven: function (promptString, currentValue, callback) {
    if (__.isUndefined(currentValue)) {
      this.promptPasswordOnce(promptString, function (err, result) {
        return callback(err, result);
      });
    } else {
      return callback(null, currentValue);
    }
  },
  
  //behavior verified
  promptIfNotGiven: function (promptString, currentValue, callback) {
    if (__.isUndefined(currentValue)) {
      return this.prompt(promptString, callback);
    } else {
      return callback(null, currentValue);
    }
  },
  
  //behavior verified
  choose: function (values, callback) {
    var self = this;
    var displays = values.map(function (v, index) {
      return util.format('  %d) %s', index + 1, v);
    });
    var msg = displays.join('\n') + '\n:';
    function again() {
      self.prompt(msg, function (err, result) {
        if (err) return callback(err);
        var selection = parseInt(result, 10) - 1;
        if (!(values[selection])) {
          again();
        } else {
          callback(null, selection);
        }
      });
    }   
    again();
  },
  
  //behavior verified
  chooseIfNotGiven: function (promptString, progressString, currentValue, valueProvider, callback) {
    var self = this;
    checkNonInteractiveMode(promptString);
    if (__.isUndefined(currentValue)) {
      //comment out the progress usage, as it interferes winton's async logging
      //var progress = self.cli.interaction.progress(progressString);
      valueProvider(function (err, values) {
        if (err) return callback(err);
        //progress.end();
        self.cli.output.help(promptString);
        self.choose(values, function (err, selection) {
          return callback(err, values[selection]);
        });
      });
    } else {
      return callback(null, currentValue);
    }
  },

  formatOutput: function (outputData, humanOutputGenerator) {
    this.cli.output.json('silly', outputData);
    if(this.cli.output.format().json) {
      this.cli.output.json(outputData);
    } else {
      humanOutputGenerator(outputData);
    }
  },

  logEachData: function (title, data) {
    for (var property in data) {
      if (data.hasOwnProperty(property)) {
        if (data[property]) {
          this.cli.output.data(title + ' ' + property, data[property]);
        } else {
          this.cli.output.data(title + ' ' + property, '');
        }
      }
    }
  },

  launchBrowser: function (url, callback) {
    log.info('Launching browser to', url);
    if (process.env.OS !== undefined) {
      // escape & characters for start cmd
      var cmd = util.format('start %s', url).replace(/&/g, '^&');
      child_process.exec(cmd, callback);
    } else {
      child_process.spawn('open', [url]);
      callback();
    }
  },
  
  //the reason of reinventing the wheel, rather use the npm 'prompt' package
  //is to display the mask of '*' for each character. No idea why we prefered 
  //this behavior, but it is what it is.
  passwordOnce: function (currentStr, mask, callback) {
    checkNonInteractiveMode(currentStr);
    var buf = '';

    // default mask
    if ('function' === typeof mask) {
      callback = mask;
      mask = '';
    }

    if (!process.stdin.setRawMode) {
      process.stdin.setRawMode = tty.setRawMode;
    }

    process.stdin.resume();
    process.stdin.setRawMode(true);
    fs.writeSync(this.istty1 ? 1 : 2, currentStr);

    process.stdin.on('data', function (character) {
      // Exit on Ctrl+C keypress
      character = character.toString();
      if (character === '\003') {
        console.log('%s', buf);
        process.exit();
      }

      // Return password in the buffer on enter key press
      if (character === '\015') {
        process.stdin.pause();
        process.stdin.removeAllListeners('data');
        process.stdout.write('\n');
        process.stdin.setRawMode(false);

        return callback(null, buf);
      }

      // Backspace handling
      // Windows usually sends '\b' (^H) while Linux sends '\x7f'
      if (character === '\b' || character === '\x7f') {
        if (buf) {
          buf = buf.slice(0, -1);
          for (var j = 0; j < mask.length; ++j) {
            process.stdout.write('\b \b'); // space the last character out
          }
        }

        return;
      }

      character = character.split('\015')[0]; // only use the first line if many (for paste)
      for(var i = 0; i < character.length; ++i) {
        process.stdout.write(mask); // output several chars (for paste)
      }

      buf += character;
    });
  },

  // Allow cli.password to accept empty passwords
  password: function (str, mask, callback) {
    var self = this;
    checkNonInteractiveMode(str);
    // Prompt first time
    this.passwordOnce(str, mask, function (err, pass) {
      //till today, *err* is always null, so we skip the check.
      // Prompt for confirmation
      self.passwordOnce('Confirm password: ', mask, function (err2, pass2) {
        if (pass === pass2) {
          return callback(null, pass);
        } else {
          throw new Error('Passwords do not match.');
        }
      });
    });
  }
});

module.exports = Interactor;
