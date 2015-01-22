// An example configuration file.
exports.config = {
  // Capabilities to be passed to the webdriver instance.
  capabilities: {
    'browserName': 'chrome'
  },
  specs: ['lib/widgets/inline-field/test/cam-widget-inline-field.spec.js',
          'lib/widgets/search-pill/test/search-pill.spec.js']
};
