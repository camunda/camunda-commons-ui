define([
  'angular',
  'bpmn-io',
  'text!./cam-widget-bpmn-viewer.html'
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
        diagramData: '=',
        control: '=?',
        disableNavigation: '&',
        onLoad: '&',
        onClick: '&',
        onMouseEnter: '&',
        onMouseLeave: '&'
      },

      template: template,

      link: function($scope, $element) {

        $scope.grabbing = false;

        // parse boolean
        $scope.disableNavigation = $scope.$eval($scope.disableNavigation);

        // --- CONTROL FUNCTIONS ---
        $scope.control = $scope.control || {};

        $scope.control.highlight = function(id) {
          canvas.addMarker(id, 'highlight');

          $element.find('[data-element-id="'+id+'"]>.djs-outline').attr({
            rx: '14px',
            ry: '14px'
          });
        };

        $scope.control.clearHighlight = function(id) {
          canvas.removeMarker(id, 'highlight');
        };

        $scope.control.isHighlighted = function(id) {
          return canvas.hasMarker(id, 'highlight');
        };

        // config: text, tooltip, color, position
        $scope.control.createBadge = function(id, config) {
          var overlays = viewer.get('overlays');

          var htmlElement;
          if(config.html) {
            htmlElement = config.html;
          } else {
            htmlElement = document.createElement('span');
            if(config.color) {
              htmlElement.style['background-color'] = config.color;
            }
            if(config.tooltip) {
              htmlElement.setAttribute('tooltip', config.tooltip);
              htmlElement.setAttribute('tooltip-placement', 'top');
            }
            if(config.text) {
              htmlElement.appendChild(document.createTextNode(config.text));
            }
          }

          overlays.add(id, {
            position: config.position || {
              bottom: 0,
              right: 0
            },
            show: {
              minZoom: -Infinity,
              maxZoom: +Infinity
            },
            html: htmlElement
          });

          $compile(htmlElement)($scope);
        };

        $scope.control.removeBadges = function(id) {
          viewer.get('overlays').remove({element:id});
        };

        $scope.control.getViewer = function() {
          return viewer;
        };

        $scope.control.scrollToElement = function(element) {
          var height, width, x, y;

          var elem = viewer.get('elementRegistry').get(element);
          var viewbox = canvas.viewbox();

          height = Math.max(viewbox.height, elem.height);
          width  = Math.max(viewbox.width,  elem.width);

          x = Math.min(Math.max(viewbox.x, elem.x - viewbox.width + elem.width), elem.x);
          y = Math.min(Math.max(viewbox.y, elem.y - viewbox.height + elem.height), elem.y);

          canvas.viewbox({
            x: x,
            y: y,
            width: width,
            height: height
          });
        };

        $scope.control.getElement = function(elementId) {
          return viewer.get('elementRegistry').get(elementId);
        };

        $scope.loaded = false;
        $scope.control.isLoaded = function() {
          return $scope.loaded;
        };

        var BpmnViewer = Viewer;
        if($scope.disableNavigation) {
          BpmnViewer = Object.getPrototypeOf(Viewer.prototype).constructor;
        }
        var viewer = new BpmnViewer({
          container: $element.find('.diagram-holder'),
          width: '100%',
          height: '100%',
          overlays: {
            deferUpdate: false
          }
        });

        var diagramData = null;
        var canvas = null;

        $scope.$watch('diagramData', function(newValue) {
          if (newValue) {
            diagramData = newValue;
            renderDiagram();
          }
        });

        var routeChanged = false;
        $scope.$on('$routeChangeStart', function() {
          routeChanged = true;
        });

        var viewboxChanged = false;
        var currentViewbox;
        $scope.$watch(function() {
          return ($location.search() || {}).viewbox;
        }, function (newValue, oldValue) {
          // not loaded or route changes
          // -> do nothing
          if (!$scope.loaded || routeChanged) {
            routeChanged = false;
            return;
          }

          // user navigates on diagram
          // -> do nothing
          if (viewboxChanged) {
            currentViewbox = newValue;
            viewboxChanged = false;
            return;
          }

          // uses the browser history or changed
          // viewbox in the url
          // -> restore the old viewbox
          // -> so that the current position
          // and zoom level does not change
          if (currentViewbox !== newValue) {
            currentViewbox = oldValue;
            search.updateSilently({
              viewbox: oldValue
            });
            $location.replace();
          } 

        });

        function renderDiagram() {
          if (diagramData) {
            $scope.loaded = false;

            var useDefinitions = (typeof diagramData === 'object');

            var importFunction = (useDefinitions ? viewer.importDefinitions : viewer.importXML).bind(viewer);

            importFunction(diagramData, function(err, warn) {

              var applyFunction = useDefinitions ? function(fn){fn();} : $scope.$apply.bind($scope);

              applyFunction(function() {
                if (err) {
                  $scope.error = err;
                  return;
                }
                $scope.warn = warn;
                canvas = viewer.get('canvas');
                zoom();
                setupEventListeners();
                $scope.loaded = true;
                $scope.onLoad();
              });
            });
          }
        }

        function zoom() {
          if (canvas) {
            currentViewbox = ($location.search() || {}).viewbox;
            if (currentViewbox) {
              var viewbox = JSON.parse(currentViewbox);
              canvas.viewbox(viewbox[diagramData.id]);
            }
            else {
              canvas.zoom('fit-viewport', 'auto');
            }
          }
        }

        var mouseReleaseCallback = function() {
          $scope.grabbing = false;
          document.removeEventListener('mouseup', mouseReleaseCallback);
          $scope.$apply();
        };

        function setupEventListeners() {
          var eventBus = viewer.get('eventBus');
          eventBus.on('element.click', function(e) {
            // e.element = the model element
            // e.gfx = the graphical element
            $scope.onClick({element: e.element, $event: e.originalEvent});
          });
          eventBus.on('element.hover', function(e) {
            $scope.onMouseEnter({element: e.element, $event: e.originalEvent});
          });
          eventBus.on('element.out', function(e) {
            $scope.onMouseLeave({element: e.element, $event: e.originalEvent});
          });
          eventBus.on('element.mousedown', function() {
            $scope.grabbing = true;

            document.addEventListener('mouseup', mouseReleaseCallback);

            $scope.$apply();
          });
          eventBus.on('canvas.viewbox.changed', function(e) {
            viewboxChanged = true;
            var viewbox = JSON.parse(($location.search() || {}).viewbox || '{}');

            viewbox[diagramData.id] = {
              x: e.viewbox.x,
              y: e.viewbox.y,
              width: e.viewbox.width,
              height: e.viewbox.height
            };

            search.updateSilently({
              viewbox: JSON.stringify(viewbox)
            });

            var phase = $rootScope.$$phase;
            if (phase !== '$apply' && phase !== '$digest') {
              $scope.$apply(function () {
                $location.replace();
              });
            } else {
              $location.replace();
            }
          });
        }

        $scope.zoomIn = function() {
          viewer.diagram.get('zoomScroll').zoom(1, {
            x: $element[0].offsetWidth / 2,
            y: $element[0].offsetHeight / 2
          });
        };

        $scope.zoomOut = function() {
          viewer.diagram.get('zoomScroll').zoom(-1, {
            x: $element[0].offsetWidth / 2,
            y: $element[0].offsetHeight / 2
          });
        };

        $scope.resetZoom = function() {
          canvas.zoom('fit-viewport', 'auto');
        };
        $scope.control.resetZoom = $scope.resetZoom;

      }
    };
  }];
});
