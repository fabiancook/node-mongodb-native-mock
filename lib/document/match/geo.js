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
const GeoLib = require('geolib'),
      GeoJSON = require('geojson'),
      BSONCompare = require('./bson-compare');

exports = module.exports = function(document, value, type, filter) {
  value = exports.getLatitudeLongitude(value);
  return exports[type] instanceof Function ? exports[type](document, value, filter) : false;
};

exports.getLatitudeLongitude = function(value) {
  const types = [
    'Point',
    'MultiPoint',
    'LineString',
    'MultiLineString',
    'Polygon',
    'MultiPolygon'
  ];
  if(types.indexOf(value.type) === -1){
    return exports.getLegacyLatitudeLongitude(value);
  }
  // http://geojson.org/geojson-spec.html#appendix-a-geometry-examples
  // Point coordinates are in x, y order (easting, northing for projected coordinates, longitude, latitude for geographic coordinates):
  if(value.type === 'Point') {
    return exports.getLegacyLatitudeLongitude(value.coordinates);
  }
  if(value.type === 'MultiPoint' ||
     value.type === 'LineString' ||
     value.type === 'Polygon') {
    return Array.prototype.map.call(value.coordinates, exports.getLegacyLatitudeLongitude);
  }
  //if(value.type === 'MultiLineString' ||
  //   value.type === 'MultiPolygon') {
  return Array.prototype.map.call(value.coordinates, function(coordinates){
    var type = 'LineString';
    //For consistency
    if(value.type === 'MultiPolygon'){
      type = 'Polygon';
    }
    return exports.getLatitudeLongitude({
      type: type,
      coordinates: coordinates
    });
  });
  //}
};

exports.getLegacyLatitudeLongitude = function(value) {
  if(!BSONCompare.isArray(value)) {
    throw new Error("Expected array");
  }
  // Polygon, this can also handle MultiPolygon
  if(BSONCompare.isArray(value[0])) {
    return Array.prototype.map.call(value, exports.getLegacyLatitudeLongitude)
  }
  if(!BSONCompare.isNumber(value[0]) || !BSONCompare.isNumber(value[1])) {
    throw new Error("Expected coordinates to be numbers");
  }

  return [value[0], value[1]];
};

exports.getGeoLibCoordinates = function(value) {
  if(BSONCompare.isArray(value)){
    return Array.prototype.map.call(value, exports.getGeoLibCoordinates)
  }
  if(!BSONCompare.isNumber(value[0]) || !BSONCompare.isNumber(value[1])) {
    throw new Error("Expected coordinates to be numbers");
  }
  // Value is in form longitude, latitude
  return {
    longitude: value[0],
    latitude: value[1]
  }
};

exports.isPoint = function(value) {
  if(!BSONCompare.isArray(value)){
    return false;
  }
  return BSONCompare.isNumber(value[0][0]) && BSONCompare.isNumber(value[0][1]);
};

exports.isPolygon = function(value) {
  if(!BSONCompare.isArray(value)){
    return false;
  }
  return exports.isPoint(value[0]);
};

exports.isMultiPolygon = function(value) {
  if(exports.isPolygon(value)){
    return false;
  }
  if(!BSONCompare.isArray(value)){
    return false;
  }
  return exports.isPolygon(value[0]);
};

exports['$geoWithin'] = function(document, value, filter){
  if(filter['$center'] || filter['$centerSphere']){
    return exports.isGeoWithinCircle(document, value, filter);
  }
  const points = exports.getGeoPoints(value);
  const filtered = Array.prototype.filter.call(points, function(point){
    return exports.isGeoPointIntersecting(point, filter);
  });
  // AND
  return filtered.length === points.length;
};

exports['$geoIntersects'] = function(document, value, filter){
  const points = exports.getGeoPoints(value);
  // OR
  return !!Array.prototype.find.call(points, function(point){
    return exports.isGeoPointIntersecting(point, filter);
  });
};

exports['$near'] = function(document, value, filter){

};

exports['$nearSphere'] = function(document, value, filter){
  // How do we want to deal with spheres?
  return exports['$near'](document, value, filter);
};

exports.getGeoPoints = function(value) {
  if(exports.isPoint(value)){
    value = [value];
  }
  if(exports.isPolygon(value)){
    value = [value];
  }
  if(!exports.isMultiPolygon(value)){
    throw new Error("LineString & MultiLineString not Implemented");
  }
  return Array.prototype.reduce.call(value, function(result, polygon){
    return result.concat(polygon);
  }, []);
};

exports.getBox = function(value) {
  if(!exports.isMultiPolygon(value)){
    throw new Error("Not a box");
  }
};

exports.isGeoWithinCircle = function(document, value, filter) {
  // How do we want to deal with spheres?
  const center = filter['$center'] || filter['$centerSphere'];
  if(!center) {
    throw new Error('Expected $center or $centerSphere');
  }
  if(!BSONCompare.isArray(center)){
    throw new Error("Expected array for $center");
  }
  if(!exports.isPoint(center[0])){
    throw new Error("No point given");
  }
  if(!BSONCompare.isNumber(center[1])){
    throw new Error("No radius given");
  }
  const point = exports.getGeoLibCoordinates(center[0]);
  var radiusInMeters = center[1];

};

exports.isGeoPointIntersecting = function(value, filter) {
  var geometry;
  if(filter['$box']) {
    geometry = exports.getBox(filter['$box']);
  } else if(filter['$polygon']) {
    geometry = exports.getLegacyLatitudeLongitude(filter['$polygon']);
  } else if(!filter['$geometry'] && BSONCompare.isArray(filter)) {
    geometry = exports.getLegacyLatitudeLongitude(filter);
  } else if(filter['$geometry'] && BSONCompare.isObject(filter['$geometry'])){
    geometry = exports.getLatitudeLongitude(filter['$geometry']);
  } else {
    throw new Error("Not Implemented");
  }
  //Make a MultiPolygon
  if(exports.isPolygon(geometry)){
    geometry = [geometry];
  }
  if(!exports.isMultiPolygon(geometry)){
    //If its something else, could you do a PR? Guess we could do inside a radius pretty easy
    //Lines are something else though...
    throw new Error("Expected Polygon or MultiPolygon to be used with $geoWithin and $geoIntersects");
  }
  const geolibValue = exports.getGeoLibCoordinates(value);
  if(geolibValue.longitude == null || geolibValue.latitude == null){
    return false;
  }
  return !!Array.prototype.find.call(geometry, function(polygon){
    if(!exports.isPolygon(polygon)){
      return false;
    }
    const geolibPolygon = exports.getGeoLibCoordinates(polygon);
    return GeoLib.isPointInside(geolibValue, geolibPolygon);
  });
};