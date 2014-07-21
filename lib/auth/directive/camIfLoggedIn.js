define([
], function() {
  'use strict';

  return [  '$animate', 'Authentication',
    function($animate,   Authentication) {
      return {
        transclude: 'element',
        priority: 1000,
        terminal: true,
        restrict: 'A',
        compile: function (element, attr, transclude) {
          return function ($scope, $element) {
            var childElement, childScope;

            $scope.$watch(Authentication.username, function(value) {
              if (childElement) {
                $animate.leave(childElement);
                childElement = undefined;
              }
              if (childScope) {
                childScope.$destroy();
                childScope = undefined;
              }
              if (!!value) {
                childScope = $scope.$new();
                transclude(childScope, function (clone) {
                  childElement = clone;
                  $animate.enter(clone, $element.parent(), $element);
                });
              }
            });
          };
        }
      };
  }];

});
