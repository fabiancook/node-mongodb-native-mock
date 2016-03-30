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

const Expect      = require('chai').expect,
      MongoDb     = require('mongodb'),
      MongoDbMock = require('../../'),
      UUID        = require('node-uuid'),
      Q           = require('q');

exports.setup = function(runExternalSpec) {

  describe('-', function(){

    var databaseName,
      collectionName,
      dbOptions;

    before(function(){
      // Does the name have to start with an alpha?
      databaseName = 'a' + UUID.v4().replace(/-/g, '');
      collectionName = 'a' + UUID.v4().replace(/-/g, '');

      dbOptions = {
        promiseLibrary: Q.Promise
      };
    });

    function runSpec(connect) {

      var db, collection, collectionDeferred = Q.defer();

      before(function(){
        return connect('mongodb://localhost/' + databaseName, dbOptions)
          .then(function(_db) {
            db = _db;
          });
      });

      before(function(){
        collection = db.collection(collectionName);
      });

      before(function(){
        collectionDeferred.resolve();
      });

      function getDbAndCollection() {
        return collectionDeferred
          .promise
          .then(function(){
            return {
              db: db,
              collection: collection
            };
          });
      }

      it('should have connected', function(){
        Expect(db).to.be.instanceOf(MongoDb.Db);
      });

      it('should have returned the collection', function(){
        Expect(collection).to.be.instanceOf(MongoDb.Collection);
      });

      it('should allow all documents to be removed', function(){
        return collection.remove({});
      });

      it('should have no documents', function(){
        return collection.find({})
          .toArray()
          .then(function(documents) {
            Expect(documents).to.be.instanceOf(Array);
            Expect(documents).to.have.lengthOf(0);
          })
      });

      runExternalSpec(getDbAndCollection);
    }

    describe('Mock', function(){
      before(MongoDbMock.setup);
      after(MongoDbMock.teardown);

      runSpec(MongoDbMock.connect);
    });

  });

};
