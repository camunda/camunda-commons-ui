/* global define: false */
  'use strict';

  /**
    this directive is placed on an input field and validates whether the
    password contains at least 8 characters
  **/
  module.exports = function() {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function (scope, element, attrs, model) {

        model.$parsers.unshift(function(viewValue) {

          if (viewValue && viewValue.length >= 8) {
            model.$setValidity('password', true);
          } else {
            model.$setValidity('password', false);
          }
          return viewValue;
        });
      }
    };
  };
