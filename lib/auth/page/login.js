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
