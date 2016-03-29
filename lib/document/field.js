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
const BSONCompare = require('./match/bson-compare'),
  Match = require('./match'),
  Flags = require('./flags');

exports.FLAG_NON_EXISTENT = Flags.NON_EXISTENT;

exports.getSettableField = function(document, field){
  return exports.getSettableFieldConditional(document, field, function(){
    return true;
  });
};

exports.getSettableFieldConditional = function(document, field, condition) {
  field = exports.getField(document, field);
  return exports.setFieldConditional.bind(exports, document, field, condition);
};

exports.getSettableFieldConditionalAndTransform = function(document, field, condition, transform) {
  field = exports.getField(document, field);
  return exports.setFieldConditionalAndTransform.bind(exports, document, field, condition, transform);
};

exports.setFieldConditional = function(document, field, condition, value) {
  return exports.setFieldConditionalAndTransform(document, field, condition, function(){ return value; });
};

exports.setFieldConditionalAndTransform = function(document, field, condition, transform) {
  var modified = false;
  field.objects.forEach(function(object) {
    const details = exports.getSettableDetails(object);
    if(details.length === 0){
      return;
    }
    details.forEach(function(settable){
      const should = condition(settable.object[settable.field], settable.field, object);
      if(!should){
        return;
      }
      const value = transform(settable.object[settable.field], settable.object, settable.field, settable);
      if(!BSONCompare.equal(settable.object[settable.field], value)){
        modified = true;
      }
      if(value === exports.FLAG_NON_EXISTENT && settable.object.hasOwnProperty(settable.field)) {
        if(settable.array){
          settable.object[settable.field] = null;
        } else {
          delete settable.object[settable.field];
        }
      } else if(value !== exports.FLAG_NON_EXISTENT) {
        settable.object[settable.field] = value;
      }
    });
  });
  return modified;
};

exports.getSettableDetails = function(objectDetails){
  if(objectDetails.settable){
    return [objectDetails];
  }
  return objectDetails.objects.reduce(function(settable, objectDetails){
    return settable.concat(exports.getSettableDetails(objectDetails));
  }, []);
};

exports.getField = function(document, field) {
  return exports.getFieldFromObject(document, field);
};

exports.getFieldFromObject = function(object, field) {
  const result = exports.buildResultForObjects([object], field);
  if(BSONCompare.isObject(object)){
    return exports.getFieldFromPlainObject(result, object, field);
  } else if(BSONCompare.isArray(object)){
    return exports.getFieldFromArray(result, Array.prototype.slice.call(object));
  }
  return result;
};

exports.hasProperty = function(object, property) {
  if(object.hasOwnProperty(property)) {
    return true;
  }
  if(typeof property !== 'number' || !BSONCompare.isArray(object)) {
    return false;
  }
  return object.length > property;
};

exports.hasNext = function(fieldDetails) {
  if(!fieldDetails.hasOwnProperty('next')) {
    return false;
  }
  // If next is actually a zero number...
  return !!fieldDetails.next.toString().length;
};

exports.getFieldFromPlainObject = function(result){
  const objectResult = result.objects[0];
  objectResult.field = result.fieldDetails.current;
  objectResult.settable = !result.fieldDetails.next;
  if(!exports.hasProperty(objectResult.object, result.fieldDetails.current)) {
    return result;
  }
  if(!exports.hasNext(result.fieldDetails)){
    objectResult.values.push(objectResult.object[result.fieldDetails.current]);
    objectResult.exists = true;
    return result;
  }
  const next = exports.getFieldFromObject(objectResult.object[result.fieldDetails.current], result.fieldDetails.next);
  next.objects
    .filter(function(nextObjectDetails) {
      return nextObjectDetails.exists;
    })
    .forEach(function(nextObjectDetails) {
      objectResult.values = objectResult.values.concat(nextObjectDetails.values);
      objectResult.exists = objectResult.exists || nextObjectDetails.exists;
    });
  objectResult.next = next;
  objectResult.settable = !!next.array;
  objectResult.objects = next.objects;
  return result;
};

