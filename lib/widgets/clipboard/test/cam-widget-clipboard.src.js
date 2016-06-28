'use strict';

var angular = require('camunda-bpm-sdk-js/vendor/angular');
var clipboardDefinition = require('../cam-widget-clipboard');

require('../../../../vendor/ui-bootstrap-tpls-0.11.2-camunda');

var clipboardModule = angular.module('clipboardModule', [
  'ui.bootstrap'
]);
clipboardModule.directive('camWidgetClipboard', clipboardDefinition);


var testModule = angular.module('testModule', [clipboardModule.name]);
testModule.controller('testController', [
  '$scope',
  function(
  $scope
) {
    $scope.obj = {
      varToCopy: 'W00p! W00p!'
    };
  }]);


angular.element(document).ready(function() {
  angular.bootstrap(document.body, [testModule.name]);
});
