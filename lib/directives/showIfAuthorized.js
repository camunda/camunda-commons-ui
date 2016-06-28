  'use strict';

  var builtInResources = {
    'application': 0,
    'user': 1,
    'group': 2,
    'group membership': 3,
    'authorization': 4
  };

  var mapParameters = function(permissionName, resource, resourceId) {

    var request = {};

    request.permissionName = permissionName;
    request.resourceName = resource;
    request.resourceType = builtInResources[resource];

    if(resourceId) {
      request.resourceId = resourceId;
    }

    return request;
  };

  module.exports = ['$animate', 'AuthorizationResource',
  function($animate,   AuthorizationResource) {
    return {
      transclude: 'element',
      priority: 1000,
      terminal: true,
      restrict: 'A',
      compile: function(element, attr, transclude) {
        return function($scope, $element) {

          var childElement, childScope;

          var permission = attr.authPermission;
          var resourceName = attr.authResourceName;
          var resourceId = $scope.$eval(attr.authResourceId);
          var invertCheck = (attr.authInverse === 'true');

          AuthorizationResource.check(mapParameters(permission, resourceName, resourceId)).$promise.then(function(response) {

            if (childElement) {
              $animate.leave(childElement);
              childElement = undefined;
            }

            if (childScope) {
              childScope.$destroy();
              childScope = undefined;
            }

            if ( (!!response.authorized && !invertCheck) || (!response.authorized && invertCheck )) {
              childScope = $scope.$new();
              transclude(childScope, function(clone) {
                childElement = clone;
                $animate.enter(clone, $element.parent(), $element);
              });
            }

          });

        };
      }
    };
  }];
