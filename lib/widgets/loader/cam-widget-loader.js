define([
  'angular',
  'text!./cam-widget-loader.html'
], function(
  angular,
  template
) {
  'use strict';

  return [function() {
    return {
      transclude: true,

      template: template,

      scope: {
        loadingState: '@',
        textEmpty:    '@',
        textError:    '@',
        textLoading:  '@'
      },

      compile: function (element, attrs) {
        if (!angular.isDefined(attrs.textLoading)) {
          attrs.textLoading = 'Loading…';
        }

        if (!angular.isDefined(attrs.loadingState)) {
          attrs.loadingState = 'INITIAL';
        }
      }
    };
  }];
});
