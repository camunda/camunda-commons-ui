'use strict';

var angular = require('camunda-bpm-sdk-js/vendor/angular');
var CamSDK = require('camunda-bpm-sdk-js/lib/angularjs/index');

module.exports = ['$rootScope', '$timeout' , '$q', function($rootScope, $timeout, $q) {

  var lastCookies = {};
  var lastCookieString = '';

  function cookies() {
    if (document && document.cookie !== lastCookieString) {
      lastCookieString = document.cookie;
      lastCookies = {};

      var cookieArray = lastCookieString.split('; ');

      for (var i = 0; i < cookieArray.length; i++) {
        var cookie = cookieArray[i];
        var index = cookie.indexOf('=');

        if (index > 0) {
          var name = unescape(cookie.substring(0, index));
          if (lastCookies[name] === undefined) {
            lastCookies[name] = unescape(cookie.substring(index + 1));
          }
        }
      }
    }

    return lastCookies;
  }

  function setHeaders(options) {
    var headers = options.headers = options.headers || {};
    var token = (cookies() || {})['XSRF-TOKEN'];

    if (token) {
      headers['X-XSRF-TOKEN'] = token;
    }
  }

  function AngularClient(config) {
    this._wrapped = new CamSDK.Client.HttpClient(config);
  }

  angular.forEach(['post', 'get', 'load', 'put', 'del', 'options', 'head'], function(name) {
    AngularClient.prototype[name] = function(path, options) {
      var myTimeout = $timeout(function() {}, 100000);

      setHeaders(options);

      var original = angular.isFunction(options.done) ? options.done : angular.noop;

      options.done = function(err, result) {

        function applyResponse() {
            // in case the session expired
          if (err && err.status === 401) {
              // broadcast that the authentication changed
            $rootScope.$broadcast('authentication.changed', null);
              // set authentication to null
            $rootScope.authentication = null;
              // broadcast event that a login is required
              // proceeds a redirect to /login
            $rootScope.$broadcast('authentication.login.required');
            return;
          }

          original(err, result);
        }

        var phase = $rootScope.$$phase;

        if(phase !== '$apply' && phase !== '$digest') {
          $rootScope.$apply(applyResponse);
        }
        else {
          applyResponse();
        }
        $timeout.cancel(myTimeout);
      };

      return $q.when(
        this._wrapped[name](path, options)
      );
    };
  });

  angular.forEach(['on', 'once', 'off', 'trigger'], function(name) {
    AngularClient.prototype[name] = function() {
      this._wrapped[name].apply(this, arguments);
    };
  });

  return AngularClient;
}];
