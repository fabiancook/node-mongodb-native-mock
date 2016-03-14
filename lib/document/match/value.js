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
const BSONCompare = require('./bson-compare'),
      Field = require('../field'),
      TextSearch = require('./text-search'),
      Geo = require('./geo');

exports.isMatch = function(match, document, filter, filterKey) {
  const filterValue = exports.getFilterValue(filter[filterKey]);
  const documentValues = Field.getValues(document, filterKey);
  return exports.handleOperatorFilter(match, document, filter, filterKey, filterValue, documentValues);
};

exports.getFilterValue = function(filterValue) {
  if(exports.isOperatorFilter(filterValue)) {
    return filterValue;
  }
  if(filterValue instanceof RegExp) {
    return {
      $regex: filterValue.source,
      $options: filterValue.flags
    }
  }
  return {
    $eq: filterValue
  };
};

exports.handleOperatorFilter = function(match, document, filter, filterKey, filterValue, documentValues) {
  const filterKeys = Object.keys(filterValue);
  const results = filterKeys
    .filter(function(key){
      if(!(exports[key] instanceof Function)){
        return false;
      }
      const found = documentValues.find(function(documentValue){
        return exports[key](match, filterValue, filterValue[key], documentValue, filterKey, document);
      });
      return !!found;
    });
  return results.length === filterKeys.length;
};

exports.isOperatorFilter = function(filterValue) {
  if(!(filterValue instanceof Object)){
    return false;
  }
  const keys = Object.keys(filterValue);
  const dollarKeys = keys.filter(function(key){
    return key.charAt(0) === '$';
  });
  const nonDollarKeys = keys.filter(function(key){
    return key.charAt(0) !== '$';
  });
  if(nonDollarKeys.length !== 0){
    return false;
  }
  return dollarKeys.length !== 0;
};

/*
 ##########
 Comparison
 ##########
 */

exports['$eq'] = function(match, filterValue, valueA, valueB) {
  return BSONCompare.equal(valueA, valueB);
};

exports['$ne'] = function(match, filterValue, valueA, valueB) {
  return !exports['$eq'](match, filterValue, valueA, valueB);
};

exports['$gt'] = function(match, filterValue, valueA, valueB) {
  // If valueA (document) is larger than valueB (filter) than compare will be 1
  return BSONCompare.compare(valueA, valueB) > 0;
};

exports['$gte'] = function(match, filterValue, valueA, valueB) {
  return (
    exports['$gt'](match, filterValue, valueA, valueB) ||
    exports['$eq'](match, filterValue, valueA, valueB)
  )
};

exports['$lt'] = function(match, filterValue, valueA, valueB) {
  // If valueA (document) is smaller than valueB (filter) than compare will be -1
  return BSONCompare.compare(match, valueA, valueB) < 0;
};

exports['$lte'] = function(match, filterValue, valueA, valueB) {
  return (
    exports['$lt'](match, filterValue, valueA, valueB) ||
    exports['$eq'](match, filterValue, valueA, valueB)
  );
};

exports['$in'] = function(match, filterValue, range, value) {
  if(!(value instanceof Array)){
    return false;
  }
  const found = range.find(function(rangeValue) {
    if(rangeValue instanceof RegExp){
      return exports['$regex'](match, {});
    }
    return BSONCompare.compare(rangeValue, value) === 0;
  });
  return !!found;
};

exports['$nin'] = function(match, filterValue, range, value) {
  return !exports['$in'](match, filterValue, range, value);
};

/*
 #######
 Logical
 #######
 */

exports['$or'] = function(){
  throw new Error("$or is not available in this context");
};

exports['$and'] = function(){
  throw new Error("$and is not available in this context");
};

exports['$not'] = function(){
  throw new Error("$not is not available in this context");
};

exports['$nor'] = function(){
  throw new Error("$nor is not available in this context");
};

/*
 #######
 Element
 #######
 */

