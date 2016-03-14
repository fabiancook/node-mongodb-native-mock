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
      Field = require('../document/field'),
      BSONCompare = require('../document/match/bson-compare'),
      Document = require('../document');

exports = module.exports = function(bson, db, ns, cmd, options, callback, collection){
  const promises = cmd.updates.map(function(update){
    return exports.singleUpdate(bson, db, ns, update, options, collection);
  });

  return Q.all(promises)
    .then(function(results) {
      const result = {
        ok: 1,
        n: 0,
        nModified: 0,
        upserted: []
      };
      results.forEach(function (updateResult) {
        result.ok = updateResult.ok === 1 ? result.ok : 0;
        result.n += updateResult.n;
        result.nModified += updateResult.nModified;
        result.upserted = result.upserted.concat(updateResult.upserted ? updateResult.upserted : []);
      });
      if (result.upserted.length === 0) {
        delete result.upserted;
      }
      return {
        ok: 1,
        result: result
      };
    })
    .nodeify(callback);
};

/*{
 update: <collection>,
 updates:
 [
 { q: <query>, u: <update>, upsert: <boolean>, multi: <boolean> },
 { q: <query>, u: <update>, upsert: <boolean>, multi: <boolean> },
 { q: <query>, u: <update>, upsert: <boolean>, multi: <boolean> },
 ...
 ],
 ordered: <boolean>,
 writeConcern: { <write concern> },
 bypassDocumentValidation: <boolean>
 }*/

exports.collectionName = function(cmd) {
  return cmd.update;
};

exports.is = function(cmd) {
  return (
    typeof cmd.update === 'string' &&
    cmd.updates instanceof Array
  )
};

exports.singleUpdate = function(bson, db, ns, cmd, options, collection){

  const cursor = collection
    .find(cmd.q);

  if(!cmd.multi) {
    cursor.limit(1);
  }

  return cursor.toArray( )
    .then(function(documents) {
      if(documents.length === 0 && cmd.upsert) {
        return exports.upsert(cmd, collection);
      }
      return exports.update(bson, documents, db, cmd, options);
    });
};

exports.update = function(bson, documents, db, cmd, options) {
  const promises = documents.map(function(document){
    return exports.updateDocument(bson, document, db, cmd, documents.length > 1, options);
  });
  return Q.all(promises)
    .then(function(results){
      const modified = results.filter(function(modified){
        return !!modified;
      }).length;
      return {
        ok: 1,
        n: documents.length,
        nModified: modified
      };
    })
};

/*$inc	Increments the value of the field by the specified amount.
 $mul	Multiplies the value of the field by the specified amount.
 $rename	Renames a field.
 $setOnInsert	Sets the value of a field if an update results in an insert of a document. Has no effect on update operations that modify existing documents.
 $set	Sets the value of a field in a document.
 $unset	Removes the specified field from a document.
 $min	Only updates the field if the specified value is less than the existing field value.
 $max	Only updates the field if the specified value is greater than the existing field value.
 $currentDate	Sets the value of a field to current date, either as a Date or a Timestamp.*/

exports.updateDocument = function(bson, document, db, cmd, isMulti) {
  var modified = false;
  var operation = false;
  const promises = Object.keys(cmd.u)
    .map(function(key) {
      if(key.charAt(0) !== "$" || !(exports[key] instanceof Function)){
        return;
      }
      operation = true;
      const promise = exports[key](bson, document, cmd.u[key], cmd);
      return promise
        .then(function(_modified){
          modified = _modified;
        });
    });
  return Q.all(promises)
    .then(function(){
      if(!operation && !cmd.multi) {
        cmd.u._id = document._id;
        // If they are equal, then no modification
        modified = !BSONCompare.equal(cmd.u, document);
        document = cmd.u;
        return modified;
      } else if(!operation) {
        var error = new Error("multi update only works with $ operators");
        error.code = 9;
        return Q.reject(error);
      }
      return modified;
    })
    .then(function(modified){
      if(!modified) {
        return Q(false);
      }
      return exports.saveDocument(bson, document, db)
        .then(function(){
          return modified;
        });
    })
};

exports['$set'] = function(bson, document, update) {
  var modified = false;
  Object.keys(update)
    .forEach(function(key){
      const thisModified = Field.setValues(document, key, update[key]);
      modified = modified || thisModified;
    });
  return Q(modified);
};

