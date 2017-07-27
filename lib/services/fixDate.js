'use strict';
var moment = require('moment');

module.exports = function() {
  return function(value) {
    if(value) {
      return moment(value).format('YYYY-MM-DDTHH:mm:ss.SSSZZ');
    }
    return value;
  };
};
