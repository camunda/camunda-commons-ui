'use strict';
var fs = require('fs');

var angular = require('camunda-bpm-sdk-js/vendor/angular'),
    Viewer = require('dmn-js/lib/Modeler'),

    template = fs.readFileSync(__dirname + '/cam-widget-dmn-viewer.html', 'utf8');

  module.exports = [function() {

    return {
      scope: {
        tableXml: '=',
        width: '=',
        height: '=',
        control: '=?',
        editMode: '&',
        showDetails: '&',
        onLoad: '&'
      },

      template: template,

      link: function($scope, $element) {

        // parse boolean
        $scope.editMode = $scope.$eval($scope.editMode);
        $scope.showDetails = $scope.$eval($scope.showDetails);

        // --- CONTROL FUNCTIONS ---
        $scope.control = $scope.control || {};

        $scope.control.getViewer = function() {
          return viewer;
        };

        $scope.control.getElement = function(elementId) {
          return viewer.get('elementRegistry').get(elementId);
        };

        $scope.loaded = false;
        $scope.control.isLoaded = function() {
          return $scope.loaded;
        };

        $scope.control.highlightRow = function(elementId, className) {
          var elementRegistry = viewer.get('elementRegistry');
          viewer.get('eventBus').on('row.render', function(event) {
            if (event.data.id === elementId) {
              angular.element(event.gfx).addClass(className);
            }
          });

          viewer.get('graphicsFactory').update('row', elementRegistry.get(elementId), elementRegistry.getGraphics(elementId));
        };

        var DmnViewer = Viewer;
        if(!$scope.editMode) {
          DmnViewer = Object.getPrototypeOf(Viewer.prototype).constructor;
        }

        var container = $element[0].querySelector('.table-holder');
        var viewer = new DmnViewer({
          container: container,
          width: $scope.width,
          height: $scope.height,
          hideDetails: !$scope.showDetails
        });

        var tableXml = null;

        $scope.$watch('tableXml', function(newValue) {
          if (newValue) {
            tableXml = newValue;
            renderTable();
          }
        });

        function renderTable() {
          if (tableXml) {
            $scope.loaded = false;

            viewer.importXML(tableXml, function(err, warn) {

              $scope.$apply(function() {
                if(err) {
                  $scope.error = err;
                  return;
                }
                $scope.loaded = true;
                $scope.onLoad();
              });
            });
          }
        }
      }
    };
  }];
