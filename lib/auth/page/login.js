/* global define: false, require: false */
define([
  'angular',
  'text!./login.html'
], function(
  angular,
  template
) {
  'use strict';
  var $ = angular.element;

  var Controller = [
    '$scope',
    '$rootScope',
    'AuthenticationService',
    'Notifications',
    '$location',
  function (
    $scope,
    $rootScope,
    AuthenticationService,
    Notifications,
    $location
  ) {

    if ($rootScope.authentication) {
      return $location.path('/');
    }

    $rootScope.showBreadcrumbs = false;

    // ensure focus on username input
    var autofocusField = $('form[name="signinForm"] [autofocus]')[0];
    if (autofocusField) {
      autofocusField.focus();
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
            message: 'Wrong credentials or missing access rights to application',
            scope: $scope
          });
        });
    };
  }];

  return [
    '$routeProvider',
  function(
    $routeProvider
  ) {
    $routeProvider.when('/login', {
      template: template,
      controller: Controller
    });
  }];

});
