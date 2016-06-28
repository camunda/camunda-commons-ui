  'use strict';

  var secretEmptyKey = '[$empty$]';
  /**
    this directive is used in combination with typeahead and opens the typeahead field on focus
  **/
  module.exports = ['$timeout',
  function($timeout) {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function(scope, element, attrs, model) {

        // IE HAX: We have to delay the setup of the instant typeahead feature, as the internet explorer triggers an input event when it sets
        // the placeholder for the input field. If we do not delay the setup, this input event would trigger the typeahead. This would open
        // the typeahead dropdown on page load, e.g. when the search widget is loaded.

        $timeout(function() {
          // this parser run before typeahead's parser
          model.$parsers.unshift(function(inputValue) {
            var value = (inputValue ? inputValue : secretEmptyKey); // replace empty string with secretEmptyKey to bypass typeahead-min-length check
            model.$viewValue = value; // this $viewValue must match the inputValue pass to typehead directive
            return value;
          });

          // this parser run after typeahead's parser
          model.$parsers.push(function(inputValue) {
            return inputValue === secretEmptyKey ? '' : inputValue; // set the secretEmptyKey back to empty string
          });

          scope.instantTypeahead = function(element, viewValue) {
            return viewValue === secretEmptyKey || (''+element).toLowerCase().indexOf((''+viewValue).toLowerCase()) > -1;
          };

          element.bind('click', function() {
            model.$setViewValue(model.$viewValue);
            element.triggerHandler('input');
          });

          element.bind('input', function() {
            // update the view value to trigger re-evaluation of the model parsers
            model.$setViewValue(model.$viewValue);
          });
        });
      }
    };
  }];
