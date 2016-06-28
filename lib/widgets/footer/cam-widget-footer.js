'use strict';
var fs = require('fs');

var template = fs.readFileSync(__dirname + '/cam-widget-footer.html', 'utf8');

module.exports = [function() {
  return {
    template: template,
    scope: {
      version: '@'
    }
  };
}];
