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
const isPlainObject = require('is-plain-object');

exports.equal = function(valueA, valueB) {
  const result = exports.compareBase(valueA, valueB);
  if(result.flag !== exports.EQUAL_VALUE){
    return false;
  }
  return result.comparison.is(valueA) && result.comparison.is(valueB);
};

exports.sortBy = function(values, fields) {
  values.sort(function(valueA, valueB) {
    return exports.compareBy(valueA, valueB, fields);
  });
  return values;
};

exports.compareBy = function(valueA, valueB, fields) {
  return Object.keys(fields)
    .reduce(function(result, field){
      if(result !== 0){
        return result;
      }
      const direction = fields[field];
      const fieldA = valueA instanceof Object ? valueA[field] : undefined;
      const fieldB = valueB instanceof Object ? valueB[field] : undefined;
      return exports.compare(fieldA, fieldB);
    }, 0);
};

// 0 if they are the same, 1 if a is greater, and -1 if b is greater.

exports.compare = function(valueA, valueB) {
  const result = exports.compareBase(valueA, valueB);
  if(result.flag === exports.EQUAL_VALUE){
    return 0;
  }
  return result.flag === exports.A_LARGER_VALUE ? 1 : -1;
};

exports.compareReturnFlag = function(valueA, valueB) {
  const result = exports.compareBase(valueA, valueB);
  return result.flag;
};

exports.compareBase = function(valueA, valueB) {
  var definitive = false;
  return exports['SortOrder'].reduce(function(result, comparison){
    // Definitive result
    if(definitive){
      return result;
    }
    definitive = comparison.is(valueA) && comparison.is(valueB);
    return {
      flag: comparison.compare(valueA, valueB),
      comparison: comparison
    }
  });
};

exports.A_LARGER_VALUE = Symbol('A_LARGER_VALUE');
exports.EQUAL_VALUE = Symbol('EQUAL_VALUE');
exports.B_LARGER_VALUE = Symbol('B_LARGER_VALUE');

exports.isMinKey = function(value) {
  return (
    typeof value === 'object' &&
    value['_bsontype'] == 'MinKey'
  )
};

exports.compareMinKey = function() {
  return exports.EQUAL_VALUE;
};

exports.isNull = function(value) {
  return (
    typeof value === 'undefined' ||
    value == null
  );
};

exports.compareNull = function() {
  return exports.EQUAL_VALUE;
};

exports.isNumber = function(value) {
  return typeof value === 'number';
};

exports.compareNumber = function(valueA, valueB) {
  if(!exports.isNumber(valueA) || !exports.isNumber(valueB)){
    return exports.EQUAL_VALUE;
  }
  if(valueA === valueB){
    return exports.EQUAL_VALUE;
  }
  return valueA > valueB ? exports.A_LARGER_VALUE : exports.B_LARGER_VALUE;
};

exports.isLong = function(value) {
  return (
    typeof value === 'object' &&
    value['_bsontype'] === 'Long'
  );
};

exports.getLong = function(value) {
  if(typeof value === 'number'){
    return value;
  }
  if(!exports.isLong(value) && !exports.isTimestamp(value)){
    return NaN;
  }
  if(!(value.toNumber instanceof Function)){
    return NaN;
  }
  return value.toNumber( );
};

exports.compareLong = function(valueA, valueB) {
  if(!exports.isLong(valueA) || !exports.isLong(valueB)){
    return exports.EQUAL_VALUE;
  }
  const numberA = exports.getLong(valueA);
  const numberB = exports.getLong(valueB);
  if(numberA === numberB){
    return exports.EQUAL_VALUE;
  }
  return numberA > numberB ? exports.A_LARGER_VALUE : exports.B_LARGER_VALUE;
};

exports.isDouble = function(value) {
  return (
    typeof value === 'object' &&
    value['_bsontype'] === 'Double'
  );
};

exports.getDouble = function(value) {
  if(!exports.isDouble(value)){
    return NaN;
  }
  if(typeof value.value !== 'number'){
    return NaN;
  }
  return value.value;
};

exports.compareDouble = function(valueA, valueB) {
  if(!exports.isDouble(valueA) || !exports.isDouble(valueB)){
    return exports.EQUAL_VALUE;
  }
  const numberA = exports.getDouble(valueA);
  const numberB = exports.getDouble(valueB);
  if(numberA === numberB) {
    return exports.EQUAL_VALUE;
  }
  return numberA > numberB ? exports.A_LARGER_VALUE : exports.B_LARGER_VALUE;
};

exports.isSymbol = function(value) {
  return (
    typeof value === 'object' &&
    value['_bsontype'] === 'Symbol'
  );
};

