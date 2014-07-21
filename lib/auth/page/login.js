/* global define: false, require: false */
/* jshint unused: false */
define([
           'angular', 'text!./login.html'
], function(angular,   template) {
  'use strict';

  var Controller = [
           '$scope', 'Authentication', 'AuthenticationService', 'Notifications', '$location',
  function ($scope,   Authentication,   AuthenticationService,   Notifications,   $location) {

    if (Authentication.username()) {
      $location.path('/');
    }

    $scope.login = function () {
      // this corrects a bug with password managers (observed in FF at least)
      $scope.username = $scope.username || angular.element('[ng-model="username"]').val();
      $scope.password = $scope.password || angular.element('[ng-model="password"]').val();

      AuthenticationService
        .login($scope.username, $scope.password)
        .then(function(success) {
          Notifications.clearAll();

          if (success) {
            if ($location.search().destination) {
              $location.url(decodeURIComponent($location.search().destination));
            }
            else {
              $location.path('/');
            }
          } else {
            Notifications.addError({
              status: 'Login Failed',
              message: 'Wrong credentials or missing access rights to application'
            });
          }
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
