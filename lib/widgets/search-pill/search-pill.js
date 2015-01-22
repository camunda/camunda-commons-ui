define([
  'text!./search-pill.html',
  'angular'
], function(
  template,
  angular
) {
  'use strict';
  return [
  function(
  ) {

    return {
      restrict: 'A',

      scope: {
        valid: '=',
        extended: '=',
        allowDates: '=',
        enforceDates: '=',
        invalidText: '@',

        type: '=',
        name: '=',
        operator: '=',
        value: '=',

        onChange: '&',
        onDelete: '&'
      },

      link: function($scope, element, attrs) {
        $scope.dropdownOpen = false;

        $scope.valueType = $scope.enforceDates ? 'datetime' : 'text';

        $scope.changeSearch = function(field, value) {

          var before = $scope[field].value;
          $scope[field].value = value;
          if(typeof $scope.onChange === "function") {
            $scope.onChange({field: field, before: before, value: value});
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
      },

      template: template
    };
  }];
});
