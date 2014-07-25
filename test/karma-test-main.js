(function() {
  'use strict';
  var allTestFiles = [
    'chai',
    'angular'
  ];
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

  var config = {
    paths: {
      'chai':             'node_modules/chai/chai',
      'jquery':           'test/vendor/jquery-2.1.1',

      'angular':          'test/vendor/angular',
      'angular-animate':  'test/vendor/angular-animate',
      'angular-cookies':  'test/vendor/angular-cookies',
      'angular-mock':     'test/vendor/angular-mock',
      'angular-route':    'test/vendor/angular-route',
      'angular-sanitize': 'test/vendor/angular-sanitize'
    },

    // Karma serves files under /base, which is the basePath from your config file
    baseUrl: '/base',

    // dynamically load all test files
    deps: allTestFiles,

    shim: {
      'angular':          {exports: 'angular', deps: ['jquery']},
      'angular-animate':  ['angular'],
      'angular-cookies':  ['angular'],
      'angular-mock':     ['angular'],
      'angular-route':    ['angular'],
      'angular-sanitize': ['angular']
    },

    // we have to kickoff jasmine, as it is asynchronous
    callback: window.__karma__.start
  };

  // console.info('karma, requirejs configuration', config);

  require.config(config);
}());
