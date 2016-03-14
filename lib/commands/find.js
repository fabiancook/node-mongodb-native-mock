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
const Document = require('../document'),
      Field = require('../document/field'),
      Q = require('q'),
      Chance = require('chance').Chance(),
      EventEmitter = require('events'),
      BSONCompare = require('../document/match/bson-compare');

/*
 {
 "find": <string>,
 "filter": <document>,
 "sort": <document>,
 "projection": <document>,
 "hint": <document or string>,
 "skip": <int>,
 "limit": <int>,
 "batchSize": <int>,
 "singleBatch": <bool>,
 "comment": <string>,
 "maxScan": <int>,
 "maxTimeMS": <int>,
 "readConcern": <document>,
 "max": <document>,
 "min": <document>,
 "returnKey": <bool>,
 "showRecordId": <bool>,
 "snapshot": <bool>,
 "tailable": <bool>,
 "oplogReplay": <bool>,
 "noCursorTimeout": <bool>,
 "awaitData": <bool>,
 "allowPartialResults": <bool>
 }
 */

exports = module.exports = function(bson, db, ns, cmd, options, callback) {
  var cursor;
  if(cmd.find) {
    cursor = exports.getCursorOrCreate(bson, db, ns, cmd, options);
    return exports.getFirstResult(bson, cursor.id, cmd)
      .nodeify(callback);
  } else if(cmd.getMore) {
    cursor = exports.getCursorOrCreate(bson, db, ns, cmd, options);
    return exports.getMore(bson, cursor.id, cmd)
      .nodeify(callback);
  } else if(cmd.killCursors){
    return exports.deleteCursors(cmd.cursors)
      .nodeify(callback);
  } else {
    callback(null, {ok: 0});
  }
};

exports.collectionName = function(cmd) {
  return cmd.find || cmd.killCursors || cmd.collection;
};

exports.is = function(cmd, bson) {
  if(typeof cmd.find === 'string') {
    return true;
  }
  if(cmd.killCursors && cmd.cursors) {
    return true;
  }
  if(!cmd.getMore){
    return false;
  }
  const id = typeof cmd.getMore === 'number' ? bson.base.Long.fromNumber(cmd.getMore) : cmd.getMore;
  try{
    exports.getCursor(id);
    return true;
  }catch(e){
    return false;
  }
};

exports.getCursorOrCreate = function(bson, db, ns, cmd, options){
  var id;
  if(cmd.find){
    id = exports.createCursor(bson, db, ns, cmd, options);
  } else if(cmd.getMore){
    id = typeof cmd.getMore === 'number' ? bson.base.Long.fromNumber(cmd.getMore) : cmd.getMore;
  }
  return exports.getCursor(id);
};

exports._cursors = { };

exports.getNumberForId = function(id){
  if(!id){
    throw new Error("Cursor ID not given");
  }
  if(id.toNumber instanceof Function){
    return id.toNumber();
  }
  if(typeof id === 'number'){
    return id;
  }
  throw new Error('Unknown number type');
};

exports.createCursor = function(bson, db, ns, cmd, options){
  const id = bson.base.Long.fromNumber(Chance.natural());
  const cursor = new EventEmitter();
  cursor.id = id;
  cursor.documents = [];
  cursor.currentIndex = -1;
  cursor.fetching = false;
  cursor.fetched = false;
  cursor.bson = bson;
  cursor.db = db;
  cursor.ns = ns;
  cursor.cmd = cmd;
  cursor.options = options;

  if(typeof cursor.cmd.skip === 'number') {
    cursor.currentIndex = cursor.cmd.skip - 1;
  }


  exports._cursors[exports.getNumberForId(id)] = cursor;
  return id;
};

exports.deleteCursor = function(id) {
  var cursor;
  try{
    cursor = exports.getCursor(id);
  } catch(e) {
    return;
  }
  cursor.deleted = true;
  cursor.removeAllListeners();
  exports._cursors[exports.getNumberForId(id)] = undefined;
};

exports.getCursor = function(id) {
  const cursor = exports._cursors[exports.getNumberForId(id)];
  if(cursor){
    return cursor;
  }
  throw new Error("Unknown cursor");
};

