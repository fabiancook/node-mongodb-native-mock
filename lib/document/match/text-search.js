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
const Natural = require('natural'),
      BSONCompare = require('./bson-compare');

exports = module.exports = function(document, text){
  // Sorry not dealing with $diacriticSensitive or $language atm
  const query = exports.getQuery(text);
  const strings = exports.getAllStrings(document, text['$caseSensitive']);
  const phrasesFound = query.phrases.filter(function(phrase){
    return strings.find(function(string){
      return string.indexOf(phrase) > -1;
    });
  });
  if(phrasesFound.length !== query.phrases.length){
    return false;
  }
  // Everything matches, either all phrases match, or there were no phrases, which means they haven't
  // Given us input, not much I can do? Is there an error for this?
  if(query.words.length === 0){
    return true;
  }
  const documentWords = exports.getSearchWords(strings, text['$caseSensitive']);
  const wordFound = query.words.find(function(word){
    return documentWords.indexOf(word) > -1;
  });
  return !!wordFound;
};

exports.getAllStrings = function(document, caseSensitive) {
  return Object.keys(document)
    .reduce(function(results, value){
      if(BSONCompare.isObject(value) || BSONCompare.isArray(value)){
        return results.concat(exports.getAllStrings(document));
      }
      if(!BSONCompare.isString(value)){
        return results;
      }
      return results.concat(value);
    }, [])
    .map(function(string){
      if(caseSensitive){
        return string;
      }
      return string.toLowerCase();
    })
};

exports.getQuery = function(text) {
  if(text.$computedQuery){
    return text.$computedQuery;
  }
  const query = { };
  const phrases = exports.getSearchPhrases(text, text['$caseSensitive']);
  const prePhraseSearch = text.$search;
  exports.removePhrasesFromSearch(text, phrases, text['$caseSensitive']);
  const words = exports.getSearchWords(text, text['$caseSensitive']);
  text.$search = prePhraseSearch;
  query.phrases = phrases;
  query.words = words;
  return text.$computedQuery = query;
};

exports.removePhrasesFromSearch = function(text, phrases, caseSensitive){
  if(!caseSensitive){
    text.$search = text.$search.toLowerCase();
  }
  text.$search = phrases
    .reduce(function(search, phrase){
      if(!caseSensitive){
        phrase = phrase.toLowerCase();
      }
      phrase = '"' + phrase + '"';
      while(text.indexOf(phrase) > -1){
        text = text.replace(phrase, '');
      }
      return text;
    }, text.$search);
  return text;
};

exports.getSearchWords = function(text, caseSensitive) {
  const search = text['$search'] || text;
  if(BSONCompare.isArray(search)){
    return Array.prototype.reduce.call(search, function(words, text){
      return words.concat(exports.getSearchWords(text, caseSensitive));
    }, []);
  }
  const tokenizer = new Natural.WordPunctTokenizer();
  return search.split()
    .reduce(function(results, word){
      var negated = false;
      if(word.charAt(0) === '-'){
        negated = true;
        word = word.substr(1);
      }
      var words = tokenizer.tokenize(word)
        .reduce(function(words, word) {
          // Only english stemming for now, natural has support for more
          const stemmed = natural.PorterStemmer.stem(word);
          return words.concat(stemmed, word);
        }, []);
      if(negated) {
        //Negated shouldn't have multiple words, but that's okay
        words = words.map(function(word) {
          return '-' + word;
        });
      }
      return results.concat(words);
    }, [])
    .map(function(string){
      if(caseSensitive){
        return string;
      }
      return string.toLowerCase();
    })
};

exports.getSearchPhrases = function(text, caseSensitive) {
  const search = text['$search'];
  const results = search.split().reduce(function(results, current){
    // If it is prefixed with '\' then ignore it?
    if(results.in && current === '"' && results[results.length] !== '\\'){
      results.in = false;
    } else if(!results.in && current === '"' && results[results.length] !== '\\'){
      results.in = true;
    } else if(results.in){
      results.push(current);
    }
    return results;
  }, []);
  if(results.in){
    //Remove the last phrase, didn't complete it
    results.splice(result.length - 1, 1);
  }
  results.in = undefined;
  return results
    .map(function(phrase){
      if(caseSensitive){
        return phrase;
      }
      return phrase.toLowerCase();
    })
};


