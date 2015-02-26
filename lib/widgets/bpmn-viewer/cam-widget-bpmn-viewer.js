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
  return [
  function() {

    return {
      scope: {
        processDiagram: '=',
        control: '=',
        onLoad: '&',
        onClick: '&'
      },

      template: template,

      link: function($scope, $element) {

        $scope.control = {};
        
        $scope.control.highlight = function(id) {
          canvas.addMarker(id, 'highlight');

          // NO ONE NEEDS ROUND CORNERS!!
          /*
          $('[data-element-id="'+id+'"]>.djs-outline').attr({
            rx: '14px',
            ry: '14px'
          });
          */
        };

        $scope.control.clearHighlight = function(id) {
          canvas.removeMarker(id, 'highlight');

        };

        $scope.control.isHighlighted = function(id) {
          return $element.find('[data-element-id="'+id+'"]')[0].getAttribute('class').split(' ').indexOf('highlight') !== -1;
        };

        var viewer = new Viewer({
          container: $element.find('.diagram-holder'),
          width: '100%',
          height: '100%'
        });

        var processDiagram = null;
        var canvas = null;

        $scope.$watch('processDiagram', function(newValue) {
          if (newValue) {
            processDiagram = newValue;
            renderDiagram();
          }
        });

        function renderDiagram() {
          if (processDiagram) {

            viewer.importXML(processDiagram, function(err) {

              $scope.$apply(function() {

                if (err) {
                  $scope.error = err;
                  return;
                }

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
          var eventBus = viewer.get('eventBus');

          // you may hook into any of the following events
          var events = [
            'element.click',
            'element.dblclick',
          ];

          var allowedElements = [
            'bpmn:UserTask',
            'bpmn:StartEvent',
            'bpmn:EndEvent'
          ];
          events.forEach(function(event) {

            eventBus.on(event, function(e) {
              // e.element = the model element
              // e.gfx = the graphical element
              if(event === 'element.click' && allowedElements.indexOf(e.element.type) !== -1) {
                $scope.onClick({element: e.element});
              }
              
            });
          });
        }


      }
    };
  }];
});