exports.getFirstResult = function(bson, id, cmd) {
  const cursor = exports.getCursor(id);
  return exports.getBatch(id, cmd.limit || cursor.cmd.nextBatch || 10)
    .then(function(documents){
      const result = {};
      result.ok = 1;
      result.documents = documents;
      if(cursor.cmd.singleBatch || result.documents.length === 0) {
        exports.deleteCursor(id);
        id = bson.base.Long.ZERO;
      }
      result.cursorId = id;
      return result;
    })
};

exports.getMore = function(bson, id, cmd) {
  return exports.getBatch(id, cmd.batchSize || 1)
    .then(function(documents){
      if(documents.length === 0){
        exports.deleteCursor(id);
        id = bson.base.Long.ZERO;
      }
      return {
        ok: 1,
        documents: [
          {
            ok: 1,
            cursor: {
              id: id,
              nextBatch: documents
            }
          }
        ]
      }
    });
};

exports.deleteCursors = function(ids) {
  if(ids instanceof Array){
    ids.forEach(exports.deleteCursor);
  } else {
    exports.deleteCursor(id);
  }
  return Q({
    ok: 1
  });
};

exports.getBatch = function(id, size) {
  const documents = [];
  const fetch = function() {
    return exports.getNextDocument(id)
      .then(function(document) {
        if(!document){
          return;
        }
        documents.push(document);
        if(document.length >= size){
          return;
        }
        return fetch();
      });
  };
  return fetch()
    .then(function(){
      return documents;
    });
};

exports.getNextDocument = function(id) {
  return exports.fetch(id)
    .then(exports.getNextDocumentNoFetch.bind(exports, id));
};

exports.getNextDocumentNoFetch = function(id) {
  const cursor = exports.getCursor(id);
  const index = (cursor.currentIndex += 1);
  return cursor.documents[index] || null;
};

exports.resolveOnNext = function(id){
  const deferred = Q.defer(),
        cursor = exports.getCursor(id);

  const reject = deferred.reject;
  const resolve = deferred.resolve;
  cursor.on('error', reject);
  cursor.on('fetched', resolve);
  if(!exports.requiresCompleteFetch(id)){
    cursor.on('data', resolve);
  }
  return deferred.promise
    .finally(function(){
      cursor.removeListener('error', reject);
      cursor.removeListener('fetched', resolve);
      cursor.removeListener('data', resolve);
    });
};

exports.fetch = function(id) {
  const cursor = exports.getCursor(id);
  if(cursor.fetched){
    return Q();
  }
  if(cursor.fetching){
    return exports.resolveOnNext(id);
  }
  cursor.fetching = true;
  cursor.db.createValueStream()
    .on('data', function (document) {
      if(cursor.deleted){
        return;
      }
      document = cursor.bson.deserialize(document);
      if(!exports.isMatchingDocument(id, document)){
        return;
      }
      document = exports.projected(id, document);
      cursor.documents.push(document);
      cursor.emit('data', document);
    })
    .on('error', function(error){
      if(cursor.deleted){
        return;
      }
      cursor.fetching = false;
      cursor.error = error;
      cursor.emit('error', error);
    })
    .on('end', function(){
      if(cursor.error || cursor.deleted){
        return;
      }
      cursor.fetched = true;
      cursor.emit('fetched');
    });
  return exports.resolveOnNext(id);
};

exports.projected = function(id, document) {
  const cursor = exports.getCursor(id);
  if(!(cursor.cmd.projection instanceof Object)){
    return document;
  }
  const projection = cursor.cmd.projection;
  return Field.projectValues(document, projection);
};

exports.requiresCompleteFetch = function(id) {
  const cursor = exports.getCursor(id);
  return !!cursor.cmd.sort;
};

exports.isMatchingDocument = function(id, document) {
  const cursor = exports.getCursor(id);
  return Document.isMatch(document, cursor.cmd.filter);
};

exports.sort = function(id, documents){
  const cursor = exports.getCursor(id);
  return BSONCompare.sortBy(documents, cursor.cmd.sort);
};