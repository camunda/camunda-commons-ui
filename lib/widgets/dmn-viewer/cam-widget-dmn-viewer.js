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
  return ['$compile', '$location', '$rootScope', 'search',
  function($compile,   $location,   $rootScope,   search) {

    return {
      scope: {
        tableXml: '=',
        control: '=?',
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

        var DmnViewer = Viewer;

        var viewer = new DmnViewer({
          container: $element.find('.table-holder'),
          width: '100%',
          height: '100%'
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
              $scope.error = err;
              //console.log('import finished', err, warn);
            });
          }
        }
      }
    };
  }];
});
