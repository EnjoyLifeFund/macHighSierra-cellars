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

exports.iotHubDefaults = {
  d2cPartitionCount: 2,
  d2cRetentionTimeInDays: 1,
  c2dMaxDeliveryCount: 10,
  c2dTtl: '01:00:00',
  feedbackLockDuration: '00:01:00',
  feedbackTtl: '01:00:00',
  feedbackMaxDeliveryCount: 1,
  fileUploadSASUriTTL: '01:00:00',
  fileUploadNotificationTTL: '01:00:00',
  fileUploadNotificationMaxDeliveryCount: 10,
  defaultLockDuration: '00:01:00'
};

exports.parseTagsArgument = function(argName, argValue) {
  var result = {};
  argValue.split(';').forEach(function(tagValue) {
    var tv = tagValue.split('=');
    if (tv.length === 2) {
      result[tv[0]] = tv[1];
    } else {
      result[tv[0]] = '';
    }
  });
  return result;
};
