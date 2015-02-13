define([
  'angular',
  'text!./cam-widget-header.html'
], function(
  angular,
  template
) {
  'use strict';

  var apps = {
    admin: {
      label: 'Admin'
    },
    cockpit: {
      label: 'Cockpit'
    },
    tasklist: {
      label: 'Tasklist'
    }
  };

  function setApps(currentApp) {
    var copied = angular.copy(apps);
    if (currentApp) {
      delete copied[currentApp];
    }
    return copied;
  }

  return [function() {
    return {
      transclude: true,

      template: template,

      scope: {
        authentication: '=',
        currentApp: '=',
        brandName: '@'
      },

      link: function (scope) {
        scope.apps = setApps(scope.currentApp);
        scope.$watch('currentApp', function () {
          scope.apps = setApps(scope.currentApp);
        });
      }
    };
  }];
});
