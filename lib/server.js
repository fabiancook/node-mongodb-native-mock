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
      Define         = require('mongodb/lib/metadata'),
      Core           = require('./core'),
      MongoDBCore    = Core.loadFromCore('/'),
      TwoSixWireProtocolSupport = Core.loadFromCore('/lib/wireprotocol/2_6_support'),
      ThreeTwoWireProtocolSupport = Core.loadFromCore('/lib/wireprotocol/3_2_support'),
      Command        = require('./command'),
      Sinon          = require('sinon'),
      CoreCommands   = Core.loadFromCore('/lib/connection/commands'),
      CoreQuery      = CoreCommands.Query,
      CoreKillCursor = CoreCommands.KillCursor;

/**
 * Creates a new Server instance
 * @class
 * @deprecated
 * @param {string} host The host for the server, can be either an IP4, IP6 or domain socket style host.
 * @param {number} [port] The server port if IP4.
 * @param {object} [options=null] Optional settings.
 * @param {number} [options.poolSize=5] Number of connections in the connection pool for each server instance, set to 5 as default for legacy reasons.
 * @param {boolean} [options.ssl=false] Use ssl connection (needs to have a mongod server with ssl support)
 * @param {object} [options.sslValidate=true] Validate mongod server certificate against ca (needs to have a mongod server with ssl support, 2.4 or higher)
 * @param {boolean|function} [options.checkServerIdentity=true] Ensure we check server identify during SSL, set to false to disable checking. Only works for Node 0.12.x or higher. You can pass in a boolean or your own checkServerIdentity override function.
 * @param {array} [options.sslCA=null] Array of valid certificates either as Buffers or Strings (needs to have a mongod server with ssl support, 2.4 or higher)
 * @param {(Buffer|string)} [options.sslCert=null] String or buffer containing the certificate we wish to present (needs to have a mongod server with ssl support, 2.4 or higher)
 * @param {(Buffer|string)} [options.sslKey=null] String or buffer containing the certificate private key we wish to present (needs to have a mongod server with ssl support, 2.4 or higher)
 * @param {(Buffer|string)} [options.sslPass=null] String or buffer containing the certificate password (needs to have a mongod server with ssl support, 2.4 or higher)
 * @param {object} [options.socketOptions=null] Socket options
 * @param {boolean} [options.socketOptions.autoReconnect=false] Reconnect on error.
 * @param {boolean} [options.socketOptions.noDelay=true] TCP Socket NoDelay option.
 * @param {number} [options.socketOptions.keepAlive=0] TCP KeepAlive on the socket with a X ms delay before start.
 * @param {number} [options.socketOptions.connectTimeoutMS=0] TCP Connection timeout setting
 * @param {number} [options.socketOptions.socketTimeoutMS=0] TCP Socket timeout setting
 * @param {number} [options.reconnectTries=30] Server attempt to reconnect #times
 * @param {number} [options.reconnectInterval=1000] Server will wait # milliseconds between retries
 * @fires Server#connect
 * @fires Server#close
 * @fires Server#error
 * @fires Server#timeout
 * @fires Server#parseError
 * @fires Server#reconnect
 * @return {Server} a Server instance.
 */
