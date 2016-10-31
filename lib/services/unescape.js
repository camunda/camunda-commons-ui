'use strict';

module.exports = function() {
  return function(str) {
    var replacedString = str
      .replace(/%252F/g, '%2F')
      .replace(/%255C/g, '%5C')
      .replace(/%2A/g, '*');

    return decodeURIComponent(replacedString);
  };
};
