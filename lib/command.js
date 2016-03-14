/*
 Copyright 2016 Fabian Cook

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */
const Commands = require('./commands'),
  LevelUp = require('levelup'),
  MemDown = require('memdown'),
  BSON    = require('bson');

exports = module.exports = function(server, db, ns, cmd, options, callback) {
  return exports.executeCommand(server, db, ns, cmd, options, callback);
};

exports.executeCommand = function(server, db, ns, cmd, options, callback) {
  var _callback,
      result;
  if(callback instanceof Function){
    _callback = callback;
    callback = function(args){
      args = Array.prototype.slice.call(arguments);
      process.nextTick(function(){
        _callback.apply(null, args);
      });
    };
  }

  const commands = exports.getCommands();

  const command = commands.find(function(command){
    return command.is(cmd, options);
  });

  if(!(command instanceof Function) && callback instanceof Function){
    return callback({
      ok: 0,
      errmsg: 'Command not found',
      cmd: cmd
    });
  } else if(!(command instanceof Function)){
    throw new Error("Command not found");
  }

  const collectionName = command.collectionName(cmd);

  const collection = db.collection(collectionName);

  // Allow the user to pass some options if they want to
  const upOptions = db.s.options && db.s.options.up;

  const up = exports.getUp(db.s.databaseName, collectionName, upOptions);
  const bson = exports.getBSON(options);

  try{
    result = command(bson, up, ns, cmd, options, callback, collection);
  } catch (error) {
    if (callback instanceof Function) {
      return callback(error);
    }
    throw error;
  }

  if(callback instanceof Function){
    return;
  }

  return result;
};

exports.getCommands = function(){
  return Commands;
};

exports.getBSON = function(options){
  if(exports.getBSON.bson){
    return exports.getBSON.bson;
  }
  var bson;
  try {
    bson = new BSON.BSONPure.BSON();
    bson.base = BSON.BSONPure;
  } catch(e) {
    bson = new BSON.BSONNative.BSON();
    bson.base = BSON.BSONNative;
  }
  const defaults = {
    serialize: [null, options.checkKeys, options.asBuffer, options.serializeFunctions]
  };
  Object.keys(defaults)
    .forEach(function(methodName){
      bson[methodName] = exports.wrapDefault(bson, methodName, defaults[methodName]);
    });
  return exports.getBSON.bson = bson;
};

exports.wrapDefault = function(instance, methodName, defaultArgs) {
  const method = instance[methodName];
  return function(){
    const passedArgs = Array.prototype.slice.call(arguments);
    const args = defaultArgs
      .map(function(value, index){
        // Wasn't passed, replace
        if(!passedArgs.hasOwnProperty(index)){
          return value;
        }
        return passedArgs[index];
      });
    return method.apply(instance, args);
  };
};

exports.getUp = function(databaseName, collectionName, options){
  options = exports.getUpOptions(options);
  const prefix = options.prefix || "";
  return LevelUp(prefix + databaseName + "." + collectionName, options);
};

exports.getUpOptions = function(options){
  if(!(options instanceof Object)){
    options = {};
  }
  options.db = options.db || MemDown;
  options.keyEncoding = 'binary';
  options.valueEncoding = 'binary';
  return options;
};