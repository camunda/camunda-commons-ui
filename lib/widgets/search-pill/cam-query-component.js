'use strict';

module.exports = [
  '$filter',
  function($filter) {
    var dateRegex = /(\d\d\d\d)-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)(?:.(\d\d\d)| )?$/;

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
