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
  Setup       = require('../../setup');

// https://docs.mongodb.org/manual/tutorial/query-documents/#specify-conditions-using-query-operators
describe('Find - Tutorial - Query Documents - Specify Conditions Using Query Operators', function(){

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

    it('should allow an insert (food)', function(){
      return collection.insert({
        type: 'food'
      })
        .then(function(result) {
          documentIds.push(result.insertedIds[result.insertedIds.length - 1]);
        });
    });

    it('should allow an insert (snacks)', function(){
      return collection.insert({
        type: 'snacks'
      })
        .then(function(result) {
          documentIds.push(result.insertedIds[result.insertedIds.length - 1]);
        });
    });

    it('should allow an insert (drinks)', function(){
      return collection.insert({
        type: 'drinks'
      })
        .then(function(result) {
          documentIds.push(result.insertedIds[result.insertedIds.length - 1]);
        });
    });

    specify('where the value of the type field is either \'food\' or \'snacks\'', function(){
      return collection.find({ type: { $in: [ 'food', 'snacks' ] } })
        .toArray()
        .then(function(documents){
          Expect(documents).to.be.instanceOf(Array);
          Expect(documents).to.have.lengthOf(2);

          Expect(documents[0]._id.toString()).to.be.oneOf([documentIds[0].toString(), documentIds[1].toString()]);
        });
    });

  }

  Setup.setup(runSpec);

});