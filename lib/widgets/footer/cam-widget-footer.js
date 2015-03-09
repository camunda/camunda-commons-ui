define([
  'text!./cam-widget-footer.html'
], function(
  template
) {
  'use strict';
  return [function() {
    return {
      template: template,
      scope: {
        version: '@'
      }
    };
  }];
});
