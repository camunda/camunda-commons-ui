'use strict';

var angular = require('camunda-bpm-sdk-js/vendor/angular');

var SearchFactory = [ '$location', '$rootScope', function($location, $rootScope) {

  var silent = false;

  $rootScope.$on('$routeUpdate', function(e, lastRoute) {
    if (silent) {
      silent = false;
    } else {
      $rootScope.$broadcast('$routeChanged', lastRoute);
    }
  });

  $rootScope.$on('$routeChangeSuccess', function() {
    silent = false;
  });

  var search = function() {
    return $location.search.apply($location, arguments);
  };

  search.updateSilently = function(params, replaceFlag) {
    var oldPath = $location.absUrl();

    angular.forEach(params, function(value, key) {
      $location.search(key, value);
    });

    var newPath = $location.absUrl();

    if (newPath != oldPath) {
      silent = true;
    }

    if(replaceFlag) {
      $location.replace();
    }
  };

  return search;
}];

var searchModule = angular.module('camunda.common.search', []);

searchModule.factory('search', SearchFactory);

module.exports = searchModule;
