/* jshint node: true, unused: false */
/* global __dirname: false, describe: false, beforeEach: false, it: false, browser: false,
          element: false, expect: false, by: false, protractor: false */
'use strict';
var path = require('path');
var projectRoot = path.resolve(__dirname, '../../../../');
var once = require(path.join(projectRoot, 'test/utils')).once;
var pkg = require(path.join(projectRoot, 'package.json'));
var pageUrl = 'http://localhost:' + pkg.gruntConfig.connectPort + '/lib/widgets/inline-field/test/cam-widget-inline-field.spec.html';

describe('Inline Edit Field', function() {

  describe('Text Input', function() {
    beforeEach(once(function () {
      browser.get(pageUrl + '#text-edit');
    }));

    it('should apply a value on Enter', function() {
      var text = 'My Name';

      element(by.id('field1')).click();
      var elem = element(by.tagName('input'));
      elem.clear();
      elem.sendKeys(text, protractor.Key.ENTER);

      expect(element(by.id('field1')).getText()).toEqual(text);
    });

    it('should apply a value on click on apply', function() {
      var text = 'My Other Name';

      element(by.id('field1')).click();
      var elem = element(by.tagName('input'));
      elem.clear();
      elem.sendKeys(text);

      element(by.className('glyphicon-ok')).click();

      expect(element(by.id('field1')).getText()).toEqual(text);
    });

    it('should cancel the edit of value on click on cancel', function() {
      element(by.id('field1')).getText().then(function(textBefore) {
        var text = 'more text';

        element(by.id('field1')).click();
        var elem = element(by.tagName('input'));
        elem.sendKeys(text);

        expect(element(by.tagName('input')).getAttribute('value')).toEqual(text);

        element(by.className('glyphicon-remove')).click();

        expect(element(by.id('field1')).getText()).toEqual(textBefore);
      });
    });

    it('should cancel the edit of value on click outside the input field', function() {
      element(by.id('field1')).getText().then(function(textBefore) {
        var text = 'more text';

        element(by.id('field1')).click();
        var elem = element(by.tagName('input'));
        elem.sendKeys(text);

        expect(element(by.tagName('input')).getAttribute('value')).toEqual(text);

        element(by.tagName('body')).click();

        expect(element(by.id('field1')).getText()).toEqual(textBefore);
      });
    });

  });

  describe('Date Input', function() {
    beforeEach(once(function () {
      browser.get(pageUrl + '#datepicker');
    }));

    it('should open and close a datepicker widget', function() {

      element(by.id('field2')).click();

      expect(element(by.className('datepicker')).isPresent()).toBe(true);

      element(by.tagName('body')).click();

      expect(element(by.className('datepicker')).isPresent()).toBe(false);
    });

    it('should apply a date', function() {
      element(by.id('field2')).click();

      element(by.buttonText('11')).click();
      element(by.model('hours')).clear().sendKeys('3');
      element(by.model('minutes')).clear().sendKeys('14');

      element(by.className('glyphicon-ok')).click();

      expect(element(by.id('field2')).getText()).toEqual('January 11, 2015 3:14 AM');
    });


  });

  describe('Options', function() {
    beforeEach(once(function () {
      browser.get(pageUrl + '#options');
    }));


    it('should show a dropdown with options', function() {
      element(by.id('field3')).click();

      var menu = element(by.className('dropdown-menu'));
      expect(menu.isPresent()).toBe(true);
      var children = menu.all(by.tagName('a'));
      expect(children.get(0).getText()).toEqual('foobar');
      expect(children.get(1).getText()).toEqual('1');
      expect(children.get(2).getText()).toEqual('2');
      expect(children.get(3).getText()).toEqual('3');

      element(by.tagName('body')).click();

      expect(menu.isPresent()).toBe(false);
    });

    it('should apply when clicking on an option', function() {
      expect(element(by.id('field3')).getText()).toEqual('foobar');
      element(by.id('field3')).click();

      element(by.className('dropdown-menu')).element(by.linkText('2')).click();

      expect(element(by.id('field3')).getText()).toEqual('2');
    });
  });

  describe('Key Value Options', function() {
    beforeEach(once(function () {
      browser.get(pageUrl + '#options-key-value');
    }));


    it('should show values when open', function() {
      element(by.id('field4')).click();

      var menu = element(by.className('dropdown-menu'));
      expect(menu.isPresent()).toBe(true);
      var children = menu.all(by.tagName('a'));
      expect(children.get(0).getText()).toEqual('Barfoo');
      expect(children.get(1).getText()).toEqual('One');
      expect(children.get(2).getText()).toEqual('Two');
      expect(children.get(3).getText()).toEqual('Three');

      element(by.tagName('body')).click();

      expect(menu.isPresent()).toBe(false);
    });

    it('should show keys and values when closed', function() {
      expect(element(by.id('field4')).getText()).toEqual('foobar : Barfoo');
      element(by.id('field4')).click();

      element(by.className('dropdown-menu')).element(by.linkText('Three')).click();

      expect(element(by.id('field4')).getText()).toEqual('3 : Three');
    });
  });

  describe('Flexible Field', function() {
    beforeEach(once(function () {
      browser.get(pageUrl + '#flexible-combo');
    }));


    it('should allow toggling between text und datetime', function() {
      element(by.id('field5')).click();

      expect(element(by.model('editValue')).isPresent()).toBe(true);

      element(by.className('glyphicon-calendar')).click();

      expect(element(by.model('editValue')).isPresent()).toBe(false);
      expect(element(by.className('datepicker')).isPresent()).toBe(true);

      element(by.className('glyphicon-pencil')).click();

      expect(element(by.model('editValue')).isPresent()).toBe(true);
      expect(element(by.className('datepicker')).isPresent()).toBe(false);

      element(by.tagName('body')).click();

      expect(element(by.model('editValue')).isPresent()).toBe(false);
    });

    it('should allow editing a date in text mode', function() {

      element(by.id('field5')).click();
      element(by.className('glyphicon-calendar')).click();
      element(by.buttonText('27')).click();
      element(by.model('hours')).clear().sendKeys('8');
      element(by.model('minutes')).clear().sendKeys('57');
      element(by.className('glyphicon-ok')).click();
      element(by.id('field5')).click();
      element(by.className('glyphicon-pencil')).click();

      expect(element(by.model('editValue')).getAttribute('value')).toContain('27T08:57');

      element(by.tagName('body')).click();
    });

    it('should apply a valid text date to the datepicker', function() {

      element(by.id('field5')).click();

      element(by.model('editValue')).clear().sendKeys('2015-11-19T18:17:29', protractor.Key.ENTER);

      element(by.id('field5')).click();
      element(by.className('glyphicon-calendar')).click();

      expect(element(by.className('datepicker')).getText()).toContain('November 2015');
      expect(element(by.buttonText('19')).getAttribute('class')).toContain('active');
      expect(element(by.model('hours')).getAttribute('value')).toEqual('18');
      expect(element(by.model('minutes')).getAttribute('value')).toEqual('17');
    });

  });
});
