'use strict';

module.exports = [
  '$filter',
  function($filter) {
    var dateRegex = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(|\.[0-9]{0,4})([+-][0-9]{4}|Z)$/;

    function isDateValue(value) {
      return value.match(dateRegex);
    }

    var camDate = $filter('camDate');

    return function(input) {
      if(input && isDateValue(input)) {
        return camDate(input);
      }
      return input ? input : '??';
    };

  }];
