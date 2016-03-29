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

// https://docs.mongodb.org/manual/tutorial/insert-documents/#insert-multiple-documents-with-bulk
describe('Tutorial - Insert Documents - Insert Multiple Documents with Bulk', function(){

  function runSpec(connect) {

    var db, collection;

    before(function(){
      return connect()
        .then(function(details) {
          db = details.db;
          collection = details.collection;
        })
    });

    var bulk = null;

    specify('Initialize a Bulk operations builder', function(){
      bulk = collection.initializeUnorderedBulkOp();
    });

    specify('Add insert operations to the bulk object', function(){
      return bulk.insert(
        {
          item: "BE10",
          details: { model: "14Q2", manufacturer: "XYZ Company" },
          stock: [ { size: "L", qty: 5 } ],
          category: "clothing"
        }
      );
    });

    specify('Add insert operations to the bulk object', function(){
      return bulk.insert(
        {
          item: "ZYT1",
          details: { model: "14Q1", manufacturer: "ABC Company"  },
          stock: [ { size: "S", qty: 5 }, { size: "M", qty: 5 } ],
          category: "houseware"
        }
      );
    });

    specify('Execute the bulk operation', function(){
      return bulk.execute()
        .then(function(result) {
          Expect(result.nInserted).to.equal(2);
        });
    })

  }

  Setup.setup(runSpec);

});