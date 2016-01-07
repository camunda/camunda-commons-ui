(function() {
  'use strict';
  var baseFiles = [
    'chai',
    'chai-spies',
    'angular',
    'angular-mocks'
  ];

  var allTestFiles = [];
  var TEST_REGEXP = /(spec|test)\.js$/i;

  var pathToModule = function(path) {
    return path.replace(/^\/base\//, '').replace(/\.js$/, '');
  };

  Object.keys(window.__karma__.files).forEach(function(file) {
    if (TEST_REGEXP.test(file)) {
      // Normalize paths to RequireJS module names.
      allTestFiles.push(pathToModule(file));
    }
  });

  // var config = {
  //   paths: {
  //     'chai':               'node_modules/chai/chai',
  //     'chai-spies':         'node_modules/chai-spies/chai-spies',
  //     'jquery':             'node_modules/jquery/dist/jquery',
  //     'text':               'node_modules/requirejs-text/text',
  //     'angular':            'node_modules/angular/angular',
  //     'angular-animate':    'node_modules/angular-animate/angular-animate',
  //     'angular-cookies':    'node_modules/angular-cookies/angular-cookies',
  //     'angular-mocks':      'node_modules/angular-mocks/angular-mocks',
  //     'angular-route':      'node_modules/angular-route/angular-route',
  //     'angular-sanitize':   'node_modules/angular-sanitize/angular-sanitize',
  //     'camunda-bpm-sdk-js': 'node_modules/camunda-bpm-sdk-js/dist/camunda-bpm-sdk-angular',
  //     'angular-bootstrap':  'vendor/ui-bootstrap-tpls-0.11.2-camunda'
  //   },

  //   // Karma serves files under /base, which is the basePath from your config file
  //   baseUrl: '/base',

  //   shim: {
  //     'angular':          {exports: 'angular', deps: ['jquery']},
  //     'angular-animate':  ['angular'],
  //     'angular-cookies':  ['angular'],
  //     'angular-mocks':    ['angular'],
  //     'angular-route':    ['angular'],
  //     'angular-sanitize': ['angular'],
  //     'angular-ui':       ['angular']
  //   }
  // };

  // console.info('karma, requirejs configuration', config);

  // require.config(config);

  // load test infrastructure
  // require(baseFiles, function(chai, chaiSpies) {

  var chai = require('chai'),
      chaiSpies = require('chai-spies'),
      angular = require('angular'),
      angularMocks = require('angular-mocks');


    // use spies
    chai.use(chaiSpies);

    // load test files
    // require(allTestFiles, function() {

      // start karma
      window.__karma__.start();
    // });

  // });

}());
