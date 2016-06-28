'use strict';

var angular = require('camunda-bpm-sdk-js/vendor/angular');

require('angular-route');
require('angular-resource');

var commonsUtil = require('../util/index'),
    loginPage = require('./page/login'),
    ifLoggedInDirective = require('./directives/camIfLoggedIn'),
    ifLoggedOutDirective = require('./directives/camIfLoggedOut'),
    authenticationService = require('./service/authenticationService');

  /**
   * @module cam.commons.auth
   */

  /**
   * @memberof cam.commons
   */

var ngModule = angular.module('cam.commons.auth', [
  angular.module('ngRoute').name,
  commonsUtil.name
]);

ngModule
  .config(loginPage)

  // redirect after login support
  .run([ '$rootScope', '$location', function($rootScope, $location) {

    var preLoginUrl;

    $rootScope.$on('authentication.login.required', function(event) {

      $rootScope.$evalAsync(function() {

        var url = $location.url();

        // skip if login is already in progress
        // or default got prevented
        if (url === '/login' || event.defaultPrevented) {
          return;
        }

        preLoginUrl = url;
        $location.url('/login');
      });
    });

    $rootScope.$on('authentication.login.success', function(event) {

      $rootScope.$evalAsync(function() {
        // skip if default got prevented
        if (!event.defaultPrevented) {
          $location.url(preLoginUrl || '/').replace();
          preLoginUrl = null;
        }
      });
    });
  }])

  // post logout redirect + reload support
  .run([ '$cacheFactory', '$rootScope', '$location', '$timeout', 'Notifications', function($cacheFactory, $rootScope, $location, $timeout, Notifications) {

    $rootScope.$on('authentication.logout.success', function(event) {

      $rootScope.$evalAsync(function() {
        // skip if default got prevented
        if (!event.defaultPrevented) {
          // clear http cache
          $cacheFactory.get('$http').removeAll();
          $location.url('/');
        }
      });

      // logout is successful - wait for authentication required messages from redirection to dashboard
      // then make an exclusive alert saying that the logout was successful.
      $timeout(function() {

        var getDayContext = function() {
          var now = new Date();
          if(now.getDay() >= 5) {
            return 'weekend';
          } else {
            var hour = now.getHours();
            switch(true) {
            case (hour >= 4 && hour < 7): return 'morning';
            case (hour >= 7 && hour < 12): return 'day';
            case (hour >= 12 && hour < 17): return 'afternoon';
            case (hour >= 17 && hour < 22): return 'evening';
            case (hour >= 22 || hour < 4): return 'night';
            }
          }
          // should never get here, but just to be sure
          return 'day';
        };

        Notifications.addMessage({
          status: 'Logout successful',
          message: 'Thank you for using Camunda today. Have a great ' + getDayContext() + '!',
          exclusive: true
        });
      });

    });
  }])

  // notification integration
  .run([ '$rootScope', 'Notifications', function($rootScope, Notifications) {

    $rootScope.$on('authentication.login.required', function() {

      Notifications.addError({
        status: 'Failed to display resource',
        message: 'Authentication failed. Your session might have expired, you need to login.',
        http: true,
        exclusive: [ 'http' ]
      });
    });

  }])

  // ensure AuthenticationService is bootstraped
  .run(['AuthenticationService', function() { } ])

  .directive('camIfLoggedIn', ifLoggedInDirective)
  .directive('camIfLoggedOut', ifLoggedOutDirective)

  .service('AuthenticationService', authenticationService);

module.exports = ngModule;

