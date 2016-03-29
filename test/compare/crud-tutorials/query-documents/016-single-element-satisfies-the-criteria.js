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
  Compare     = require('../../../../lib/document/match/bson-compare');

// https://docs.mongodb.org/manual/tutorial/query-documents/#single-element-satisfies-the-criteria
describe('Find - Tutorial - Query Documents - Arrays - Single Element Satisfies the Criteria', function(){

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
      return collection.insert({ _id: 5, type: "food", item: "aaa", ratings: [ 5, 8, 9 ] });
    });

    it('should allow inserts', function(){
      return collection.insert({ _id: 6, type: "food", item: "bbb", ratings: [ 5, 9 ] });
    });

    it('should allow inserts', function(){
      return collection.insert({ _id: 7, type: "food", item: "ccc", ratings: [ 9, 5, 8 ] });
    });

    specify('query', function(){
      return collection.find({ ratings: { $elemMatch: { $gt: 5, $lt: 9 } } })
        .toArray()
        .then(function(documents){
          Expect(documents).to.be.instanceOf(Array);
          Expect(documents).to.have.lengthOf(2);

          Expect(documents[0]._id).to.be.oneOf([
            5, 7
          ]);
          Expect(documents[1]._id).to.be.oneOf([
            5, 7
          ]);

          Expect((
            Compare.equal({ "_id" : 5, "type" : "food", "item" : "aaa", "ratings" : [ 5, 8, 9 ] }, documents[0]) ||
            Compare.equal({ "_id" : 5, "type" : "food", "item" : "aaa", "ratings" : [ 5, 8, 9 ] }, documents[1])
          )).to.equal(true);

          Expect((
            Compare.equal({ "_id" : 7, "type" : "food", "item" : "ccc", "ratings" : [ 9, 5, 8 ] }, documents[0]) ||
            Compare.equal({ "_id" : 7, "type" : "food", "item" : "ccc", "ratings" : [ 9, 5, 8 ] }, documents[1])
          )).to.equal(true);
        });
    });

  }

  Setup.setup(runSpec);

});