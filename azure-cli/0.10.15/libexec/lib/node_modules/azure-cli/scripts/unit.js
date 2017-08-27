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
var fs = require('fs');
var args = (process.ARGV || process.argv);

var reporter = '../../../test/framework/xcli-test-reporter';
var xunitOption = Array.prototype.indexOf.call(args, '-xunit');
if (xunitOption !== -1) {
  reporter = 'xunit';
  args.splice(xunitOption, 1);
}

var testList = args.pop();

if (!fs.existsSync) {
  fs.existsSync = require('path').existsSync;
}

var root = fs.existsSync('./package.json');

function buildFileList(testFiles, testList, root) {
  var file = root ? './test/' + testList : testList;
  var fileContent = fs.readFileSync(file).toString();
  var files = fileContent.split('\n');
  var includeMark = 'include:';
  for (var i = 0; i < files.length ; i++) {
    if (files[i].indexOf(includeMark) === 0) {
      var fileToInclude = files[i].substring(includeMark.length).replace('\r', '');
      buildFileList(testFiles, fileToInclude, root);
    } else {
      testFiles.push(files[i]);
    }
  }
}

var allFiles = [];
buildFileList(allFiles, testList, root);

args.push('-u');
args.push('tdd');

// TODO: remove this timeout once tests are faster
args.push('-t');
args.push('1600000');

allFiles.forEach(function (file) {
  if (file.length > 0 && file.trim()[0] !== '#') {
    // trim trailing \r if it exists
    file = file.replace('\r', '');
    var temp = root ? 'test/' + file : file;
    args.push(temp);
  }
});

args.push('-R');
args.push(reporter);
//for clean shutdown of the event loop, so silly log gets drained to disk.
args.push('--no-exit');

console.log('Start (' + testList + '):' + new Date().toLocaleTimeString());

//console.log(JSON.stringify(args, null, 2));

process.on('exit', function (err) {
  console.log('End:' + new Date().toLocaleTimeString());
})

require('../node_modules/mocha/bin/mocha');
