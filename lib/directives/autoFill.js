/* global define: false */
define([], function() {
  'use strict';

  /**
   * This directive ensures that form fields
   * filled by browsers are properly recognized by angular.
   *
   * @example
   *
   * <input ng-model="password" auto-fill />
   */
  return ['$timeout', function($timeout) {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function (scope, element, attrs, model) {

        $timeout(function() {
          var value = element.val();
          if (value !== model.$viewValue) {
            model.$setViewValue(value);
          }
        }, 500);
      }
    };
  }];
});
