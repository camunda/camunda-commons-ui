'use strict';

var angular = require('camunda-bpm-sdk-js/vendor/angular');

require('angular-route');
require('angular-resource');

var commonsUtil = require('../util/index'),
    loginPage = require('./page/login'),
    ifLoggedInDirective = require('./directives/camIfLoggedIn'),
    ifLoggedOutDirective = require('./directives/camIfLoggedOut'),
    authenticationService = require('./service/authenticationService'),
    translateWithDefault = require('./service/translateWithDefault');

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
  .run([
    '$cacheFactory', '$rootScope', '$location', '$timeout', 'Notifications', 'translateWithDefault',
    function($cacheFactory, $rootScope, $location, $timeout, Notifications, translateWithDefault) {
      var translations = translateWithDefault({
        LOGOUT_SUCCESSFUL: 'Logout successful',
        LOGOUT_THANKS: 'Thank you for using Camunda today. Have a great',
        MORNING: 'morning',
        DAY: 'day',
        AFTERNOON: 'afternoon',
        EVENING: 'evening',
        NIGHT: 'night'
      });

      $rootScope.$on('authentication.logout.success', function(event) {
        $rootScope.$evalAsync(function() {
          // skip if default got prevented
          if (!event.defaultPrevented) {
            // clear http cache
            $cacheFactory.get('$http').removeAll();
            $location.url('/login');
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
              case (hour >= 4 && hour < 7): return 'MORNING';
              case (hour >= 7 && hour < 12): return 'DAY';
              case (hour >= 12 && hour < 17): return 'AFTERNOON';
              case (hour >= 17 && hour < 22): return 'EVENING';
              case (hour >= 22 || hour < 4): return 'NIGHT';
              }
            }
            // should never get here, but just to be sure
            return 'day';
          };

          translations.then(function(translations) {
            Notifications.addMessage({
              status: translations.LOGOUT_SUCCESSFUL,
              message: translations.LOGOUT_THANKS + ' ' + translations[getDayContext()] + '!',
              exclusive: true
            });
          });
        });
      });
    }
  ])

  // notification integration
  .run([
    '$rootScope', 'Notifications', 'translateWithDefault', 'shouldDisplayAuthenticationError',
    function($rootScope, Notifications, translateWithDefault, shouldDisplayAuthenticationError) {
      var translations = translateWithDefault({
        FAILED_TO_DISPLAY_RESOURCE: 'Failed to display resource' ,
        AUTHENTICATION_FAILED: 'Authentication failed. Your session might have expired, you need to login.'
      });

      $rootScope.$on('authentication.login.required', function() {
        if (shouldDisplayAuthenticationError()) {
          translations.then(function(translations) {
            Notifications.addError({
              status: translations.FAILED_TO_DISPLAY_RESOURCE,
              message: translations.AUTHENTICATION_FAILED,
              http: true,
              exclusive: ['http']
            });
          });
        }
      });
    }
  ])

  // ensure AuthenticationService is bootstraped
  .run(['AuthenticationService', function() { } ])

  .directive('camIfLoggedIn', ifLoggedInDirective)
  .directive('camIfLoggedOut', ifLoggedOutDirective)

  .service('AuthenticationService', authenticationService)
  .service('translateWithDefault', translateWithDefault);

module.exports = ngModule;
