define([
  'angular',
  'text!./cam-widget-variables-table.html',
  'text!./../variable/cam-widget-variable-dialog.html',
  './../variable/cam-variable-utils'
], function(
  angular,
  template,
  templateDialog,
  varUtils
) {
  'use strict';

  var typeUtils = varUtils.typeUtils;

  var emptyVariable = {
    variable: {
      name: null,
      type: null,
      value: null,
      valueInfo: {}
    },
    additions: {}
  };

  function deepCopy(original) {
    return JSON.parse(JSON.stringify(original));
  }

  function noopPromise(info/*, i*/) {
    return {
      then: function (success/*, error*/) {
        success(angular.copy(info.variable));
        // error('Not implemented');
      }
    };
  }

  return [
    '$modal',
  function(
    $modal
  ) {
    return {
      template: template,

      scope: {
        variables:    '=camVariables',
        headers:      '=?camHeaders',
        editable:     '=?camEditable',

        deleteVar:    '=?onDelete',
        saveVar:      '=?onSave',
        editVar:      '=?onEdit',
        downloadVar:  '=?onDownload',
        uploadVar:    '=?onUpload'
      },


      link: function ($scope) {
        var originals = [];
        var backups = [];

        function _getVar(v) {
          return ($scope.variables[v] || {}).variable;
        }

        function hasChanged(v) {
          if (!$scope.variables || !$scope.variables[v] || !$scope.variables[v]._copy) { return false; }
          var yep;
          var now = _getVar(v);
          var before = $scope.variables[v]._copy;

          yep = !now || !before;

          yep = yep || (now.name !== before.name);
          yep = yep || (now.type !== before.type);
          yep = yep || (now.value !== before.value);

          // if (now.valueInfo) {}
          // yep = yep || (now.valueInfo !== before.valueInfo);

          return yep;
        }


        $scope.editable = ($scope.editable || ['type', 'name', 'value']);

        $scope.headers = ($scope.headers || {
          name:   'Name',
          type:   'Type',
          value:  'Value'
        });
        $scope.headerNames = Object.keys($scope.headers);

        $scope.variableTypes = angular.copy(varUtils.types);
        $scope.defaultValues = varUtils.defaultValues;
        $scope.isPrimitive = varUtils.isPrimitive($scope);
        $scope.isBinary = varUtils.isBinary($scope);
        $scope.useCheckbox = varUtils.useCheckbox($scope);

        $scope.headers = ($scope.headers || {
          name:   'Name',
          type:   'Type',
          value:  'Value'
        });

        $scope.headerNames = Object.keys($scope.headers);

        [
          'uploadVar',
          'deleteVar',
          'saveVar'
        ].forEach(function (name) {
          $scope[name] = (angular.isFunction($scope[name]) ? $scope[name] : noopPromise);
        });

        $scope.editVar = angular.isFunction($scope.editVar) ? $scope.editVar : (function (info, v) {
          return $modal.open({
            template: varUtils.templateDialog,

            controller: varUtils.modalCtrl,

            windowClass: 'cam-widget-variable-dialog',

            resolve: {
              variable: function () { return angular.copy(_getVar(v)); },
              readonly: function () { return !$scope.isEditable('value', $scope.variables[v]); }
            }
          })
          .result;
        });

        $scope.downloadLink = angular.isFunction($scope.downloadVar) ? $scope.downloadVar : (function (info) {
          return '/camunda/api/engine/engine/default/variable-instance/' + info.variable.id +'/data';
        });





        function validate(info, i) {
          if (!info.variable.name || !info.variable.type) {
            info.valid = false;
          }

          else if (info.variable.value === null ||
                   ['String', 'Object', 'Null'].indexOf(info.variable.type) > -1) {
            info.valid = true;
          }

          else {
            info.valid = typeUtils.isType(info.variable.value, info.variable.type);
          }

          if(info.valid) {
            // save the variable in the appropriate type
            if (info.variable.type &&
                info.variable.value !== null &&
                $scope.isPrimitive(info.variable.type)) {
              var newTyped;

              if (info.variable.type !== 'Boolean') {
                newTyped = typeUtils.convertToType(info.variable.value, info.variable.type);
              }
              else {
                newTyped = info.variable.value ?
                            info.variable.value !== 'false' :
                            false;
              }

              // only change value if newType has different type, to avoid infinite recursion
              if(typeof info.variable.value !== typeof newTyped) {
                info.variable.value = newTyped;
              }
            }
          }

          info.changed = hasChanged(i);
        }

        function initVariables() {
          originals = angular.copy($scope.variables || []);
          ($scope.variables || []).forEach(function (info, i) {
            info.valid = true;

            var varPath = 'variables[' + i + '].variable';
            function wrapedValidate() {
              validate(info, i);
            }
            $scope.$watch(varPath + '.value', wrapedValidate);
            $scope.$watch(varPath + '.name', wrapedValidate);
            $scope.$watch(varPath + '.type', wrapedValidate);

            $scope.$watch('variables[' + i + '].editMode', function (now, before) {
              if (angular.isUndefined(now)) { return; }

              if (now === true) {
                info._copy = deepCopy(info.variable);
              }
              else if (now === false && before === true && info._copy) {
                info.variable.type = info._copy.type;
                info.variable.name = info._copy.name;
                info.variable.value = info._copy.value;

                delete info._copy;
              }
            });

            validate(info, i);
            backups[i] = info.variable.value;
          });
        }
        $scope.$watch('variables', initVariables);
        initVariables();








        $scope.isEditable = function (what, info) {
          return info.editMode && $scope.editable.indexOf(what) > -1;
        };

        $scope.rowClasses = function (info/*, v*/) {
          return [
            info.editMode ? 'editing' : null,
            info.valid ? null : 'ng-invalid',
            info.valid ? null : 'ng-invalid-cam-variable-validator'
          ];
        };

        $scope.colClasses = function (info, headerName/*, v*/) {
          return [
            $scope.isEditable(headerName, info) ? 'editable' : null,
            'type-' + (info.variable.type || '').toLowerCase(),
            'col-' + headerName
          ];
        };





        $scope.isNull = function (v) {
          return $scope.variables[v].variable.value === null;
        };

        $scope.setNull = function (v) {
          var variable = _getVar(v);
          backups[v] = variable.value;
          variable.value = null;
        };

        $scope.setNonNull = function (v) {
          var variable = _getVar(v);
          variable.value = backups[v] || $scope.defaultValues[variable.type];
        };



        $scope.editVariableValue = function (v) {
          var info = $scope.variables[v];
          $scope.editVar(info, v).then(function (result) {
            _getVar(v).value = result.value;
            _getVar(v).valueInfo = result.valueInfo;
          });
        };


        $scope.addVariable = function () {
          $scope.variables.push(angular.copy(emptyVariable));
        };

        $scope.deleteVariable = function (v) {
          var info = $scope.variables[v];

          $scope.deleteVar(info, v).then(function () {
            $scope.variables.splice($scope.variables.indexOf(info), 1);
          }, function (err) {
            console.error(err);
          });
        };

        $scope.saveVariable = function (v) {
          var info = $scope.variables[v];
          info.editMode = false;

          $scope.saveVar(info, v).then(function(saved) {
            info.variable.name = saved.name;
            info.variable.type = saved.type;
            info.variable.value = saved.value;
            info.variable.valueInfo = saved.valueInfo;
            delete info._copy;
          }, function(/*err*/) {
            // console.error(err);
            info.editMode = true;
          });
        };


        $scope.uploadVariable = function (v) {
          var info = $scope.variables[v];
          info.editMode = false;

          $scope.uploadVar(info, v).then(function(/*saved*/) {
            delete info._copy;
          }, function(/*err*/) {
            // console.error(err);
          });
        };
      }
    };
  }];
});