exports.compareSymbol = function(valueA, valueB) {
  if(!exports.isSymbol(valueA) || !exports.isSymbol(valueB)){
    return exports.EQUAL_VALUE;
  }
  if(valueA.value === valueB.value) {
    return exports.EQUAL_VALUE;
  }
  return valueA.value > valueB.value ? exports.A_LARGER_VALUE : exports.B_LARGER_VALUE;
};

exports.isString = function(value) {
  return typeof value === 'string';
};

exports.compareString = function(valueA, valueB) {
  if(!exports.isString(valueA) || !exports.isString(valueB)){
    return exports.EQUAL_VALUE;
  }
  if(valueA === valueB){
    return exports.EQUAL_VALUE;
  }
  return valueA > valueB ? exports.A_LARGER_VALUE : exports.B_LARGER_VALUE;
};

exports.isObject = function(value) {
  return (
    isPlainObject(value) &&
    value['_bsontype'] == null
  );
};

exports.compareObject = function(valueA, valueB) {
  if(!exports.isObject(valueA) || !exports.isObject(valueB)) {
    return exports.EQUAL_VALUE;
  }
  // They are the same object
  if(valueA === valueB){
    return exports.EQUAL_VALUE;
  }
  const keysA = Object.keys(valueA);
  const keysB = Object.keys(valueB);
  const keysCompare = exports.compareArray(keysA, keysB);
  if(keysCompare !== exports.EQUAL_VALUE){
    return keysCompare;
  }
  const valuesA = keysA.map(function(key){ return valueA[key]; });
  const valuesB = keysA.map(function(key){ return valueB[key]; });
  return exports.compareArray(valuesA, valuesB);
};

exports.isArray = function(value) {
  return (
    value instanceof Array ||
    value instanceof Int8Array ||
    value instanceof Uint8Array ||
    value instanceof Uint8ClampedArray ||
    value instanceof Int16Array ||
    value instanceof Uint16Array ||
    value instanceof Int32Array ||
    value instanceof Uint32Array ||
    value instanceof Float32Array ||
    value instanceof Float64Array
  )
};

exports.compareArray = function(valueA, valueB) {
  if(!exports.isArray(valueA) || !exports.isArray(valueB)){
    return exports.EQUAL_VALUE;
  }
  // They are the same array?
  if(valueA === valueB){
    return exports.EQUAL_VALUE;
  }
  return valueA.reduce(function(result, _, index){
    if(result !== exports.EQUAL_VALUE){
      return result;
    }
    const itemA = valueA[index];
    const itemB = valueB[index];
    return exports.compareReturnFlag(itemA, itemB);
  }, exports.EQUAL_VALUE);
};

exports.isBinData = function(value) {
  return (
    exports.isBuffer(value) ||
    exports.isBinary(value)
  );
};

exports.compareBinData = function(valueA, valueB) {
  if(!exports.isBinData(valueA) || !exports.isBinData(valueB)){
    return exports.EQUAL_VALUE;
  }
  if(exports.isBinary(valueA)){
    valueA = exports.getBufferFromBinary(valueA);
  }
  if(exports.isBinary(valueB)){
    valueB = exports.getBufferFromBinary(valueB);
  }
  if(valueA.length !== valueB.length) {
    return valueA.length > valueB.length ? exports.A_LARGER_VALUE : exports.B_LARGER_VALUE;
  }
  if(valueA.hasOwnProperty(exports.SUBTYPE_PROPERTY) && valueB.hasOwnProperty(exports.SUBTYPE_PROPERTY)) {
    return valueA[exports.SUBTYPE_PROPERTY] > valueB[exports.SUBTYPE_PROPERTY] ? exports.A_LARGER_VALUE : exports.B_LARGER_VALUE;
  }
  return Buffer.compare(valueA, valueB)
};

exports.isBuffer = function(value) {
  return Buffer.isBuffer(value);
};

exports.compareBuffer = function(valueA, valueB) {
  return exports.compareBinData(valueA, valueB);
};

exports.isBinary = function(value) {
  return (
    typeof value === 'object' &&
    value['_bsontype'] === 'Binary'
  );
};

exports.SUBTYPE_PROPERTY = Symbol('SubType');

exports.getBufferFromBinary = function(value){
  if(!exports.isBuffer(value) || !(value['value'] instanceof Function)){
    return new Buffer(0);
  }
  const buffer = value.value(true);
  buffer[exports.SUBTYPE_PROPERTY] = value.sub_type;
  return buffer;
};

exports.compareBinary = function(valueA, valueB) {
  return exports.compareBinData(valueA, valueB);
};

exports.isObjectId = function(value) {
  return (
    typeof value === 'object' &&
    value['_bsontype'] === 'ObjectID'
  )
};

