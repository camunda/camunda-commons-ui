/* jshint node: true, unused: false */
/* global __dirname: false, describe: false, before: false, it: false, browser: false,
          element: false, expect: false, by: false, protractor: false */
'use strict';

function Variable(node) {
  this.node = node;
}

Variable.prototype.editingGroup = function() {
  return this.node.element(by.css('.editing.input-group'));
};
Variable.prototype.editingGroupClass = function() {
  return this.editingGroup().getAttribute('class');
};

Variable.prototype.setNullBtn = function() {
  return this.editingGroup().element(by.css('.btn.set-null'));
};
Variable.prototype.setNonNullBtn = function() {
  return this.editingGroup().element(by.css('.btn.null-value'));
};

Variable.prototype.type = function() {
  return this.node.element(by.css('.type'));
};
Variable.prototype.typeDropdownText = function() {
  return this.type().element(by.css('.dropdown-toggle')).getText();
};
Variable.prototype.typeText = function() {
  return this.type().getText();
};
Variable.prototype.typeSelect = function(w00t) {
  this.type().element(by.css('.dropdown-toggle')).click();
  return this.type().element(by.cssContainingText('a', w00t))
};

Variable.prototype.name = function() {
  return this.node.element(by.css('.name'));
};
Variable.prototype.nameValue = function() {
  return this.name().getAttribute('value');
};
Variable.prototype.nameText = function() {
  return this.name().getText();
};

Variable.prototype.value = function() {
  return this.node.element(by.css('.value'));
};
Variable.prototype.valueValue = function() {
  return this.value().getAttribute('value');
};
Variable.prototype.valueType = function() {
  return this.value().getAttribute('type');
};
Variable.prototype.valueText = function() {
  return this.value().getText();
};


function Page() { }

Page.prototype.variable = function(identifier, index) {
  return new Variable(element.all(by.css(identifier + ' [cam-widget-variable]')).get(index));
};


module.exports = new Page();
