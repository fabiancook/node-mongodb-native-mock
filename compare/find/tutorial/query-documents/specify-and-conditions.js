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

// https://docs.mongodb.org/manual/tutorial/query-documents/#specify-and-conditions
describe('Find - Tutorial - Query Documents - Specify AND Conditions', function(){

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

    it('should allow an insert (type: food, price: 8)', function(){
      return collection.insert({
        type: 'food',
        price: 8
      })
        .then(function(result) {
          documentIds.push(result.insertedIds[result.insertedIds.length - 1]);
        });
    });

    it('should allow an insert (type: food, price: 10)', function(){
      return collection.insert({
        type: 'food',
        price: 10
      })
        .then(function(result) {
          documentIds.push(result.insertedIds[result.insertedIds.length - 1]);
        });
    });

    it('should allow an insert (type: snacks, price: 8)', function(){
      return collection.insert({
        type: 'snacks',
        price: 8
      })
        .then(function(result) {
          documentIds.push(result.insertedIds[result.insertedIds.length - 1]);
        });
    });

    it('should allow an insert (type: snacks, price: 10)', function(){
      return collection.insert({
        type: 'snacks',
        price: 10
      })
        .then(function(result) {
          documentIds.push(result.insertedIds[result.insertedIds.length - 1]);
        });
    });

    specify('equality match on the field type and a less than ($lt) comparison match on the field price', function(){
      return collection.find({ type: 'food', price: { $lt: 9.95 } })
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