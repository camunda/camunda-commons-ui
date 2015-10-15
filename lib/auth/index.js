define([
  'angular',
  'angular-route',
  '../util/index',
  './page/login',
  './directives/camIfLoggedIn',
  './directives/camIfLoggedOut',
  './service/authenticationService'
], function(
  angular,
  angularRoute,
  commonsUtil,
  loginPage,
  ifLoggedInDirective,
  ifLoggedOutDirective,
  authenticationService
) {
  'use strict';

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
    .run([ '$cacheFactory', '$rootScope', '$location', function($cacheFactory, $rootScope, $location) {

      $rootScope.$on('authentication.logout.success', function(event) {

        $rootScope.$evalAsync(function() {
          // skip if default got prevented
          if (!event.defaultPrevented) {
            // clear http cache
            $cacheFactory.get('$http').removeAll();
            $location.url('/');
          }
        });
      });
    }])

    // notification integration
    .run([ '$rootScope', 'Notifications', function($rootScope, Notifications) {

      $rootScope.$on('authentication.login.required', function() {

        Notifications.addError({
          status: 'Unauthorized',
          message: 'Login is required to access the resource',
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

  return ngModule;
});

