/* jshint node: true, unused: false */
/* global __dirname: false, describe: false, beforeEach: false, it: false, browser: false,
          element: false, expect: false, by: false, protractor: false */
'use strict';
var path = require('path');
var projectRoot = path.resolve(__dirname, '../../../../');
var once = require(path.join(projectRoot, 'test/utils')).once;
var pkg = require(path.join(projectRoot, 'package.json'));
var pageUrl = 'http://localhost:' + pkg.gruntConfig.connectPort + '/lib/widgets/header/test/cam-widget-header.spec.html';


describe('Header', function() {

  describe('With content', function() {
    beforeEach(once(function () {
      browser.get(pageUrl + '#with-content');
    }));

    it('uses the ng-transclude feature', function () {
      expect(element(by.css('#with-content [ng-transclude]')).getText()).toBe('Awesome');
    });
  });


  describe('Anonymous', function() {
    beforeEach(once(function () {
      browser.get(pageUrl + '#anonymous');
    }));

    it('does not show the account dropdown', function () {
      expect(element(by.css('#anonymous .cam-nav .account')).isPresent()).toBe(false);
    });

    it('does not show the link to the current app', function () {
      expect(element(by.css('#anonymous .cam-nav .app-switch .admin')).isPresent()).toBe(false);
    });

    it('shows the links to other apps', function () {
      expect(element(by.css('#anonymous .cam-nav .app-switch .cockpit')).isPresent()).toBe(true);
      expect(element(by.css('#anonymous .cam-nav .app-switch .tasklist')).isPresent()).toBe(true);
    });
  });


  describe('Authenticated', function() {
    beforeEach(once(function () {
      browser.get(pageUrl + '#authenticated');
    }));

    it('shows the account dropdown', function () {
      expect(element(by.css('#authenticated .cam-nav .account')).isPresent()).toBe(true);
    });

    it('shows the user name', function () {
      expect(element(by.css('#authenticated .cam-nav .account > a')).getText()).toBe('mustermann');
    });

    it('shows the link to admin app', function () {
      expect(element(by.css('#authenticated .cam-nav .app-switch .admin')).isPresent()).toBe(true);
    });

    it('does not show the link to cockpit app because user has not access to it', function () {
      expect(element(by.css('#authenticated .cam-nav .app-switch .cockpit')).isPresent()).toBe(false);
    });

    it('does not show the link to tasklist app because it is the current app', function () {
      expect(element(by.css('#authenticated .cam-nav .app-switch .tasklist')).isPresent()).toBe(false);
    });
  });
});
