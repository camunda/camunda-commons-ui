/* jshint node: true, unused: false */
/* global __dirname: false, describe: false, before: false, it: false, browser: false,
          element: false, expect: false, by: false, protractor: false */
'use strict';

var SearchPill = require('../../search-pill/test/search-pill-object.page.js');


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
