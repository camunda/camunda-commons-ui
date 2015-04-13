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
    '$http',
    'variable',
  function (
    $dialogScope,
    $http,
    variable
  ) {
    $dialogScope.variable = variable;
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
        // A variable HAS a the following information
        // {
        //   value: <Mixed>,
        //   name: <String>,
        //   type: <String>,
        //
        // A variable MAY HAVE a the following information
        //   id: <UUID>,
        //   valueInfo: {
        //     objectTypeName: <String>,
        //     serializationDataFormat: <String>
        //   },
        //
        //   activitiyInstanceId: <UUID>,
        //   caseExecutionId: <UUID>,
        //   caseInstanceId: <UUID>,
        //   executionId: <UUID>,
        //   processInstanceId: <UUID>,
        //   taskId: <UUID>
        // }
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
          'Boolean':    false,
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
        };
        $scope.$watch('shown', function () {
          element
            .removeClass('show-type show-name show-value')
            .addClass($scope.shownClasses());
        });


        function validate() {
          if (!$scope.variable.name || !$scope.variable.type) {
            $scope.valid = false;
          }

          else if ($scope.variable.value === null ||
                   ['String', 'Object', 'Bytes', 'Null'].indexOf($scope.variable.type) > -1) {
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

        // backup is used to recover a variable value
        // from either type or null switch
        var backup = $scope.variable.value;

        $scope.$watch('variable.type', function (current, previous) {
          // convert the value to boolean when the type becomes Boolean
          if (current === 'Boolean') {
            // we don't do anything if the value is null
            if ($scope.variable.value !== null) {
              backup = $scope.variable.value;

              $scope.variable.value = $scope.variable.value === 'false' ?
                                      false :
                                      !!$scope.variable.value;
            }
          }
          else if (previous === 'Boolean') {
            $scope.variable.value = backup;
          }

          var classList = element[0].classList;
          if (previous) {
            classList.remove('var-type-' + previous.toLowerCase());
          }
          if (current) {
            classList.add('var-type-' + current.toLowerCase());
          }
        });

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
          // var modalInstance =
          $modal.open({
            template: templateDialog,

            controller: modalCtrl,

            windowClass: 'cam-widget-variable-dialog',

            resolve: {
              variable: function () { return $scope.variable; }
            }
          });

          // modalInstance.result.then(function () {/*success*/}, function () {/*error*/});
        };
      }
    };
  }];
});
