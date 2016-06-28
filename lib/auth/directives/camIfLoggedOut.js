  'use strict';

  module.exports = [  '$animate', '$rootScope',
    function($animate,   $rootScope) {
      return {
        transclude: 'element',
        priority: 1000,
        terminal: true,
        restrict: 'A',
        compile: function(element, attr, transclude) {
          return function($scope, $element) {
            var childElement, childScope;

            function redraw(show) {
              if (childElement) {
                $animate.leave(childElement);
                childElement = undefined;
              }
              if (childScope) {
                childScope.$destroy();
                childScope = undefined;
              }
              if (show) {
                childScope = $scope.$new();
                transclude(childScope, function(clone) {
                  childElement = clone;
                  $animate.enter(clone, $element.parent(), $element);
                });
              }
            }

            // listening to the local $scope prevents memory leaks because when the $scope
            // is droped/deleted, the listeners are too
            // and as the authentication service "broadcasts" events from the $rootScope
            // the event will also be triggered on the local $scope
            $scope.$on('authentication.changed', function(e, authentication) {
              redraw(!authentication);
            });

            redraw(!$rootScope.authentication);
          };
        }
      };
    }];
