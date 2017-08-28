'use strict';
var moment = require('camunda-bpm-sdk-js/vendor/moment');

module.exports = function() {
  return function(value) {
    if(value) {
      return moment(value).format('YYYY-MM-DDTHH:mm:ss.SSSZZ');
    }
    return value;
  };
};