exports.getFieldFromArray = function(result) {
  var next;
  const objectResult = result.objects[0];
  if(exports.isIntegerString(result.fieldDetails.current)) {
    result.fieldDetails.current = +result.fieldDetails.current;
  }
  if(result.fieldDetails.current === '$') {
    result.field = 0;
    result.fieldDetails.current = 0;
  }
  if(typeof result.fieldDetails.current === 'number'){
    if(!exports.hasNext(result.fieldDetails)){
      objectResult.settable = true;
      objectResult.field = result.fieldDetails.current;
      objectResult.values = [objectResult.object[objectResult.field]];
      objectResult.exists = objectResult.object.length > objectResult.field;
    } else {
      next = exports.getFieldFromObject(objectResult.object[result.fieldDetails.current], result.fieldDetails.next);
      next.objects
        .filter(function(nextObjectDetails) {
          return nextObjectDetails.exists;
        })
        .forEach(function(nextObjectDetails) {
          objectResult.values = objectResult.values.concat(nextObjectDetails.values);
          objectResult.exists = objectResult.exists || nextObjectDetails.exists;
        });
      objectResult.next = next;
      objectResult.settable = !!next.array;
      objectResult.objects = next.objects;
    }
    return result;
  }
  objectResult.array = true;
  objectResult.field = false;
  // Array not settable, must be set on an object
  objectResult.settable = false;
  next = objectResult.object
    .filter(function(item){
      return BSONCompare.isObject(item) || BSONCompare.isArray(item)
    })
    .map(function(item){
      return exports.getFieldFromObject(item, result.fieldDetails.field);
    })
    .reduce(function(next, objectResult){
      next.objects = next.objects.concat(objectResult.objects);
      return next;
    }, exports.buildResultForObjects([], result.fieldDetails.field));
  objectResult.next = next;
  objectResult.exists = !!next.objects.find(function(objectResult){
    return !!objectResult.exists;
  });
  objectResult.values = next.objects.reduce(function(values, objectResult){
    return values.concat(objectResult.values);
  }, []);
  objectResult.objects = next.objects;
  return result;
};

exports.buildResultForObject = function(object){
  return {
    object: object,
    values: [ ],
    objects: [ ],
    exists: false,
    next: false,
    field: false,
    settable: false,
    array: false
  };
};

exports.buildResultForObjects = function(objects, field) {
  const details = exports.getSplitField(field);
  return {
    objects: objects.map(exports.buildResultForObject),
    field: field,
    fieldDetails: details
  };
};

exports.isIntegerString = function(value) {
  if(typeof value !== 'string' || value.length === 0) {
    return false;
  }
  value = +value;
  if(isNaN(value)) {
    return false;
  }
  return Math.floor(value) === value;
};

exports.getSplitField = function(field){
  const split = field.split('.'),
    result = {
      current: split[0],
      field: field
    };
  if(exports.isIntegerString(result.current)) {
    result.current = +result.current;
  }
  if(split.length > 1){
    result.next = split.slice(1).join('.')
  }
  return result;
};

exports.getValues = function(document, field){
  const details = exports.getField(document, field);
  const values = details.objects.reduce(function(values, object){
    return values.concat(object.values);
  }, []);
  if(values.length === 0){
    // No values, not exists, same as null
    values.push(exports.FLAG_NON_EXISTENT);
  }
  return values;
};

exports.setValues = function(document, field, value) {
  const setter = exports.getSettableField(document, field);
  return setter(value);
};

exports.setValuesConditional = function(document, field, value, condition) {
  return exports.getSettableFieldConditional(document, field, condition)(value);
};

exports.setValuesTransform = function(document, field, transform) {
  return exports.setValuesConditionalTransform(document, field, function(){return true;}, transform);
};

exports.setValuesConditionalTransform = function(document, field, conditional, transform) {
  return exports.getSettableFieldConditionalAndTransform(document, field, conditional, transform)();
};

exports.getFieldExists = function(document, field) {
  const details = exports.getField(document, field);
  return details.exists;
};

exports.projectValues = function(document, projection) {
  if(!(projection instanceof Object)){
    return document;
  }
  const fields = Object.keys(projection)
    .filter(function(key){
      // isObject for $elemMatch, $meta & $slice
      return projection[key] === 1 || BSONCompare.isObject(projection[key]);
    });
  const result = [];
  Object.defineProperty(result, '$document', {
    enumerable: false,
    configurable: false,
    value: document
  });
  if(projection._id !== 0){
    fields.push('_id');
  }
  const withoutOperations = exports.removeProjectionOperations(fields);
  const allowed = exports.explodeFields(withoutOperations);
  document = exports.filterOutFields(document, allowed, withoutOperations);
  return exports.invokeProjectionOperations(document, projection);
};

exports.invokeProjectionOperations = function(document, projection) {
  const operations = exports.getProjectionOperations(projection);
  return operations.reduce(function(document, operation) {
    return exports.invokeProjectionOperation(document, operation);
  }, document);
};

exports.invokeProjectionOperation = function(document, operation){
  const arrays = exports.getValues(document, operation.field);
  arrays.forEach(function(array){
    if(!BSONCompare.isArray(array)){
      return;
    }
    if(operation.$slice){
      exports.invokeProjectionSlice(array, operation);
    } else if(operation.$elemMatch) {
      exports.invokeProjectionElemMatch(array, operation);
    } /*else if(operation.$meta){
     //Do nothing
     } */
  });
  return document;
};

