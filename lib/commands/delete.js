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
const Q = require('q'),
      BSONCompare = require('../document/match/bson-compare'),
      Insert = require('./insert');

exports = module.exports = function(bson, db, ns, cmd, options, callback, collection) {

  const result = {
    ok: 1,
    n: 0
  };

  const promise = cmd.deletes.reduce(function(promise, del, index){
    return promise
      .then(function(){
        return exports.deleteDocuments(bson, db, del, collection);
      })
      .then(function(count){
        result.n += count || 0;
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
      }
    })
    .nodeify(callback);
};

exports.collectionName = function(cmd) {
  return cmd.delete;
};

exports.is = function(cmd) {
  return typeof cmd.delete === 'string' && cmd.deletes instanceof Array;
};

exports.deleteDocuments = function(bson, db, cmd, collection) {
  return collection
    .find(cmd.q, { _id: 1 })
    .limit(cmd.limit)
    .toArray()
    .then(function(documents){
      return Q.all(documents.map(exports.deleteDocument.bind(exports, bson, db, cmd, collection)))
        .then(function(results){
          return results.filter(function(result) {
            return !!result;
          }).length;
        });
    });
};

exports.deleteDocument = function(bson, db, cmd, collection, document) {
  const id = Insert.getSerializedId(bson, document);
  const deferred = Q.defer();
  db.del(id, deferred.makeNodeResolver());
  return deferred
    .promise
    .then(function(){
      // Always return true for now, later we may want to return false if we can't find the document
      return true;
    });
};