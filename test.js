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
const MongoDb = require('./'),
      Q       = require('q');

const options = {
  promiseLibrary: Q.Promise
};

MongoDb.connect("mongodb://localhost/db", options, function(err, db){
  if(err) return console.error(err);
  console.log('Have connection');

  const collection = db.collection('test');

  collection.insertMany([{ key: 1.44}])
    .then(function(result){
      console.log("Inserted", result);
      return collection.update(
        {
          _id: result.ops[0]._id
        },
        {
          $mul: {
            key: 13.4
          }
        }
      )
        .then(function(f){
          console.log(f);
          return collection.find({_id: result.ops[0]._id}).limit(1).toArray()
        })
        .then(function(f){
          console.log(f);
          return collection.update(
            {
              _id: result.ops[0]._id
            },
            {
              key: 1
            }
          );
        })
    })
    .then(function(result){
      console.log(result);
    })
    .catch(function(error){
      console.error("Error", error);
      console.error("Error message", error.message);
      console.error("Error stack", error.stack)
    })
    .finally(function(){
      db.close()
    });
});
