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
var util = require('util');
var fs = require('fs');
var progress = require('progress');
var profile = require('../../../util/profile');
var utils = require('../../../util/utils');
var tagUtils = require('../tag/tagUtils');
var $ = utils.getLocaleString;
var dataLakeStoreUtils = require('./datalakestore.utils');
// required functions for reading data
var readStreamToBuffer = function (strm, callback) {
  var bufs = [];
  strm.on('data', function (d) {
    bufs.push(d);
  });
  strm.on('end', function () {
    callback(null, Buffer.concat(bufs));
  });
};

exports.init = function (cli) {
  var log = cli.output;
  var withProgress = cli.interaction.withProgress.bind(cli.interaction);
  
  // This includes the following three categories:
  // Account Management (category of 'Account')
  // FileSystem Management (category of 'FileSystem')
  // FileSystem Permissions Management (category of 'Permissions')
  var dataLakeCommands = cli.category('datalake')
    .description($('Commands to manage your Data Lake objects'));
  
  var dataLakeStoreCommands = dataLakeCommands.category('store')
    .description($('Commands to manage your Data Lake Storage objects'));
  
  var dataLakeStoreFileSystem = dataLakeStoreCommands.category('filesystem')
    .description($('Commands to manage your Data Lake Storage FileSystem'));
  
  var dataLakeStoreFileSystemExpiry = dataLakeStoreFileSystem.category('expiry')
    .description($('Commands to manage expiration of your Data Lake Storage FileSystem'));
  
  dataLakeStoreFileSystemExpiry.command('set [accountName] [path]')
    .description($('sets or removes the absolute expiration time of the specified path (files only).'))
    .usage('[options] <accountName> <path>')
    .option('-n --accountName <accountName>', $('the Data Lake Store account name to execute the action on'))
    .option('-p --path <path>', $('the full path to the folder to list (e.g. /someFolder or /someFolder/someNestedFolder)'))
    .option('-e --expiration <expiration time in ticks since epoch>', $('the expiration time to set for the file. Values <= 0 or >= 253402300800000 indicate the file will never expire.)'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (accountName, path, options, _) {
    if (!accountName) {
      return cli.missingArgument('accountName');
    }
    
    if (!path) {
      return cli.missingArgument('path');
    }
    
    var subscription = profile.current.getSubscription(options.subscription);
    var client = utils.createDataLakeStoreFileSystemManagementClient(subscription);
    var fileStatus = client.fileSystem.getFileStatus(accountName, path, _).fileStatus;
    if(fileStatus.type !== 'FILE') {
      throw new Error($('Expiration can only be set on files (not on folders). Please specify a file path with the --path parameter. Path given: ' + path));
    }
    
    if (options.expiration && parseInt(options.expiration) > 0 && parseInt(options.expiration) < 253402300800000) {
      // set the expiration to the absolute time represented by the number of ticks passed in.
      var params = {
        expireTime: parseInt(options.expiration)
      };
      
      client.fileSystem.setFileExpiry(accountName, path, 'Absolute', params, _);
    }
    else {
      // remove expiration from the file.
      client.fileSystem.setFileExpiry(accountName, path, 'NeverExpire', _);
    }
    
    fileStatus = client.fileSystem.getFileStatus(accountName, path, _).fileStatus;
    dataLakeStoreUtils.formatOutput(cli, log, options, fileStatus);
  });
  
  dataLakeStoreFileSystem.command('list [accountName] [path]')
    .description($('Lists the contents of the specified path (files and folders).'))
    .usage('[options] <accountName> <path>')
    .option('-n --accountName <accountName>', $('the Data Lake Store account name to execute the action on'))
    .option('-p --path <path>', $('the full path to the folder to list (e.g. /someFolder or /someFolder/someNestedFolder)'))
    .option('-l --listSize <listSize>', $('the optional number of entries to list. The default is all entries, which can potentially take some time for large directories.)'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (accountName, path, options, _) {
    if (!accountName) {
      return cli.missingArgument('accountName');
    }
    
    if (!path) {
      return cli.missingArgument('path');
    }
    
    var subscription = profile.current.getSubscription(options.subscription);
    var client = utils.createDataLakeStoreFileSystemManagementClient(subscription);
    var parameters = {};
    if (options.listSize) {
      parameters = {
        listSize: parseInt(options.listSize)
      };
    }
    
    var fileStatuses = client.fileSystem.listFileStatus(accountName, path, parameters, _).fileStatuses.fileStatus;
    dataLakeStoreUtils.formatOutputList(cli, log, options, fileStatuses);
  });
  
  dataLakeStoreFileSystem.command('show [accountName] [path]')
    .description($('Gets the specified Data Lake Store file or folder details'))
    .usage('[options] <accountName> <path>')
    .option('-n --accountName <accountName>', $('the Data Lake Store account name to execute the action on'))
    .option('-p --path <path>', $('the full path to the folder or file to get (e.g. /someFolder or /someFolder/someFile.txt)'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (accountName, path, options, _) {
    if (!accountName) {
      return cli.missingArgument('accountName');
    }
    
    if (!path) {
      return cli.missingArgument('path');
    }
    
    var subscription = profile.current.getSubscription(options.subscription);
    var client = utils.createDataLakeStoreFileSystemManagementClient(subscription);
    
    var fileStatus = client.fileSystem.getFileStatus(accountName, path, _).fileStatus;
    dataLakeStoreUtils.formatOutput(cli, log, options, fileStatus);
  });
  
  dataLakeStoreFileSystem.command('delete [accountName] [path]')
    .description($('deletes the specified Data Lake Store file or folder, with the option for recursive delete (if the folder has contents)'))
    .usage('[options] <accountName> <path>')
    .option('-n --accountName <accountName>', $('the Data Lake Store account name to execute the action on'))
    .option('-p --path <path>', $('the full path to the folder or file to get (e.g. /someFolder or /someFolder/someFile.txt)'))
    .option('-r --recurse', $('optionally indicates that this should be a recursive delete, which will delete a folder and all contents underneath it.'))
    .option('-q --quiet', $('optionally indicates the delete should be immediately performed with no confirmation or prompting. Use carefully.'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (accountName, path, options, _) {
    if (!accountName) {
      return cli.missingArgument('accountName');
    }
    
    if (!path) {
      return cli.missingArgument('path');
    }
    
    if (!options.quiet && !cli.interaction.confirm(util.format($('Delete the file or folder at path: %s? [y/n] '), path), _)) {
      return;
    }
    
    var subscription = profile.current.getSubscription(options.subscription);
    var client = utils.createDataLakeStoreFileSystemManagementClient(subscription);
    
    var params = {};
    if (!options.recurse) {
      params.recursive = false;
    }
    else {
      params.recursive = true;
    }
    
    client.fileSystem.deleteMethod(accountName, path, params, _);
    log.info($('Successfully deleted the item at path: ' + path));
  });
  
  dataLakeStoreFileSystem.command('create [accountName] [path]')
    .description($('Creates the specified folder or file, with the option to include content in file creation.'))
    .usage('[options] <accountName> <path>')
    .option('-n --accountName <accountName>', $('the Data Lake Store account name to execute the action on'))
    .option('-p --path <path>', $('the full path to the file to add content to (e.g. /someFolder/someFile.txt)'))
    .option('-v --value <value>', $('optional indicates the contents (as a string) to create the file with. NOTE: This parameter cannot be specified with --folder (-d)'))
    .option('-d --folder', $('optionally specify that the item being created is a folder, not a file. If this is not specified, a file will be created. NOTE: This parameter cannot be specified with --encoding (-e) or --value (-v)'))
    .option('-f --force', $('optionally indicates that the file or folder being created can overwrite the file or folder at path if it already exists (default is false). \'true\' must be passed in for the overwrite to work'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (accountName, path, options, _) {
    if (!accountName) {
      return cli.missingArgument('accountName');
    }
    
    if (!path) {
      return cli.missingArgument('path');
    }
    
    if ((options.value && options.folder)) {
      throw new Error($('--folder cannot be specified with --value'));
    }
    
    var subscription = profile.current.getSubscription(options.subscription);
    var clientOptions = {
      disableLogFilter: true
    };
    
    var client = utils.createDataLakeStoreFileSystemManagementClient(subscription, clientOptions);
    
    if (options.folder) {
      var result = client.fileSystem.mkdirs(accountName, path, _);
      if (result.operationResult !== true) {
        throw new Error($('Failed to create the desired directory!'));
      }
    }
    else {
      var parameters = {};
      
      if (options.force) {
        parameters.overwrite = true;
      }
      else {
        parameters.overwrite = false;
      }
      
      parameters.permission = null;
      withProgress(util.format($('Creating file %s'), path),
        function (log, _) {
        if (options.value) {
          // TODO: may need to convert what they pass in to a stream
          parameters.streamContents = new Buffer(options.value);
        }
        
        client.fileSystem.create(accountName, path, parameters, _);
      }, _);
    }
    
    log.info($('Successfully created the specified item at path:  ' + path));
  });
  
  dataLakeStoreFileSystem.command('import [accountName] [path] [destination]')
    .description($('Uploads the specified the specified file, to the target destination in an Azure Data Lake.'))
    .usage('[options] <accountName> <path> <destination>')
    .option('-n --accountName <accountName>', $('the Data Lake Store account name to execute the action on'))
    .option('-p --path <path>', $('the full local path to the file to import (e.g. /someFolder/someFile.txt or C:\somefolder\someFile.txt)'))
    .option('-d --destination <destination>', $('the full path in the Data Lake Store where the file should be imported to (e.g. /someFolder/someFile.txt'))
    .option('-f --force', $('optionally indicates that the file or folder being created can overwrite the file or folder at path if it already exists (default is false). \'true\' must be passed in for the overwrite to work'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (accountName, path, destination, options, _) {
    if (!accountName) {
      return cli.missingArgument('accountName');
    }
    
    if (!path) {
      return cli.missingArgument('path');
    }
    
    if (!destination) {
      return cli.missingArgument('destination');
    }
    
    var subscription = profile.current.getSubscription(options.subscription);
    var clientOptions = {
      disableLogFilter: true
    };
    
    var client = utils.createDataLakeStoreFileSystemManagementClient(subscription, clientOptions);
    
    var parameters = {};
    
    if (options.force) {
      parameters.overwrite = true;
    }
    else {
      parameters.overwrite = false;
    }
    
    parameters.permission = null;
    
    var fileStats = fs.stat(path, _);
    if (fileStats.isDirectory()) {
      throw new Error($('Cannot import directories, please specify a valid file path'));
    }
    
    log.info($('Uploading file %s to the Data Lake Store location: %s ...'), path, destination);
    var fileSizeInBytes = fileStats.size;
    var maxBytesToRead = 8 * 1024 * 1024; // 8mb
    
    var fileHandle = fs.open(path, 'r', _);
    var maxAttempts = 4;
    try {
      var offset = 0;
      var bar = new progress('  uploading [:bar] :percent :etas', {
        complete: '=',
        incomplete: ' ',
        width: 40,
        total: fileSizeInBytes
      });
      
      if (fileSizeInBytes === 0) {
        // just create an empty file and return.
        client.fileSystem.create(accountName, destination, _);
      }
      else {
        while (offset < fileSizeInBytes) {
          var bytesToRead = maxBytesToRead;
          if (offset + maxBytesToRead > fileSizeInBytes) {
            bytesToRead = fileSizeInBytes - offset;
          }
          
          var appendSucceeded = false;
          var attemptCount = 0;
          while (!appendSucceeded && attemptCount < maxAttempts) {
            attemptCount++;
            try {
              var buffer = new Buffer(bytesToRead);
              fs.read(fileHandle, buffer, 0, bytesToRead, offset, _);
              
              if (offset === 0) {
                parameters.streamContents = buffer;
                client.fileSystem.create(accountName, destination, parameters, _);
              }
              else {
                client.fileSystem.append(accountName, destination, buffer, _);
              }
              
              appendSucceeded = true;
              offset += bytesToRead;
              bar.tick(bytesToRead);
            }
              catch (err) {
              if (attemptCount >= maxAttempts) {
                throw err;
              }
              
              // we set it to true to use the backoff retry strategy.
              // this should only be set to false in test scenarios.
              dataLakeStoreUtils.waitForRetry(attemptCount, true);
            }
          }
        }
      }
    }
      finally {
      fs.close(fileHandle);
    }
    
    log.info($('Successfully created the specified item at path:  ' + destination));
  });
  
  dataLakeStoreFileSystem.command('concat [accountName] [paths] [destination]')
    .description($('Concatenates the specified list of files into the specified destination file.'))
    .usage('[options] <accountName> <paths> <destination>')
    .option('-n --accountName <accountName>', $('the Data Lake Store account name to execute the action on'))
    .option('-p --paths <paths>', $('a comma seperated list of full paths to concatenate (e.g. \'/someFolder/someFile.txt,/somefolder/somefile2.txt,/anotherFolder/newFile.txt\')'))
    .option('-d --destination <destination>', $('specify the target file that all of the files in --paths should be concatenated into (e.g /someFolder/targetFile.txt)'))
    .option('-f --force', $('optionally indicates that the file or folder being created can overwrite the file or folder at path if it already exists (default is false). \'true\' must be passed in for the overwrite to work'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (accountName, paths, destination, force, options, _) {
    if (!accountName) {
      return cli.missingArgument('accountName');
    }
    
    if (!paths) {
      return cli.missingArgument('paths');
    }
    
    if (!destination) {
      return cli.missingArgument('destination');
    }
    
    var subscription = profile.current.getSubscription(options.subscription);
    var client = utils.createDataLakeStoreFileSystemManagementClient(subscription);
    
    if (options.force) {
      try {
        var fileStatus = client.fileSystem.getFileStatus(accountName, destination, _).fileStatus;
        if (fileStatus.type.toLowerCase() === 'file') {
          client.fileSystem.deleteMethod(accountName, destination, false, _);
        }
        else {
          throw new Error($('Cannot forcibly concatenate files into a path that is an existing directory. Please use the delete command to remove the directory and try again.'));
        }
      }
        catch (err) {
          // do nothing since this means the file does not exist and that is fine
      }
    }
    
    var pathsBuf = new Buffer('sources=' + paths);
    withProgress(util.format($('Concatenating specified files into target location: %s'), destination),
        function (log, _) {
      client.fileSystem.msConcat(accountName, destination, pathsBuf, false, _);
    }, _);
    log.info($('Successfully concatenated the file list into the specified item at path:  ' + destination));
  });
  
  dataLakeStoreFileSystem.command('move [accountName] [path] [destination]')
    .description($('Moves (renames) the specified file or folder into the specified destination file or folder.'))
    .usage('[options] <accountName> <path> <destination>')
    .option('-n --accountName <accountName>', $('the Data Lake Store account name to execute the action on'))
    .option('-p --path <path>', $('the path to the file or folder to move (e.g. /someFolder or /someFolder/someFile.txt)'))
    .option('-d --destination <destination>', $('specify the target location to move the file or folder to'))
    .option('-f --force', $('optionally indicates that the file or folder being created can overwrite the file or folder at path if it already exists (default is false). \'true\' must be passed in for the overwrite to work'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (accountName, path, destination, options, _) {
    if (!accountName) {
      return cli.missingArgument('accountName');
    }
    
    if (!path) {
      return cli.missingArgument('paths');
    }
    
    if (!destination) {
      return cli.missingArgument('destination');
    }
    
    var subscription = profile.current.getSubscription(options.subscription);
    var client = utils.createDataLakeStoreFileSystemManagementClient(subscription);
    
    if (options.force) {
      try {
        client.fileSystem.deleteMethod(accountName, destination, true, _);
      }
        catch (err) {
          // do nothing since this means the file does not exist and that is fine
      }
    }
    
    client.fileSystem.rename(accountName, path, destination, _);
    log.info($('Successfully moved the file or folder to: ' + destination));
  });
  
  dataLakeStoreFileSystem.command('addcontent [accountName] [path] [value]')
    .description($('Appends the specified content to the end of the Data Lake Store file path specified.'))
    .usage('[options] <accountName> <path> <value>')
    .option('-n --accountName <accountName>', $('the Data Lake Store account name to execute the action on'))
    .option('-p --path <path>', $('the full path to the file to add content to (e.g. /someFolder/someFile.txt)'))
    .option('-v --value <value>', $('the contents to append to the file'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (accountName, path, value, options, _) {
    if (!accountName) {
      return cli.missingArgument('accountName');
    }
    
    if (!path) {
      return cli.missingArgument('path');
    }
    
    if (!value) {
      return cli.missingArgument('value');
    }
    
    var subscription = profile.current.getSubscription(options.subscription);
    
    var clientOptions = {
      disableLogFilter: true
    };
    
    var client = utils.createDataLakeStoreFileSystemManagementClient(subscription, clientOptions);
    withProgress(util.format($('Adding specified content to file %s'), path),
      function (log, _) {
      client.fileSystem.append(accountName, path, value, _);
    }, _);
    log.info($('Successfully appended content at the specified path:  ' + path));
  });
  
  dataLakeStoreFileSystem.command('export [accountName] [path] [destination]')
    .description($('Downloads the specified file to the target location.'))
    .usage('[options] <accountName> <path> <destination>')
    .option('-n --accountName <accountName>', $('the Data Lake Store account name to execute the action on'))
    .option('-p --path <path>', $('the full path in the Data Lake Store where the file should be imported to (e.g. /someFolder/someFile.txt'))
    .option('-d --destination <destination>', $('the full local path to the file to import (e.g. /someFolder/someFile.txt or C:\somefolder\someFile.txt)'))
    .option('-f --force', $('optionally indicates that the file being created can overwrite the file at path if it already exists (default is false).'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (accountName, path, destination, options, _) {
    if (!accountName) {
      return cli.missingArgument('accountName');
    }
    
    if (!path) {
      return cli.missingArgument('path');
    }
    
    if (!destination) {
      return cli.missingArgument('destination');
    }
    
    var subscription = profile.current.getSubscription(options.subscription);
    var client = utils.createDataLakeStoreFileSystemManagementClient(subscription);
    var maxBytesToRead = 8 * 1024 * 1024; //8MB
    var fileStatus = client.fileSystem.getFileStatus(accountName, path, _).fileStatus;
    
    log.info($('Downloading file %s to the specified location: %s'), path, destination);
    
    var fileSizeInBytes = fileStatus.length;
    var fileHandle;
    if (options.force) {
      fileHandle = fs.open(destination, 'w', _);
    }
    else {
      try {
        fileHandle = fs.open(destination, 'wx', _);
      }
        catch (err) {
        throw new Error($('The file at path: ' + destination + ' already exists. Please use the --force option to overwrite this file. Actual error reported: ' + err));
      }
    }
    try {
      var offset = 0;
      var maxAttempts = 4;
      var bar = new progress('  downloading [:bar] :percent :etas', {
        complete: '=',
        incomplete: ' ',
        width: 40,
        total: fileSizeInBytes
      });
      
      while (offset < fileSizeInBytes) {
        var bytesToRead = maxBytesToRead;
        if (offset + maxBytesToRead > fileSizeInBytes) {
          bytesToRead = fileSizeInBytes - offset;
        }
        
        var parameters = {
          length: bytesToRead,
          offset: offset
        };
        
        var attemptCount = 0;
        var readSucceeded = false;
        while (!readSucceeded && attemptCount < maxAttempts) {
          try {
            var response = client.fileSystem.open(accountName, path, parameters, _);
            var buff = readStreamToBuffer(response, _);
            fs.write(fileHandle, buff, 0, bytesToRead, offset, _);
            readSucceeded = true;
            offset += bytesToRead;
            bar.tick(bytesToRead);
          }
            catch (err) {
            if (attemptCount >= maxAttempts) {
              throw err;
            }
            
            // we set it to true to use the backoff retry strategy.
            // this should only be set to false in test scenarios.
            dataLakeStoreUtils.waitForRetry(attemptCount, true);
          }
        }
      }
    }
      catch (err) {
      log.info(err);
    }
      finally {
      fs.close(fileHandle);
    }
    
    log.info($('Successfully downloaded the specified item at path:  ' + path + ' to local path: ' + destination));
  });
  
  dataLakeStoreFileSystem.command('read [accountName] [path]')
    .description($('Previews the specified Data Lake Store file starting at index 0 (or the specified offset) until the length is reached, displaying the results to the console.'))
    .usage('[options] <accountName> <path>')
    .option('-n --accountName <accountName>', $('the Data Lake Store account name to execute the action on'))
    .option('-p --path <path>', $('the full path to the file to download (e.g. /someFolder/someFile.txt)'))
    .option('-l --length <length>', $('optionally specify the length, in bytes, to read from the file. If not specified will attempt to display all content after offset. If that length is greater than 1MB a length must be specified.'))
    .option('-o --offset <offset>', $('the optional offset to begin reading at (default is 0)'))
    .option('-f --force', $('optionally forces previewing of a full file. Use with caution, as this can cause instability and hangs with very large files.'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (accountName, path, options, _) {
    if (!accountName) {
      return cli.missingArgument('accountName');
    }
    
    if (!path) {
      return cli.missingArgument('path');
    }
    
    if (options.offset && parseInt(options.offset) < 0) {
      throw new Error($('--offset must be greater than or equal to 0. Value passed in: ' + options.offset));
    }
    
    var parameters = {};
    if (options.offset) {
      parameters.offset = parseInt(options.offset);
    }
    else {
      parameters.offset = 0;
    }
    
    var maxLength = 1 * 1024 * 1024;
    var subscription = profile.current.getSubscription(options.subscription);
    var client = utils.createDataLakeStoreFileSystemManagementClient(subscription);
    var fileInfo = client.fileSystem.getFileStatus(accountName, path, _);
    var length = 0;
    if (!options.length || options.length <= 0) {
      length = fileInfo.length - parameters.offset;
    }
    else {
      length = parseInt(options.length);
    }
    
    if (parameters.offset >= fileInfo.length) {
      throw new Error($('--offset must be less than than the length of the file. File length: ' + fileInfo.length + '. Value passed in: ' + options.offset));
    }
    
    // in the case where the user specifies more data than exists in the file from the offset, reduce it to pass error checking for small files.
    if (fileInfo.length - parameters.offset < length) {
      length = fileInfo.length - parameters.offset;
    }
    
    if (length > maxLength && !options.force) {
      throw new Error($('The remaining data to preview is greater than ' + maxLength + ' bytes. Please specify a length or use the --force parameter to preview the entire file. The length of the file that would have been previewed: ' + length));
    }
    
    parameters.length = length;
    
    var response;
    withProgress(util.format($('Previewing contents of file %s'), path),
      function (log, _) {
      
      response = client.fileSystem.open(accountName, path, parameters, _);
    }, _);
    
    var buff = readStreamToBuffer(response, _);
    log.data(buff.toString());
  });
  
  var dataLakeStoreFileSystemPermissions = dataLakeStoreCommands.category('permissions')
    .description($('Commands to manage your Data Lake Storage FileSystem Permissions'));
  
  dataLakeStoreFileSystemPermissions.command('show [accountName] [path]')
    .description($('Gets the specified Data Lake Store folder ACL'))
    .usage('[options] <accountName> <path>')
    .option('-n --accountName <accountName>', $('the Data Lake Store account name to execute the action on'))
    .option('-p --path <path>', $('the full path to the folder or file to get (e.g. /someFolder or /someFolder/someFile.txt)'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (accountName, path, options, _) {
    if (!accountName) {
      return cli.missingArgument('accountName');
    }
    
    if (!path) {
      return cli.missingArgument('path');
    }
    
    var subscription = profile.current.getSubscription(options.subscription);
    var client = utils.createDataLakeStoreFileSystemManagementClient(subscription);
    
    var aclStatus = client.fileSystem.getAclStatus(accountName, path, _).aclStatus;
    dataLakeStoreUtils.formatOutput(cli, log, options, aclStatus);
  });
  
  dataLakeStoreFileSystemPermissions.command('delete [accountName] [path]')
    .description($('Deletes the entire ACL associated with a folder (not including un-named ACL entries)'))
    .usage('[options] <accountName> <path>')
    .option('-n --accountName <accountName>', $('the Data Lake Store account name to execute the action on'))
    .option('-p --path <path>', $('the full path to the folder to remove ACLs from (e.g. /someFolder)'))
    .option('-d --defaultAcl', $('optionally indicates that the default ACL should be removed instead of the regular ACL. Default is false.'))
    .option('-q, --quiet', $('quiet mode (do not ask for delete confirmation)'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (accountName, path, options, _) {
    if (!accountName) {
      return cli.missingArgument('accountName');
    }
    
    if (!path) {
      return cli.missingArgument('path');
    }
    
    if (!options.quiet && !cli.interaction.confirm(util.format($('Delete Data Lake Store ACLs for account %s at path %s? [y/n] '), accountName, path), _)) {
      return;
    }
    
    var subscription = profile.current.getSubscription(options.subscription);
    var client = utils.createDataLakeStoreFileSystemManagementClient(subscription);
    
    if (options.defaultAcl) {
      client.fileSystem.removeDefaultAcl(accountName, path, _);
    }
    else {
      client.fileSystem.removeAcl(accountName, path, _);
    }
    log.info($('Successfully removed the specified ACL'));
  });
  
  var dataLakeStoreFileSystemPermissionsEntries = dataLakeStoreFileSystemPermissions.category('entry')
    .description($('Commands to manage your Data Lake Storage FileSystem granular permissions entries'));
  
  dataLakeStoreFileSystemPermissionsEntries.command('delete [accountName] [path] [aclEntries]')
    .description($('deletes the specific ACE entry or entries from the path'))
    .usage('[options] <accountName> <path> <aclEntries>')
    .option('-n --accountName <accountName>', $('the Data Lake Store account name to execute the action on'))
    .option('-p --path <path>', $('the full path to the folder to remove ACEs from (e.g. /someFolder)'))
    .option('-a --aclEntries <aclEntries>', $('a comma delimited list of the fully qualified ACE entry or entries to delete in the format [default:]<user>|<group>:<object Id> (e.g \'user:5546499e-795f-4f5f-b411-8179051f8b0a\' or \'default:group:5546499e-795f-4f5f-b411-8179051f8b0a\')'))
    .option('-q, --quiet', $('quiet mode (do not ask for delete confirmation)'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (accountName, path, aclEntries, options, _) {
    if (!accountName) {
      return cli.missingArgument('accountName');
    }
    
    if (!path) {
      return cli.missingArgument('path');
    }
    
    if (!aclEntries) {
      return cli.missingArgument('aclEntries');
    }
    
    if (!options.quiet && !cli.interaction.confirm(util.format($('Delete Data Lake Store ACL entries: %s for account %s at path %s? [y/n] '), aclEntries, accountName, path), _)) {
      return;
    }
    
    var subscription = profile.current.getSubscription(options.subscription);
    var client = utils.createDataLakeStoreFileSystemManagementClient(subscription);
    
    client.fileSystem.removeAclEntries(accountName, path, aclEntries, _);
    log.info($('Successfully removed the specified ACL entries'));
  });
  
  dataLakeStoreFileSystemPermissionsEntries.command('set [accountName] [path] [aclEntries]')
    .description($('sets the specified Data Lake Store folder ACE entry or entries'))
    .usage('[options] <accountName> <path> <aclEntries>')
    .option('-n --accountName <accountName>', $('the Data Lake Store account name to execute the action on'))
    .option('-p --path <path>', $('the full path to the folder to set ACEs on (e.g. /someFolder)'))
    .option('-a --aclEntries <aclEntries>', $('a comma delimited list of the fully qualified ACE entries to set in the format [default:]<user>|<group>:<object Id>:<permissions> (e.g \'user:5546499e-795f-4f5f-b411-8179051f8b0a:r-x\' or \'default:group:5546499e-795f-4f5f-b411-8179051f8b0a:rwx\')'))
    .option('-q, --quiet', $('quiet mode (do not ask for overwrite confirmation)'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (accountName, path, aclEntries, options, _) {
    if (!accountName) {
      return cli.missingArgument('accountName');
    }
    
    if (!path) {
      return cli.missingArgument('path');
    }
    
    if (!aclEntries) {
      return cli.missingArgument('aclEntries');
    }
    
    if (!options.quiet && !cli.interaction.confirm(util.format($('Potentially overwrite existing Data Lake Store ACL entries: %s for account %s at path %s? [y/n] '), aclEntries, accountName, path), _)) {
      return;
    }
    
    var subscription = profile.current.getSubscription(options.subscription);
    var client = utils.createDataLakeStoreFileSystemManagementClient(subscription);
    
    client.fileSystem.modifyAclEntries(accountName, path, aclEntries, _);
    log.info($('Successfully set the specified ACL entries'));
  });
  
  dataLakeStoreFileSystemPermissions.command('set [accountName] [path] [aclSpec]')
    .description($('sets the specified Data Lake Store folder ACL (overwriting the previous ACL entries)'))
    .usage('[options] <accountName> <path> <aclSpec>')
    .option('-n --accountName <accountName>', $('the Data Lake Store account name to execute the action on'))
    .option('-p --path <path>', $('the full path to the folder to remove ACLs from (e.g. /someFolder)'))
    .option('-a --aclSpec <aclSpec>', $('a comma delimited list of fully qualified ACL entries to set in the format [default:]<user>|<group>:<object Id>:<permissions> (e.g \'user:5546499e-795f-4f5f-b411-8179051f8b0a:r-x\' or \'default:group:5546499e-795f-4f5f-b411-8179051f8b0a:rwx\'). This list must also include default entries (no object ID in the middle)'))
    .option('-q, --quiet', $('quiet mode (do not ask for overwrite confirmation)'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (accountName, path, aclSpec, options, _) {
    if (!accountName) {
      return cli.missingArgument('accountName');
    }
    
    if (!path) {
      return cli.missingArgument('path');
    }
    
    if (!aclSpec) {
      return cli.missingArgument('aclSpec');
    }
    
    if (!options.quiet && !cli.interaction.confirm(util.format($('Overwrite existing Data Lake Store ACL with the following ACL: %s for account %s at path %s? [y/n] '), aclSpec, accountName, path), _)) {
      return;
    }
    
    var subscription = profile.current.getSubscription(options.subscription);
    var client = utils.createDataLakeStoreFileSystemManagementClient(subscription);
    
    client.fileSystem.setAcl(accountName, path, aclSpec, _);
    log.info($('Successfully set the ACL'));
  });
  
  var dataLakeStoreFirewallRules = dataLakeStoreCommands.category('firewall')
    .description($('Commands to manage your Data Lake Storage account firewall rules'));
  
  dataLakeStoreFirewallRules.command('create [accountName] [name] [startIpAddress] [endIpAddress]')
    .description($('adds the specified firewall rule to the specified Data Lake Store account.'))
    .usage('[options] <accountName> <name> <startIpAddress> <endIpAddress>')
    .option('-a --accountName <accountName>', $('the Data Lake Store account name to execute the action on'))
    .option('-n --name <firewall rule name>', $('the name of the firewall rule to add'))
    .option('-t --startIpAddress <start ip address>', $('the start of the valid ip range for the firewall rule'))
    .option('-e, --endIpAddress <end ip address>', $('the end of the valid ip range for the firewall rule'))
    .option('-g --resource-group <resource-group>', $('optionally explicitly set the resource group. If not specified, will attempt to discover it.'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (accountName, name, startIpAddress, endIpAddress, options, _) {
    if (!accountName) {
      return cli.missingArgument('accountName');
    }
    
    if (!name) {
      return cli.missingArgument('name');
    }
    
    if (!startIpAddress) {
      return cli.missingArgument('startIpAddress');
    }
    
    if (!endIpAddress) {
      return cli.missingArgument('endIpAddress');
    }
    
    var subscription = profile.current.getSubscription(options.subscription);
    
    if (!options.resourceGroup) {
      options.resourceGroup = getResourceGroupByAccountName(subscription, options.resourceGroup, accountName, _);
    }
    
    var client = utils.createDataLakeStoreManagementClient(subscription);
    var parameters = {
      startIpAddress: startIpAddress,
      endIpAddress: endIpAddress
    };
    
    var result = client.firewallRules.createOrUpdate(options.resourceGroup, accountName, name, parameters, _);
    dataLakeStoreUtils.formatOutput(cli, log, options, result);
  });
  
  dataLakeStoreFirewallRules.command('set [accountName] [name]')
    .description($('updates the specified firewall rule in the specified Data Lake Store account.'))
    .usage('[options] <accountName> <name>')
    .option('-a --accountName <accountName>', $('the Data Lake Store account name to execute the action on'))
    .option('-n --name <firewall rule name>', $('the name of the firewall rule to update'))
    .option('-t --startIpAddress <start ip address>', $('the optional new start of the valid ip range for the firewall rule'))
    .option('-e, --endIpAddress <end ip address>', $('the optional new end of the valid ip range for the firewall rule'))
    .option('-g --resource-group <resource-group>', $('optionally explicitly set the resource group. If not specified, will attempt to discover it.'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (accountName, name, options, _) {
    if (!accountName) {
      return cli.missingArgument('accountName');
    }
    
    if (!name) {
      return cli.missingArgument('name');
    }
    
    var subscription = profile.current.getSubscription(options.subscription);
    
    if (!options.resourceGroup) {
      options.resourceGroup = getResourceGroupByAccountName(subscription, options.resourceGroup, accountName, _);
    }
    
    var client = utils.createDataLakeStoreManagementClient(subscription);
    var currentRule = client.firewallRules.get(options.resourceGroup, accountName, name, _);
    if (!options.startIpAddress) {
      options.startIpAddress = currentRule.startIpAddress;
    }
    
    if (!options.endIpAddress) {
      options.endIpAddress = currentRule.endIpAddress;
    }
    
    var parameters = {
      startIpAddress: options.startIpAddress,
      endIpAddress: options.endIpAddress
    };
    
    var result = client.firewallRules.createOrUpdate(options.resourceGroup, accountName, name, parameters, _);
    dataLakeStoreUtils.formatOutput(cli, log, options, result);
  });
  
  dataLakeStoreFirewallRules.command('show [accountName] [name]')
    .description($('retrieves the specified firewall rule in the specified Data Lake Store account.'))
    .usage('[options] <accountName> <name>')
    .option('-a --accountName <accountName>', $('the Data Lake Store account name to execute the action on'))
    .option('-g --resource-group <resource-group>', $('optionally explicitly set the resource group. If not specified, will attempt to discover it.'))
    .option('-n --name <firewall rule name>', $('the name of the firewall rule to display'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (accountName, name, options, _) {
    if (!accountName) {
      return cli.missingArgument('accountName');
    }
    
    if (!name) {
      return cli.missingArgument('name');
    }
    
    var subscription = profile.current.getSubscription(options.subscription);
    
    if (!options.resourceGroup) {
      options.resourceGroup = getResourceGroupByAccountName(subscription, options.resourceGroup, accountName, _);
    }
    
    var client = utils.createDataLakeStoreManagementClient(subscription);
    var currentRule = client.firewallRules.get(options.resourceGroup, accountName, name, _);
    dataLakeStoreUtils.formatOutput(cli, log, options, currentRule);
  });
  
  dataLakeStoreFirewallRules.command('list [accountName]')
    .description($('retrieves all firewall rules in the specified Data Lake Store account.'))
    .usage('[options] <accountName>')
    .option('-n --accountName <accountName>', $('the Data Lake Store account name to execute the action on'))
    .option('-g --resource-group <resource-group>', $('optionally explicitly set the resource group. If not specified, will attempt to discover it.'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (accountName, options, _) {
    if (!accountName) {
      return cli.missingArgument('accountName');
    }
    
    var subscription = profile.current.getSubscription(options.subscription);
    
    if (!options.resourceGroup) {
      options.resourceGroup = getResourceGroupByAccountName(subscription, options.resourceGroup, accountName, _);
    }
    
    var client = utils.createDataLakeStoreManagementClient(subscription);
    var response = client.firewallRules.listByAccount(options.resourceGroup, accountName, _);
    var rules = response;
    while (response.nextLink) {
      response = client.firewallRules.listByAccountNext(response.nextLink, _);
      rules.push.apply(rules, response);
    }
    
    dataLakeStoreUtils.formatOutputList(cli, log, options, rules);
  });
  
  dataLakeStoreFirewallRules.command('delete [accountName] [name]')
    .description($('removes the specified firewall rule in the specified Data Lake Store account.'))
    .usage('[options] <accountName> <name>')
    .option('-a --accountName <accountName>', $('the Data Lake Store account name to execute the action on'))
    .option('-g --resource-group <resource-group>', $('the optional resource group to list the accounts in'))
    .option('-n --name <firewall rule name>', $('the name of the firewall rule to delete'))
    .option('-q, --quiet', $('quiet mode (do not ask for delete confirmation)'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (accountName, name, options, _) {
    if (!accountName) {
      return cli.missingArgument('accountName');
    }
    
    if (!name) {
      return cli.missingArgument('name');
    }
    
    if (!options.quiet && !cli.interaction.confirm(util.format($('Delete firewall rule %s in Data Lake Store account %s? [y/n] '), name, accountName), _)) {
      return;
    }
    
    var subscription = profile.current.getSubscription(options.subscription);
    
    if (!options.resourceGroup) {
      options.resourceGroup = getResourceGroupByAccountName(subscription, options.resourceGroup, accountName, _);
    }
    
    var client = utils.createDataLakeStoreManagementClient(subscription);
    client.firewallRules.deleteMethod(options.resourceGroup, accountName, name, _);
    
    log.info($('Successfully deleted the specified firewall rule.'));
  });
  
  var dataLakeStoreTrustedIdProvider = dataLakeStoreCommands.category('provider')
    .description($('Commands to manage your Data Lake Storage account trusted identity providers'));
  
  dataLakeStoreTrustedIdProvider.command('create [accountName] [name] [providerEndpoint]')
    .description($('adds the specified trusted identity provider to the specified Data Lake Store account.'))
    .usage('[options] <accountName> <name> <providerEndpoint>')
    .option('-a --accountName <accountName>', $('the Data Lake Store account name to execute the action on'))
    .option('-g --resource-group <resource-group>', $('optionally explicitly set the resource group. If not specified, will attempt to discover it.'))
    .option('-n --name <trusted identity provider name>', $('the name of the trusted identity provider to add'))
    .option('-e, --providerEndpoint <endpoint>', $('the valid trusted provider endpoint in the format: https://sts.windows.net/<provider identity>'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (accountName, name, providerEndpoint, options, _) {
    createOrUpdateTrustedIdProvider(cli, accountName, options.resourceGroup, name, providerEndpoint, options, _);
  });
  
  dataLakeStoreTrustedIdProvider.command('set [accountName] [name] [providerEndpoint]')
    .description($('updates the specified trusted identity provider in the specified Data Lake Store account.'))
    .usage('[options] <accountName> <name> <providerEndpoint>')
    .option('-a --accountName <accountName>', $('the Data Lake Store account name to execute the action on'))
    .option('-g --resource-group <resource-group>', $('optionally explicitly set the resource group. If not specified, will attempt to discover it.'))
    .option('-n --name <trusted identity provider name>', $('the name of the trusted identity provider to update'))
    .option('-e, --providerEndpoint <endpoint>', $('the new valid trusted provider endpoint in the format: https://sts.windows.net/<provider identity>'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (accountName, name, providerEndpoint, options, _) {
    createOrUpdateTrustedIdProvider(cli, accountName, options.resourceGroup, name, providerEndpoint, options, _);
  });
  
  dataLakeStoreTrustedIdProvider.command('show [accountName] [name]')
    .description($('retrieves the specified trusted identity provider in the specified Data Lake Store account.'))
    .usage('[options] <accountName> <name>')
    .option('-a --accountName <accountName>', $('the Data Lake Store account name to execute the action on'))
    .option('-g --resource-group <resource-group>', $('optionally explicitly set the resource group. If not specified, will attempt to discover it.'))
    .option('-n --name <trusted identity provider name>', $('the name of the trusted identity provider to display'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (accountName, name, options, _) {
    if (!accountName) {
      return cli.missingArgument('accountName');
    }
    
    if (!name) {
      return cli.missingArgument('name');
    }
    
    var subscription = profile.current.getSubscription(options.subscription);
    
    if (!options.resourceGroup) {
      options.resourceGroup = getResourceGroupByAccountName(subscription, options.resourceGroup, accountName, _);
    }
    
    var client = utils.createDataLakeStoreManagementClient(subscription);
    var currentRule = client.trustedIdProviders.get(options.resourceGroup, accountName, name, _);
    dataLakeStoreUtils.formatOutput(cli, log, options, currentRule);
  });
  
  dataLakeStoreTrustedIdProvider.command('list [accountName]')
    .description($('retrieves all trusted identity providers in the specified Data Lake Store account.'))
    .usage('[options] <accountName>')
    .option('-n --accountName <accountName>', $('the Data Lake Store account name to execute the action on'))
    .option('-g --resource-group <resource-group>', $('optionally explicitly set the resource group. If not specified, will attempt to discover it.'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (accountName, options, _) {
    if (!accountName) {
      return cli.missingArgument('accountName');
    }
    
    var subscription = profile.current.getSubscription(options.subscription);
    
    if (!options.resourceGroup) {
      options.resourceGroup = getResourceGroupByAccountName(subscription, options.resourceGroup, accountName, _);
    }
    
    var client = utils.createDataLakeStoreManagementClient(subscription);
    var response = client.trustedIdProviders.listByAccount(options.resourceGroup, accountName, _);
    var rules = response;
    while (response.nextLink) {
      response = client.trustedIdProviders.listByAccountNext(response.nextLink, _);
      rules.push.apply(rules, response);
    }
    
    dataLakeStoreUtils.formatOutputList(cli, log, options, rules);
  });
  
  dataLakeStoreTrustedIdProvider.command('delete [accountName] [name]')
    .description($('removes the specified trusted identity provider in the specified Data Lake Store account.'))
    .usage('[options] <accountName> <name>')
    .option('-a --accountName <accountName>', $('the Data Lake Store account name to execute the action on'))
    .option('-g --resource-group <resource-group>', $('the optional resource group to list the accounts in'))
    .option('-n --name <trusted identity provider name>', $('the name of the trusted identity provider to delete'))
    .option('-q, --quiet', $('quiet mode (do not ask for delete confirmation)'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (accountName, name, options, _) {
    if (!accountName) {
      return cli.missingArgument('accountName');
    }
    
    if (!name) {
      return cli.missingArgument('name');
    }
    
    if (!options.quiet && !cli.interaction.confirm(util.format($('Delete trusted identity provider %s in Data Lake Store account %s? [y/n] '), name, accountName), _)) {
      return;
    }
    
    var subscription = profile.current.getSubscription(options.subscription);
    
    if (!options.resourceGroup) {
      options.resourceGroup = getResourceGroupByAccountName(subscription, options.resourceGroup, accountName, _);
    }
    
    var client = utils.createDataLakeStoreManagementClient(subscription);
    client.trustedIdProviders.deleteMethod(options.resourceGroup, accountName, name, _);
    
    log.info($('Successfully deleted the specified trusted identity provider.'));
  });
  
  var dataLakeStoreAccount = dataLakeStoreCommands.category('account')
    .description($('Commands to manage your Data Lake Storage accounts'));
  
  dataLakeStoreAccount.command('list')
    .description($('List all Data Lake Store accounts available for your subscription or subscription and resource group'))
    .usage('[options]')
    .option('-g --resource-group <resource-group>', $('the optional resource group to list the accounts in'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (options, _) {
    var subscription = profile.current.getSubscription(options.subscription);
    var accounts = listAllDataLakeStoreAccounts(subscription, options.resourceGroup, _);
    dataLakeStoreUtils.formatOutputList(cli, log, options, accounts);
  });
  
  dataLakeStoreAccount.command('show [accountName]')
    .description($('Shows a Data Lake Store Account based on account name'))
    .usage('[options] <accountName>')
    .option('-n --accountName <accountName>', $('the Data Lake Store account name'))
    .option('-g --resource-group <resource-group>', $('the optional resource group to list the accounts in'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (accountName, options, _) {
    if (!accountName) {
      return cli.missingArgument('accountName');
    }
    
    var subscription = profile.current.getSubscription(options.subscription);
    var client = utils.createDataLakeStoreManagementClient(subscription);
    
    if (!options.resourceGroup) {
      options.resourceGroup = getResourceGroupByAccountName(subscription, options.resourceGroup, accountName, _);
    }
    
    var dataLakeStoreAccount = client.account.get(options.resourceGroup, accountName, _);
    
    dataLakeStoreUtils.formatOutput(cli, log, options, dataLakeStoreAccount);
  });
  
  dataLakeStoreAccount.command('delete [accountName]')
    .description($('Deletes a Data Lake Store Account based on account name'))
    .usage('[options] <accountName>')
    .option('-n --accountName <accountName>', $('the Data Lake Store account name'))
    .option('-g --resource-group <resource-group>', $('the optional resource group to force the command to find the Data Lake Store account to delete in.'))
    .option('-q, --quiet', $('quiet mode (do not ask for delete confirmation)'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (accountName, options, _) {
    if (!accountName) {
      return cli.missingArgument('accountName');
    }
    
    if (!options.quiet && !cli.interaction.confirm(util.format($('Delete Data Lake Store Account %s? [y/n] '), accountName), _)) {
      return;
    }
    
    var subscription = profile.current.getSubscription(options.subscription);
    var client = utils.createDataLakeStoreManagementClient(subscription);
    
    if (!options.resourceGroup) {
      options.resourceGroup = getResourceGroupByAccountName(subscription, options.resourceGroup, accountName, _);
    }
    
    client.account.deleteMethod(options.resourceGroup, accountName, _);
    
    log.info($('Successfully deleted the specified Data Lake Store account.'));
  });
  
  dataLakeStoreAccount.command('create [accountName] [location] [resourceGroup] [defaultGroup] [encryption] [keyVaultId] [keyName] [keyVersion]')
    .description($('Creates a Data Lake Store Account'))
    .usage('[options] <accountName> <location> <resource-group>')
    .option('-n --accountName <accountName>', $('The Data Lake Store account name to create'))
    .option('-l --location <location>', $('the location the Data Lake Store account will be created in. Valid values are: North Central US, South Central US, Central US, West Europe, North Europe, West US, East US, East US 2, Japan East, Japan West, Brazil South, Southeast Asia, East Asia, Australia East, Australia Southeast'))
    .option('-g --resource-group <resource-group>', $('the resource group to create the account in'))
    .option('-d --defaultGroup <defaultGroup>', $('the optional default permissions group to add to the account when created'))
    .option('-e --encryption <\'UserManaged\'|\'ServiceManaged\'>', $('optionally indicates what type of encryption to provision the account with, if any. Valid values are UserManaged or ServiceManaged'))
    .option('-k --keyVaultId <key vault id>', $('if the encryption type is UserAssigned, this is the id of the key vault the user wishes to use'))
    .option('-y --keyName <key name>', $('if the encryption type is UserAssigned, this is the key name in the key vault the user wishes to use'))
    .option('-s --keyVersion <key version>', $('if the encryption type is UserAssigned, this is the key version of the key the user wishes to use'))
    .option('-t --tags <tags>', $('Tags to set to the the Data Lake Store account. Can be mutliple. ' +
            'In the format of \'name=value\'. Name is required and value is optional. For example, -t tag1=value1;tag2'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (accountName, location, resourceGroup, defaultGroup, encryption, keyVaultId, keyName, keyVersion, options, _) {
    var subscription = profile.current.getSubscription(options.subscription);
    var tags = {};
    var config = null;
    tags = tagUtils.buildTagsParameter(tags, options);
    if (encryption) {
      config = {
        type: encryption
      };
      if (encryption === 'UserManaged') {
        if (!keyVaultId || !keyName || !keyVersion) {
          throw new Error($('For user managed encryption, --keyVaultId, --keyName and --keyVersion are required parameters and must be supplied.'));
        }
        
        config.keyVaultMetaInfo = {
          keyVaultResourceId: keyVaultId,
          encryptionKeyName: keyName,
          encryptionKeyVersion: keyVersion
        };
      }
      else if (encryption !== 'ServiceManaged') {
        throw new Error($('Valid values for --encryption are: \'UserManaged\' or \'ServiceManaged\'. Value supplied: ' + encryption));
      }
      else {
        if (keyVaultId || keyName || keyVersion) {
          log.info($('User supplied Key Vault information. For service managed encryption user supplied Key Vault information is ignored.'));
        }
      }
      
      options.config = config;
    }
    
    var dataLakeStoreAccount = createOrUpdateDataLakeStoreAccount(subscription, accountName, resourceGroup, location, tags, options, _);
    dataLakeStoreUtils.formatOutput(cli, log, options, dataLakeStoreAccount);
  });
  
  dataLakeStoreAccount.command('set [accountName]')
    .description($('Updates the properties of an existing Data Lake Store Account'))
    .usage('[options] <accountName>')
    .option('-n --accountName <accountName>', $('The Data Lake Store account name to update with new tags and/or default permissions group'))
    .option('-g --resource-group <resource-group>', $('the optional resource group to forcibly look for the account to update in'))
    .option('-d --defaultGroup <defaultGroup>', $('the optional default permissions group to set in the existing account'))
    .option('-t --trustedIdProviderState <Enabled|Disabled>', $('optionally enable or disable existing trusted identity providers. Valid values are \'Enabled\' or \'Disabled\''))
    .option('-f --firewallState <Enabled|Disabled>', $('optionally enable or disable existing firewall rules. Valid values are \'Enabled\' or \'Disabled\''))
    .option('-t --tags <tags>', $('Tags to set to the Data Lake Store account. Can be mutliple. ' +
            'In the format of \'name=value\'. Name is required and value is optional. For example, -t tag1=value1;tag2'))
    .option('--no-tags', $('remove all existing tags'))
    .option('-s, --subscription <id>', $('the subscription identifier'))
    .execute(function (accountName, options, _) {
    var subscription = profile.current.getSubscription(options.subscription);
    var client = utils.createDataLakeStoreManagementClient(subscription);
    
    if (!options.resourceGroup) {
      options.resourceGroup = getResourceGroupByAccountName(subscription, options.resourceGroup, accountName, _);
    }
    
    var dataLakeStoreAccount = client.account.get(options.resourceGroup, accountName, _);
    
    if (!options.defaultGroup) {
      options.defaultGroup = dataLakeStoreAccount.defaultGroup;
    }
    
    var tags = {};
    if (!options.tags && !options.no-tags) {
      tags = dataLakeStoreAccount.tags;
    }
    else {
      tags = tagUtils.buildTagsParameter(tags, options);
    }
    
    dataLakeStoreAccount = createOrUpdateDataLakeStoreAccount(subscription, accountName, options.resourceGroup, dataLakeStoreAccount.location, tags, options, _);
    dataLakeStoreUtils.formatOutput(cli, log, options, dataLakeStoreAccount);
  });
  
  function createOrUpdateDataLakeStoreAccount(subscription, accountName, resourceGroup, location, tags, options, _) {
    if (!accountName) {
      return cli.missingArgument('accountName');
    }
    if (!location) {
      return cli.missingArgument('location');
    }
    if (!resourceGroup) {
      return cli.missingArgument('resourceGroup');
    }
    
    var client = utils.createDataLakeStoreManagementClient(subscription);
    var create = false;
    try {
      client.account.get(resourceGroup, accountName, _);
    }
      catch (err) {
      create = true;
    }
    
    var accountParams = {
      location: location,
      defaultGroup: options.defaultGroup,
      tags: tags
    };
    
    if (create) {
      if (options.config) {
        accountParams.identity = {};
        accountParams.encryptionConfig = options.config;
        accountParams.encryptionState = 'Enabled';
      }
      
      client.account.create(resourceGroup, accountName, accountParams, _);
    }
    else {
      if(options.firewallState){
        accountParams.firewallState = options.firewallState;
      }
      
      if(options.trustedIdProviderState){
        accountParams.trustedIdProviderState = options.trustedIdProviderState;
      }
      
      client.account.update(resourceGroup, accountName, accountParams, _);
    }
    
    return client.account.get(resourceGroup, accountName, _);
  }
  
  function listAllDataLakeStoreAccounts(subscription, resourceGroup, _) {
    var client = utils.createDataLakeStoreManagementClient(subscription);
    var response;
    var accounts;
    if (!resourceGroup) {
      response = client.account.list(_);
      accounts = response;
      while (response.nextLink) {
        response = client.account.listNext(response.nextLink, _);
        accounts.push.apply(accounts, response);
      }
    }
    else {
      response = client.account.listByResourceGroup(resourceGroup, _);
      accounts = response;
      while (response.nextLink) {
        response = client.account.listByResourceGroupNext(response.nextLink, _);
        accounts.push.apply(accounts, response);
      }
    }
    
    return accounts;
  }
  
  function getResourceGroupByAccountName(subscription, resourceGroup, name, _) {
    var accounts = listAllDataLakeStoreAccounts(subscription, resourceGroup, _);
    for (var i = 0; i < accounts.length; i++) {
      if (accounts[i].name === name) {
        var acctId = accounts[i].id;
        var rgStart = acctId.indexOf('resourceGroups/') + ('resourceGroups/'.length);
        var rgEnd = acctId.indexOf('/providers/');
        return acctId.substring(rgStart, rgEnd);
      }
    }
    
    throw new Error($('Could not find account: ' + name + ' in any resource group in subscription: ' + subscription.name + ' with id: ' + subscription.id));
  }

  function createOrUpdateTrustedIdProvider(cli, accountName, resourceGroup, name, providerEndpoint, options, _) {
    if (!accountName) {
      return cli.missingArgument('accountName');
    }
    
    if (!name) {
      return cli.missingArgument('name');
    }
    
    if (!providerEndpoint) {
      return cli.missingArgument('providerEndpoint');
    }
    
    var subscription = profile.current.getSubscription(options.subscription);
    if (!resourceGroup) {
      resourceGroup = getResourceGroupByAccountName(subscription, resourceGroup, accountName, _);
    }
    
    var parameters = {
      idProvider: providerEndpoint
    };
    
    var client = utils.createDataLakeStoreManagementClient(subscription);
    var result = client.trustedIdProviders.createOrUpdate(resourceGroup, accountName, name, parameters, _);
    dataLakeStoreUtils.formatOutput(cli, log, options, result);
  }
};