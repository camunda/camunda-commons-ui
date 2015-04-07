/* jshint node: true, unused: false */
/* global __dirname: false, describe: false, before: false, it: false, browser: false,
          element: false, expect: false, by: false, protractor: false */
'use strict';
var path = require('path');
var projectRoot = path.resolve(__dirname, '../../../../');
var pkg = require(path.join(projectRoot, 'package.json'));
var pageUrl = 'http://localhost:' + pkg.gruntConfig.connectPort +
              '/lib/widgets/header/test/cam-widget-header.spec.html';

var page = require('./cam-widget-header.page.js');

describe('Header', function() {
  var header;
  describe('With content', function() {
    before(function () {
      browser.get(pageUrl + '#with-content');
      header = page.header('#with-content');
    });

    it('uses the ng-transclude feature', function () {
      expect(header.transcludedText()).to.eventually.eql('Awesome');
    });
  });


  describe('Anonymous', function() {
    before(function () {
      browser.get(pageUrl + '#anonymous');
      header = page.header('#anonymous');
    });

    it('does not show the account dropdown', function () {
      expect(header.account().isPresent()).to.eventually.eql(false);
    });

    it('does not show the link to the current app', function () {
      expect(header.adminLink().isPresent()).to.eventually.eql(false);
    });

    it('shows the links to other apps', function () {
      expect(header.cockpitLink().isPresent()).to.eventually.eql(true);
      expect(header.tasklistLink().isPresent()).to.eventually.eql(true);
    });
  });


  describe('Authenticated', function() {
    before(function () {
      browser.get(pageUrl + '#authenticated');
      header = page.header('#authenticated');
    });

    it('shows the account dropdown', function () {
      expect(header.account().isPresent()).to.eventually.eql(true);
    });

    it('shows the user name', function () {
      expect(header.accountText()).to.eventually.eql('mustermann');
    });

    it('shows the link to admin app', function () {
      expect(header.adminLink().isPresent()).to.eventually.eql(true);
    });

    it('does not show the link to cockpit app because user has not access to it', function () {
      expect(header.cockpitLink().isPresent()).to.eventually.eql(false);
    });

    it('does not show the link to tasklist app because it is the current app', function () {
      expect(header.tasklistLink().isPresent()).to.eventually.eql(false);
    });
  });
});
