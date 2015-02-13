/* jshint node: true, unused: false */
/* global __dirname: false, describe: false, beforeEach: false, it: false, browser: false,
          element: false, expect: false, by: false, protractor: false */
'use strict';
var path = require('path');
var projectRoot = path.resolve(__dirname, '../../../../');
var once = require(path.join(projectRoot, 'test/utils')).once;
var pkg = require(path.join(projectRoot, 'package.json'));
var pageUrl = 'http://localhost:' + pkg.gruntConfig.connectPort + '/lib/widgets/search-pill/test/search-pill.spec.html';

describe('Search Pill', function() {
  beforeEach(once(function() {
  browser.get(pageUrl);
}));

  describe('Basic', function() {
    beforeEach(once(function () {
      browser.get(pageUrl + '#basic');
    }));

    it('should open a dropdown with available types', function() {
      var fields = element(by.id('pill1')).all(by.css('[cam-widget-inline-field]'));
      fields.get(0).click();

      var menu = element(by.className('dropdown-menu'));
      expect(menu.isPresent()).toBe(true);

      var options = menu.all(by.tagName('li'));
      expect(options.get(0).getText()).toEqual('Foo');
      expect(options.get(1).getText()).toEqual('Bar');

      options.get(0).click();

      expect(menu.isPresent()).toBe(false);
      expect(fields.get(0).getText()).toEqual('Foo');
    });

    it('should open a dropdown with available operators', function() {
      var fields = element(by.id('pill1')).all(by.css('[cam-widget-inline-field]'));
      fields.get(1).click();

      var menu = element(by.className('dropdown-menu'));
      expect(menu.isPresent()).toBe(true);

      var options = menu.all(by.tagName('li'));
      expect(options.get(0).getText()).toEqual('=');
      expect(options.get(1).getText()).toEqual('!=');

      options.get(1).click();

      expect(menu.isPresent()).toBe(false);
      expect(fields.get(1).getText()).toEqual('!=');
    });

    it('should allow text input', function() {
      var fields = element(by.id('pill1')).all(by.css('[cam-widget-inline-field]'));
      fields.get(2).click();

      var input = element(by.tagName('input'));
      expect(input.isPresent()).toBe(true);

      // workaround to check focus
      // see: http://stackoverflow.com/a/22756276
      expect(input.getAttribute('ng-model')).toEqual(browser.driver.switchTo().activeElement().getAttribute('ng-model'));
    });

    it('should execute the update function and set the valid property', function() {
      var fields = element(by.id('pill1')).all(by.css('[cam-widget-inline-field]'));

      expect(element(by.id('pill1')).element(by.className('search-label')).getAttribute('class')).toContain('invalid');

      fields.get(0).click();
      element(by.className('dropdown-menu')).all(by.tagName('li')).get(0).click();
      fields.get(1).click();
      element(by.className('dropdown-menu')).all(by.tagName('li')).get(1).click();
      fields.get(2).click();
      element(by.tagName('input')).sendKeys('test', protractor.Key.ENTER);

      expect(element(by.id('pill1')).element(by.className('search-label')).getAttribute('class')).not.toContain('invalid');
    });
  });

  describe('Date Enforced', function() {
    beforeEach(once(function () {
      browser.get(pageUrl + '#enforcing-dates');
    }));

    it('should open a datepicker for the value field', function() {
      var fields = element(by.id('pill2')).all(by.css('[cam-widget-inline-field]'));
      fields.get(2).click();

      expect(element(by.className('datepicker')).isPresent()).toBe(true);
    });

    it('should format a date', function() {
      var fields = element(by.id('pill2')).all(by.css('[cam-widget-inline-field]'));
      fields.get(2).click();

      element(by.buttonText('15')).click();
      element(by.className('glyphicon-ok')).click();
      expect(fields.get(2).getText()).toEqual('January 15, 2015 12:46 PM');
    });
  });

  describe('Date Allowed', function() {
    beforeEach(once(function () {
      browser.get(pageUrl + '#allow-dates');
    }));

    it('should offer a calendar option', function() {
      var fields = element(by.id('pill3')).all(by.css('[cam-widget-inline-field]'));
      fields.get(2).click();

      expect(element(by.className('glyphicon-calendar')).isPresent()).toBe(true);

      element(by.className('glyphicon-calendar')).click();

      expect(element(by.className('datepicker')).isPresent()).toBe(true);
    });
  });

  describe('Extended', function() {
    beforeEach(function () {
      browser.get(pageUrl + '#extended');
    });

    it('should provide a name field', function() {
      var fields = element(by.id('pill4')).all(by.css('[cam-widget-inline-field]'));

      expect(fields.count()).toBe(3);

      fields.get(0).click();
      var menu = element(by.className('dropdown-menu'));
      var options = menu.all(by.tagName('li'));

      options.get(1).click();

      expect(fields.count()).toBe(4);
    });

    it('name field should be text input', function() {
      var fields = element(by.id('pill4')).all(by.css('[cam-widget-inline-field]'));

      fields.get(0).click();
      var menu = element(by.className('dropdown-menu'));
      var options = menu.all(by.tagName('li'));
      options.get(1).click();

      fields = element(by.id('pill4')).all(by.css('[cam-widget-inline-field]'));
      fields.get(1).click();

      var input = element(by.tagName('input'));
      expect(input.isPresent()).toBe(true);

      // workaround to check focus
      // see: http://stackoverflow.com/a/22756276
      expect(input.getAttribute('ng-model')).toEqual(browser.driver.switchTo().activeElement().getAttribute('ng-model'));
    });

  });

});
