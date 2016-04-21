/* jshint node: true, unused: false */
/* global __dirname: false, describe: false, before: false, it: false, browser: false,
          element: false, expect: false, by: false, protractor: false */
'use strict';

var SearchPill = require('../../search-pill/test/cam-widget-search-pill-object.page.js');


function Example(id) { this.node = element(by.id('example'+id)); }

Example.prototype.searchInput = function() {
  return this.node.element(by.css('[cam-widget-search] [ng-model="inputQuery"]'));
};

Example.prototype.inputDropdown = function() {
  return this.node.element(by.css('[cam-widget-search] .form-container > ul'));
};

Example.prototype.inputDropdownOption = function(option) {
  return this.node.all(by.css('[cam-widget-search] .form-container > ul > li')).get(option);
};

Example.prototype.inputDropdownOptionCount = function() {
  return this.node.all(by.css('[cam-widget-search] .form-container > ul > li')).count();
};

Example.prototype.searchPills = function() {
  return this.node.all(by.css('[cam-widget-search] [cam-widget-search-pill]'));
};

Example.prototype.searchPill = function(pill) {
  return new SearchPill(this.searchPills().get(pill));
};

Example.prototype.allSearchesCount = function() {
  return this.node.element(by.id('allSearchesCount')).getText();
};
Example.prototype.validSearchesCount = function() {
  return this.node.element(by.id('validSearchesCount')).getText();
};

function Page() { }

Page.prototype.example = function(id) {
  return new Example(id);
};

module.exports = new Page();
