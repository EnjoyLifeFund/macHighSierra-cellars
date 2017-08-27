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

module.exports = {
  tags: {
    option: '-t, --tags <tags>',
    create: 'the list of tags.' +
    '\n     Can be multiple. In the format of "name=value".' +
    '\n     Name is required and value is optional.' +
    '\n     For example, -t "tag1=value1;tag2"',
    set: 'the list of tags.' +
    '\n     Can be multiple. In the format of "name=value".' +
    '\n     Name is required and value is optional.' +
    '\n     Existing tag values will be replaced by the values specified.' +
    '\n     For example, -t "tag1=value1;tag2"'
  },

  location: {
    option: '-l, --location <location>',
    description: 'the location'
  },
  
  subscription: {
    option: '-s, --subscription <subscription>', 
    description: 'the subscription identifier'
  },
  
  resourceGroup : {
    option: '-g, --resource-group <resource-group>',
    description: 'the name of the resource group'
  },
  
  gatewayName : {
    option: '-n, --name <name>',
    option2: '-w, --gateway-name <name>',
    description: 'the name of the server management gateway'
  },
  
  nodeName : {
    option: '-n, --name <name>',
    option2: '-n, --node-name <name>',
    description: 'the name of the server management node'
  },
  
  sessionName : {
    option: '-n, --name <name>',
    option2: '-e, --session-name <name>',
    description: 'the name of the session on the node'
  },
  
  powershellSessionId : {
    option: '-p, --powershell-session-id <id>',
    description: 'the id of the powershell session on the node'
  },
  
  command : {
    option: '-c, --command <command>',
    description: 'the powershell command or script to invoke'
  },
  
  connection : {
    option: '-c, --connection-name <name>',
    description: 'the connection name of the server management node (host name)'
  },
  
  userName : {
    option: '-u, --user-name <name>',
    description: 'the account user name to use to connect to the node'
  },
  
  password : {
    option: '-p, --password <name>',
    description: 'the account password to use to connect to the node'
  },
  
  autoUpgrade: {
      option: '-a --auto-upgrade',
      description : 'set the gateway to automatically upgrade.'
  }
};
