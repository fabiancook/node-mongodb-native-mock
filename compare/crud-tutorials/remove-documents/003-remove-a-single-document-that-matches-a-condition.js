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
  Setup       = require('../../setup'),
  Compare     = require('../../../lib/document/match/bson-compare');

// https://docs.mongodb.org/manual/tutorial/remove-documents/#remove-a-single-document-that-matches-a-condition
describe.only('Remove Documents - Remove a Single Document that Matches a Condition', function(){

  function runSpec(connect) {

    var db, collection;

    before(function(){
      return connect()
        .then(function(details) {
          db = details.db;
          collection = details.collection;
        })
    });

    it('should allow inserts', function(){
      return collection.insert({ "name": "burgers", "type" : "food" });
    });

    it('should allow inserts', function(){
      return collection.insert({ "name": "coke", "type" : "drinks" });
    });

    it('should allow inserts', function(){
      return collection.insert({ "name": "fries", "type" : "food" });
    });

    specify('Remove a Single Document that Matches a Condition', function(){
      return collection.remove({ "type": "food" }, { single: true });
    });

    it('should have no documents', function(){
      return collection.find({})
        .toArray()
        .then(function(documents) {
          Expect(documents).to.have.lengthOf(2);
        });
    })

  }

  Setup.setup(runSpec);

});