//command arguments:
// if no arguments, output all across asm and arm
// Or use 'arm' to output all arm ones
// Or use 'arm vm,network' to output arm\network, arm\vm ones

var cmds = [];
var cmdsets;
var scope = process.argv[2] || 'all';
var filter = process.argv[3] || '';
var result = {};

cmdsets = filter ? filter.split(',') : null;

if (scope === 'arm' || scope === 'all') {
  cmds = cmds.concat(gen('../lib/plugins.arm.json', cmdsets));
} else if (scope === 'asm' || scope === 'all') {
  cmds = cmds.concat(gen('../lib/plugins.asm.json', cmdsets));
} else {
  console.log('Use scope of "arm", "asm" or "all"');
}

console.log(cmds.join('\n'));

function gen(file, cmdsets) {
  result = {};
  var metedata = require(file);
  parse(metedata, '');
  var cmds = Object.keys(result).sort();
  if (cmdsets) {
    cmds = cmds.filter(function (e) {
      var t1 = e.trim().split(' ')[0];
      return cmdsets.indexOf(t1) >= 0;
    });
  }
  return cmds;
}

function parse(cmdObj, category) {
  if (cmdObj !== null && typeof cmdObj === 'object') {
    Object.keys(cmdObj).forEach(function (key) {
      if (key === 'commands') {
        cmdObj[key].forEach(function (element) {
          var fullname = category + ' ' + element.name;
          result[fullname] = element.filePath;
        });
      } else if (key === 'categories') {
        Object.keys(cmdObj[key]).forEach(function (subCategory) {
          parse(cmdObj[key][subCategory], category + ' ' + subCategory);
        });
      }
    });
  }
}