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

// https://docs.mongodb.org/manual/tutorial/modify-documents/#update-specific-fields-in-a-document
describe('Tutorial - Modify Documents - Update Specific Fields in a Document', function(){

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
        item: 'MNO2',
        category: 'snacks',
        details: { cake: true, model: "14Q2", manufacturer: "ABC Company" },
        lastModified: new Date(2000, 0, 1)
      });
    });

    specify('Use update operators to change field values', function(){
      return collection.update(
        { item: "MNO2" },
        {
          $set: {
            category: "apparel",
            details: { model: "14Q3", manufacturer: "XYZ Company" }
          },
          $currentDate: { lastModified: true }
        }
      )
        .then(function(result) {
          Expect(result.result.nModified).to.equal(1);
        });
    });

    it('Should have updated the lastModified date', function(){
      return collection.find({ item: "MNO2" })
        .toArray()
        .then(function(documents) {
          Expect(documents).to.have.lengthOf(1);
          Expect(documents[0].lastModified).to.be.instanceOf(Date);
          // It shouldn't take a second to get here right?
          Expect(documents[0].lastModified.getTime()).to.be.above(Date.now() - 1000);
        });
    });

    it('Should have updated the category', function(){
      return collection.find({ item: "MNO2" })
        .toArray()
        .then(function(documents) {
          Expect(documents).to.have.lengthOf(1);
          Expect(documents[0].category).to.equal('apparel');
        });
    });

    it('Should have updated the details', function(){
      return collection.find({ item: "MNO2" })
        .toArray()
        .then(function(documents) {
          Expect(documents).to.have.lengthOf(1);
          Expect(Compare.equal(documents[0].details, { model: "14Q3", manufacturer: "XYZ Company" })).to.equal(true);
        });
    });

  }

  Setup.setup(runSpec);

});