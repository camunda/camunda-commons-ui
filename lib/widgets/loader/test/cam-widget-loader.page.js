/* jshint node: true, unused: false */
/* global __dirname: false, describe: false, before: false, it: false, browser: false,
          element: false, expect: false, by: false, protractor: false */
'use strict';

var Loader = function(node) {
  this.node = node;
};
Loader.prototype.isPresent = function() {
  return this.node.isPresent();
};
Loader.prototype.stateText = function() {
  return this.node.element(by.css('.state-display')).getText();
};
Loader.prototype.defaultPanel = function() {
  return this.node.element(by.css('.panel.panel-default'));
};
Loader.prototype.loadingNotice = function() {
  return this.node.element(by.css('.loader-state.loading'));
};
Loader.prototype.errorNotice = function() {
  return this.node.element(by.css('.alert.alert-danger'));
};
Loader.prototype.reloadButton = function() {
  return this.node.element(by.css('button.reload'));
};
Loader.prototype.reloadEmptyButton = function() {
  return this.node.element(by.css('button.reload-empty'));
};
Loader.prototype.failButton = function() {
  return this.node.element(by.css('button.fail-load'));
};

function Page() { }

Page.prototype.loader = function(node) {
  return new Loader(element(by.css(node)));
};

module.exports = new Page();