exports.invokeProjectionSlice = function(array, operation){
  var splice = {
    lower: {
      start: 0,
      length: 0
    },
    upper: {
      start: 0,
      length: 0
    }
  };
  var skip = operation.$slice;
  var limit = undefined;
  if(BSONCompare.isArray(skip)){
    limit = skip[1];
    skip = skip[0];
  }
  if(typeof limit !== 'number'){
    limit = 0;
  }
  if(skip < 0){
    splice.lower.length = array.length + skip;
    splice.upper.start = splice.lower.length + limit;
    if(splice.upper.start > array.length){
      splice.upper.start = array.length;
    }
    splice.upper.length = array.length - splice.upper.start;
  } else if(limit){
    // n < n + limit < length
    splice.lower.length = skip;
    splice.upper.start = skip + limit;
    if(splice.upper.start > array.length){
      splice.upper.start = array.length;
    }
    splice.upper.length = array.length - splice.upper.start;
  } else {
    // n < length
    splice.lower.length = skip;
  }
  array.splice(splice.lower.start, splice.lower.length);
  splice.upper.start -= splice.lower.start;
  if(splice.upper.start >= 0){
    array.splice(splice.upper.start, splice.upper.length);
  }
};

exports.invokeProjectionElemMatch = function(array, operation) {
  const map = Object.keys(array)
    .reduce(function(map, index){
      if(isNaN(+index)){
        return map;
      }
      map[index] = array[+index];
      return map;
    }, {});

  const remove = Object.keys(map)
    .filter(function(key){
      return !Match.isMatch(map[key], operation.$elemMatch);
    });

  remove.forEach(function(toRemove){
    const index = array.indexOf(toRemove);
    if(index === -1){
      return;
    }
    array.splice(index, 1);
  });

  return array;
};

exports.getProjectionOperations = function(projection) {
  return Object.keys(projection)
    .filter(function(field){
      if(BSONCompare.isObject(projection[field])) {
        return !!(projection[field].$elemMatch || projection[field].$meta || projection[field].$slice)
      }
      if(projection[field] !== 1){
        return false;
      }
      return /\.\$$/.test(field);
    })
    .map(function(field) {
      if(projection[field] === 1){
        //First item, this is the '$' operator
        return {
          field: field.replace(/\.\$$/, ''),
          $slice: [0, 1]
        };
      }
      projection[field].field = field;
      return projection[field];
    });
};

exports.removeProjectionOperations = function(fields){
  return fields.map(function(field){
    //Remove $, $elemMatch, $meta and $slice from the end of the field name
    return field.replace(/\.\$(elemMatch|meta|slice)?$/, '');
  });
};

exports.explodeFields = function(fields){
  return fields.reduce(function(results, field){
    return results.concat(exports.explodeField(field));
  }, []);
};

exports.explodeField = function(field) {
  const split = exports.getSplitField(field);
  if(!split.next){
    return [split.current];
  }
  const next = exports.explodeField(split.next)
    .map(function(next){
      return split.current + '.' + next;
    });
  return [split.current].concat(next);
};

exports.removeFirstLevel = function(fields){
  if(!BSONCompare.isArray(fields)){
    return [];
  }
  return Array.prototype.filter.call(fields, function(field){
      // Shouldn't be able to have dot at the end, but that's okay
      return field.indexOf('.') > -1 && field[field.length - 1] !== '.'
    })
    .map(function(field){
      // Remove first field
      return field.replace(/^[a-zA-Z0-9_\-]+\./, '')
    })
};

exports.filterOutFields = function(document, allAllowed, endAllowed){
  if(BSONCompare.isArray(document)){
    return Array.prototype.map.call(document, function(item){
      return exports.filterOutFields(item, allAllowed, endAllowed);
    });
  }
  return Object.keys(document)
    .reduce(function(result, key){
      if(allAllowed.indexOf(key) === -1){
        return result;
      }
      const subsetAllAllowed = exports.removeFirstLevel(allAllowed.slice()),
        subsetEndAllowed = exports.removeFirstLevel(endAllowed.slice());
      if(endAllowed.indexOf(key) !== -1){
        // If it wasn't an end key, then its not what they wanted
        result[key] = document[key];
      } else if(BSONCompare.isArray(document[key])){
        const arrayResult = exports.filterOutFields(document[key], subsetAllAllowed, subsetEndAllowed);
        if(!arrayResult){
          return result;
        }
        result[key] = arrayResult;
      } else if(BSONCompare.isObject(document[key])){
        result[key] = exports.filterOutFields(document[key], subsetAllAllowed, subsetEndAllowed);
      }
      return result;
    }, {});
};