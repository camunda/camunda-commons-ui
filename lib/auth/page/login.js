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
  'translateWithDefault',
  function(
    $scope,
    $rootScope,
    AuthenticationService,
    Notifications,
    $location,
    translateWithDefault
  ) {
    if ($rootScope.authentication) {
      return $location.path('/');
    }

    var loginErrorsTranslation = translateWithDefault({
      LOGIN_ERROR_MSG: 'Wrong credentials or missing access rights to application',
      LOGIN_FAILED: 'Login Failed'
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
        .catch(function(error) {
          delete $scope.username;
          delete $scope.password;

          return loginErrorsTranslation
            .then(function(loginError) {
              Notifications.addError({
                status: loginError.LOGIN_FAILED,
                message: error.data || loginError.LOGIN_ERROR_MSG,
                scope: $scope,
                exclusive: true
              });
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
