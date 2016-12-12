/* jshint node: true, unused: false */
/* global __dirname: false, describe: false, before: false, it: false, browser: false,
          element: false, expect: false, by: false, protractor: false */
'use strict';
var path = require('path');
var projectRoot = path.resolve(__dirname, '../../../../');
var pkg = require(path.join(projectRoot, 'package.json'));
var pageUrl = 'http://localhost:' + pkg.gruntConfig.connectPort +
              '/lib/widgets/chart-line/test/cam-widget-chart-line.spec.html';

var page = require('./cam-widget-chart-line.page.js');

describe('chart-line', function() {
  var chartLine;

  before(function() {
    browser.get(pageUrl);
    chartLine = page.chartLine('[cam-widget-chart-line]');
  });

  describe('rendering', function() {
    it('is based on canvas', function() {
      expect(chartLine.isPresent()).to.eventually.eql(true);
      expect(chartLine.hasCanvas()).to.eventually.eql(true);
    });
  });
});
