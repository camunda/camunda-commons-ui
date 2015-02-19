/* jshint node: true, unused: false */
/* global __dirname: false, describe: false, beforeEach: false, it: false, browser: false,
          element: false, expect: false, by: false, protractor: false */
'use strict';
var path = require('path');
var projectRoot = path.resolve(__dirname, '../../../../');
var once = require(path.join(projectRoot, 'test/utils')).once;
var pkg = require(path.join(projectRoot, 'package.json'));
var pageUrl = 'http://localhost:' + pkg.gruntConfig.connectPort + '/lib/widgets/loader/test/cam-widget-loader.spec.html';

var page = require('./cam-widget-loader.page.js');

describe('loader', function() {
  var loader;

  beforeEach(once(function () {
    browser.get(pageUrl + '#interactive-container');
    loader = page.loader('#interactive-container');
  }));


  describe('initial state', function () {
    it('hides everything', function () {
      expect(loader.isPresent()).toBe(true);
      expect(loader.stateText()).toBe('INITIAL');
      expect(loader.defaultPanel().isPresent()).toBe(true);
      expect(loader.defaultPanel().isDisplayed()).toBe(false);
    });
  });


  describe('loading state', function() {
    it('shows the icon', function () {
      loader.reloadButton().click(function () {
        expect(loader.stateText()).toBe('LOADING');
        expect(loader.loadingNotice().isDisplayed()).toBe(true);
        expect(loader.defaultPanel().isDisplayed()).toBe(false);
      });
    });
  });


  describe('loaded state', function() {
    it('shows the transclusion content', function () {
      loader.reloadButton().click(function () {
        browser.sleep(1200).then(function () {
          expect(loader.stateText()).toBe('LOADED');
          expect(loader.loadingNotice().isDisplayed()).toBe(false);
          expect(loader.defaultPanel().isDisplayed()).toBe(true);
        });
      });
    });
  });


  describe('loaded empty state', function() {
    it('does not show the transclusion content', function () {
      loader.reloadEmptyButton().click(function () {
        browser.sleep(1200).then(function () {
          expect(loader.stateText()).toBe('LOADED');
          expect(loader.loadingNotice().isDisplayed()).toBe(false);
          expect(loader.defaultPanel().isDisplayed()).toBe(false);
        });
      });
    });
  });


  describe('error state', function() {
    it('does not show the transclusion content', function () {
      loader.reloadButton().click(function () {
        loader.failButton().then(function () {
          expect(loader.stateText()).toBe('ERROR');
          expect(loader.loadingNotice().isDisplayed()).toBe(false);
          expect(loader.defaultPanel().isDisplayed()).toBe(false);
          expect(loader.errorNotice().isDisplayed()).toBe(true);
        });
      });
    });
  });
});