exports['$exists'] = function(match, filterValue, exists, value) {
  const valueExists = value !== exports.FLAG_NON_EXISTENT;
  return exists ? valueExists : !valueExists;
};

exports['$type'] = function(match, filterValue, type, value) {
  return BSONCompare.isType(type, value);
};

/*
 ##########
 Evaluation
 ##########
 */

exports['$mod'] = function(match, filterValue, mod, value){
  if(!(BSONCompare['Array'].is(mod)) || mod.length < 2){
    const error = new Error("bad query: BadValue malformed mod, not enough elements");
    error.code = 16810;
    throw error;
  }
  if(mod.length !== 2){
    const error = new Error("bad query: BadValue malformed mod, too many elements");
    error.code = 16810;
    throw error;
  }
  const divisor = mod[0];
  const remainder = mod[1];
  if(!BSONCompare.isNumber(divisor) || !BSONCompare.isNumber(remainder)){
    const error = new Error("bad query: BadValue malformed mod, divisor and remainder are expected to be numbers");
    error.code = 16810;
    throw error;
  }
  if(!BSONCompare.isNumber(value)){
    return false;
  }
  return ((value % divisor) + divisor) % divisor === remainder;
};

exports['$regex'] = function(match, filterValue, expression, value) {
  var options = filterValue['$options'] || undefined;
  if(/x/.test(options))
    if(typeof expression === 'string'){
      if(expression.charAt(0) === '/' && expression.charAt(expression.length - 1) === '/') {
        expression = expression.substr(1);
        expression = expression.substr(0, expression.length - 1);
      }
      expression = new RegExp(expression, options);
    }
  expression = BSONCompare.getRegularExpression(expression);
  if(!(expression instanceof RegExp)){
    throw new Error("Regular expression expected");
  }
  if(typeof value !== 'string'){
    throw new Error("Value expected to be a string for a RegExp");
  }
  return expression.test( value );
};

exports['$options'] = function(match, filterValue, options) {
  if(!filterValue['$regex']){
    throw new Error("$options present without $regex");
  }
  if(typeof options !== 'string' || !/[imxlsu]+/.test(options)){
    throw new Error('Invalid value for $options');
  }
  if(/[xlsu]/.test(options)) {
    throw new Error("$options 'x', 'l', 's', and 'u' are not implemented");
  }
  return true;
};

exports['$text'] = function(){
  throw new Error("$text is not available in this context");
};

exports['$where'] = function(){
  throw new Error("$where is not available in this context");
};

/*
 ##########
 Geospatial
 ##########
 */

exports['$geoWithin'] = function(match, filterValue, geoWithin, value){
  return Geo(document, value, "$geoWithin", geoWithin);
};

exports['$geoIntersects'] = function(match, filterValue, geoIntersects, value){
  return Geo(document, value, "$geoIntersects", geoIntersects);
};

exports['$near'] = function(match, filterValue, near, value){
  return Geo(document, value, "$near", near);
};

exports['$nearSphere'] = function(match, filterValue, nearSphere, value){
  return Geo(document, value, "$nearSphere", nearSphere);
};

/*
 #####
 Array
 #####
 */

exports['$all'] = function(match, filterValue, all, value){

};

exports['$elemMatch'] = function(match, filterValue, elemMatch, value){

};

exports['$size'] = function(match, filterValue, size, value){

};

/*
 #######
 Bitwise
 #######
 */

exports['$bitsAllSet'] = function(match, filterValue, bitsAllSet, value){

};

exports['$bitsAnySet'] = function(match, filterValue, bitsAnySet, value){

};

exports['$bitsAllClear'] = function(match, filterValue, bitsAllClear, value){

};

exports['$bitsAnyClear'] = function(match, filterValue, bitsAnyClear, value){

};

/*
 ########
 Comments
 ########
 */

exports['$comment'] = function(){
  return true;
};