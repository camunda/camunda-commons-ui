'use strict';
var fs = require('fs');

var angular = require('camunda-bpm-sdk-js/vendor/angular'),

    template = fs.readFileSync(__dirname + '/cam-widget-header.html', 'utf8');

var apps = {
  welcome:{
    label: 'Welcome'
  },
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


module.exports = [function() {
  return {
    transclude: true,

    template: template,

    scope: {
      authentication: '=',
      userName: '=?',
      currentApp: '@',
      signOut: '@?',
      toggleNavigation: '@?',
      myProfile: '@?',
      smallScreenWarning: '@?',
      brandName: '@'
    },

    compile: function(el, attrs) {
      if (!attrs.toggleNavigation) { attrs.toggleNavigation = 'Toggle navigation'; }
      if (!attrs.myProfile) { attrs.myProfile = 'My profile'; }
      if (!attrs.signOut) { attrs.signOut = 'Sign out'; }
      if (!attrs.brandName) { attrs.brandName = 'Camunda'; }
      if (!attrs.smallScreenWarning) {
        attrs.smallScreenWarning = 'This application is conceived for larger screens.';
      }
    },

    controller: [
      '$scope',
      'AuthenticationService',
      function(
        $scope,
        AuthenticationService
      ) {
        $scope.logout = AuthenticationService.logout;

        function setApps() {
          var kept = angular.copy(apps);

          if ($scope.currentApp) {
            if ($scope.currentApp === 'welcome' && $scope.authentication) {
              kept = {};
            }
            else {
              delete kept[$scope.currentApp];
            }
          }

          if ($scope.authentication && $scope.authentication.name) {
            delete kept.welcome;

            Object.keys(kept).forEach(function(appName) {
              if ($scope.authentication.authorizedApps.indexOf(appName) < 0) {
                delete kept[appName];
              }
            });
          }

          $scope.showAppDropDown = Object.keys(kept).length > 0;

          $scope.apps = kept;
        }

        $scope.$watch('currentApp', setApps);
        $scope.$watch('authentication', setApps);
      }]
  };
}];
