/* global define: false, require: false */
/* jshint unused: false */
define([
           'angular', 'text!./login.html'
], function(angular,   template) {
  'use strict';

  var Controller = [
           '$scope', '$rootScope', 'AuthenticationService', 'Notifications', '$location',
  function ($scope,   $rootScope,   AuthenticationService,   Notifications,   $location) {

    if ($rootScope.authentication) {
      return $location.path('/');
    }

    $scope.login = function () {
      AuthenticationService
        .login($scope.username, $scope.password)
        .then(function() {
          Notifications.clearAll();
        })
        .catch(function() {
          Notifications.addError({
            status: 'Login Failed',
            message: 'Wrong credentials or missing access rights to application'
          });
        });
    };
  }];

  return [ '$routeProvider', function($routeProvider) {
    $routeProvider.when('/login', {
      template: template,
      controller: Controller
    });
  }];

});