exports['$inc'] = function(bson, document, update){
  var modified = false;
  Object.keys(update)
    .forEach(function(key){
      const increment = update[key];
      if(typeof increment !== "number"){
        return;
      }
      function transform(value){
        console.log(value, increment);
        //Need to move this out to take care of non primitive numbers
        if(typeof value !== 'number'){
          return 0;
        }
        return value + increment;
      }
      const thisModified = Field.setValuesTransform(document, key, transform);
      modified = modified || thisModified;
    });
  return Q(modified);
};

exports['$mul'] = function(bson, document, update) {
  var modified = false;
  Object.keys(update)
    .forEach(function(key){
      const multiplier = update[key];
      if(typeof multiplier !== "number"){
        return;
      }
      function transform(value){
        //Need to move this out to take care of non primitive numbers
        if(typeof value !== 'number'){
          return NaN;
        }
        return value * multiplier;
      }
      const thisModified = Field.setValuesTransform(document, key, transform);
      modified = modified || thisModified;
    });
  return Q(modified);
};

exports['$rename'] = function(bson, document, update) {
  var modified = false;
  Object.keys(update)
    .forEach(function(key){
      const newName = update[key];
      if(newName === key){
        return;
      }
      const values = Field.getValues(document, key);
      if(values.length !== 1) {
        return;
      }
      Field.setValues(document, key, Field.FLAG_NON_EXISTENT);
      const thisModified = Field.setValues(document, newName, values[0]);
      modified = modified || thisModified;
    });
  return Q(modified);
};

exports['$unset'] = function(bson, document, update) {
  var modified = false;
  Object.keys(update)
    .forEach(function(key){
      const thisModified = Field.setValues(document, key, Field.FLAG_NON_EXISTENT);
      modified = modified || thisModified;
    });
  return Q(modified);
};

exports['$min'] = function(bson, document, min) {
  var modified = false;
  Object.keys(update)
    .forEach(function(key){
      var min = update[key];
      const condition = function(value){
        // If value is smaller then min then compare will return -1
        return BSONCompare.compare(value, min) < 0;
      };
      const thisModified = Field.setValuesConditional(document, key, min, condition);
      modified = modified || thisModified;
    });
  return Q(modified);
};

exports['$max'] = function(bson, document, update) {
  var modified = false;
  Object.keys(update)
    .forEach(function(key){
      var max = update[key];
      const condition = function(value){
        // If value is larger then max then compare will return 1
        return BSONCompare.compare(value, max) > 0;
      };
      const thisModified = Field.setValuesConditional(document, key, max, condition);
      modified = modified || thisModified;
    });
  return Q(modified);
};

exports['$currentDate'] = function(bson, document, update) {
  var modified = false;
  Object.keys(update)
    .forEach(function(key) {
      var date = update[key];
      if(date === 'date' || date === true) {
        date = new Date();
      } else if(date === 'timestamp') {
        date = bson.base.Timestamp.fromInt(Date.now());
      } else {
        throw new Error("Invalid current date format");
      }
      const thisModified = Field.setValues(document, key, date);
      return modified = modified || thisModified;
    });
  return Q(modified);
};

/*$	Acts as a placeholder to update the first element that matches the query condition in an update.
 $addToSet	Adds elements to an array only if they do not already exist in the set.
 $pop	Removes the first or last item of an array.
 $pullAll	Removes all matching values from an array.
 $pull	Removes all array elements that match a specified query.
 $pushAll	Deprecated. Adds several items to an array.
 $push	Adds an item to an array.*/

exports['$addToSet'] = function(bson, document, update) {
  var modified = false;
  Object.keys(update)
    .forEach(function(key){
      const addToSet = key[key];
      var itemsToAdd = [];
      if(addToSet.$each){
        itemsToAdd = addToSet.$each;
      } else {
        itemsToAdd.push(addToSet);
      }
      const arrays = Field.getValues(document, key);
      itemsToAdd.forEach(function(item){
        arrays.forEach(function(array){
          if(exports.arrayIncludes(array, item)){
            return;
          }
          modified = true;
          Array.prototype.push.call(array, item);
        });
      });
    });
  return Q(modified);
};

