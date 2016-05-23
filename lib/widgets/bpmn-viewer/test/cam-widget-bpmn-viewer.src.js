'use strict';

var fs = require('fs');

var angular = require('camunda-bpm-sdk-js/vendor/angular');
var camCommonsUi = require('../../index');
var testXML = fs.readFileSync(__dirname + '/test.xml', 'utf8');

var testModule = angular.module('myModule', [camCommonsUi.name]);
testModule.factory('debounce', require('../../../services/debounce'));
testModule.controller('testController', ['$scope', function($scope) {
  $scope.diagramXML = testXML;

  $scope.control = {};

  $scope.selectedNodes = [];
  $scope.handleClick = function(element) {
    if(element.businessObject.$instanceOf('bpmn:FlowNode')) {
      if($scope.control.isHighlighted(element.id)) {
        $scope.control.clearHighlight(element.id);
        $scope.control.removeBadges(element.id);
        $scope.selectedNodes.splice($scope.selectedNodes.indexOf(element.id),1);
        $scope.$apply();
      } else {
        $scope.control.highlight(element.id);
        $scope.control.createBadge(element.id, {text: 'Test', tooltip: 'This is a tooltip'});
        $scope.selectedNodes.push(element.id);
        $scope.$apply();
      }
    }
  };

  $scope.hovering = [];
  $scope.mouseEnter = function(element) {
    $scope.hovering.push(element.id);
    $scope.$apply();
  };
  $scope.mouseLeave = function(element) {
    $scope.hovering.splice($scope.hovering.indexOf(element.id), 1);
    $scope.$apply();
  };


}]);


angular.element(document).ready(function() {
  angular.bootstrap(document.body, [testModule.name]);
});
