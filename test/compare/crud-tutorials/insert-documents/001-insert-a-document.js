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

// https://docs.mongodb.org/manual/tutorial/query-documents/#select-all-documents-in-a-collection
describe('Tutorial - Insert Documents - Insert a Document', function(){

  function runSpec(connect) {

    var db, collection;

    before(function(){
      return connect()
        .then(function(details) {
          db = details.db;
          collection = details.collection;
        })
    });

    specify('Insert a document into a collection.', function(){
      return collection.insert(
        {
          item: "ABC1",
          details: {
            model: "14Q3",
            manufacturer: "XYZ Company"
          },
          stock: [ { size: "S", qty: 25 }, { size: "M", qty: 50 } ],
          category: "clothing"
        }
      )
        .then(function(result) {
          Expect(result.insertedCount).to.equal(1)
        })
    });

    specify('Review the inserted document.', function(){
      return collection.find()
        .toArray()
        .then(function(documents) {
          Expect(documents).to.have.lengthOf(1);
          // Delete the _id so it matches
          // The document should have the same order as previous
          delete documents[0]._id;
          Expect(Compare.equal({
            item: "ABC1",
            details: {
              model: "14Q3",
              manufacturer: "XYZ Company"
            },
            stock: [ { size: "S", qty: 25 }, { size: "M", qty: 50 } ],
            category: "clothing"
          }, documents[0])).to.equal(true);
        });
    });

  }

  Setup.setup(runSpec);

});