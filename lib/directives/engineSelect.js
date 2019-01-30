'use strict';

var fs = require('fs');

var angular = require('camunda-bpm-sdk-js/vendor/angular');
var template = fs.readFileSync(__dirname + '/engineSelect.html', 'utf8');

var $ = require('jquery');

var ProcessEngineSelectionController = [
  '$scope', '$http', '$location', '$window', 'Uri', 'Notifications', '$translate',
  function($scope,   $http,   $location,   $window,   Uri,   Notifications, $translate) {

    var current = Uri.appUri(':engine');
    var enginesByName = {};

    $http.get(Uri.appUri('engine://engine/')).then(function(response) {
      $scope.engines = response.data;

      angular.forEach($scope.engines , function(engine) {
        enginesByName[engine.name] = engine;
      });

      $scope.currentEngine = enginesByName[current];

      if (!$scope.currentEngine) {
        Notifications.addError({ status: $translate.instant('DIRECTIVE_ENGINE_SELECT_STATUS_NOT_FOUND'), message: $translate.instant('DIRECTIVE_ENGINE_SELECT_MESSAGE_NOT_FOUND'), scope: $scope });
        $location.path('/dashboard');
      }
    }).catch(angular.noop);
  }];

module.exports = function() {
  return {
    template: template,
    replace: true,
    controller: ProcessEngineSelectionController,
    link: function(scope, element, attrs) {

      var divider;

      scope.$watch(attrs.ngShow, function(newValue) {
        if (newValue && !divider) {
          divider = $('<li class="divider-vertical"></li>').insertAfter(element);
        }

        if (!newValue && divider) {
          divider.remove();
          divider = null;
        }
      });

      scope.$on('$destroy', function() {
        if (divider) {
          divider.remove();
        }
      });
    }
  };
};
