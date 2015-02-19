/* jshint node: true, unused: false */
/* global __dirname: false, describe: false, beforeEach: false, it: false, browser: false,
          element: false, expect: false, by: false, protractor: false */
'use strict';
var path = require('path');
var projectRoot = path.resolve(__dirname, '../../../../');
var once = require(path.join(projectRoot, 'test/utils')).once;
var pkg = require(path.join(projectRoot, 'package.json'));
var pageUrl = 'http://localhost:' + pkg.gruntConfig.connectPort + '/lib/widgets/header/test/cam-widget-header.spec.html';

var page = require('./cam-widget-header.page.js');

describe('Header', function() {
  var header;
  describe('With content', function() {
    beforeEach(once(function () {
      browser.get(pageUrl + '#with-content');
      header = page.header('#with-content');
    }));

    it('uses the ng-transclude feature', function () {
      expect(header.transcludedText()).toBe('Awesome');
    });
  });


  describe('Anonymous', function() {
    beforeEach(once(function () {
      browser.get(pageUrl + '#anonymous');
      header = page.header('#anonymous');
    }));

    it('does not show the account dropdown', function () {
      expect(header.account().isPresent()).toBe(false);
    });

    it('does not show the link to the current app', function () {
      expect(header.adminLink().isPresent()).toBe(false);
    });

    it('shows the links to other apps', function () {
      expect(header.cockpitLink().isPresent()).toBe(true);
      expect(header.tasklistLink().isPresent()).toBe(true);
    });
  });


  describe('Authenticated', function() {
    beforeEach(once(function () {
      browser.get(pageUrl + '#authenticated');
      header = page.header('#authenticated');
    }));

    it('shows the account dropdown', function () {
      expect(header.account().isPresent()).toBe(true);
    });

    it('shows the user name', function () {
      expect(header.accountText()).toBe('mustermann');
    });

    it('shows the link to admin app', function () {
      expect(header.adminLink().isPresent()).toBe(true);
    });

    it('does not show the link to cockpit app because user has not access to it', function () {
      expect(header.cockpitLink().isPresent()).toBe(false);
    });

    it('does not show the link to tasklist app because it is the current app', function () {
      expect(header.tasklistLink().isPresent()).toBe(false);
    });
  });
});
