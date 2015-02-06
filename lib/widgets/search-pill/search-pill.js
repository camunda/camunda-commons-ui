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
          $scope[field].inEdit = false;
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

        $scope.$watch('value', function(newValue) {
          if(newValue.inEdit) {
            $timeout(function(){
              element.find("[cam-widget-inline-field]").last().find(".view-value").click();
            });
          }
        }, true);
        $scope.$watch('name', function(newValue) {
          if(newValue.inEdit) {
            $timeout(function(){
              element.find("[cam-widget-inline-field][value='name.value']").find(".view-value").click();
            });
          }
        }, true);
      },

      template: template
    };
  }];
});
