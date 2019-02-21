'use strict';
var moment = require('camunda-bpm-sdk-js/vendor/moment');

module.exports = function() {
  return function(value) {
    if(value) {
      return moment(value, moment.ISO_8601).format('YYYY-MM-DDTHH:mm:ss.SSSZZ');
    }
    return value;
  };
};
