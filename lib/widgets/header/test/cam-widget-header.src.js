'use strict';

var angular = require('camunda-bpm-sdk-js/vendor/angular'),
    headerDefinition = require('../cam-widget-header');

require('../../../../vendor/ui-bootstrap-tpls-0.11.2-camunda');

// naive auth object for test purposes
function Authentication(username, accesses) {
  this.name = username || '';
  this.authorizedApps = accesses || [];
}
Authentication.prototype.canAccess = function(appName) {
  return !this.authorizedApps.length || this.authorizedApps.indexOf(appName) > -1;
};


var mockedDependenciesModule = angular.module('mockedDependencies', []);

mockedDependenciesModule.service('AuthenticationService', [function() {
  this.logout = function() {
    // logging out
  };
}]);

mockedDependenciesModule.provider('uriFilter', [function() {
  return { $get: function() {} };
}]);
mockedDependenciesModule.filter('uri', [function() {
  return function() { return '#uri-filter-replaced'; };
}]);



var headerModule = angular.module('headerModule', [
  'ui.bootstrap',
  mockedDependenciesModule.name
]);
headerModule.directive('camWidgetHeader', headerDefinition);



var testModule = angular.module('testModule', [headerModule.name]);

testModule.controller('testAnonymousController', ['$scope', function($scope) {
  $scope.ctrlCurrentApp = 'admin';
  $scope.auth = new Authentication();
}]);

testModule.controller('testAuthenticatedController', ['$scope', '$timeout', function($scope, $timeout) {
  $scope.ctrlCurrentApp = 'tasklist';

  $scope.auth = new Authentication('mustermann', ['tasklist', 'admin']);

  $timeout(function() {
    $scope.fullName = 'Max Mustermann';
  }, 400);
}]);

testModule.controller('testAuthenticatedSingleController', ['$scope', '$timeout', function($scope, $timeout) {
  $scope.auth = new Authentication('mustermann', ['tasklist']);

  $timeout(function() {
    $scope.fullName = 'Max Mustermann';
  }, 400);
}]);

angular.element(document).ready(function() {
  angular.bootstrap(document.body, [testModule.name]);
});
