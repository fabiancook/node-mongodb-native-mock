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

// https://docs.mongodb.org/manual/tutorial/modify-documents/#specify-upsert-true-for-the-update-specific-fields-operation
describe('Tutorial - Modify Documents - Specify upsert: true for the update specific fields operation', function(){

  function runSpec(connect) {

    var db, collection, id;

    before(function(){
      return connect()
        .then(function(details) {
          db = details.db;
          collection = details.collection;
        })
    });

    specify('Specify upsert: true for the update specific fields operation', function(){
      return collection.update(
        { item: "TBD2" },
        {
          $set: {
            details: { "model" : "14Q3", "manufacturer" : "IJK Co." },
            category: "houseware"
          }
        },
        { upsert: true }
      )
        .then(function(result) {
          Expect(result.result.nUpserted).to.equal(1);
          Expect(!!result.result._id).to.equal(true);
          id = result.result._id;
        });
    });

    it('should have inserted', function(){
      return collection.find({_id: id})
        .toArray()
        .then(function(documents) {
          Expect(documents).to.have.lengthOf(1);
          delete documents[0]._id;
          Expect(Compare.equal(
            documents[0],
            {
              item: "TBD2",
              details: { "model" : "14Q3", "manufacturer" : "IJK Co." },
              category: "houseware"
            }
          )).to.equal(true);
        });
    });

  }

  Setup.setup(runSpec);

});