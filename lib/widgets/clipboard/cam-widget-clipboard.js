'use strict';
var fs = require('fs');
var Clipboard = require('clipboard');

var template = fs.readFileSync(__dirname + '/cam-widget-clipboard.html', 'utf8');

module.exports = ['$timeout', '$translate', function($timeout, $translate) {
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
      $scope.icon = attrs.icon || 'glyphicon-copy';

      $scope.$watch('value', function() {
        $scope.tooltipText = attrs.tooltipText || $translate.instant('CAM_WIDGET_COPY', {value: $scope.value});
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
        var link = element[0].querySelector('a.' + $scope.icon);
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
          $timeout.cancel(_top);
        }
      });
    }
  };
}];
