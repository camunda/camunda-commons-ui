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
  '$translate',
  function(
    $scope,
    $rootScope,
    AuthenticationService,
    Notifications,
    $location,
    $translate
  ) {
    if ($rootScope.authentication) {
      return $location.path('/');
    }

    var loginErrorTranslation = $translate('LOGIN_ERROR_MSG')
      .catch(function() {
        return 'Wrong credentials or missing access rights to application';
      });

    $rootScope.showBreadcrumbs = false;

    // ensure focus on username input
    var autofocusField = $('form[name="signinForm"] [autofocus]')[0];
    if (autofocusField) {
      autofocusField.focus();
    }

    $scope.login = function() {
      AuthenticationService
        .login($scope.username, $scope.password)
        .then(function() {
          Notifications.clearAll();
        })
        .catch(function() {
          return loginErrorTranslation
            .then(function(loginError) {
              Notifications.addError({
                status: 'Login Failed',
                message: loginError,
                scope: $scope,
                exclusive: true
              });
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
