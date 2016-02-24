(function() {
  'use strict';

  var chai = require('chai'),
      chaiSpies = require('chai-spies'),
      angular = require('camunda-bpm-sdk-js/vendor/angular'),
      angularMocks = require('angular-mocks');

  window.$ = require('jquery');

  // use spies
  chai.use(chaiSpies);

}());
