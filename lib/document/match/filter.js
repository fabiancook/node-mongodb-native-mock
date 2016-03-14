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
const TextSearch = require('./text-search'),
      Where = require('./where');

exports.isMatch = function(match, document, filter) {
  if(filter instanceof Function){
    filter = {
      $where: filter
    };
  }
  const filterKeys = Object.keys(filter);
  if(filterKeys.length === 0){
    return true;
  }
  const matches = filterKeys
    .filter(function(filterKey) {
      if(filterKey.charAt(0) === '$' && exports[filterKey] instanceof Function){
        return exports[filterKey](match, document, filter);
      }
      return match.Value.isMatch(match, document, filter, filterKey);
    });
  return matches.length === filterKeys.length;
};

exports['$or'] = function(match, document, filter) {
  const found = filter.$or.find(function(childFilter) {
    return exports.isMatch(match, document, childFilter);
  });
  return !!found;
};

exports['$and'] = function(match, document, filter) {
  const found = filter.$and.filter(function(childFilter){
    return exports.isMatch(match, document, childFilter);
  });
  return found.length === filter.$and.length
};

exports['$not'] = function(match, document, filter) {
  return !exports.isMatch(match, document, filter);
};

exports['$nor'] = function(match, document, filter) {
  return !exports['$or'](match, document, filter);
};

exports['$where'] = function(match, document, filter) {
  return Where(document, filter);
};

exports['$text'] = function(match, document, filter){
  return TextSearch(document, filter);
};