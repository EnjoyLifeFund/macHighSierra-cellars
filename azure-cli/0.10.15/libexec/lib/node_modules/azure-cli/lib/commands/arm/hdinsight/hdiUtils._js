//
// Copyright (c) Microsoft and contributors.  All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//
// See the License for the specific language governing permissions and
// limitations under the License.
//

exports.getKeyValueStoreAsJson = function(dictionary) {
  var objecToSerialize = [];
  if (dictionary instanceof Array) {
    for (var i = 0; i < dictionary.length; i++) {
      if (dictionary[i] instanceof Array) {
        objecToSerialize.push(this.getKeyValueStoreAsJson(dictionary[i]));
      } else if (dictionary[i].value instanceof Array) {
        var keyString = dictionary[i].key;
        var objWithArrayValue = {};
        objWithArrayValue[keyString] = this.getKeyValueStoreAsJson(dictionary[i].value);
        objecToSerialize.push(objWithArrayValue);
      } else {
        var key = dictionary[i].key;
        var value = dictionary[i].value;
        var obj = {};
        obj[key] = value;
        objecToSerialize.push(obj);
      }
    }
  }
  return objecToSerialize;
};

exports.pushToConfig = function(key, value, configuration) {
  var obj = {};
  obj[key] = value;
  configuration.push(obj);
};