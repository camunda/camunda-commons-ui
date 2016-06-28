'use strict';
  // the karma-test-main.js file takes care of pre-requiring the chai lib, so you can use it
  // with require('chai') instead of require(['chai'], function(chai) { .. })
var expect = require('chai').expect;
var ngModule;
var ngModuleName = 'camunda.common.services';

beforeEach(function() {
  console.groupCollapsed(this.test.parent.title+' '+this.currentTest.title);
});
afterEach(function() {
  console.groupEnd(this.test.parent.title+' '+this.currentTest.title);
});

describe('can be loaded using requirejs', function() {
  it('loads', function(done) {
    var loaded = require('../index');
    expect(loaded.name).to.equal(ngModuleName);
    ngModule = loaded;
    done();
  });


  it('can be used as dependency for other modules', function() {
    require('camunda-bpm-sdk-js/vendor/angular').module('test.camunda.common.services', [
      ngModule.name
    ]);
  });
});
