/**
 * @namespace cam.common.services
 */

define([
  'angular',
  'camunda-commons-ui/util/index',
  'camunda-commons-ui/services/escape',
  'camunda-commons-ui/services/debounce',
  'camunda-commons-ui/services/RequestLogger',
  'camunda-commons-ui/services/ResourceResolver'
],
function(angular) {
  'use strict';

  var ngModule = angular.module('camunda.common.services', [
    // `ResourceResolver` relies on cam.commons.util for Notifications
    'cam.commons.util'
  ]);


  ngModule.filter('escape',             require('camunda-commons-ui/services/escape'));

  ngModule.factory('debounce',          require('camunda-commons-ui/services/debounce'));
  ngModule.factory('RequestLogger',     require('camunda-commons-ui/services/RequestLogger'));
  ngModule.factory('ResourceResolver',  require('camunda-commons-ui/services/ResourceResolver'));


  /**
   * Register http status interceptor per default
   */
  ngModule.config([
          '$httpProvider',
  function($httpProvider) {
    $httpProvider.responseInterceptors.push([
              '$rootScope', '$q', 'RequestLogger',
      function($rootScope,   $q,   RequestLogger) {

      return function(promise) {

        RequestLogger.logStarted();

        function success(response) {
          RequestLogger.logFinished();
          return response;
        }

        function error(response) {
          RequestLogger.logFinished();

          var httpError = {
            status: parseInt(response.status),
            response: response,
            data: response.data
          };

          $rootScope.$broadcast('httpError', httpError);

          return $q.reject(response);
        }

        return promise.then(success, error);
      };
    }]);
  }]);



  ngModule.config([
          '$httpProvider', '$windowProvider',
  function($httpProvider,   $windowProvider) {
      var window = $windowProvider.$get();
      var uri = window.location.href;

      var match = uri.match(/app\/(\w+)\/(\w+)\//);
      if (match) {
        $httpProvider.defaults.headers.get = {'X-Authorized-Engine' : match[2] };
      } else {
        throw new Error('no process engine selected');
      }
  }]);

  return ngModule;
});
