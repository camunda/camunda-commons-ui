/* jshint node: true, unused: false */
/* global __dirname: false, describe: false, before: false, beforeEach: false, it: false,
          browser: false, element: false, expect: false, by: false, protractor: false */
'use strict';
var path = require('path');
var projectRoot = path.resolve(__dirname, '../../../../');
var pkg = require(path.join(projectRoot, 'package.json'));
var pageUrl = 'http://localhost:' + pkg.gruntConfig.connectPort +
              '/lib/widgets/dmn-viewer/test/cam-widget-dmn-viewer.spec.html';

var page = require('./cam-widget-dmn-viewer.page.js');

describe('Dmn Viewer', function() {
  beforeEach((function() {
    browser.get(pageUrl);
  }));

  describe('table display', function() {
    var table;

    beforeEach(function() {
      table = page.table('viewer1');
    });

    it('should display a table', function() {
      expect(table.isPresent()).to.eventually.eql(true);
    });
  });

  describe('drd display', function() {
    var drd;

    beforeEach(function() {
      drd = page.drdDiagram('example-4');
    });

    it('should display a table', function() {
      expect(drd.isPresent()).to.eventually.eql(true);
    });
  });
});
