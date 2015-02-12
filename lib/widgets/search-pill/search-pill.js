define([
  'text!./search-pill.html',
  'angular',
  'jquery'
], function(
  template,
  angular,
  $
) {
  'use strict';
  return ['$timeout',
  function($timeout) {

    return {
      restrict: 'A',

      scope: {
        valid: '=',
        extended: '=',
        allowDates: '=',
        enforceDates: '=',
        invalidText: '@',
        deleteText: '@',

        type: '=',
        name: '=',
        operator: '=',
        value: '=',

        onChange: '&',
        onDelete: '&'
      },

      link: function($scope, element, attrs) {
        $scope.valueType = $scope.enforceDates ? 'datetime' : 'text';

        $scope.changeSearch = function(field, value, evt) {
          var before = $scope[field].value;
          $scope[field].value = value;
          $scope[field].inEdit = false;
          if(typeof $scope.onChange === "function") {
            $scope.onChange({field: field, before: before, value: value, $event: evt});
          }
        };

        $scope.clearEditTrigger = function(field) {
          $scope[field].inEdit = false;
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
            element.find("[cam-widget-inline-field][value='"+fieldName+".value']").find(".view-value").click();
          });
        };
        $scope.$watch('value', function(newValue) {
          return newValue.inEdit && focusField('value');
        }, true);
        $scope.$watch('name', function(newValue) {
          return newValue.inEdit && focusField('name');
        }, true);
        $scope.$watch('type', function(newValue) {
          return newValue.inEdit && focusField('type');
        }, true);

      },

      template: template
    };
  }];
});
