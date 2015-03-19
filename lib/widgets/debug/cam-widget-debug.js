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
        open:     '@'
      },

      link: function (scope, element, attrs) {
        scope.varName = attrs.debugged;
      }
    };
  }];
});
