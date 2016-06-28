'use strict';
var fs = require('fs');

var angular = require('camunda-bpm-sdk-js/vendor/angular'),

    template = fs.readFileSync(__dirname + '/cam-widget-loader.html', 'utf8');

module.exports = [function() {
  return {
    transclude: true,

    template: template,

    scope: {
      loadingState: '@',
      textEmpty:    '@',
      textError:    '@',
      textLoading:  '@'
    },

    compile: function(element, attrs) {
      if (!angular.isDefined(attrs.textLoading)) {
        attrs.textLoading = 'Loading…';
      }

      if (!angular.isDefined(attrs.loadingState)) {
        attrs.loadingState = 'INITIAL';
      }
    }
  };
}];
