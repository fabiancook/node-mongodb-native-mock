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

// https://docs.mongodb.org/manual/tutorial/remove-documents/#remove-all-documents
describe('Remove Documents - Remove All Documents', function(){

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

    it('should allow inserts', function(){
      return collection.insert({ "_id" : 902 });
    });

    specify('Remove All Documents', function(){
      return collection.remove({});
    });

    it('should have no documents', function(){
      return collection.find({})
        .toArray()
        .then(function(documents) {
          Expect(documents).to.have.lengthOf(0);
        });
    })

  }

  Setup.setup(runSpec);

});