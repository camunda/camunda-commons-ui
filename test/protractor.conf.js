var jasmineReporters = require('jasmine-reporters');

exports.config = {
  // Capabilities to be passed to the webdriver instance.
  capabilities: {
    'browserName': 'chrome'
  },
  specs: [
    '../lib/widgets/inline-field/test/cam-widget-inline-field.spec.js',
    '../lib/widgets/search-pill/test/search-pill.spec.js',
    '../lib/widgets/header/test/cam-widget-header.spec.js',
    '../lib/widgets/loader/test/cam-widget-loader.spec.js',
    '../lib/widgets/search/test/cam-widget-search.spec.js'
  ],

  framework: 'jasmine2',

  onPrepare: function () {
      jasmine.getEnv().addReporter(new jasmineReporters.JUnitXmlReporter({
          savePath: 'test',
          consolidateAll: true
      }));
  },
  jasmineNodeOpts: {
      showColors: false,
      defaultTimeoutInterval: 60000,
      print: function() {}
  }
};
