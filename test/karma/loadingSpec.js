describe('camunda-commons-ui', function() {
  'use strict';
  // the karma-test-main.js file takes care of pre-requiring the chai lib, so you can use it
  // with require('chai') instead of require(['chai'], function(chai) { .. })
  var expect = require('chai').expect;

  beforeEach(function() {
    console.groupCollapsed(this.test.parent.title+' '+this.currentTest.title);
  });
  afterEach(function() {
    console.groupEnd(this.test.parent.title+' '+this.currentTest.title);
  });

  describe('auth', function() {
    it('loads', function() {
      expect(function() {

      }).to.not.throw(function(err) {
        console.error('test: '+ err.message);
      });
    });
  });


  describe('util', function() {

  });


  describe('directives', function() {

  });


  describe('pages', function() {

  });


  describe('services', function() {

  });
});
