/* jshint node: true, unused: false */
/* global __dirname: false, describe: false, beforeEach: false, it: false, browser: false,
          element: false, expect: false, by: false, protractor: false */
'use strict';
var path = require('path');
var projectRoot = path.resolve(__dirname, '../../../../');
var once = require(path.join(projectRoot, 'test/utils')).once;
var pkg = require(path.join(projectRoot, 'package.json'));
var pageUrl = 'http://localhost:' + pkg.gruntConfig.connectPort + '/lib/widgets/loader/test/cam-widget-loader.spec.html';


describe('loader', function() {
  var context;

  function contextChild(selecta) {
    return context.element(by.css(selecta));
  }

  beforeEach(once(function () {
    browser.get(pageUrl + '#interactive-container');
    context = element(by.css('#interactive-container'));
  }));


  describe('initial state', function () {
    it('hides everything', function () {
      expect(context.isPresent()).toBe(true);
      expect(contextChild('.state-display').getText()).toBe('INITIAL');
      expect(contextChild('.panel.panel-default').isPresent()).toBe(true);
      expect(contextChild('.panel.panel-default').isDisplayed()).toBe(false);
    });
  });


  describe('loading state', function() {
    it('shows the icon', function () {
      contextChild('button.reload').click(function () {
        expect(contextChild('.state-display').getText()).toBe('LOADING');
        expect(contextChild('.loader-state.loading').isDisplayed()).toBe(true);
        expect(contextChild('.panel.panel-default').isDisplayed()).toBe(false);
      });
    });
  });


  describe('loaded state', function() {
    it('shows the transclusion content', function () {
      contextChild('button.reload').click(function () {
        browser.sleep(1200).then(function () {
          expect(contextChild('.state-display').getText()).toBe('LOADED');
          expect(contextChild('.loader-state.loading').isDisplayed()).toBe(false);
          expect(contextChild('.panel.panel-default').isDisplayed()).toBe(true);
        });
      });
    });
  });


  describe('loaded empty state', function() {
    it('does not show the transclusion content', function () {
      contextChild('button.reload-empty').click(function () {
        browser.sleep(1200).then(function () {
          expect(contextChild('.state-display').getText()).toBe('LOADED');
          expect(contextChild('.loader-state.loading').isDisplayed()).toBe(false);
          expect(contextChild('.panel.panel-default').isDisplayed()).toBe(false);
        });
      });
    });
  });


  describe('error state', function() {
    it('does not show the transclusion content', function () {
      contextChild('button.reload').click(function () {
        contextChild('button.fail-load').then(function () {
          expect(contextChild('.state-display').getText()).toBe('ERROR');
          expect(contextChild('.loader-state.loading').isDisplayed()).toBe(false);
          expect(contextChild('.panel.panel-default').isDisplayed()).toBe(false);
          expect(contextChild('.alert.alert-danger').isDisplayed()).toBe(true);
        });
      });
    });
  });
});
