/* jshint node: true, unused: false */
/* global __dirname: false, describe: false, beforeEach: false, it: false, browser: false,
          element: false, expect: false, by: false, protractor: false */
'use strict';
var path = require('path');
var projectRoot = path.resolve(__dirname, '../../../../');
var once = require(path.join(projectRoot, 'test/utils')).once;
var pkg = require(path.join(projectRoot, 'package.json'));
var pageUrl = 'http://localhost:' + pkg.gruntConfig.connectPort + '/lib/widgets/search/test/cam-widget-search.spec.html';

var searchPage = require('./cam-widget-search.page.js');

describe('Search Widget', function() {

  beforeEach(function () {
    browser.get(pageUrl + '#example');
  });

  it('should show dropdown on click', function() {
    searchPage.searchInput().click();
    expect(searchPage.inputDropdown().isPresent()).toBe(true);
  });

  it('should create search pill on select in dropdown', function() {
    searchPage.searchInput().click();
    searchPage.inputDropdown.option(2).click();
    expect(searchPage.searchPills().count()).toBe(1);
  });

  it('should focus the value input of a newly created search pill', function() {
    searchPage.searchInput().click();
    searchPage.inputDropdown.option(0).click();
    expect(searchPage.searchPill(0).valueInput().isPresent()).toBe(true);
    expect(searchPage.searchPill(0).valueInput().getAttribute('ng-model')).toEqual(browser.driver.switchTo().activeElement().getAttribute('ng-model'));
  });

  it('should focus the value input of a newly created search pill', function() {
    searchPage.searchInput().click();
    searchPage.inputDropdown.option(2).click();
    expect(searchPage.searchPill(0).nameInput().isPresent()).toBe(true);
    expect(searchPage.searchPill(0).nameInput().getAttribute('ng-model')).toEqual(browser.driver.switchTo().activeElement().getAttribute('ng-model'));
  });

  it('should select the next invalid search pill on enter', function() {
    searchPage.searchInput().click();
    searchPage.inputDropdown.option(0).click();
    searchPage.searchInput().click();
    searchPage.inputDropdown.option(0).click();

    searchPage.searchPill(1).valueInput().sendKeys('nowValid', protractor.Key.ENTER);

    expect(searchPage.searchPill(0).valueInput().isPresent()).toBe(true);
    expect(searchPage.searchPill(0).valueInput().getAttribute('ng-model')).toEqual(browser.driver.switchTo().activeElement().getAttribute('ng-model'));
  });

  it('should return valid and all searches', function() {
    searchPage.searchInput().click();
    searchPage.inputDropdown.option(0).click();
    searchPage.searchInput().click();
    searchPage.inputDropdown.option(0).click();

    searchPage.searchPill(1).valueInput().sendKeys('nowValid', protractor.Key.ENTER);

    expect(searchPage.allSearchesCount()).toEqual("2");
    expect(searchPage.validSearchesCount()).toEqual("1");
  });

  it('should restore valid searches on reload', function() {
    searchPage.searchInput().click();
    searchPage.inputDropdown.option(0).click();
    searchPage.searchPill(0).valueInput().sendKeys('nowValid', protractor.Key.ENTER);

    browser.refresh();

    expect(searchPage.searchPills().count()).toBe(1);
  });

  it('should use default type', function() {
    var input = 'I am ignoring the typeahead';

    searchPage.searchInput().click();
    searchPage.searchInput().sendKeys(input, protractor.Key.ENTER);

    expect(searchPage.searchPill(0).type()).toEqual('Predefined Operators');
    expect(searchPage.searchPill(0).value()).toEqual(input);
  });

  it('should display operators depending on value type', function() {
    searchPage.searchInput().click();
    searchPage.inputDropdown.option(2).click();

    // boolean
    searchPage.searchPill(0).value().click();
    searchPage.searchPill(0).valueInput().sendKeys('true', protractor.Key.ENTER);
    searchPage.searchPill(0).operator().click();
    expect(searchPage.searchPill(0).operatorCount()).toBe(1);

    // number
    searchPage.searchPill(0).value().click();
    searchPage.searchPill(0).valueInput().clear().sendKeys('4', protractor.Key.ENTER);
    searchPage.searchPill(0).operator().click();
    expect(searchPage.searchPill(0).operatorCount()).toBe(4);

    // undefined
    searchPage.searchPill(0).value().click();
    searchPage.searchPill(0).valueInput().clear().sendKeys(protractor.Key.ENTER);
    searchPage.searchPill(0).operator().click();
    expect(searchPage.searchPill(0).operatorCount()).toBe(2);
  });
});
