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

// https://docs.mongodb.org/manual/tutorial/modify-documents/#update-an-embedded-field
describe('Tutorial - Modify Documents - Update an embedded field', function(){

  function runSpec(connect) {

    var db, collection;

    before(function(){
      return connect()
        .then(function(details) {
          db = details.db;
          collection = details.collection;
        })
    });

    it('should insert a document', function(){
      return collection.insert({
        item: 'ABC1',
        category: 'snacks',
        details: { cake: true, model: "14Q1" },
        lastModified: new Date(2000, 0, 1)
      });
    });

    specify('Update an embedded field', function(){
      return collection.update(
        { item: "ABC1" },
        { $set: { "details.model": "14Q2" } }
      )
        .then(function(result) {
          Expect(result.result.nModified).to.equal(1);
        });
    });

    it('should update details.model', function(){
      return collection.find({ item: "ABC1" })
        .toArray()
        .then(function(documents) {
          Expect(documents).to.have.lengthOf(1);
          Expect(documents[0].details.model).to.equal('14Q2');
        });
    });

  }

  Setup.setup(runSpec);

});