var Server = function(host, port, options) {
  const self = this;

  // Make sure it is always called from this context

  for(var key in self){
    if(!(self[key] instanceof Function)){
      continue;
    }
    self[key] = self[key].bind(this);
  }

  options.wireProtocolHandler = new ThreeTwoWireProtocolSupport( new TwoSixWireProtocolSupport( ) );

  MongoDB.Server.call(this, host, port, options);
  this.cs = this.s.server;
  this.cs.command = this.command.bind(this);

  // Both implement the same functions, we will just mock this
  // Need to define the property so we don't get circular
  Object.defineProperty(this.s, 'server', {
    get: function(){
      return {
        bson: self.cs.s.bson,
        parserType: self.parserType.bind(self),
        connect: self.connect.bind(self),
        capabilities: self.capabilities.bind(self),
        command: self.command.bind(self),
        insert: self.insert.bind(self),
        update: self.update.bind(self),
        remove: self.remove.bind(self),
        isConnected: self.isConnected.bind(self),
        isDestroyed: self.isDestroyed.bind(self),
        cursor: self.cursor.bind(self),
        setBSONParserType: self.setBSONParserType.bind(self),
        lastIsMaster: self.lastIsMaster.bind(self),
        close: self.close.bind(self),
        destroy: self.destroy.bind(self),
        auth: self.auth.bind(self),
        connections: self.connections.bind(self),
        getServer: self.getServer.bind(self.cs),
        getCallbacks: self.cs.getCallbacks.bind(self.cs),
        pool: self,
        s: self.cs.s
      };
    }
  });
  Object.defineProperty(this.cs.s, 'pool', {
    get: function(){
      return self;
    }
  });


  this.$mocked = {
    connected: false,
    destroyed: false,
    db: null,
    options: null
  };
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

Util.inherits(Server, MongoDB.Server);

var define = Server.define = new Define('Server', Server, false);

Server.prototype.parserType = function() {
  return MongoDB.Server.prototype.parseType.call(this);
};

Server.prototype.connect = function(db, _options, callback) {
  setTimeout(this._connect.bind(this, db, _options, callback), 1);
};

Server.prototype._connect = function(db, _options, callback) {
  this.$mocked.db = db;
  this.$mocked.options = _options;
  this.cs.s.disconnectHandler = null;
  this.emit('connect', this);
  this.emit('open', this);
  this.$mocked.connected = true;
  callback(null, this);
};

Server.prototype.capabilities = function() {
  return MongoDB.Server.prototype.capabilities.call(this);
};

Server.prototype.command = function(ns, cmd, options, callback) {
  Command(this, this.$mocked.db, ns, cmd, options, callback);
};

Server.prototype.insert = function(ns, ops, options, callback) {
  this.cs.insert(ns, ops, options, callback);
};

Server.prototype.update = function(ns, ops, options, callback) {
  this.cs.update(ns, ops, options, callback);
};

Server.prototype.remove = function(ns, ops, options, callback) {
  this.cs.remove(ns, ops, options, callback);
};

Server.prototype.isConnected = function() {
  return this.$mocked.connected;
};

Server.prototype.isDestroyed = function(){
  return this.$mocked.destroyed;
};

Server.prototype.cursor = function(ns, cmd, options) {
  //return this.command(ns, cmd, options, null);
  options.disconnectHandler = this.s.store;
  return this.cs.cursor(ns, cmd, options);
};

Server.prototype.setBSONParserType = function(type) {
  MongoDBCore.Server.prototype.setBSONParserType.call(this,type);
};

Server.prototype.lastIsMaster = function() {
  // See https://docs.mongodb.org/manual/reference/command/isMaster/
  return {
    ismaster: true,
    maxBsonObjectSize: 16 * 1024 * 1024,
    maxMessageSizeBytes: 48000000,
    localTime: new Date( ),
    maxWireVersion: 3,
    minWireVersion: 3,
    ok: 1
  }
};


Server.prototype.close = function(forceClosed) {
  //throw new Error("No close");
  this.$mocked.connected = false;
  this.$mocked.destroyed = true;
  this.$mocked.forceClosed = forceClosed;
};

Server.prototype.auth = function() {
  throw new Error( "Not Implemented" );
};

Server.prototype.connections = function() {
  throw new Error( "Not Implemented" );
};


/*
Implementation of mongodb-core/lib/server
 */

Server.prototype.destroy = Server.prototype.close;

Server.prototype.getServer = function(){
  return this
};

/*
Implementation of mongodb-core/lib/connection/pool
 */

Server.prototype.write = function(cmd, _callback){
  const callback = function(err, result){
    if(!(_callback instanceof Function)){
      return;
    }
    if(!(err instanceof Error) && !result){
      result = err;
      err = undefined;
    }
    _callback(err, result);
  };
  if(cmd instanceof CoreQuery) {
    cmd.options.query = cmd;
    this.command(cmd.ns, cmd.query, cmd.options, callback);
  } else {
    throw new Error("Can't write");
  }
};

module.exports = Server;