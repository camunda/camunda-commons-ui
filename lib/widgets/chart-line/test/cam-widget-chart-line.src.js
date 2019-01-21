'use strict';

var angular = require('camunda-bpm-sdk-js/vendor/angular'),
    fs = require('fs'),
    moment = require('camunda-bpm-sdk-js/vendor/moment'),
    data = {},
    chartLineDefinition = require('../cam-widget-chart-line');

require('../../../../vendor/ui-bootstrap-tpls-2.5.0-camunda');

function shiftTimestamps(json) {
  var diff = moment().valueOf() - moment(json[0].timestamp).valueOf();
  return json.map(function(item) {
    item.timestamp = moment(item.timestamp).add(diff).format('YYYY-MM-DDTHH:mm:00');
    return item;
  });
}

data.day = [
  shiftTimestamps(JSON.parse(fs.readFileSync(__dirname + '/data/day-instance-start.json'))),
  shiftTimestamps(JSON.parse(fs.readFileSync(__dirname + '/data/day-instance-end.json')))
];
data.week = [
  shiftTimestamps(JSON.parse(fs.readFileSync(__dirname + '/data/week-instance-start.json'))),
  shiftTimestamps(JSON.parse(fs.readFileSync(__dirname + '/data/week-instance-end.json')))
];
data.month = [
  shiftTimestamps(JSON.parse(fs.readFileSync(__dirname + '/data/month-instance-start.json'))),
  shiftTimestamps(JSON.parse(fs.readFileSync(__dirname + '/data/month-instance-end.json')))
];



var chartLineModule = angular.module('chart-line-module', ['ui.bootstrap']);
chartLineModule.directive('camWidgetChartLine', chartLineDefinition);

var testModule = angular.module('testModule', [chartLineModule.name]);
testModule.controller('testController', [
  '$scope',
  function(
    $scope
  ) {
    $scope.colors = [
      'green',
      'blue'
    ];
    $scope.timespan = 'week';
    $scope.interval = 900 * 3;

    $scope.info = {};
    $scope.selectedStart = null;
    $scope.selectedEnd = null;
    $scope.selectionChanged = function selectionChanged(info) {
      info = info.info; // Angular facepalm
      $scope.info = info;

      if (!info.start || !info.end) {
        $scope.selectedStart = '';
        $scope.selectedEnd = '';
        return;
      }

      $scope.selectedStart = info.start.format('YYYY-MM-DD HH:mm');
      $scope.selectedEnd = info.end.format('YYYY-MM-DD HH:mm');
    };


    $scope.$watch('timespan', function() {
      if ($scope.timespan === 'day') {
        $scope.interval = 900;
      }
      else if ($scope.timespan === 'week') {
        $scope.interval = 900 * 3;
      }
      else {
        $scope.interval = 900 * 14;
      }
      $scope.values = data[$scope.timespan];
    });
  }]);

angular.element(document).ready(function() {
  angular.bootstrap(document.body, [testModule.name]);
});
