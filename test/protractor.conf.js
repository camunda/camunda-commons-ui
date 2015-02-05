var jasmineReporters = require('jasmine-reporters');

exports.config = {
  // Capabilities to be passed to the webdriver instance.
  capabilities: {
    'browserName': 'chrome'
  },
  specs: ['../lib/widgets/inline-field/test/cam-widget-inline-field.spec.js',
          '../lib/widgets/search-pill/test/search-pill.spec.js'],

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
