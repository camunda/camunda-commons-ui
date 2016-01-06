'use strict';
var fs = require('fs');

var angular = require('angular'),

    template = fs.readFileSync(__dirname + '/cam-widget-debug.html', 'utf8');

  module.exports = [function() {
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
