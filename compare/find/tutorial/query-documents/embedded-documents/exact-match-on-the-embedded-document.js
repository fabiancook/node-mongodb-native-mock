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
  Setup       = require('../../../../setup');

// https://docs.mongodb.org/manual/tutorial/query-documents/#exact-match-on-the-embedded-document
describe('Find - Tutorial - Query Documents - Embedded Documents - Exact Match on the Embedded Document', function(){

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

    it('should allow an insert (matched document)', function(){
      return collection.insert({
          producer: {
            company: 'ABC123',
            address: '123 Street'
          }
        })
        .then(function(result) {
          documentIds.push(result.insertedIds[result.insertedIds.length - 1]);
        });
    });

    it('should allow an insert (non-matched document)', function(){
      return collection.insert({
          producer: {
            company: 'ABC123',
            address: '123 Street',
            name: 'ABC Ltd'
          }
        })
        .then(function(result) {
          documentIds.push(result.insertedIds[result.insertedIds.length - 1]);
        });
    });

    specify('where the value of the field producer is an embedded document that contains only the field company with the value \'ABC123\' and the field address with the value \'123 Street\', in the exact order', function(){
      return collection.find({
          producer: {
            company: 'ABC123',
            address: '123 Street'
          }
        })
        .toArray()
        .then(function(documents){
          Expect(documents).to.be.instanceOf(Array);
          Expect(documents).to.have.lengthOf(1);

          Expect(documents[0]._id.toString()).to.equal(documentIds[0].toString());
        });
    });

  }

  Setup.setup(runSpec);

});