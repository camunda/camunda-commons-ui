'use strict';
var fs = require('fs');

var angular = require('angular'),

    template = fs.readFileSync(__dirname + '/cam-widget-header.html', 'utf8');

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

      compile: function (el, attrs) {
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
      function (
        $scope,
        AuthenticationService
      ) {
        $scope.apps = setApps($scope.currentApp);
        $scope.logout = AuthenticationService.logout;

        $scope.$watch('currentApp', function () {
          $scope.apps = setApps($scope.currentApp);
        });
      }]
    };
  }];
