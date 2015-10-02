define([
  'angular',
  'dmn-io',
  'text!./cam-widget-dmn-viewer.html'
], function(
  angular,
  Viewer,
  template
) {
  'use strict';
  return [function() {

    return {
      scope: {
        tableXml: '=',
        control: '=?',
        onLoad: '&'
      },

      template: template,

      link: function($scope, $element) {

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
              // todo: use domClasses or the like
              event.gfx.classList.add(className);
            }
          });

          viewer.get('graphicsFactory').update('row', elementRegistry.get(elementId), elementRegistry.getGraphics(elementId));
        };

        var DmnViewer = Viewer;

        var viewer = new DmnViewer({
          container: $element.find('.table-holder'),
          width: '100%',
          height: '100%',
          hideDetails: true
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
              if(err) {
                $scope.error = err;
                return;
              }
              $scope.loaded = true;
              $scope.onLoad();
            });
          }
        }
      }
    };
  }];
});
