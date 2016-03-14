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
const Natural = require('natural');

const wordTokeniser = new Natural.WordTokenizer();

console.log(wordTokeniser.tokenize('Hello my name is fabian, and I\'m 20'));
console.log(Natural.PorterStemmer.stem("Fabian"));
console.log(Natural.PorterStemmerRu.stem("падший"));

exports.getSearchPhrases = function(text) {
  const search = text['$search'];
  return search.split('').reduce(function(results, current){
    // If it is prefixed with '\' then ignore it?
    if(results.in && current === '"'){
      results.in = false;
    } else if(!results.in && current === '"'){
      results.in = true;
      results.push([]);
    } else if(results.in){
      results[results.length - 1].push(current);
    }
    return results;
  }, [])
    .map(function(result){
      return result.join('');
    })
};

console.log(exports.getSearchPhrases({$search:'hello my name is "Fabian Cook" and this is a "string with a extra words"'}));