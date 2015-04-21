define([
  'angular',
  'text!./cam-widget-debug.html'
], function(
  angular,
  template
) {
  'use strict';

  return [function() {
    return {
      template: template,

      scope: {
        debugged: '=',
        open:     '@',
        tooltip:  '@camWidgetDebugTooltip'
      },

      link: function (scope, element, attrs) {
        scope.varName = attrs.debugged;

        scope.toggleOpen = function() {
          scope.open = !scope.open;
        };
      }
    };
  }];
});