exports.compareObjectId = function(valueA, valueB) {
  if(!exports.isObjectId(valueA) || !exports.isObjectId(valueB)){
    return exports.EQUAL_VALUE;
  }
  if(valueA['equals'] instanceof Function && valueA['equals'](valueB)){
    return exports.EQUAL_VALUE;
  }
  if(!(valueA['getTimestamp'] instanceof Function) || !(valueB['getTimestamp'] instanceof Function)){
    return exports.EQUAL_VALUE; //Can't tell
  }
  const timestampA = valueA.getTimestamp();
  const timestampB = valueB.getTimestamp();
  return timestampA > timestampB ? exports.A_LARGER_VALUE : exports.B_LARGER_VALUE;
};

exports.isBoolean = function(value) {
  return typeof value === 'boolean';
};

exports.compareBoolean = function(valueA, valueB) {
  if(!exports.isBoolean(valueA) || !exports.isBoolean(valueB)){
    return exports.EQUAL_VALUE;
  }
  if(valueA === valueB){
    return exports.EQUAL_VALUE;
  }
  return valueA > valueB ? exports.A_LARGER_VALUE : exports.B_LARGER_VALUE;
};

exports.isDate = function(value) {
  return value instanceof Date;
};

exports.compareDate = function(valueA, valueB) {
  if(!exports.isDate(valueA) || !exports.isDate(valueB)){
    return exports.EQUAL_VALUE;
  }
  const timestampA = valueA.getTime();
  const timestampB = valueB.getTime();
  return exports.compareTimestamp(timestampA, timestampB);
};

exports.isTimestamp = function(value) {
  return (
    exports.isNumber(value) ||
    (
      typeof value === 'object' &&
      value['_bsontype'] === 'Timestamp'
    ) ||
    (
      typeof value === 'object' &&
      value['_bsontype'] === 'Long'
    )
  );
};

exports.getTimestamp = function(value){
  return exports.getLong(value)
};

exports.compareTimestamp = function(valueA, valueB) {
  if(!exports.isTimestamp(valueA) || !exports.isTimestamp(valueB)){
    return exports.EQUAL_VALUE;
  }
  const numberA = exports.getTimestamp(valueA);
  const numberB = exports.getTimestamp(valueB);
  if(numberA === numberB){
    return exports.EQUAL_VALUE;
  }
  return numberA > numberB ? exports.A_LARGER_VALUE : exports.B_LARGER_VALUE;
};

exports.isRegularExpression = function(value) {
  return (
    value instanceof RegExp ||
    exports.isBSONRegularExpression(value)
  )
};

exports.compareRegularExpression = function(valueA, valueB) {
  if(!exports.isRegularExpression(valueA) || !exports.isRegularExpression(valueB)){
    return exports.EQUAL_VALUE;
  }
  // Same instance
  if(valueA === valueB){
    return exports.EQUAL_VALUE;
  }
  const sourceA = valueA.source;
  const sourceB = valueB.source;
  if(sourceA !== sourceB){
    return sourceA > sourceB ? exports.A_LARGER_VALUE : exports.B_LARGER_VALUE;
  }
  const flagsA = valueA.flags;
  const flagsB = valueB.flags;
  if(flagsA === flagsB){
    return exports.EQUAL_VALUE;
  }
  return flagsA > flagsB ? exports.A_LARGER_VALUE : exports.B_LARGER_VALUE;
};

exports.isBSONRegularExpression = function(value) {
  return (
    typeof value === 'object' &&
    value['_bsontype'] === 'BSONRegExp'
  )
};


exports.getRegularExpression = function(value) {
  if(exports.isBSONRegularExpression(value)){
    return exports.getRegularExpressionFromBSONRegularExpression(value);
  }
  if(value instanceof RegExp){
    return value;
  }
  return null;
};

exports.getRegularExpressionFromBSONRegularExpression = function(value) {
  if(value instanceof RegExp){
    return value;
  }
  if(!exports.isBSONRegularExpression(value)) {
    return null;
  }
  if(/[xlsu]/.test(value.options)) {
    throw new Error("$options 'x', 'l', 's', and 'u' are not implemented");
  }
  return new RegExp(value.pattern, value.options);
};

exports.compareBSONRegularExpression = function(valueA, valueB) {
  return exports.compareRegularExpression(valueA, valueB);
};

exports.isMaxKey = function(value) {
  return (
    typeof value === 'object' &&
    value['_bsontype'] == 'MaxKey'
  )
};

exports.compareMaxKey = function(bsom, valueA, valueB) {
  return exports.EQUAL_VALUE;
};

exports.getValue = function(value) {
  if(value && value['toBSON'] instanceof Function) {
    value = value['toBSON']();
  }
  return value;
};

