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
const MongoDB        = require('mongodb'),
      Util           = require('util'),
      parse          = require('mongodb/lib/url_parser'),
      Server         = require('./server'),
      Db             = MongoDB.Db,
      Core           = require('./core'),
      Sinon          = require('sinon'),
      CoreCommands   = Core.loadFromCore('/lib/connection/commands'),
      CoreQuery      = CoreCommands.Query,
      CoreKillCursor = CoreCommands.KillCursor;

/**
 * Creates a new MongoClient instance
 * @class
 * @return {MongoClient} a MongoClient instance.
 */
function MongoClient() {
  /**
   * The callback format for results
   * @callback MongoClient~connectCallback
   * @param {MongoError} error An error instance representing the error during the execution.
   * @param {Db} db The connected database.
   */

  /**
   * Connect to MongoDB using a url as documented at
   *
   *  docs.mongodb.org/manual/reference/connection-string/
   *
   * Note that for replicasets the replicaSet query parameter is required in the 2.0 driver
   *
   * @method
   * @param {string} url The connection URI string
   * @param {object} [options=null] Optional settings.
   * @param {boolean} [options.uri_decode_auth=false] Uri decode the user name and password for authentication
   * @param {object} [options.db=null] A hash of options to set on the db object, see **Db constructor**
   * @param {object} [options.server=null] A hash of options to set on the server objects, see **Server** constructor**
   * @param {object} [options.replSet=null] A hash of options to set on the replSet object, see **ReplSet** constructor**
   * @param {object} [options.mongos=null] A hash of options to set on the mongos object, see **Mongos** constructor**
   * @param {object} [options.promiseLibrary=null] A Promise library class the application wishes to use such as Bluebird, must be ES6 compatible
   * @param {MongoClient~connectCallback} [callback] The command result callback
   * @return {Promise} returns Promise if no callback passed
   */
  this.connect = MongoClient.connect;
  this.teardown = MongoClient.teardown;
}

Util.inherits(MongoClient, MongoDB.MongoClient);

/**
 * Connect to MongoDB using a url as documented at
 *
 *  docs.mongodb.org/manual/reference/connection-string/
 *
 * Note that for replicasets the replicaSet query parameter is required in the 2.0 driver
 *
 * @method
 * @static
 * @param {string} url The connection URI string
 * @param {object} [options=null] Optional settings.
 * @param {boolean} [options.uri_decode_auth=false] Uri decode the user name and password for authentication
 * @param {object} [options.db=null] A hash of options to set on the db object, see **Db constructor**
 * @param {object} [options.server=null] A hash of options to set on the server objects, see **Server** constructor**
 * @param {object} [options.replSet=null] A hash of options to set on the replSet object, see **ReplSet** constructor**
 * @param {object} [options.mongos=null] A hash of options to set on the mongos object, see **Mongos** constructor**
 * @param {object} [options.promiseLibrary=null] A Promise library class the application wishes to use such as Bluebird, must be ES6 compatible
 * @param {MongoClient~connectCallback} [callback] The command result callback
 * @return {Promise} returns Promise if no callback passed
 */
MongoClient.connect = function(url, options, callback) {
  var args = Array.prototype.slice.call(arguments, 1);
  callback = typeof args[args.length - 1] == 'function' ? args.pop() : null;
  options = args.length ? args.shift() : null;
  options = options || {};

  // Get the promiseLibrary
  var promiseLibrary = options.promiseLibrary;

  // No promise library selected fall back
  if(!promiseLibrary) {
    promiseLibrary = typeof global.Promise == 'function' ?
      global.Promise : require('es6-promise').Promise;
  }

  // Return a promise
  if(typeof callback != 'function') {
    return new promiseLibrary(function(resolve, reject) {
      connect(url, options, function(err, db) {
        if(err) return reject(err);
        resolve(db);
      });
    });
  }

  // Fallback to callback based connect
  connect(url, options, callback);
};

var connect = function(url, options, callback) {

  MongoClient.setup();

  var dbOptions = options.db || {};

  // If callback is null throw an exception
  if(callback == null)
    throw new Error("no callback function provided");

  // Parse the string
  var object = parse(url, options);

  // Merge in any options for db in options object
  if(dbOptions) {
    for(var name in dbOptions) object.db_options[name] = dbOptions[name];
  }

  // Added the url to the options
  object.db_options.url = url;

  // Set the promise library
  object.db_options.promiseLibrary = options.promiseLibrary;

  // Failure modes
  if(object.servers.length == 0) throw new Error("connection string must contain at least one seed host");

  // If we have no db setting for the native parser try to set the c++ one first
  object.db_options.native_parser = _setNativeParser(object.db_options);

  // If we have more than a server, it could be replicaset or mongos list
  // need to verify that it's one or the other and fail if it's a mix
  // Connect to all servers and run ismaster

  var server_options = object.servers[0];

  var _server_options = {
    poolSize: 1,
    socketOptions: {
      connectTimeoutMS: 1000 * 120,
      socketTimeoutMS:  1000 * 120
    },
    auto_reconnect:false
  };

  var server = server_options.domain_socket
    ? new Server(server_options.domain_socket, _server_options)
    : new Server(server_options.host, server_options.port, _server_options);

  // We just want a database instance, who cares if it is mongos?
  new Db(object.dbName, server, object.db_options)
  .open(function(err, db) {
    const _db = db;
    if(err) db = null;
    return process.nextTick(function(){
      try {
        callback(err, db);
      } catch (err) {
        if(_db) _db.close();
        throw err;
      }
    });
  });
};

var _setNativeParser = function(db_options) {
  if(typeof db_options.native_parser == 'boolean') return db_options.native_parser;

  try {
    return !!Core.loadFromCore('/').BSON.BSONNative.BSON;
  } catch(err) {
    return false;
  }
};

MongoClient.setup = function(){
  if(!(CoreKillCursor.prototype.toBin.restore instanceof Function)){
    Sinon.stub( CoreKillCursor.prototype, 'toBin', function(){
      return this;
    });
  }
  if(!(CoreQuery.prototype.toBin.restore instanceof Function)){
    Sinon.stub( CoreQuery.prototype, 'toBin', function(){
      return this;
    });
  }
};

MongoClient.teardown = function(){
  if(CoreKillCursor.prototype.toBin.restore instanceof Function){
    CoreKillCursor.prototype.toBin.restore();
  }
  if(CoreQuery.prototype.toBin.restore instanceof Function){
    CoreQuery.prototype.toBin.restore();
  }
};

MongoClient._setNativeParser = _setNativeParser;

module.exports = MongoClient;