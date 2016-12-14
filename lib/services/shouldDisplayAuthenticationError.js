'use strict';

define([], function() {
  return [
    '$location',
    function($location) {
      return function() {
        var url = $location.url();

        return url !== '/login' && url !== '/dashboard' && url !== '/' && url !== '/welcome' && url !== '/users';
      };
    }
  ];
});
