'use strict';

var angular = require('camunda-bpm-sdk-js/vendor/angular'),
    camCommonsUi = require('../../index');

var testModule = angular.module('myModule', [camCommonsUi.name]);

testModule.controller('testController', ['$scope', function($scope) {
  $scope.name = 'Mr. Prosciutto';
  $scope.date = '2015-01-22T15:11:59';
  $scope.options = ['foobar', '1', '2', '3'];
  $scope.selectedOption = 'foobar';
  $scope.selectedOption2 = 'foobar';
  $scope.keyOptions = [{key: 'foobar', value: 'Barfoo'}, {key: '1', value: 'One'}, {key: '2', value: 'Two'}, {key: '3', value: 'Three'}];
  $scope.selectedKeyOption = {key: 'foobar', value: 'Barfoo'};
  $scope.dateText = 'Foobar';
}]);

angular.element(document).ready(function() {
  angular.bootstrap(document.body, [testModule.name]);
});
