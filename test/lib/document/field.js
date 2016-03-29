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
const Expect = require('chai').expect,
  Chance = require('chance').Chance(),
  Sinon  = require('sinon'),
  Impl   = require('../../../lib/document/field');

describe('Document, Field', function() {


  describe('getValues', function(){

    specify('is a function', function(){
      Expect(Impl.getValues).to.be.instanceOf(Function);
    });

    specify('returns array', function(){
      const object = {
        key: Chance.string( )
      };
      const result = Impl.getValues(object, 'key');
      Expect(result).to.be.instanceOf(Array);
    });

    specify('returns value of simple object', function(){
      const object = {
        key: Chance.string( )
      };
      const result = Impl.getValues(object, 'key');
      Expect(result).to.include(object.key);

    });

    specify('returns value of nested object', function(){
      const object = {
        nested: {
          key: Chance.string()
        }
      };
      const result = Impl.getValues(object, 'nested.key');
      Expect(result).to.include(object.nested.key);
    });

    specify('returns value of nested array', function(){
      const object = {
        nested: [
          {
            key: Chance.string()
          }
        ]
      };
      const result = Impl.getValues(object, 'nested.key');
      Expect(result).to.include(object.nested[0].key);
    });

    specify('returns value of deeply nested array', function(){
      const object = {
        nested: [
          {
            nested: [
              {
                key: Chance.string()
              }
            ]
          }
        ]
      };
      const result = Impl.getValues(object, 'nested.nested.key');
      Expect(result).to.include(object.nested[0].nested[0].key);
    });

    specify('returns array value', function(){
      const object = {
        key: [
          Chance.string(),
          Chance.string()
        ]
      };
      const result = Impl.getValues(object, 'key');
      Expect(result[0]).to.be.instanceOf(Array);
      Expect(result[0]).to.include(object.key[0]);
      Expect(result[0]).to.include(object.key[1]);
    });

    specify('returns nested array value', function(){
      const object = {
        nested: {
          key: [
            Chance.string(),
            Chance.string()
          ]
        }
      };
      const result = Impl.getValues(object, 'nested.key');
      Expect(result[0]).to.be.instanceOf(Array);
      Expect(result[0]).to.include(object.nested.key[0]);
      Expect(result[0]).to.include(object.nested.key[1]);
    });

    specify('returns array value of nested array', function(){
      const object = {
        nested: [
          {
            key: [
              Chance.string(),
              Chance.string()
            ]
          }
        ]
      };
      const result = Impl.getValues(object, 'nested.key');
      Expect(result[0]).to.be.instanceOf(Array);
      Expect(result[0]).to.include(object.nested[0].key[0]);
      Expect(result[0]).to.include(object.nested[0].key[1]);
    });

    specify('returns array value of multiple nested arrays', function(){
      const object = {
        nested: [
          {
            key: [
              Chance.string(),
              Chance.string()
            ]
          },
          {
            key: [
              Chance.string(),
              Chance.string()
            ]
          }
        ]
      };
      const result = Impl.getValues(object, 'nested.key');
      Expect(result[0]).to.be.instanceOf(Array);
      Expect(result[1]).to.be.instanceOf(Array);
      Expect(result[0]).to.include(object.nested[0].key[0]);
      Expect(result[0]).to.include(object.nested[0].key[1]);
      Expect(result[1]).to.include(object.nested[1].key[0]);
      Expect(result[1]).to.include(object.nested[1].key[1]);
    });
  });

  describe('setValues', function(){

    specify('is a function', function(){
      Expect(Impl.setValues).to.be.instanceOf(Function);
    });

    specify('sets value that does not already exist', function(){
      const object = {},
        expected = Chance.string(),
        key = Chance.string({pool: 'abc'});
      Impl.setValues(object, key, expected);
      Expect(object[key]).to.equal(expected);
    });

    specify('sets value of simple object', function(){
      const object = {
          key: Chance.string()
        },
        expected = Chance.string();
      Impl.setValues(object, 'key', expected);
      Expect(object.key).to.equal(expected);
    });

    specify('sets nested value that does not already exist', function(){
      const object = {
          nested: { }
        },
        expected = Chance.string(),
        key = Chance.string({pool: 'abc'});
      Impl.setValues(object, 'nested.' + key, expected);
      Expect(object.nested[key]).to.equal(expected);
    });

    specify('sets value of nested object', function(){
      const object = {
          nested: {
            key: Chance.string()
          }
        },
        expected = Chance.string();
      Impl.setValues(object, 'nested.key', expected);
      Expect(object.nested.key).to.equal(expected);
    });

    specify('sets value of nested array', function(){
      const object = {
          nested: [
            {
              key: Chance.string()
            }
          ]
        },
        expected = Chance.string();
      const field = Impl.getField(object, 'nested.key');
      Impl.setValues(object, 'nested.key', expected);
      Expect(object.nested[0].key).to.equal(expected);
    });

    specify('sets value of deeply nested array', function(){
      const object = {
          nested: [
            {
              nested: [
                {
                  key: Chance.string()
                }
              ]
            }
          ]
        },
        expected = Chance.string();
      Impl.setValues(object, 'nested.nested.key', expected);
      Expect(object.nested[0].nested[0].key).to.equal(expected);
    });

    specify('sets multiple values of deeply nested array', function(){
      const object = {
          nested: [
            {
              key: [
                Chance.string(),
                Chance.string()
              ]
            },
            {
              key: [
                Chance.string(),
                Chance.string()
              ]
            }
          ]
        },
        expected = Chance.string();
      Impl.setValues(object, 'nested.key', expected);
      Expect(object.nested[0].key).to.equal(expected);
      Expect(object.nested[1].key).to.equal(expected);
    });

    specify('sets multiple values of super deeply nested array', function(){
      const object = {
          nested: [
            [
              {
                key: [
                  Chance.string(),
                  Chance.string()
                ]
              },
              {
                key: [
                  Chance.string(),
                  Chance.string()
                ]
              }
            ],
            [
              {
                key: [
                  Chance.string(),
                  Chance.string()
                ]
              },
              {
                key: [
                  Chance.string(),
                  Chance.string()
                ]
              }
            ]
          ]
        },
        expected = Chance.string();
      Impl.setValues(object, 'nested.key', expected);
      Expect(object.nested[0][0].key).to.equal(expected);
      Expect(object.nested[1][0].key).to.equal(expected);
      Expect(object.nested[0][1].key).to.equal(expected);
      Expect(object.nested[1][1].key).to.equal(expected);
    });

  });

  describe('getSettableField', function(){

    specify('is a function', function(){
      Expect(Impl.getSettableField).to.be.instanceOf(Function)
    });

    specify('returns a function', function(){
      Sinon.stub(Impl, 'getField').returns({
        settable: false,
        objects: [
          {}
        ]
      });
      const object = {
        key: Chance.string()
      };
      const result = Impl.getSettableField(object, 'key');
      Expect(result).to.be.instanceOf(Function);
      Impl.getField.restore();
    });

    specify('sets each settable field (simple)', function(){
      Sinon.stub(Impl, 'getField').returns({
        settable: false,
        objects: [
          {}
        ]
      });
      const object = {
          key: Chance.string()
        },
        details = {
          settable: true,
          field: Chance.string(),
          object: object
        };
      Sinon.stub(Impl, 'getSettableDetails').returns([details]);
      const setter = Impl.getSettableField(object, 'key');
      const expected = Chance.string();
      setter(expected);
      Expect(object[details.field]).to.equal(expected);
      Impl.getSettableDetails.restore();
      Impl.getField.restore();
    });

    specify('returns if no settable fields', function(){
      Sinon.stub(Impl, 'getField').returns({
        settable: false,
        objects: [
          {}
        ]
      });
      const object = {
        key: Chance.string()
      };
      const detailArray = [];
      Sinon.spy(detailArray, 'forEach');
      Sinon.stub(Impl, 'getSettableDetails').returns([]);
      const setter = Impl.getSettableField(object, 'key');
      const expected = Chance.string();
      setter(expected);
      // We know it loops the values if it is settable
      Expect(detailArray.forEach.called).to.equal(false);
      Impl.getSettableDetails.restore();
      Impl.getField.restore();
    });

  });

  describe('getSettableDetails', function(){

    specify('is a function', function(){
      Expect(Impl.getSettableDetails).to.be.instanceOf(Function);
    });

    specify('returns array', function(){
      const details = {
        settable: true
      };
      const result = Impl.getSettableDetails(details);
      Expect(result).to.be.instanceOf(Array)
    });

    specify('returns details if they are settable', function(){
      const details = {
        settable: true
      };
      const result = Impl.getSettableDetails(details);
      Expect(result).to.include(details);
    });

    specify('returns empty array if they not settable and no children', function(){
      const details = {
        settable: false,
        objects: []
      };
      const result = Impl.getSettableDetails(details);
      Expect(result).to.be.instanceOf(Array);
      Expect(result).to.have.lengthOf(0);
    });

    specify('returns child details if settable', function(){
      const child = {
          field: Chance.string(),
          settable: true,
          object: {},
          objects: []
        },
        details = {
          settable: false,
          objects: [ child ]
        };
      const result = Impl.getSettableDetails(details);
      Expect(result).to.include(child);
    })
  });

  describe('getField', function(){

    specify('is a function', function(){
      Expect(Impl.getField).to.be.instanceOf(Function);
    });

    specify('invokes getFieldFromObject', function(){
      const document = {},
        field = Chance.string(),
        expected = Chance.string();
      Sinon.stub(Impl, 'getFieldFromObject').returns(expected);
      Impl.getField(document, field);
      Expect(Impl.getFieldFromObject.called).to.equal(true);
      Impl.getFieldFromObject.restore();
    });

    specify('invokes getFieldFromObject with document', function(){
      const document = {},
        field = Chance.string(),
        expected = Chance.string();
      Sinon.stub(Impl, 'getFieldFromObject').returns(expected);
      Impl.getField(document, field);
      Expect(Impl.getFieldFromObject.calledWith(document)).to.equal(true);
      Impl.getFieldFromObject.restore();
    });

    specify('invokes getFieldFromObject with field', function(){
      const document = {},
        field = Chance.string(),
        expected = Chance.string();
      Sinon.stub(Impl, 'getFieldFromObject').returns(expected);
      Impl.getField(document, field);
      Expect(Impl.getFieldFromObject.calledWith(document, field)).to.equal(true);
      Impl.getFieldFromObject.restore();
    });

    specify('returns value from getFieldFromObject', function(){
      const document = {},
        field = Chance.string(),
        expected = Chance.string();
      Sinon.stub(Impl, 'getFieldFromObject').returns(expected);
      const result = Impl.getField(document, field);
      Expect(result).to.equal(expected);
      Impl.getFieldFromObject.restore();
    });

  });

  describe('buildResultForObject', function(){

    specify('is a function', function(){
      Expect(Impl.buildResultForObject).to.be.instanceOf(Function)
    });

    specify('returns an object', function(){
      const result = Impl.buildResultForObject({});
      Expect(result).to.be.instanceOf(Object);
    });

    specify('has key `object`', function(){
      const result = Impl.buildResultForObject({});
      Expect(result).to.include.key('object');
    });

    specify('has key `values`', function(){
      const result = Impl.buildResultForObject({});
      Expect(result).to.include.key('values');
    });

    specify('has key `objects`', function(){
      const result = Impl.buildResultForObject({});
      Expect(result).to.include.key('objects');
    });

    specify('has key `exists`', function(){
      const result = Impl.buildResultForObject({});
      Expect(result).to.include.key('exists');
    });

    specify('has key `next`', function(){
      const result = Impl.buildResultForObject({});
      Expect(result).to.include.key('next');
    });

    specify('has key `field`', function(){
      const result = Impl.buildResultForObject({});
      Expect(result).to.include.key('field');
    });

    specify('has key `settable`', function(){
      const result = Impl.buildResultForObject({});
      Expect(result).to.include.key('settable');
    });

    specify('property `object` is value passed', function(){
      const object = {};
      const result = Impl.buildResultForObject(object);
      Expect(result.object).to.equal(object);
    });

    specify('property `values` is empty array', function(){
      const object = {};
      const result = Impl.buildResultForObject(object);
      Expect(result.values).to.be.instanceOf(Array);
      Expect(result.values).to.have.lengthOf(0);
    });

    specify('property `objects` is empty array', function(){
      const object = {};
      const result = Impl.buildResultForObject(object);
      Expect(result.objects).to.be.instanceOf(Array);
      Expect(result.objects).to.have.lengthOf(0);
    });

    specify('property `exists` is false', function(){
      const object = {};
      const result = Impl.buildResultForObject(object);
      Expect(result.exists).to.equal(false);
    });

    specify('property `next` is false', function(){
      const object = {};
      const result = Impl.buildResultForObject(object);
      Expect(result.next).to.equal(false);
    });

    specify('property `field` is false', function(){
      const object = {};
      const result = Impl.buildResultForObject(object);
      Expect(result.field).to.equal(false);
    });

    specify('property `settable` is false', function(){
      const object = {};
      const result = Impl.buildResultForObject(object);
      Expect(result.settable).to.equal(false);
    });

  });

  describe('getSplitField', function(){

    specify('is a function', function(){
      Expect(Impl.getSplitField).to.be.instanceOf(Function);
    });

    specify('returns object', function(){
      const field = Chance.string({pool: 'abc'});
      const result = Impl.getSplitField(field);
      Expect(result).to.be.instanceOf(Object);
    });

    specify('current is passed if not dot-notation', function(){
      const field = Chance.string({pool: 'abc'});
      const result = Impl.getSplitField(field);
      Expect(result.current).to.equal(field);
    });

    specify('current is first if dot-notation', function(){
      const fieldA = Chance.string({pool: 'abc'}),
        fieldB = Chance.string({pool: 'abc'}),
        field = fieldA + '.' + fieldB;
      const result = Impl.getSplitField(field);
      Expect(result.current).to.equal(fieldA);
    });

    specify('next is last if dot-notation', function(){
      const fieldA = Chance.string({pool: 'abc'}),
        fieldB = Chance.string({pool: 'abc'}),
        field = fieldA + '.' + fieldB;
      const result = Impl.getSplitField(field);
      Expect(result.next).to.equal(fieldB);
    });

    specify('next is rest if dot-notation', function(){
      const fieldA = Chance.string({pool: 'abc'}),
        fieldB = Chance.string({pool: 'abc'}),
        fieldC = Chance.string({pool: 'abc'}),
        rest = fieldB + '.' + fieldC,
        field = fieldA + '.' + rest;
      const result = Impl.getSplitField(field);
      Expect(result.next).to.equal(rest);
    });


  });

  describe('buildResultForObjects', function(){

    specify('is a function', function(){
      Expect(Impl.buildResultForObjects).to.be.instanceOf(Function);
    });

    specify('returns object', function(){
      const object = {},
        objects = [object],
        field = Chance.string({pool:'abc'});
      const result = Impl.buildResultForObjects(objects, field);
      Expect(result).to.be.instanceOf(Object);
    });

    specify('has key `objects`', function(){
      const object = {},
        objects = [object],
        field = Chance.string({pool:'abc'});
      const result = Impl.buildResultForObjects(objects, field);
      Expect(result).to.include.key('objects');
    });

    specify('has key `field`', function(){
      const object = {},
        objects = [object],
        field = Chance.string({pool:'abc'});
      const result = Impl.buildResultForObjects(objects, field);
      Expect(result).to.include.key('field');
    });

    specify('has key `fieldDetails`', function(){
      const object = {},
        objects = [object],
        field = Chance.string({pool:'abc'});
      const result = Impl.buildResultForObjects(objects, field);
      Expect(result).to.include.key('fieldDetails');
    });

    specify('property `objects` is an array', function(){
      const object = {},
        objects = [object],
        field = Chance.string({pool:'abc'});
      const result = Impl.buildResultForObjects(objects, field);
      Expect(result.objects).to.be.instanceOf(Object);
    });

    specify('property `objects` is has length of objects passed', function(){
      const object = {},
        objects = [object],
        field = Chance.string({pool:'abc'});
      const result = Impl.buildResultForObjects(objects, field);
      Expect(result.objects).to.have.lengthOf(objects.length);
    });

    specify('property `objects` is has length of objects passed (multiple)', function(){
      const object = {},
        objects = [object, object],
        field = Chance.string({pool:'abc'});
      const result = Impl.buildResultForObjects(objects, field);
      Expect(result.objects).to.have.lengthOf(objects.length);
    });

    specify('property `objects` is results from buildResultForObject', function(){
      const objectA = {},
        objectB = {},
        objects = [objectA, objectB],
        field = Chance.string({pool:'abc'});
      Sinon.spy(Impl, 'buildResultForObject');
      const result = Impl.buildResultForObjects(objects, field);
      //Make sure it was actually executed
      Expect(Impl.buildResultForObject.calledWith(objectA)).to.equal(true);
      Expect(Impl.buildResultForObject.calledWith(objectB)).to.equal(true);
      Expect(result.objects).to.include(Impl.buildResultForObject.returnValues[0]);
      Expect(result.objects).to.include(Impl.buildResultForObject.returnValues[1]);
      Impl.buildResultForObject.restore();
    });

    specify('property `field` is the field passed', function(){
      const object = {},
        objects = [object],
        field = Chance.string({pool:'abc'});
      const result = Impl.buildResultForObjects(objects, field);
      Expect(result.field).to.equal(field);
    });

    specify('property `fieldDetails` is an object', function(){
      const object = {},
        objects = [object],
        field = Chance.string({pool:'abc'});
      const result = Impl.buildResultForObjects(objects, field);
      Expect(result.fieldDetails).to.be.instanceOf(Object);
    });

    specify('property `fieldDetails` is result from getSplitField', function(){
      const object = {},
        objects = [object],
        field = Chance.string({pool:'abc'});
      Sinon.spy(Impl, 'getSplitField');
      const result = Impl.buildResultForObjects(objects, field);
      Expect(Impl.getSplitField.calledWith(field)).to.equal(true);
      Expect(result.fieldDetails).to.equal(Impl.getSplitField.returnValues[0]);
      Impl.getSplitField.restore();
    });

  });

  describe('getFieldFromObject', function(){

    specify('is a function', function(){
      Expect(Impl.getFieldFromObject).to.be.instanceOf(Function);
    });

    specify('returns non settable if not object', function(){
      const value = Chance.string(),
        field = Chance.string({pool: 'abc'});
      const result = Impl.getFieldFromObject(value, field);
      Expect(result.objects[0].settable).to.equal(false);
    });

    specify('returns settable if object with field given', function(){
      const field = Chance.string({pool: 'abc'});
      const object = {};
      const value = Chance.string();
      object[field] = value;
      const result = Impl.getFieldFromObject(object, field);
      Expect(result.objects[0].settable).to.equal(true);
    });

    specify('returns settable if object with field not given, and not dot notation', function(){
      const field = Chance.string({pool: 'abc'});
      const object = {};
      const result = Impl.getFieldFromObject(object, field);
      Expect(result.objects[0].settable).to.equal(true);
    });

    specify('returns non settable if dot notation and current not exists', function(){
      const fieldA = Chance.string({pool: 'abc'}),
        fieldB = Chance.string({pool: 'abc'}),
        field = fieldA + '.' + fieldB;
      const object = {};
      const result = Impl.getFieldFromObject(object, field);
      Expect(result.objects[0].settable).to.equal(false);
    });

    specify('returns non settable if dot notation and current exists', function(){
      const fieldA = Chance.string({pool: 'abc'}),
        fieldB = Chance.string({pool: 'abc'}),
        field = fieldA + '.' + fieldB;
      const object = {};
      object[fieldA] = {};
      const result = Impl.getFieldFromObject(object, field);
      Expect(result.objects[0].settable).to.equal(false);
    });

    specify('returns not exists if object with field not given, and not dot notation', function(){
      const field = Chance.string({pool: 'abc'});
      const object = {};
      const result = Impl.getFieldFromObject(object, field);
      Expect(result.objects[0].exists).to.equal(false);
    });

    specify('returns not exists if dot notation and current not exists', function(){
      const fieldA = Chance.string({pool: 'abc'}),
        fieldB = Chance.string({pool: 'abc'}),
        field = fieldA + '.' + fieldB;
      const object = {};
      const result = Impl.getFieldFromObject(object, field);
      Expect(result.objects[0].exists).to.equal(false);
    });

    specify('returns exists if object with field given', function(){
      const field = Chance.string({pool: 'abc'});
      const object = {};
      const value = Chance.string();
      object[field] = value;
      const result = Impl.getFieldFromObject(object, field);
      Expect(result.objects[0].exists).to.equal(true);
    });

    specify('returns exists if dot notation and current and next exists', function(){
      const fieldA = Chance.string({pool: 'abc'}),
        fieldB = Chance.string({pool: 'abc'}),
        field = fieldA + '.' + fieldB;
      const value = Chance.string();
      const object = {};
      object[fieldA] = {};
      object[fieldA][fieldB] = value;
      const result = Impl.getFieldFromObject(object, field);
      Expect(result.objects[0].exists).to.equal(true);
    });

    specify('returns exists if dot notation and current and next a single value exists', function(){
      const fieldA = Chance.string({pool: 'abc'}),
        fieldB = Chance.string({pool: 'abc'}),
        field = fieldA + '.' + fieldB;
      const valueB = Chance.string();
      const object = {},
        objectB = {},
        objectC = {};
      objectB[fieldB] = valueB;
      object[fieldA] = [];
      object[fieldA].push(objectB);
      object[fieldA].push(objectC);
      const result = Impl.getFieldFromObject(object, field);
      Expect(result.objects[0].exists).to.equal(true);
    });

    specify('returns value if object with field given', function(){
      const field = Chance.string({pool: 'abc'});
      const object = {};
      const value = Chance.string();
      object[field] = value;
      const result = Impl.getFieldFromObject(object, field);
      Expect(result.objects[0].values).to.include(value);
    });

    specify('returns value if dot notation and current and next exists', function(){
      const fieldA = Chance.string({pool: 'abc'}),
        fieldB = Chance.string({pool: 'abc'}),
        field = fieldA + '.' + fieldB;
      const value = Chance.string();
      const object = {};
      object[fieldA] = {};
      object[fieldA][fieldB] = value;
      const result = Impl.getFieldFromObject(object, field);
      Expect(result.objects[0].values).to.include(value);
    });

    specify('returns values if dot notation and current and next exists', function(){
      const fieldA = Chance.string({pool: 'abc'}),
        fieldB = Chance.string({pool: 'abc'}),
        field = fieldA + '.' + fieldB;
      const valueB = Chance.string();
      const valueC = Chance.string();
      const object = {},
        objectB = {},
        objectC = {};
      objectB[fieldB] = valueB;
      objectC[fieldB] = valueC;
      object[fieldA] = [];
      object[fieldA].push(objectB);
      object[fieldA].push(objectC);
      const result = Impl.getFieldFromObject(object, field);
      Expect(result.objects[0].values).to.include(valueB);
      Expect(result.objects[0].values).to.include(valueC);
    });

    specify('returns exists if dot notation and current and next a single value exists', function(){
      const fieldA = Chance.string({pool: 'abc'}),
        fieldB = Chance.string({pool: 'abc'}),
        field = fieldA + '.' + fieldB;
      const valueB = Chance.string();
      const object = {},
        objectB = {},
        objectC = {};
      objectB[fieldB] = valueB;
      object[fieldA] = [];
      object[fieldA].push(objectB);
      object[fieldA].push(objectC);
      const result = Impl.getFieldFromObject(object, field);
      Expect(result.objects[0].values).to.include(valueB);
    });

  });

});