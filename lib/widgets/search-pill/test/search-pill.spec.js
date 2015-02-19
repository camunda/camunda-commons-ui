/* jshint node: true, unused: false */
/* global __dirname: false, describe: false, beforeEach: false, it: false, browser: false,
          element: false, expect: false, by: false, protractor: false */
'use strict';
var path = require('path');
var projectRoot = path.resolve(__dirname, '../../../../');
var once = require(path.join(projectRoot, 'test/utils')).once;
var pkg = require(path.join(projectRoot, 'package.json'));
var pageUrl = 'http://localhost:' + pkg.gruntConfig.connectPort + '/lib/widgets/search-pill/test/search-pill.spec.html';

var page = require('./search-pill.page.js');

describe('Search Pill', function() {
  beforeEach(once(function() {
    browser.get(pageUrl);
  }));
  var pill;

  describe('Basic', function() {
    beforeEach(once(function () {
      browser.get(pageUrl + '#basic');
      pill = page.pill('pill1');
    }));

    it('should open a dropdown with available types', function() {

      var typeField = pill.typeField();

      typeField.click();

      expect(typeField.dropdown().isPresent()).toBe(true);
      expect(typeField.dropdownOption(0).getText()).toEqual('Foo');
      expect(typeField.dropdownOption(1).getText()).toEqual('Bar');

      typeField.dropdownOption(0).click();

      expect(typeField.dropdown().isPresent()).toBe(false);
      expect(typeField.text()).toEqual('Foo');
    });

    it('should open a dropdown with available operators', function() {

      var operatorField = pill.operatorField();

      operatorField.click();

      expect(operatorField.dropdown().isPresent()).toBe(true);
      expect(operatorField.dropdownOption(0).getText()).toEqual('=');
      expect(operatorField.dropdownOption(1).getText()).toEqual('!=');

      operatorField.dropdownOption(1).click();

      expect(operatorField.dropdown().isPresent()).toBe(false);
      expect(operatorField.text()).toEqual('!=');
    });

    it('should allow text input', function() {

      var valueField = pill.valueField();

      valueField.click();

      expect(valueField.inputField().isPresent()).toBe(true);

      // workaround to check focus
      // see: http://stackoverflow.com/a/22756276
      expect(valueField.inputField().getAttribute('ng-model')).toEqual(browser.driver.switchTo().activeElement().getAttribute('ng-model'));
    });

    it('should execute the update function and set the valid property', function() {

      expect(pill.isValid()).toBe(false);

      pill.typeField().click();
      pill.typeField().dropdownOption(0).click();
      pill.operatorField().click();
      pill.operatorField().dropdownOption(1).click();
      pill.valueField().click();
      pill.valueField().type('test', protractor.Key.ENTER);

      expect(pill.isValid()).toBe(true);
    });
  });

  describe('Date Enforced', function() {
    beforeEach(once(function () {
      browser.get(pageUrl + '#enforcing-dates');
      pill = page.pill('pill2');
    }));

    it('should open a datepicker for the value field', function() {

      var valueField = pill.valueField();

      valueField.click();

      expect(valueField.datepicker().isPresent()).toBe(true);
    });

    it('should format a date', function() {

      var valueField = pill.valueField();

      valueField.click();
      valueField.datepicker.day('15').click();
      valueField.okButton().click();

      expect(valueField.text()).toEqual('January 15, 2015 12:46 PM');
    });
  });

  describe('Date Allowed', function() {
    beforeEach(once(function () {
      browser.get(pageUrl + '#allow-dates');
      pill = page.pill('pill3');
    }));

    it('should offer a calendar option', function() {

      var valueField = pill.valueField();

      valueField.click();

      expect(valueField.calendarButton().isPresent()).toBe(true);

      valueField.calendarButton().click();

      expect(valueField.datepicker().isPresent()).toBe(true);
    });
  });

  describe('Extended', function() {
    beforeEach(function () {
      browser.get(pageUrl + '#extended');
      pill = page.pill('pill4');
    });

    it('should provide a name field', function() {

      expect(pill.nameField().isPresent()).toBe(false);

      pill.typeField().click();
      pill.typeField().dropdownOption(1).click();

      expect(pill.nameField().isPresent()).toBe(true);
    });

    it('name field should be text input', function() {

      pill.typeField().click();
      pill.typeField().dropdownOption(1).click();

      pill.nameField().click();

      expect(pill.nameField().inputField().isPresent()).toBe(true);

      // workaround to check focus
      // see: http://stackoverflow.com/a/22756276
      expect(pill.nameField().inputField().getAttribute('ng-model')).toEqual(browser.driver.switchTo().activeElement().getAttribute('ng-model'));
    });

  });

});
