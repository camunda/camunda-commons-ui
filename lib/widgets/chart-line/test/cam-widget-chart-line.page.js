/* jshint node: true, unused: false */
/* global __dirname: false, describe: false, before: false, it: false, browser: false,
          element: false, expect: false, by: false, protractor: false */
'use strict';

var ChartLine = function(node) {
  this.node = node;
};
ChartLine.prototype.isPresent = function() {
  return this.node.isPresent();
};
ChartLine.prototype.hasCanvas = function() {
  return this.node.element(by.css('canvas')).isPresent();
};

function Page() { }

Page.prototype.chartLine = function(selector) {
  return new ChartLine(element(by.css(selector)));
};

module.exports = new Page();
