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
      Q           = require('q'),
      Setup       = require('../../../setup');

// https://docs.mongodb.org/manual/tutorial/query-documents/#select-all-documents-in-a-collection
describe('Find - Tutorial - Query Documents - Select All Documents in a Collection', function(){

  function runSpec(connect) {

    var db, collection;

    before(function(){
      return connect()
        .then(function(details) {
          db = details.db;
          collection = details.collection;
        })
    });

    const documentIds = [];

    it('should allow an insert', function(){
      return collection.insert({})
        .then(function(result) {
          documentIds.push(result.insertedIds[result.insertedIds.length - 1]);
        });
    });

    specify('An empty query document ({}) selects all documents in the collection', function(){
      return collection.find({})
        .toArray()
        .then(function(documents){
          Expect(documents).to.be.instanceOf(Array);
          Expect(documents).to.have.lengthOf(1);
        });
    });

    specify('Not specifying a query document to the find() is equivalent to specifying an empty query document', function(){
      return collection.find()
        .toArray()
        .then(function(documents){
          Expect(documents).to.be.instanceOf(Array);
          Expect(documents).to.have.lengthOf(1);

          Expect(documents[0]._id.toString()).to.equal(documentIds[0].toString());
        });
    });

  }

  Setup.setup(runSpec);

});