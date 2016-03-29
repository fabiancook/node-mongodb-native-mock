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

// https://docs.mongodb.org/manual/tutorial/modify-documents/#update-multiple-documents
describe('Tutorial - Modify Documents - Update multiple documents', function(){

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

    it('should insert a document', function(){
      return collection.insert({
        item: 'ABC2',
        category: 'clothing',
        details: { cake: true, model: "14Q1" },
        lastModified: new Date(2001, 0, 1)
      });
    });

    it('should insert a document', function(){
      return collection.insert({
        item: 'ABC3',
        category: 'clothing',
        details: { cake: true, model: "14Q1" },
        lastModified: new Date(2002, 0, 1)
      });
    });

    it('should insert a document', function(){
      return collection.insert({
        item: 'ABC4',
        category: 'clothing',
        details: { cake: true, model: "14Q1" },
        lastModified: new Date(2003, 0, 1)
      });
    });

    specify('Update multiple documents', function(){
      return collection.update(
        { category: "clothing" },
        {
          $set: { category: "apparel" },
          $currentDate: { lastModified: true }
        },
        { multi: true }
      )
        .then(function(result) {
          Expect(result.result.nModified).to.equal(3);
        });
    });

    it('should update details.model', function(){
      return collection.find({ category: "apparel" })
        .toArray()
        .then(function(documents) {
          Expect(documents).to.have.lengthOf(3);
          Expect(documents[0].category).to.equal('apparel');
          Expect(documents[1].category).to.equal('apparel');
          Expect(documents[2].category).to.equal('apparel');
        });
    });

  }

  Setup.setup(runSpec);

});