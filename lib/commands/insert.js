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
const Q = require('q');


exports = module.exports = function(bson, db, ns, cmd, options, callback) {

  const result = {
    ok: 1,
    n: 0
  };

  const promise = cmd.documents.reduce(function(promise, document, index){
    return promise
      .then(function(){
        return exports.insertDocument(bson, db, cmd, document);
      })
      .then(function(){
        result.n += 1;
      })
      .catch(function(error){
        result.writeErrors = result.writeErrors || [];
        result.writeErrors.push({
          index: index,
          code: error.code,
          errmsg: error.message
        });
        if(cmd.ordered){
          return;
        }
        throw error;
      });
  }, Q( ) );

  return promise
    .catch(function(){ })
    .then(function(){
      return {
        ok: 1,
        result: result
      };
    })
    .nodeify(callback);
};

exports.collectionName = function(cmd) {
  return cmd.insert;
};

exports.is = function(cmd) {
  return (
    typeof cmd.insert === 'string' &&
    cmd.documents instanceof Array
  )
};

exports.insertDocument = function(bson, db, cmd, document){
  return exports.checkDuplicate(bson, db, cmd, document)
    .then(function(){
      const id = exports.getSerializedId(bson, document);
      const deferred = Q.defer();
      db.put(id, bson.serialize(document), deferred.makeNodeResolver());
      return deferred.promise;
    });
};

exports.getSerializedId = function(bson, document) {
  if(document._id instanceof bson.base.ObjectID || document._id instanceof Object) {
    return bson.serialize(document._id);
  }
  return bson.serialize({
    oid: document._id
  });
};

exports.checkDuplicate = function(bson, db, cmd, document) {

  const deferred = Q.defer();

  const id = exports.getSerializedId(bson, document);

  db.get(id.toString('base64'), deferred.makeNodeResolver());

  return deferred.promise
    .then(function(){
      var msg = "insertDocument :: caused by :: 11000 E11000 duplicate key error index: " + '' + "." + cmd.insert + ".$_id_  dup key: { : " + document._id.toString( ) + " }";
      var error = new Error( msg );
      error.code = 11000;
      throw error;
    })
    .catch(function(error){
      if(error.notFound){
        return;
      }
      throw error;
    });
};