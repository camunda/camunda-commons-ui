/* jshint node: true, unused: false */
/* global __dirname: false, describe: false, before: false, it: false, browser: false,
          element: false, expect: false, by: false, protractor: false */
'use strict';

var InlineField = require('../../inline-field/test/cam-widget-inline-field-object.page.js');

var Pill = function(node) {
  this.node = node;
};

Pill.prototype.typeElement = function() {
  return this.node.element(by.css('[cam-widget-inline-field][value="type.value"]'));
};

Pill.prototype.nameElement = function() {
  return this.node.element(by.css('[cam-widget-inline-field][value="name.value"]'));
};

Pill.prototype.operatorElement = function() {
  return this.node.element(by.css('[cam-widget-inline-field][value="operator.value"]'));
};

Pill.prototype.valueElement = function() {
  return this.node.element(by.css('[cam-widget-inline-field][value="value.value"]'));
};

Pill.prototype.typeField = function() {
  return new InlineField(this.typeElement());
};
Pill.prototype.nameField = function() {
  return new InlineField(this.nameElement());
};
Pill.prototype.operatorField = function() {
  return new InlineField(this.operatorElement());
};
Pill.prototype.valueField = function() {
  return new InlineField(this.valueElement());
};
Pill.prototype.isValid = function() {
  return this.node.element(by.className('search-label')).getAttribute('class').then(function (classes) {
    return classes.split(' ').indexOf('invalid') === -1;
  });
};

module.exports = Pill;
