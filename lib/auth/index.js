define([
  'angular',
  './page/login',
  './directive/camIfLoggedIn',
  './directive/camIfLoggedOut',
  './service/authentication',
  './service/authenticationService'
], function(
  angular,
  login,
  camIfLoggedIn,
  camIfLoggedOut,
  authentication,
  authenticationService
) {
  'use strict';

  /**
   * @module cam.commons.auth
   */

  /**
   * @memberof cam.commons
   */

  return angular.module('cam.commons.auth', [
    'ngRoute'
  ])
    .config(login)

    .directive('camIfLoggedIn', camIfLoggedIn)
    .directive('camIfLoggedOut', camIfLoggedOut)

    .service('Authentication', authentication)
    .provider('AuthenticationService', authenticationService);
});

