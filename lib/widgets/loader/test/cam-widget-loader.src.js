'use strict';

var angular = require('camunda-bpm-sdk-js/vendor/angular'),
    loaderDefinition = require('../cam-widget-loader');

require('../../../../vendor/ui-bootstrap-tpls-0.11.2-camunda');

var loaderModule = angular.module('loaderModule', ['ui.bootstrap']);
loaderModule.directive('camWidgetLoader', loaderDefinition);

var testModule = angular.module('testModule', [loaderModule.name]);
testModule.controller('testInteractiveController', [
  '$scope',
  '$timeout',
  function(
  $scope,
  $timeout
) {
    $scope.ctrlState = 'INITIAL';
    $scope.timeoutPromise = null;

    $scope.reload = function(simulateEmpty) {
      $scope.ctrlState = 'LOADING';

      $scope.timeoutPromise = $timeout(function() {
        $scope.ctrlVar1 = 'Control variable';
        $scope.ctrlState = simulateEmpty ? 'EMPTY' : 'LOADED';
      }, 1000);
    };

    $scope.fail = function() {
      $scope.ctrlState = 'ERROR';
      $scope.ctrlError = 'Something wen really wrong';

      if ($scope.timeoutPromise) {
        $timeout.cancel($scope.timeoutPromise);
      }
    };
  }]);

angular.element(document).ready(function() {
  angular.bootstrap(document.body, [testModule.name]);
});
