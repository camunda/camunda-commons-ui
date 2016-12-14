'use strict';

module.exports = [
  '$location',
  function($location) {
    return function() {
      var path = $location.path();

      return path !== '/login' && path !== '/dashboard' && path !== '/' && path !== '/welcome';
    };
  }
];
