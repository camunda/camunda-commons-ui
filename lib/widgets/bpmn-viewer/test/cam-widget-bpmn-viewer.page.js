/* jshint node: true, unused: false */
/* global __dirname: false, describe: false, beforeEach: false, it: false, browser: false,
          element: false, expect: false, by: false, protractor: false */
'use strict';

var ViewerNode = function(node) {
  this.node = node;
};

ViewerNode.prototype.click = function() {
  return this.node.click();
};

ViewerNode.prototype.isHighlighted = function() {
  return this.node.getAttribute('class').then(function (classes) {
    return classes.split(' ').indexOf('highlight') !== -1;
  });
};

var Viewer = function(node) {
  this.node = node;
};

Viewer.prototype.isPresent = function() {
  return this.node.isPresent();
};

Viewer.prototype.element = function(id) {
  return new ViewerNode(this.node.element(by.css('[data-element-id="'+id+'"]')));
};

Viewer.prototype.badgeFor = function(id) {
  return this.node.element(by.css('.djs-overlays-'+id + ' > .djs-overlay:first-child'));
};


function Page() { }

Page.prototype.diagram = function() {
  return new Viewer(element(by.css('[cam-widget-bpmn-viewer]')));
};

module.exports = new Page();
