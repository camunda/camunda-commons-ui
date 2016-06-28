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

            $scope.$on('authentication.changed', function(e, authentication) {
              redraw(authentication);
            });

            redraw($rootScope.authentication);
          };
        }
      };
    }];
