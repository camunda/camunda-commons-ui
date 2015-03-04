/* jshint node: true, unused: false */
/* global __dirname: false, describe: false, beforeEach: false, it: false, browser: false,
          element: false, expect: false, by: false, protractor: false */
'use strict';
var path = require('path');
var projectRoot = path.resolve(__dirname, '../../../../');
var once = require(path.join(projectRoot, 'test/utils')).once;
var pkg = require(path.join(projectRoot, 'package.json'));
var pageUrl = 'http://localhost:' + pkg.gruntConfig.connectPort + '/lib/widgets/bpmn-viewer/test/cam-widget-bpmn-viewer.spec.html';

var page = require('./cam-widget-bpmn-viewer.page.js');

describe('Bpmn Viewer', function() {
  beforeEach(once(function() {
    browser.get(pageUrl);
  }));
  var diagram;
  describe('With Navigation', function() {
    beforeEach(function(){
      diagram = page.diagram('viewer1');
    });

    it('should display a diagram', function() {
      expect(diagram.isPresent()).toBe(true);
    });

    it('should highlight elements on click', function() {
      diagram.element('UserTask_1').click();
      expect(diagram.element('UserTask_1').isHighlighted()).toBe(true);

      diagram.element('UserTask_1').click();
      expect(diagram.element('UserTask_1').isHighlighted()).toBe(false);
    });

    it('should create badges on click', function() {
      diagram.element('UserTask_2').click();
      expect(diagram.badgeFor('UserTask_2').getText()).toEqual('Test');
    });
  });

  describe('Without Navigation', function() {
    beforeEach(function() {
      diagram = page.diagram('viewer2');
    });

    it('should not display navigation buttons', function() {
      expect(diagram.navigationButtons().isPresent()).toBe(false);
    });
  });

});
