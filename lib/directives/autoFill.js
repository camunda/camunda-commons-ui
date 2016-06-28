'use strict';

  /**
   * This directive ensures that form fields
   * filled by browsers are properly recognized by angular.
   *
   * @example
   *
   * <input ng-model="password" auto-fill />
   */
module.exports = [
  '$interval',
  function(
    $interval
  ) {
    return {
      restrict: 'A',

      require: 'ngModel',

      link: function(scope, element, attrs, model) {
        // console.info('start watching for auto-filled field', attrs.name);

        var interval = $interval(function() {
          var value = element.val();
          if (value !== model.$viewValue) {
            model.$setViewValue(value);
            model.$setPristine();
          }

          if (typeof document.contains === 'function' && !document.contains(element[0])) {
            // console.info('stop watching for auto-filled field', attrs.name);
            $interval.cancel(interval);
          }
          else if (typeof document.contains !== 'function') {
            $interval.cancel(interval);
          }
        }, 500);
      }
    };
  }];
