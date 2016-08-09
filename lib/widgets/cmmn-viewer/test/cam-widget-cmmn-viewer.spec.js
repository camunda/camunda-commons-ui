/* jshint node: true, unused: false */
/* global __dirname: false, describe: false, before: false, beforeEach: false, it: false,
          browser: false, element: false, expect: false, by: false, protractor: false */
'use strict';
var path = require('path');
var projectRoot = path.resolve(__dirname, '../../../../');
var pkg = require(path.join(projectRoot, 'package.json'));
var pageUrl = 'http://localhost:' + pkg.gruntConfig.connectPort +
              '/lib/widgets/cmmn-viewer/test/cam-widget-cmmn-viewer.spec.html';

var page = require('./cam-widget-cmmn-viewer.page.js');

describe('Cmmn Viewer', function() {
  beforeEach((function() {
    browser.get(pageUrl);
  }));
  var diagram;
  describe('With Navigation', function() {
    beforeEach(function() {
      diagram = page.diagram('viewer1');
    });

    it('should display a diagram', function() {
      expect(diagram.isPresent()).to.eventually.eql(true);
    });

    it('should highlight elements on click', function() {
      diagram.element('PlanItem_0mb2bge').click();
      expect(diagram.element('PlanItem_0mb2bge').isHighlighted()).to.eventually.eql(true);

      diagram.element('PlanItem_0mb2bge').click();
      expect(diagram.element('PlanItem_0mb2bge').isHighlighted()).to.eventually.eql(false);
    });

    it('should create badges on click', function() {
      diagram.element('PlanItem_1').click();
      expect(diagram.badgeFor('PlanItem_1').getText()).to.eventually.eql('Test');
    });

    it('should recognize hovered elements', function() {
      diagram.element('PlanItem_0vkb9uc').hover();
      expect(page.hoveredElementsText()).to.eventually.eql('["PlanItem_0vkb9uc"]');
    });

    it('should zoom in', function() {
      var zoomBefore = diagram.zoomLevel();
      diagram.zoomInButton().click();
      var zoomAfter = diagram.zoomLevel();

      zoomBefore.then(function(val) {
        expect(zoomAfter).to.eventually.be.above(val);
      });
    });

    it('should zoom out', function() {
      var zoomBefore = diagram.zoomLevel();
      diagram.zoomOutButton().click();
      var zoomAfter = diagram.zoomLevel();

      zoomBefore.then(function(val) {
        expect(zoomAfter).to.eventually.be.below(val);
      });
    });

    it('should reset the zoom level', function() {
      // refresh the page to get the initial zoom
      browser.get(pageUrl);

      var zoomBefore = diagram.zoomLevel();
      diagram.zoomInButton().click();
      diagram.zoomInButton().click();
      diagram.resetZoomButton().click();
      var zoomAfter = diagram.zoomLevel();

      zoomBefore.then(function(val) {
        expect(zoomAfter).to.eventually.eql(val);
      });
    });

    it('should store viewbox in the URL', function() {
      // refresh the page to get the initial zoom
      browser.get(pageUrl);

      diagram.zoomInButton().click();
      var zoomBefore = diagram.zoomLevel().then(function(val) {

        browser.getLocationAbsUrl().then(function(url) {
          browser.get(url);

          var zoomAfter = page.diagram('viewer1').zoomLevel();

          expect(zoomAfter).to.eventually.closeTo(val, 0.5);
        });

      });
    });
  });

  describe('Without Navigation', function() {
    beforeEach(function() {
      diagram = page.diagram('viewer2');
    });

    it('should not display navigation buttons', function() {
      expect(diagram.navigationButtons().isPresent()).to.eventually.eql(false);
    });
  });

});
