  'use strict';
  module.exports = function() {
    return function(str) {
      // see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent

      // we double escape the / character => / is escaped as '%2F',
      // we additionally escape '%' as '%25'
      return encodeURIComponent(str).replace(/%2F/g, '%252F')
             // !!!! could not found what "escape" is refering to, so I commented that !!!!
             // BTW, that RegExp looks... odd.
             // .replace(/[!'()]/g, escape)
            .replace(/\*/g, '%2A')
            .replace(/%5C/g, '%255C');
    };
  };
