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
const VM = require('vm');

exports = module.exports = function(document, where){
  where = exports.getFunctionContents(where);
  if(!exports.isSafeFunction(where)){
    throw new Error("Whats in that function of yours?");
  }
  return exports.executeWithContext(document, where);
};

exports.getFunctionContents = function(where){
  if(typeof where === 'string'){
    return 'function(){ return (' + where + ') }';
  }
  if(!(where instanceof Function)){
    throw new Error("Unexpected value for $where");
  }
  return where.toString();
};

exports.isSafeFunction = function(where) {
  // Idk, maybe we should do something else here?
  /*
  (Along with the document passed)
  We should only be allowing this:

   args
   MaxKey
   MinKey
   assert()
   BinData()
   DBPointer()
   DBRef()
   doassert()
   emit()
   gc()
   HexData()
   hex_md5()
   isNumber()
   isObject()
   ISODate()
   isString()
   Map()
   MD5()
   NumberInt()
   NumberLong()
   ObjectId()
   print()
   printjson()
   printjsononeline()
   sleep()
   Timestamp()
   tojson()
   tojsononeline()
   tojsonObject()
   UUID()
   version()
   */
  return [
    'process',
    'global',
    'db'
  ].reduce(function(result, disallowed) {
    if(!result){
      return result;
    }
    return where.indexOf(disallowed) === -1;
  }, true);
};

exports.executeWithContext = function(document, where) {
  const scriptContents = [
    'const obj = this.obj',
    'const func = (' + where + ');',
    'this.result = func.call(this.obj);'
  ].join('\n');

  const script = new VM.Script(scriptContents);
  const context = {
    obj: document,
    result: undefined
  };
  VM.createContext(context);
  VM.runInContext(script, context);
  return context.result;
};