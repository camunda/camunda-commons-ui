'use strict';
var fs = require('fs');
var angular = require('camunda-bpm-sdk-js/vendor/angular');
var Viewer = require('dmn-js/lib/NavigatedViewer');
var Modeler = require('dmn-js/lib/Modeler');
var changeDmnNamespace = require('../../util/change-dmn-namespace');

var template = fs.readFileSync(__dirname + '/cam-widget-dmn-viewer.html', 'utf8');

module.exports = ['$window', function($window) {

  return {
    scope: {
      xml: '=',
      table: '@',
      width: '=',
      height: '=',
      control: '=?',
      editMode: '=',
      showDetails: '=',
      disableNavigation: '=',
      enableDrdNavigation: '=',
      disableLoader: '=',
      onLoad: '&',
      onClick: '&',
      onDblClick: '&'
    },
    template: template,
    link: function($scope, $element) {
      var canvas;
      var document = $window.document;

      $scope.isDrd = false;
      $scope.grabbing = false;

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
        var tableViewer = viewer.table;
        var elementRegistry = tableViewer.get('elementRegistry');

        tableViewer.get('eventBus').on('row.render', function(event) {
          if (event.data.id === elementId) {
            angular.element(event.gfx).addClass(className);
          }
        });

        tableViewer.get('graphicsFactory').update('row', elementRegistry.get(elementId), elementRegistry.getGraphics(elementId));
      };

      $scope.control.highlightElement = function(id) {
        if (canvas && viewer.get('elementRegistry').get(id)) {
          canvas.addMarker(id, 'highlight');

          $element.find('[data-element-id="' + id + '"]>.djs-outline').attr({
            rx: '14px',
            ry: '14px'
          });
        }
      };

      $scope.control.clearAllElementsHighlight = function() {
        if (canvas) {
          var children = canvas.getRootElement().children;

          children.forEach(function(element) {
            var id = element.id;

            if (canvas.hasMarker(id, 'highlight')) {
              canvas.removeMarker(id, 'highlight');
            }
          });
        }
      };

      $scope.control.clearElementHighlight = function(id) {
        if (canvas) {
          canvas.removeMarker(id, 'highlight');
        }
      };

      $scope.control.isElementHighlighted = function(id) {
        if (canvas) {
          return canvas.hasMarker(id, 'highlight');
        }
      };

      $scope.control.getElements = function(filter) {
        if (canvas) {
          return viewer.get('elementRegistry').filter(filter);
        }
      };

      $scope.control.createBadge = function(id, config) {
        if (canvas) {
          addOverlay(id, config);
        }
      };

      $scope.control.resetZoom = resetZoom;

      $scope.control.refreshZoom = function() {
        canvas.resized();
        canvas.zoom(canvas.zoom(), 'auto');
      };

      function addOverlay(id, config) {
        var overlays = viewer.get('overlays');

        var overlayId = overlays.add(id, {
          position: config.position || {
            bottom: 10,
            right: 10
          },
          show: {
            minZoom: -Infinity,
            maxZoom: +Infinity
          },
          html: config.html
        });

        return overlayId;
      }

      var DmnViewer;

      if(!$scope.editMode) {
        DmnViewer = Viewer;
      } else {
        DmnViewer = Modeler;
      }

      var container = $element[0].querySelector('.table-holder');
      var viewer = new DmnViewer({
        container: container,
        width: $scope.width,
        height: $scope.height,
        hideDetails: !$scope.showDetails,
        disableDrdInteraction: !$scope.enableDrdNavigation
      });

      var xml = null;

      $scope.$watch('xml', function(newValue) {
        if (newValue) {
          xml = newValue;
          renderTable();
        }
      });

      viewer.on('element.click', function(e) {
        $scope.$apply(function() {
          $scope.onClick({element: e.element, $event: e.originalEvent});
        });
      });

      viewer.on('element.dblclick', function(e) {
        $scope.$apply(function() {
          $scope.onDblClick({element: e.element, $event: e.originalEvent});
        });
      });

      viewer.on('view.switch', function(e) {
        $scope.$apply(function() {
          $scope.isDrd = e.fromTable;
        });
      });

      var mouseReleaseCallback = $scope.$apply.bind($scope, function() {
        $scope.grabbing = false;
        document.removeEventListener('mouseup', mouseReleaseCallback);
      });

      viewer.on('element.mousedown', $scope.$apply.bind($scope, function() {
        $scope.grabbing = true;

        document.addEventListener('mouseup', mouseReleaseCallback);
      }));

      $scope.zoomIn = function() {
        viewer.get('zoomScroll').zoom(1, {
          x: $element[0].offsetWidth / 2,
          y: $element[0].offsetHeight / 2
        });
      };

      $scope.zoomOut = function() {
        viewer.get('zoomScroll').zoom(-1, {
          x: $element[0].offsetWidth / 2,
          y: $element[0].offsetHeight / 2
        });
      };

      $scope.resetZoom = resetZoom;

      $window.addEventListener('resize', $scope.resetZoom);

      $scope.$on('destroy', function() {
        $window.removeEventListener('resize', $scope.resetZoom);
        document.removeEventListener('mouseup', mouseReleaseCallback);
      });

      function renderTable() {
        if (xml) {
          var correctedXML = changeDmnNamespace(xml);

          $scope.loaded = false;

          viewer.importXML(correctedXML, function(err) {
            $scope.isDrd = viewer.getDecisions().length > 1 && !$scope.table;

            if ($scope.isDrd) {
              canvas = viewer.get('canvas');
              canvas.zoom('fit-viewport', 'auto');

              $scope.control
                .getElements(function(element) {
                  return element.type === 'dmn:Decision';
                })
                .forEach(function(element) {
                  canvas.addMarker(element.id, 'decision-element');
                });
            }

            if ($scope.table) {
              var decisions = viewer.getDecisions();
              var isIndex = /^[0-9]+$/.test($scope.table);

              $scope.table = isIndex ? +$scope.table : $scope.table;

              decisions.forEach(function(decision, index) {
                if (isDecisionSelected(decision, index)) {
                  viewer.showDecision(decision);
                }
              });
            }

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

      function isDecisionSelected(decision, index) {
        if (angular.isString($scope.table) && decision.id === $scope.table || decision.name === $scope.table) {
          return true;
        }

        return $scope.table === index;
      }

      function resetZoom() {
        if (canvas) {
          canvas.resized();
          canvas.zoom('fit-viewport', 'auto');
        }
      }
    }
  };
}];
