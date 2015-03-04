define([
  'angular',
  'bpmn-js',
  'text!./cam-widget-bpmn-viewer.html'
], function(
  angular,
  Viewer,
  template
) {
  'use strict';
  return ['$compile',
  function($compile) {

    return {
      scope: {
        diagramData: '=',
        control: '=?',
        disableNavigation: '&',
        onLoad: '&',
        onClick: '&'
      },

      template: template,

      link: function($scope, $element) {

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

          var htmlElement = document.createElement('span');
          if(config.color) {
            htmlElement.style['background-color'] = config.color;
          }
          if(config.tooltip) {
            htmlElement.setAttribute('tooltip', config.tooltip);
            htmlElement.setAttribute('tooltip-placement', 'top');
          }
          htmlElement.appendChild(document.createTextNode(config.text));

          overlays.add(id, {
            position: config.position || {
              bottom: 0,
              right: 0
            },
            html: htmlElement
          });

          $compile(htmlElement)($scope);
        };

        $scope.control.removeBadges = function(id) {
          viewer.get('overlays').remove({element:id});
        };

        var BpmnViewer = Viewer;
        if($scope.disableNavigation) {
          BpmnViewer = Object.getPrototypeOf(Viewer.prototype).constructor;
        }
        var viewer = new BpmnViewer({
          container: $element.find('.diagram-holder'),
          width: '100%',
          height: '100%'
        });

        var diagramData = null;
        var canvas = null;

        $scope.$watch('diagramData', function(newValue) {
          if (newValue) {
            diagramData = newValue;
            renderDiagram();
          }
        });

        function renderDiagram() {
          if (diagramData) {
            viewer.importXML(diagramData, function(err, warn) {
              $scope.$apply(function() {
                if (err) {
                  $scope.error = err;
                  return;
                }
                $scope.warn = warn;
                canvas = viewer.get('canvas');
                zoom();
                setupEventListeners();
                $scope.onLoad();
              });
            });
          }
        }

        function zoom() {
          if (canvas) {
            canvas.zoom('fit-viewport');
          }
        }

        function setupEventListeners() {
          viewer.get('eventBus').on('element.click', function(e) {
            // e.element = the model element
            // e.gfx = the graphical element
            $scope.onClick({element: e.element});
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
          viewer.diagram.get('zoomScroll').reset();
        };

      }
    };
  }];
});