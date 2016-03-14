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
const Path = require('path');

exports.loadFromCore = function(path) {
  const coreDirectory = exports.getCoreDirectory();
  if(path == null || path === '/') {
    path = '';
  }
  path = Path.join(coreDirectory, path);
  return exports.require(path);
};

exports.require = function(path) {
  return require(path);
};

exports.getCoreDirectory = function() {
  const index = exports.getCoreIndexPath();
  if(Path.basename(index, '.js') !== 'index') {
    // Did they change their structure?
    return index;
  }
  return Path.dirname(index);
};

exports.getCoreIndexPath = function() {
  // Try to get `mongodb-core` from `mongodb`, we want to use what ever `mongodb` is using
  try {
    return exports.requireResolve('mongodb/node_modules/mongodb-core');
  } catch(e) { }
  // Try and get `mongodb-core` in general, guess we can't do much else
  return exports.requireResolve('mongodb-core');
};

exports.requireResolve = function(path) {
  return require.resolve(path);
};