'use strict';

define([], function() {
  return [
    '$location',
    function($location) {
      return function() {
        var path = $location.path();

        return path !== '/login' && path !== '/dashboard' && path !== '/' && path !== '/welcome' && path !== '/users';
      };
    }
  ];
});
