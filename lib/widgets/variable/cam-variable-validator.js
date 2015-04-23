define(['camunda-bpm-sdk-js-type-utils'], function(typeUtils) {
  'use strict';

  return [function() {

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

        $attrs.$observe('camVariableValidator', function(){
          return validate(ctrl.$viewValue);
        });
      }
    };
  }];
});
