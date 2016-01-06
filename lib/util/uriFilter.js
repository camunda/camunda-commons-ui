'use strict';

var UriFilter = [ 'Uri', function(Uri) {
  return function(input) {
    return Uri.appUri(input);
  };
}];

module.exports = UriFilter;
