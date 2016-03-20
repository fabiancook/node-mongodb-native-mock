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

// https://docs.mongodb.org/manual/tutorial/query-documents/#specify-or-conditions
describe('Find - Tutorial - Query Documents - Specify OR Conditions', function(){

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

    it('should allow an insert (qty: 200, price: 8)', function(){
      return collection.insert({
        qty: 200,
        price: 8
      })
        .then(function(result) {
          documentIds.push(result.insertedIds[result.insertedIds.length - 1]);
        });
    });

    it('should allow an insert (qty: 50, price: 5)', function(){
      return collection.insert({
        qty: 50,
        price: 5
      })
        .then(function(result) {
          documentIds.push(result.insertedIds[result.insertedIds.length - 1]);
        });
    });

    it('should allow an insert (qty: 200, price: 10)', function(){
      return collection.insert({
        qty: 200,
        price: 10
      })
        .then(function(result) {
          documentIds.push(result.insertedIds[result.insertedIds.length - 1]);
        });
    });

    it('should allow an insert (qty: 50, price: 20)', function(){
      return collection.insert({
        qty: 50,
        price: 20
      })
        .then(function(result) {
          documentIds.push(result.insertedIds[result.insertedIds.length - 1]);
        });
    });

    specify(' where the field qty has a value greater than ($gt) 100 or the value of the price field is less than ($lt) 9.95', function(){
      return collection.find({
          $or: [ { qty: { $gt: 100 } }, { price: { $lt: 9.95 } } ]
        })
        .toArray()
        .then(function(documents){
          Expect(documents).to.be.instanceOf(Array);
          Expect(documents).to.have.lengthOf(3);

          Expect(documents[0]._id.toString()).to.be.oneOf([documentIds[0].toString(), documentIds[1].toString(), documentIds[2].toString()]);
          Expect(documents[1]._id.toString()).to.be.oneOf([documentIds[0].toString(), documentIds[1].toString(), documentIds[2].toString()]);
          Expect(documents[2]._id.toString()).to.be.oneOf([documentIds[0].toString(), documentIds[1].toString(), documentIds[2].toString()]);

        });
    });

  }

  Setup.setup(runSpec);

});