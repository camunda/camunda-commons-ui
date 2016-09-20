'use strict';
var fs = require('fs');

var template = fs.readFileSync(__dirname + '/cam-widget-debug.html', 'utf8');

module.exports = [function() {
  return {
    template: template,

    scope: {
      debugged:       '=',
      displayName:    '=?',
      extensionName:  '@extensionName',
      open:           '@',
      extendedInfo:   '=',
      tooltip:        '@camWidgetDebugTooltip'
    },

    link: function(scope, element, attrs) {
      scope.varName = attrs.displayName || attrs.debugged;
      scope.extended = attrs.extended !== undefined;

      scope.toggleOpen = function() {
        scope.open = !scope.open;
      };
    }
  };
}];
