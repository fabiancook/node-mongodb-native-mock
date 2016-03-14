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
const MongoDB     = require('mongodb'),
      MongoClient = require('./lib/mongo_client'),
      connect     = MongoClient.connect;

Object.keys( MongoDB )
  .forEach(function(key){
    connect[key] = MongoDB[key];
  });

connect.MongoClient = MongoClient;
connect.Server = require('./lib/server');

connect.connect = connect;

module.exports = connect;
