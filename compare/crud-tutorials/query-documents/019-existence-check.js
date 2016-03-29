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

// https://docs.mongodb.org/manual/tutorial/query-documents/#existence-check
describe('Find - Tutorial - Query Documents - Existence Check', function(){

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
      return collection.insert({ "_id" : 900, "item" : null });
    });

    it('should allow inserts', function(){
      return collection.insert({ "_id" : 901 });
    });

    specify('query', function(){
      return collection.find({ item: null })
        .toArray()
        .then(function(documents){
          Expect(documents).to.be.instanceOf(Array);
          Expect(documents).to.have.lengthOf(2);

          Expect(documents[0]._id).to.be.oneOf([
            900, 901
          ]);

          Expect((
            Compare.equal({ "_id" : 900, "item" : null }, documents[0]) ||
            Compare.equal({ "_id" : 900, "item" : null }, documents[0])
          )).to.equal(true);

          Expect((
            Compare.equal({ "_id" : 901 }, documents[1]) ||
            Compare.equal({ "_id" : 901 }, documents[1])
          )).to.equal(true);
        });
    });

  }

  Setup.setup(runSpec);

});