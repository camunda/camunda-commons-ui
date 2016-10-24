/* jshint node: true, unused: false */
/* global __dirname: false, describe: false, before: false, it: false, browser: false,
          element: false, expect: false, by: false, protractor: false, $: false */
'use strict';

var Viewer = function(node) {
  this.node = node;
};

Viewer.prototype.isPresent = function() {
  return this.node.isPresent();
};

function Page() { }

Page.prototype.table = function(id) {
  return new Viewer(element(by.css('.tjs-container table')));
};

Page.prototype.drdDiagram = function(id) {
  return new Viewer(element(by.css('svg')));
};

module.exports = new Page();
