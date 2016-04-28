'use strict';
var fs = require('fs');

var angular = require('camunda-bpm-sdk-js/vendor/angular'),

    template = fs.readFileSync(__dirname + '/cam-widget-debug.html', 'utf8');

  module.exports = [function() {
    return {
      template: template,

      scope: {
        debugged:    '=',
        displayName: '=?',
        open:        '@',
        tooltip:     '@camWidgetDebugTooltip'
      },

      link: function (scope, element, attrs) {
        scope.varName = attrs.displayName || attrs.debugged;

        scope.toggleOpen = function() {
          scope.open = !scope.open;
        };
      }
    };
  }];
