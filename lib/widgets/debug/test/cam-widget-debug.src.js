'use strict';

var angular = require('camunda-bpm-sdk-js/vendor/angular');
var debugDefinition = require('../cam-widget-debug');

var debugModule = angular.module('debugModule', []);
debugModule.directive('camWidgetDebug', debugDefinition);

var clipboardWidget = require('../../clipboard/cam-widget-clipboard');
debugModule.directive('camWidgetClipboard', clipboardWidget);


var testModule = angular.module('testModule', [debugModule.name]);
testModule.controller('testController', [
  '$scope',
  function(
  $scope
) {
    $scope.varToDebug = {
      something: {
        to: {
          debug: new Date()
        }
      },
      array: 'abcdef'.split('')
    };

    $scope.info = 'testInfo';
  }]);


angular.element(document).ready(function() {
  angular.bootstrap(document.body, [testModule.name]);
});