exports['$pop'] = function(bson, document, update) {
  var modified = false;
  Object.keys(update)
    .forEach(function(key){
      const pop = key[key];
      const arrays = Field.getValues(document, key);
      arrays.forEach(function(array){
        if(!BSONCompare.isArray(array)){
          return;
        }
        if(array.length === 0){
          return;
        }
        if(pop === -1){
          Array.prototype.splice.call(array, 0, 1);
          modified = true;
        } else if(pop === 1){
          Array.prototype.splice.call(array, -1, 1);
          modified = true;
        }
      });
    });
  return Q(modified);
};

exports['$pullAll'] = function(bson, document, update) {
  var modified = false;
  Object.keys(update)
    .forEach(function(key) {
      const values = update[key];
      if(!BSONCompare.isArray(values)) {
        throw new Error("Expected array of values");
      }
      const arrays = Field.getValues(document, key);
      arrays.forEach(function(array){
        if(!BSONCompare.isArray(array)){
          return;
        }
        const itemsToRemove = [];
        Array.prototype.forEach.call(array, function(item){
          values.find(function(matcher){
            if(!BSONCompare.equal(matcher, item)){
              return false;
            }
            itemsToRemove.push(item);
            return true;
          });
        });
        itemsToRemove.forEach(function(item){
          const index = Array.prototype.indexOf.call(array, item);
          if(index === -1){
            return;
          }
          modified = true;
          Array.prototype.splice.call(array, index, 1);
        });
      });
    });
  return Q(modified);
};

exports['$pull'] = function(bson, document, update) {
  var modified = false;
  Object.keys(update)
    .forEach(function(key){
      const condition = key[key];
      const arrays = Field.getValues(document, key);
      arrays.forEach(function(array){
        var documents = array.filter(function(item) {
          var query = {
            value: condition
          };
          var document = {
            value: item
          };
          return Document.isMatch(document, query);
        });
        documents.forEach(function(document) {
          const index = array.indexOf(document);
          if(index === -1){
            return;
          }
          modified = true;
          array.splice(index, 1);
        });
      });
    });
  return Q(modified);
};

exports['$pushAll'] = function(bson, document, update) {
  var modified = false;
  Object.keys(update)
    .forEach(function(key){
    });
  return Q(modified);
};

exports['$push'] = function(bson, document, update) {
  var modified = false;
  Object.keys(update)
    .forEach(function(key){
      var valuesToPush = [];
      var slice = null;
      var sort = {};
      var position = -1;
      const push = update[key];
      if(push.$each){
        valuesToPush = push.$each;
        if(BSONCompare.isArray(push.$slice)){
          slice = Array.from(push.$slice);
        }
        if(BSONCompare.isObject(push.$sort)){
          sort = push.$sort;
        }
        if(typeof push.$position === 'number'){
          position = push.$position
        }
      }
      const arrays = Field.getValues(document, key);
      arrays.forEach(function(array){
        if(!BSONCompare.isArray(array)){
          return;
        }
        array = Array.from(array);

      })

    });
  return Q(modified);
};

/*$each	Modifies the $push and $addToSet operators to append multiple items for array updates.
 $slice	Modifies the $push operator to limit the size of updated arrays.
 $sort	Modifies the $push operator to reorder documents stored in an array.
 $position	Modifies the $push operator to specify the position in the array to add elements.*/

exports.arrayIncludes = function(array, item) {
  if(!BSONCompare.isArray(value)){
    throw new Error("Expected an array");
  }
  return !!Array.prototype.find.call(array, function(arrayItem){
    return BSONCompare.equal(arrayItem, item);
  });
};

exports.saveDocument = function(bson, document, db) {
  const deferred = Q.defer();
  db.put(bson.serialize(document._id), bson.serialize(document), deferred.makeNodeResolver());
  return deferred.promise;
};

exports.upsert = function(cmd, collection){
  cmd.u = cmd.u.$setOnInsert || cmd.$set || cmd.u;
  return collection.insert(cmd.u)
    .then(function(r) {
      cmd.u._id = r.ops[0]._id;
      return {
        ok: 1,
        nModified: 0,
        n: 1,
        upserted: [ cmd.u ]
      };
    });
};