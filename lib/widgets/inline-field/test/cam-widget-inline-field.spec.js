/* jshint node: true, unused: false */
/* global __dirname: false, describe: false, beforeEach: false, it: false, browser: false,
          element: false, expect: false, by: false, protractor: false */
'use strict';
var path = require('path');
var projectRoot = path.resolve(__dirname, '../../../../');
var once = require(path.join(projectRoot, 'test/utils')).once;
var pkg = require(path.join(projectRoot, 'package.json'));
var pageUrl = 'http://localhost:' + pkg.gruntConfig.connectPort + '/lib/widgets/inline-field/test/cam-widget-inline-field.spec.html';

var page = require('./cam-widget-inline-field.page.js');

describe('Inline Edit Field', function() {
  var field;

  describe('Text Input', function() {
    beforeEach(once(function () {
      browser.get(pageUrl + '#text-edit');
      field = page.field('field1');
    }));

    it('should apply a value on Enter', function() {
      var text = 'My Name';

      field
        .click()
        .type(text, protractor.Key.ENTER);

      expect(field.text()).toEqual(text);
    });

    it('should apply a value on click on apply', function() {
      var text = 'My Other Name';

      field
        .click()
        .clear()
        .type(text)
        .okButton().click();

      expect(field.text()).toEqual(text);
    });

    it('should cancel the edit of value on click on cancel', function() {

      field.text().then(function(textBefore) {
        var text = 'more text';

        field
          .click()
          .type(text);

        expect(field.inputText()).toEqual(text);

        field.cancelButton().click();

        expect(field.text()).toEqual(textBefore);
      });
    });

    it('should cancel the edit of value on click outside the input field', function() {

      field.text().then(function(textBefore) {
        var text = 'more text';

        field
          .click()
          .type(text);

        expect(field.inputText()).toEqual(text);

        page.body().click();

        expect(field.text()).toEqual(textBefore);
      });
    });

  });

  describe('Date Input', function() {
    beforeEach(once(function () {
      browser.get(pageUrl + '#datepicker');
      field = page.field('field2');
    }));

    it('should open and close a datepicker widget', function() {

      field.click();

      expect(field.datepicker().isPresent()).toBe(true);

      page.body().click();

      expect(field.datepicker().isPresent()).toBe(false);
    });

    it('should apply a date', function() {

      field.click();

      field.datepicker.day('11').click();
      field.timepicker.hoursField().clear().sendKeys('3');
      field.timepicker.minutesField().clear().sendKeys('14');

      field.okButton().click();

      expect(field.text()).toEqual('January 11, 2015 3:14 AM');
    });


  });

  describe('Options', function() {
    beforeEach(once(function () {
      browser.get(pageUrl + '#options');
      field = page.field('field3');
    }));


    it('should show a dropdown with options', function() {

      field.click();

      expect(field.dropdown().isPresent()).toBe(true);
      expect(field.dropdownOption(0).getText()).toEqual('foobar');
      expect(field.dropdownOption(1).getText()).toEqual('1');
      expect(field.dropdownOption(2).getText()).toEqual('2');
      expect(field.dropdownOption(3).getText()).toEqual('3');

      page.body().click();

      expect(field.dropdown().isPresent()).toBe(false);
    });

    it('should apply when clicking on an option', function() {

      expect(field.text()).toEqual('foobar');

      field
        .click()
        .dropdownOptionByText('2').click();

      expect(field.text()).toEqual('2');
    });
  });

  describe('Key Value Options', function() {
    beforeEach(once(function () {
      browser.get(pageUrl + '#options-key-value');
      field = page.field('field4');
    }));


    it('should show values when open', function() {

      field.click();

      expect(field.dropdown().isPresent()).toBe(true);
      expect(field.dropdownOption(0).getText()).toEqual('Barfoo');
      expect(field.dropdownOption(1).getText()).toEqual('One');
      expect(field.dropdownOption(2).getText()).toEqual('Two');
      expect(field.dropdownOption(3).getText()).toEqual('Three');

      page.body().click();

      expect(field.dropdown().isPresent()).toBe(false);
    });

    it('should show keys and values when closed', function() {

      expect(field.text()).toEqual('foobar : Barfoo');

      field
        .click()
        .dropdownOptionByText('Three').click();

      expect(field.text()).toEqual('3 : Three');
    });
  });

  describe('Flexible Field', function() {
    beforeEach(once(function () {
      browser.get(pageUrl + '#flexible-combo');
      field = page.field('field5');
    }));


    it('should allow toggling between text und datetime', function() {

      field.click();

      expect(field.inputField().isPresent()).toBe(true);

      field.calendarButton().click();

      expect(field.inputField().isPresent()).toBe(false);
      expect(field.datepicker().isPresent()).toBe(true);

      field.pencilButton().click();

      expect(field.inputField().isPresent()).toBe(true);
      expect(field.datepicker().isPresent()).toBe(false);

      page.body().click();

      expect(field.inputField().isPresent()).toBe(false);
    });

    it('should allow editing a date in text mode', function() {

      field.click();
      field.calendarButton().click();
      field.datepicker.day('27').click();
      field.timepicker.hoursField().clear().sendKeys('8');
      field.timepicker.minutesField().clear().sendKeys('57');
      field.okButton().click();
      field.click();
      field.pencilButton().click();

      expect(field.inputText()).toContain('27T08:57');

      page.body().click();
    });

    it('should apply a valid text date to the datepicker', function() {

      field
        .click()
        .clear()
        .type('2015-11-19T18:17:29', protractor.Key.ENTER)
        .click()
        .calendarButton().click();

      expect(field.datepicker().getText()).toContain('November 2015');
      expect(field.datepicker.activeDay()).toEqual('19');
      expect(field.timepicker.hoursValue()).toEqual('18');
      expect(field.timepicker.minutesValue()).toEqual('17');
    });

  });
});
