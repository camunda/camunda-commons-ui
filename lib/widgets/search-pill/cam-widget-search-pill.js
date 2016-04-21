'use strict';
var fs = require('fs');

var angular = require('camunda-bpm-sdk-js/vendor/angular'),
    $ = require('jquery'),

    template = fs.readFileSync(__dirname + '/cam-widget-search-pill.html', 'utf8');

  module.exports = ['$timeout',
  function($timeout) {

    return {
      restrict: 'A',

      scope: {
        valid: '=',
        extended: '=',
        basic: '=',
        allowDates: '=',
        enforceDates: '=',
        invalidText: '@',
        deleteText: '@',

        type: '=',
        name: '=',
        potentialNames: '=?',
        operator: '=',
        value: '=',

        onChange: '&',
        onDelete: '&'
      },

      link: function($scope, element, attrs) {
        $scope.valueType = $scope.enforceDates ? 'datetime' : 'text';
        $scope.potentialNames = $scope.potentialNames || [];

        $scope.changeSearch = function(field, value, evt) {
          var before = $scope[field].value;
          $scope[field].value = value;
          $scope[field].inEdit = false;
          if(typeof $scope.onChange === 'function') {
            $scope.onChange({field: field, before: before, value: value, $event: evt});
          }
        };

        $scope.clearEditTrigger = function(field) {
          $scope[field].inEdit = false;
        };

        $scope.onKeydown = function(evt, field) {
          if(evt.keyCode === 13 && evt.target === evt.currentTarget) {
            $scope[field].inEdit = true;
          }
        };

        $scope.$watch('allowDates', function(newValue){
          if(!newValue) {
            $scope.valueType = 'text';
          }
        });

        $scope.$watch('enforceDates', function(newValue){
          if(newValue) {
            $scope.valueType = 'datetime';
          }
        });

        var focusField = function(fieldName) {
          $timeout(function(){
            $(element[0].querySelectorAll("[cam-widget-inline-field][value='"+fieldName+".value']")).find(".view-value").click();
          });
        };
        $scope.$watch('value', function(newValue) {
          return newValue && newValue.inEdit && focusField('value');
        }, true);
        $scope.$watch('name', function(newValue) {
          return newValue && newValue.inEdit && focusField('name');
        }, true);
        $scope.$watch('type', function(newValue) {
          return newValue && newValue.inEdit && focusField('type');
        }, true);
        $scope.$watch('operator', function(newValue) {
          if (newValue && !newValue.value && newValue.values.length === 1) {
            newValue.value = newValue.values[0];
          }
          return newValue && newValue.inEdit && focusField('operator');
        }, true);

      },

      template: template
    };
  }];
