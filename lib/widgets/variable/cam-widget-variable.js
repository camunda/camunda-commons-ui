define([
  'angular',
  'text!./cam-widget-variable.html',
  'text!./cam-widget-variable-dialog.html',
  'camunda-bpm-sdk-js-type-utils'
], function(
  angular,
  template,
  templateDialog,
  typeUtils
) {
  'use strict';

  var variableTypes = [
    'Boolean',
    'Bytes',
    'Date',
    'Double',
    'Integer',
    'Long',
    'Null',
    'Object',
    'Short',
    'String'
  ];

  var modalCtrl = [
    '$scope',
    'variable',
  function (
    $dialogScope,
    variable
  ) {
    $dialogScope.value = variable.value;

    $dialogScope.ok = function () {

    };

    $dialogScope.cancel = function () {

    };
  }];

  return [
    '$modal',
  function(
    $modal
  ) {
    return {
      template: template,

      scope: {
        variable: '=camVariable',
        display:  '@?',
        shown:    '=?'
      },


      link: function ($scope, element) {
        $scope.variableTypes = angular.copy(variableTypes);

        $scope.isPrimitive = function () {
          if (!$scope.variable.type) { return true; }
          return [
            'Boolean',
            'Date',
            'Double',
            'Integer',
            'Long',
            'Null',
            'Short',
            'String'
          ].indexOf($scope.variable.type) >= 0;
        };
        var defaultValues = {
          'Booolean':   false,
          'Date':       new Date(),
          'Double':     0,
          'Integer':    0,
          'Long':       0,
          'Null':       '',
          'Short':      0,
          'String':     '',
          'Bytes':      '',
          'Object':     {}
        };

        $scope.useCheckbox = function () {
          return $scope.variable.type === 'Boolean';
        };



        $scope.isShown = function (what) {
          if (!Array.isArray($scope.shown) || !$scope.shown.length) { return true; }
          return $scope.shown.indexOf(what) > -1;
        };

        $scope.shownClasses = function () {
          if (!Array.isArray($scope.shown) || !$scope.shown.length) { return ''; }
          return $scope.shown.map(function (part) {
            return 'show-' + part;
          }).join(' ');
        }
        $scope.$watch('shown', function () {
          element
            .removeClass('show-type show-name show-value')
            .addClass($scope.shownClasses());
        });


        function validate() {
          if (!$scope.variable.name) {
            $scope.valid = false;
          }
          else if ($scope.variable.value === null) {
            $scope.valid = true;
          }
          else {
            $scope.valid = typeUtils.isType($scope.variable.value, $scope.variable.type);
          }
        }
        $scope.valid = true;
        $scope.$watch('variable.value', validate);
        $scope.$watch('variable.name', validate);
        $scope.$watch('variable.type', validate);
        validate();


        var backup = $scope.variable.value;
        $scope.isNull = function () {
          return $scope.variable.value === null;
        };
        $scope.setNonNull = function () {
          $scope.variable.value = backup || defaultValues[$scope.variable.type];
        };
        $scope.setNull = function () {
          backup = $scope.variable.value;
          $scope.variable.value = null;
        };

        $scope.editVariableValue = function () {
          $modal.open({
            template: templateDialog,

            controller: modalCtrl,

            resolve: {
              variable: function () { return $scope.variable; }
            }
          });
        };
      }
    };
  }];
});
