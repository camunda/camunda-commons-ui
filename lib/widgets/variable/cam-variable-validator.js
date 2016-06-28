'use strict';

var typeUtils = require('camunda-bpm-sdk-js/lib/forms/type-util');

module.exports = [function() {

  return {

    require: 'ngModel',

    link: function($scope, $element, $attrs, ctrl) {

      var validate = function(viewValue) {

        var type = $attrs.camVariableValidator;
        if (['String', 'Object', 'Null'].indexOf(type) !== -1) {
          ctrl.$setValidity('camVariableValidator', true);
        } else {
          ctrl.$setValidity('camVariableValidator', typeUtils.isType(viewValue, type));
        }

        return viewValue;
      };

      ctrl.$parsers.unshift(validate);
      ctrl.$formatters.push(validate);

      $attrs.$observe('camVariableValidator', function() {
        return validate(ctrl.$viewValue);
      });
    }
  };
}];
