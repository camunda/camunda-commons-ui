'use strict';

var fs = require('fs');

var template = fs.readFileSync(__dirname + '/login.html', 'utf8');

var $ = require('jquery');

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

    $rootScope.showBreadcrumbs = false;

    // ensure focus on username input
    var autofocusField = $('form[name="signinForm"] [autofocus]')[0];
    if (autofocusField) {
      autofocusField.focus();
    }

    $scope.login = function() {
      return AuthenticationService
        .login($scope.username, $scope.password)
        .then(function() {
          Notifications.clearAll();
        })
        .catch(function(error) {
          delete $scope.username;
          delete $scope.password;

          Notifications.addError({
            status: $translate.instant('PAGE_LOGIN_FAILED'),
            message: (error.data && error.data.message) || $translate.instant('PAGE_LOGIN_ERROR_MSG'),
            scope: $scope,
            exclusive: true
          });
        });
    };
  }];

module.exports = [
  '$routeProvider',
  function(
    $routeProvider
  ) {
    $routeProvider.when('/login', {
      template: template,
      controller: Controller
    });
  }];
