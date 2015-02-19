/* jshint node: true, unused: false */
/* global __dirname: false, describe: false, beforeEach: false, it: false, browser: false,
          element: false, expect: false, by: false, protractor: false */
'use strict';
var path = require('path');
var projectRoot = path.resolve(__dirname, '../../../../');
var once = require(path.join(projectRoot, 'test/utils')).once;
var pkg = require(path.join(projectRoot, 'package.json'));
var pageUrl = 'http://localhost:' + pkg.gruntConfig.connectPort + '/lib/widgets/search/test/cam-widget-search.spec.html';

var page = require('./cam-widget-search.page.js');

describe('Search Widget', function() {

  beforeEach(function () {
    browser.get(pageUrl);
  });

  it('should show dropdown on click', function() {
    page.searchInput().click();
    expect(page.inputDropdown().isPresent()).toBe(true);
  });

  it('should create search pill on select in dropdown', function() {
    page.searchInput().click();
    page.inputDropdown.option(2).click();
    expect(page.searchPills().count()).toBe(1);
  });

  it('should focus the value input of a newly created search pill', function() {
    page.searchInput().click();
    page.inputDropdown.option(0).click();
    expect(page.searchPill(0).valueField().inputField().isPresent()).toBe(true);
    expect(page.searchPill(0).valueField().inputField().getAttribute('ng-model')).toEqual(browser.driver.switchTo().activeElement().getAttribute('ng-model'));
  });

  it('should focus the value input of a newly created search pill', function() {
    page.searchInput().click();
    page.inputDropdown.option(2).click();
    expect(page.searchPill(0).nameField().inputField().isPresent()).toBe(true);
    expect(page.searchPill(0).nameField().inputField().getAttribute('ng-model')).toEqual(browser.driver.switchTo().activeElement().getAttribute('ng-model'));
  });

  it('should select the next invalid search pill on enter', function() {
    page.searchInput().click();
    page.inputDropdown.option(0).click();
    page.searchInput().click();
    page.inputDropdown.option(0).click();

    page.searchPill(1).valueField().type('nowValid', protractor.Key.ENTER);

    expect(page.searchPill(0).valueField().inputField().isPresent()).toBe(true);
    expect(page.searchPill(0).valueField().inputField().getAttribute('ng-model')).toEqual(browser.driver.switchTo().activeElement().getAttribute('ng-model'));
  });

  it('should return valid and all searches', function() {
    page.searchInput().click();
    page.inputDropdown.option(0).click();
    page.searchInput().click();
    page.inputDropdown.option(0).click();

    page.searchPill(1).valueField().type('nowValid', protractor.Key.ENTER);

    expect(page.allSearchesCount()).toEqual("2");
    expect(page.validSearchesCount()).toEqual("1");
  });

  it('should store valid searches in the URL', function() {
    page.searchInput().click();
    page.inputDropdown.option(0).click();
    page.searchPill(0).valueField().type('nowValid', protractor.Key.ENTER);

    browser.getLocationAbsUrl().then(function(url) {
      browser.get(url);
      expect(page.searchPills().count()).toBe(1);
    });
  });

  it('should use default type', function() {
    var input = 'I am ignoring the typeahead';

    page.searchInput().click();
    page.searchInput().sendKeys(input, protractor.Key.ENTER);

    expect(page.searchPill(0).typeField().text()).toEqual('Predefined Operators');
    expect(page.searchPill(0).valueField().text()).toEqual(input);
  });

  it('should display operators depending on value type', function() {
    page.searchInput().click();
    page.inputDropdown.option(2).click();

    var pill = page.searchPill(0);

    // boolean
    pill.valueField().click();
    pill.valueField().type('true', protractor.Key.ENTER);
    pill.operatorField().click();
    expect(pill.operatorField().dropdownOptionCount()).toBe(1);

    // number
    pill.valueField().click();
    pill.valueField().type('4', protractor.Key.ENTER);
    pill.operatorField().click();
    expect(pill.operatorField().dropdownOptionCount()).toBe(4);

    // undefined
    pill.valueField().click();
    pill.valueField().clear().type(protractor.Key.ENTER);
    pill.operatorField().click();
    expect(pill.operatorField().dropdownOptionCount()).toBe(2);
  });
});
