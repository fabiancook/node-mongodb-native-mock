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

// https://docs.mongodb.org/manual/tutorial/query-documents/#specify-and-as-well-as-or-conditions
describe('Find - Tutorial - Query Documents - Specify AND as well as OR Conditions', function(){

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

    it('should allow an insert (type: food, qty: 200)', function(){
      return collection.insert({
        type: 'food',
        qty: 200
      })
        .then(function(result) {
          documentIds.push(result.insertedIds[result.insertedIds.length - 1]);
        });
    });

    it('should allow an insert (type: snacks, qty: 200)', function(){
      return collection.insert({
        type: 'snacks',
        qty: 200
      })
        .then(function(result) {
          documentIds.push(result.insertedIds[result.insertedIds.length - 1]);
        });
    });

    it('should allow an insert (type: food, qty: 50)', function(){
      return collection.insert({
        type: 'food',
        qty: 50
      })
        .then(function(result) {
          documentIds.push(result.insertedIds[result.insertedIds.length - 1]);
        });
    });

    it('should allow an insert (type: food, price: 8)', function(){
      return collection.insert({
        type: 'food',
        price: 8
      })
        .then(function(result) {
          documentIds.push(result.insertedIds[result.insertedIds.length - 1]);
        });
    });

    it('should allow an insert (type: food, price: 20)', function(){
      return collection.insert({
        type: 'food',
        price: 20
      })
        .then(function(result) {
          documentIds.push(result.insertedIds[result.insertedIds.length - 1]);
        });
    });

    specify('the value of the type field is \'food\' and either the qty has a value greater than ($gt) 100 or the value of the price field is less than ($lt) 9.95', function(){
      return collection.find({
        type: 'food',
        $or: [ { qty: { $gt: 100 } }, { price: { $lt: 9.95 } } ]
      })
        .toArray()
        .then(function(documents){
          Expect(documents).to.be.instanceOf(Array);
          Expect(documents).to.have.lengthOf(2);

          Expect(documents[0]._id.toString()).to.be.oneOf([
            documentIds[0].toString(),
            documentIds[3].toString()
          ]);
          Expect(documents[1]._id.toString()).to.be.oneOf([
            documentIds[0].toString(),
            documentIds[3].toString()
          ]);
        });
    });

  }

  Setup.setup(runSpec);

});
