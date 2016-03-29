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

// https://docs.mongodb.org/manual/tutorial/query-documents/#match-a-field-in-the-embedded-document-using-the-array-index
describe('Find - Tutorial - Query Documents - Arrays - Match a Field in the Embedded Document Using the Array Index', function(){

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
      return collection.insert({
          _id: 100,
          type: "food",
          item: "xyz",
          qty: 25,
          price: 2.5,
          ratings: [ 5, 8, 9 ],
          memos: [ { memo: "on time", by: "shipping" }, { memo: "approved", by: "billing" } ]
        }
      );
    });

    it('should allow inserts', function(){
      return collection.insert({
        _id: 101,
        type: "fruit",
        item: "jkl",
        qty: 10,
        price: 4.25,
        ratings: [ 5, 9 ],
        memos: [ { memo: "on time", by: "payment" }, { memo: "delayed", by: "shipping" } ]
      });
    });

    specify('query', function(){
      return collection.find({ 'memos.0.by': 'shipping' })
        .toArray()
        .then(function(documents){
          Expect(documents).to.be.instanceOf(Array);
          Expect(documents).to.have.lengthOf(1);

          Expect(documents[0]._id).to.be.oneOf([
            100
          ]);

          Expect((
            Compare.equal({
              _id: 100,
              type: "food",
              item: "xyz",
              qty: 25,
              price: 2.5,
              ratings: [ 5, 8, 9 ],
              memos: [ { memo: "on time", by: "shipping" }, { memo: "approved", by: "billing" } ]
            }, documents[0])
          )).to.equal(true);
        });
    });

  }

  Setup.setup(runSpec);

});