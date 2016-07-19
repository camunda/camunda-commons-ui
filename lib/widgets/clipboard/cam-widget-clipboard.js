'use strict';
var fs = require('fs');
var Clipboard = require('clipboard');

var template = fs.readFileSync(__dirname + '/cam-widget-clipboard.html', 'utf8');

module.exports = ['$timeout', function($timeout) {
  return {
    transclude: true,

    template: template,

    scope: {
      value: '=camWidgetClipboard'
    },

    link: function($scope, element, attrs) {
      var cb;

      $scope.noTooltip = typeof attrs.noTooltip !== 'undefined';
      $scope.copyStatus = null;

      $scope.$watch('value', function() {
        $scope.tooltipText = 'Click to copy \'' + $scope.value + '\'';
      });


      var _top;
      function restore() {
        $scope.$apply();
        _top = $timeout(function() {
          $scope.copyStatus = null;
        }, 1200, true);
      }

      // needed because otherwise the content of `element` is not rendered yet
      // and `querySelector` is then not available
      $timeout(function() {
        var link = element[0].querySelector('a.glyphicon-copy');
        if (!link) { return; }

        cb = new Clipboard(link, {
          text: function() {
            return $scope.value;
          }
        });

        cb.on('success', function() {
          $scope.copyStatus = true;
          restore();
        });


        cb.on('error', function() {
          $scope.copyStatus = false;
          restore();
        });
      });


      $scope.$on('$destroy', function() {
        if (cb && cb.destroy) {
          cb.destroy();
        }

        if (_top) {
          $timeout.cancel(top);
        }
      });
    }
  };
}];
