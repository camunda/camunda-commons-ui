/* jshint node: true, unused: false */
/* global __dirname: false, describe: false, beforeEach: false, it: false, browser: false,
          element: false, expect: false, by: false, protractor: false */
'use strict';

function SearchPill(node) {
  this.node = node;
}

SearchPill.prototype.valueInput = function() {
  return this.node.element(by.css('[cam-widget-inline-field][value="value.value"] input'));
};
SearchPill.prototype.nameInput = function() {
  return this.node.element(by.css('[cam-widget-inline-field][value="name.value"] input'));
};
SearchPill.prototype.type = function() {
  return this.node.element(by.css('[cam-widget-inline-field][value="type.value"]')).getText();
};
SearchPill.prototype.value = function() {
  return this.node.element(by.css('[cam-widget-inline-field][value="value.value"]')).getText();
};
SearchPill.prototype.operator = function() {
  return this.node.element(by.css('[cam-widget-inline-field][value="operator.value"]')).getText();
};
SearchPill.prototype.operatorCount = function() {
  return this.node.all(by.css('[cam-widget-inline-field][value="operator.value"] ul > li')).count();
};



function Page() { }

Page.prototype.searchInput = function() {
  return element(by.css('[cam-widget-search] [ng-model="inputQuery"]'));
};

Page.prototype.inputDropdown = function() {
  return element(by.css('[cam-widget-search] .search-container > ul'));
};

Page.prototype.inputDropdown.option = function(option) {
  return element.all(by.css('[cam-widget-search] .search-container > ul > li')).get(option);
};

Page.prototype.searchPills = function() {
  return element.all(by.css('[cam-widget-search] [cam-widget-search-pill]'));
};

Page.prototype.searchPill = function(pill) {
  return new SearchPill(this.searchPills().get(pill));
};

Page.prototype.allSearchesCount = function() {
  return element(by.id('allSearchesCount')).getText();
};
Page.prototype.validSearchesCount = function() {
  return element(by.id('validSearchesCount')).getText();
};

module.exports = new Page();