exports['MinKey'] = {
  is: exports.isMinKey,
  compare: exports.compareMinKey
};
exports['Null'] = {
  is: exports.isNull,
  compare: exports.compareNull
};
exports['Number'] = {
  is: exports.isNumber,
  compare: exports.compareNumber
};
exports['Long'] = {
  is: exports.isLong,
  compare: exports.compareLong
};
exports['Double'] = {
  is: exports.isDouble,
  compare: exports.compareDouble
};
exports['Symbol'] = {
  is: exports.isSymbol,
  compare: exports.compareSymbol
};
exports['String'] = {
  is: exports.isString,
  compare: exports.compareString
};
exports['Object'] = {
  is: exports.isObject,
  compare: exports.compareObject
};
exports['Array'] = {
  is: exports.isArray,
  compare: exports.compareArray
};
exports['BinData'] = {
  is: exports.isBinData,
  compare: exports.compareBinData
};
exports['Buffer'] = {
  is: exports.isBuffer,
  compare: exports.compareBuffer
};
exports['Binary'] = {
  is: exports.isBinary,
  compare: exports.compareBinary
};
exports['ObjectId'] = {
  is: exports.isObjectId,
  compare: exports.compareObjectId
};
exports['Boolean'] = {
  is: exports.isBoolean,
  compare: exports.compareBoolean
};
exports['Date'] = {
  is: exports.isDate,
  compare: exports.compareDate
};
exports['Timestamp'] = {
  is: exports.isTimestamp,
  compare: exports.compareTimestamp
};
exports['RegularExpression'] = {
  is: exports.isRegularExpression,
  compare: exports.compareRegularExpression
};
exports['BSONRegularExpression'] = {
  is: exports.isBSONRegularExpression,
  compare: exports.compareBSONRegularExpression
};
exports['MaxKey'] = {
  is: exports.isMaxKey,
  compare: exports.compareMaxKey
};
exports['Unknown'] = {
  is: function(){ return false },
  compare: function(){ return exports.EQUAL_VALUE; }
};

exports['SortOrder'] = [
  exports['MinKey'],
  exports['Null'],
  exports['Number'],
  exports['Long'],
  exports['Double'],
  exports['Symbol'],
  exports['String'],
  exports['Object'],
  exports['Array'],
  exports['BinData'],
  exports['ObjectId'],
  exports['Boolean'],
  exports['Date'],
  exports['Timestamp'],
  exports['RegularExpression'],
  exports['MaxKey']
];

exports['TypeNumericalMap'] = {
  double: 1,
  string: 2,
  object: 3,
  array: 4,
  binData: 5,
  undefined: 6,
  objectId: 7,
  bool: 8,
  date: 9,
  null: 10,
  regex: 11,
  dbPointer: 12,
  javascript: 13,
  symbol: 14,
  javascriptWithScope: 15,
  int: 16,
  timestamp: 17,
  long: 18,
  minKey: -1,
  maxKey: 127
};

exports['TypeMap'] = {
  double: exports['Double'],
  string: exports['String'],
  object: exports['Object'],
  array: exports['Array'],
  binData: exports['BinData'],
  undefined: exports['Null'],
  objectId: exports['ObjectId'],
  bool: exports['Boolean'],
  date: exports['Date'],
  null: exports['Null'],
  regex: exports['RegularExpression'],
  dbPointer: exports['Unknown'],
  javascript: exports['Unknown'],
  symbol: exports['Symbol'],
  javascriptWithScope: exports['Unknown'],
  int: exports['Long'],
  timestamp: exports['Timestamp'],
  long: exports['Long'],
  minKey: exports['MinKey'],
  maxKey: exports['MaxKey']
};

exports.getTypeNumeric = function(typeDefinition) {
  typeDefinition = exports.getTypeString(typeDefinition);
  typeDefinition = exports['TypeNumericalMap'][typeDefinition];
  return typeDefinition == null ? null : typeDefinition;
};

exports.getTypeString = function(typeDefinition) {
  if(typeof typeDefinition === 'string' && exports['TypeNumericalMap'][typeDefinition] != null){
    return typeDefinition;
  }
  if(typeof typeDefinition !== 'number'){
    return null;
  }
  typeDefinition = Object.keys(exports['TypeNumericalMap'])
    .find(function(key){
      return exports['TypeNumericalMap'][key] === typeDefinition;
    });
  return typeDefinition == null ? null : typeDefinition;
};

exports.getTypeComparison = function(typeDefinition) {
  typeDefinition = exports.getTypeString(typeDefinition);
  return exports['TypeMap'][typeDefinition] || exports['Unknown'];
};

exports.isType = function(typeDefinition, value) {
  const comparison = exports.getTypeComparison(typeDefinition);
  return comparison.is(value);
};