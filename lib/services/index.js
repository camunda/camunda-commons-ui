/**
 * @namespace cam.common.services
 */

'use strict';

var angular = require('camunda-bpm-sdk-js/vendor/angular'),
    util = require('./../util/index'),
    escape = require('./escape'),
    debounce = require('./debounce'),
    RequestLogger = require('./RequestLogger'),
    ResourceResolver = require('./ResourceResolver'),
    HttpClient = require('./HttpClient'),
    unescape = require('./unescape');

var ngModule = angular.module('camunda.common.services', [
    // `ResourceResolver` relies on cam.commons.util for Notifications
  util.name
]);


ngModule.filter('escape',             escape);

ngModule.factory('debounce',          debounce);
ngModule.factory('RequestLogger',     RequestLogger);
ngModule.factory('ResourceResolver',  ResourceResolver);
ngModule.factory('camAPIHttpClient',  HttpClient);
ngModule.factory('unescape',          unescape);


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

    var match = uri.match(/\/app\/([\w-]+)\/([\w-]+)\//);
    if (match) {
      $httpProvider.defaults.headers.get = {'X-Authorized-Engine' : match[2] };
    } else {
      throw new Error('no process engine selected');
    }
  }]);

module.exports = ngModule;
