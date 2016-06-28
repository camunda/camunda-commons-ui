/* jshint node: true, unused: false */
/* global __dirname: false, describe: false, before: false, beforeEach: false, it: false,
          browser: false, element: false, expect: false, by: false, protractor: false */
'use strict';
var path = require('path');
var projectRoot = path.resolve(__dirname, '../../../../');
var pkg = require(path.join(projectRoot, 'package.json'));
var pageUrl = 'http://localhost:' + pkg.gruntConfig.connectPort +
              '/lib/widgets/search/test/cam-widget-search.spec.html';

var page = require('./cam-widget-search.page.js');

describe('Search Widget', function() {

  beforeEach(function() {
    browser.get(pageUrl +'#example1');
  });

  // this is a problem encounter on IE11
  it('should not show a dropdown at initialization', function() {
    expect(page.example(1).inputDropdown().isDisplayed()).to.eventually.eql(false);
  });

  it('should show dropdown on click', function() {
    page.example(1).searchInput().click();
    expect(page.example(1).inputDropdown().isDisplayed()).to.eventually.eql(true);
  });

  it('should create search pill on select in dropdown', function() {
    page.example(1).searchInput().click();
    page.example(1).inputDropdownOption(2).click();
    expect(page.example(1).searchPills().count()).to.eventually.eql(1);
  });

  it('should focus the value input of a newly created search pill', function() {
    page.example(1).searchInput().click();
    page.example(1).inputDropdownOption(0).click();
    expect(page.example(1).searchPill(0).valueField().inputField().isPresent()).to.eventually.eql(true);

    browser.driver.switchTo().activeElement().getAttribute('ng-model').then(function(val) {
      expect(page.example(1).searchPill(0).valueField().inputField().getAttribute('ng-model')).to.eventually.eql(val);
    });
  });

  it('should focus the value input of a newly created search pill', function() {
    page.example(1).searchInput().click();
    page.example(1).inputDropdownOption(2).click();
    expect(page.example(1).searchPill(0).nameField().inputField().isPresent()).to.eventually.eql(true);

    browser.driver.switchTo().activeElement().getAttribute('ng-model').then(function(val) {
      expect(page.example(1).searchPill(0).nameField().inputField().getAttribute('ng-model')).to.eventually.eql(val);
    });
  });

  it('should select the next invalid search pill on enter', function() {
    page.example(1).searchInput().click();
    page.example(1).inputDropdownOption(0).click();
    page.example(1).searchInput().click();
    page.example(1).inputDropdownOption(0).click();

    page.example(1).searchPill(1).valueField().type('nowValid', protractor.Key.ENTER);

    expect(page.example(1).searchPill(0).valueField().inputField().isPresent()).to.eventually.eql(true);

    browser.driver.switchTo().activeElement().getAttribute('ng-model').then(function(val) {
      expect(page.example(1).searchPill(0).valueField().inputField().getAttribute('ng-model')).to.eventually.eql(val);
    });
  });

  it('should return valid and all searches', function() {
    page.example(1).searchInput().click();
    page.example(1).inputDropdownOption(0).click();
    page.example(1).searchInput().click();
    page.example(1).inputDropdownOption(0).click();

    page.example(1).searchPill(1).valueField().type('nowValid', protractor.Key.ENTER);

    expect(page.example(1).allSearchesCount()).to.eventually.eql('2');
    expect(page.example(1).validSearchesCount()).to.eventually.eql('1');
  });

  it('should store valid searches in the URL', function() {
    page.example(1).searchInput().click();
    page.example(1).inputDropdownOption(0).click();
    page.example(1).searchPill(0).valueField().type('nowValid', protractor.Key.ENTER);

    browser.getLocationAbsUrl().then(function(url) {
      browser.get(url);
      expect(page.example(1).searchPills().count()).to.eventually.eql(1);
    });
  });

  it('should adjust searches on changes in the URL', function() {
    page.example(1).searchInput().click();
    page.example(1).inputDropdownOption(0).click();
    page.example(1).searchPill(0).valueField().type('nowValid', protractor.Key.ENTER);

    browser.getLocationAbsUrl().then(function(url) {
      expect(url).to.contain('nowValid');

      var location = url.substr(url.indexOf('#') + 2);

      location = location.replace('nowValid', 'anotherString');

      browser.setLocation(location).then(function() {
        expect(page.example(1).searchPill(0).valueField().text()).to.eventually.eql('anotherString');
      });

    });
  });

  it('should retail invalid searches when adjusting searches on changes in the URL', function() {
    page.example(1).searchInput().click();
    page.example(1).inputDropdownOption(0).click();
    page.example(1).searchPill(0).valueField().type('nowValid', protractor.Key.ENTER);

    page.example(1).searchInput().click();
    page.example(1).inputDropdownOption(0).click();

    browser.getLocationAbsUrl().then(function(url) {
      expect(url).to.contain('nowValid');

      var location = url.substr(url.indexOf('#') + 2);

      location = location.replace('nowValid', 'anotherString');

      browser.setLocation(location).then(function() {
        expect(page.example(1).searchPills().count()).to.eventually.eql(2);
      });

    });
  });

  it('should use default type', function() {
    var input = 'I am ignoring the typeahead';

    page.example(1).searchInput().click();
    page.example(1).searchInput().sendKeys(input, protractor.Key.ENTER);

    expect(page.example(1).searchPill(0).typeField().text()).to.eventually.eql('Predefined Operators');
    expect(page.example(1).searchPill(0).valueField().text()).to.eventually.eql(input);
  });

  it('should display operators depending on value type', function() {
    page.example(1).searchInput().click();
    page.example(1).inputDropdownOption(2).click();

    var pill = page.example(1).searchPill(0);

    // boolean
    pill.valueField().click();
    pill.valueField().type('true', protractor.Key.ENTER);
    expect(pill.operatorField().isPresent()).to.eventually.eql(true);
    expect(pill.operatorField().text()).to.eventually.eql('=');

    // number
    pill.valueField().click();
    pill.valueField().type('4', protractor.Key.ENTER);
    pill.operatorField().click();
    expect(pill.operatorField().dropdownOptionCount()).to.eventually.eql(4);

    // undefined
    pill.valueField().click();
    pill.valueField().clear().type(protractor.Key.ENTER);
    pill.operatorField().click();
    expect(pill.operatorField().dropdownOptionCount()).to.eventually.eql(2);
  });

  it('should store valid searches for multiple widget instances', function() {
    page.example(1).searchInput().click();
    page.example(1).inputDropdownOption(0).click();
    page.example(1).searchPill(0).valueField().type('nowValidSearch1', protractor.Key.ENTER);

    page.example(2).searchInput().click();
    page.example(2).inputDropdownOption(0).click();
    page.example(2).searchPill(0).valueField().type('nowValidSearch2', protractor.Key.ENTER);

    browser.getLocationAbsUrl().then(function(url) {
      browser.get(url);
      expect(page.example(1).searchPill(0).valueField().text()).to.eventually.eql('nowValidSearch1');
      expect(page.example(2).searchPill(0).valueField().text()).to.eventually.eql('nowValidSearch2');
    });
  });

  it('should add a valid search pill with type basic', function() {
    page.example(1).searchInput().click();
    page.example(1).inputDropdownOption(3).click();

    expect(page.example(1).validSearchesCount()).to.eventually.eql('1');
  });

  describe('Groups', function() {
    it('should show all available groups initially', function() {
      page.example(2).searchInput().click();
      expect(page.example(2).inputDropdownOptionCount()).to.eventually.eql(3);
    });

    it('should show only matching options in the input dropdown', function() {
      page.example(2).searchInput().click();
      page.example(2).inputDropdownOption(0).click();
      page.example(2).searchInput().click();

      expect(page.example(2).inputDropdownOption(0).getText()).to.eventually.eql('A');
      expect(page.example(2).inputDropdownOption(1).getText()).to.eventually.eql('C');
    });

    it('should allow type change of existing search pill only within valid group', function() {
      page.example(2).searchInput().click();
      page.example(2).inputDropdownOption(1).click();
      page.example(2).searchPill(0).typeField().click();

      expect(page.example(2).searchPill(0).typeField().dropdownOption(0).getText()).to.eventually.eql('B');
      expect(page.example(2).searchPill(0).typeField().dropdownOption(1).getText()).to.eventually.eql('C');
    });

    it('should update allowed groups', function() {
      page.example(2).searchInput().click();
      page.example(2).inputDropdownOption(1).click();

      page.example(2).searchPill(0).typeField().click();

      expect(page.example(2).searchPill(0).typeField().dropdownOptionCount()).to.eventually.eql(2);

      page.example(2).searchPill(0).typeField().dropdownOption(1).click();
      page.example(2).searchPill(0).typeField().click();

      expect(page.example(2).searchPill(0).typeField().dropdownOptionCount()).to.eventually.eql(3);

      page.example(2).searchPill(0).typeField().dropdownOption(0).click();
      page.example(2).searchPill(0).typeField().click();

      expect(page.example(2).searchPill(0).typeField().dropdownOptionCount()).to.eventually.eql(2);
    });
  });
});
