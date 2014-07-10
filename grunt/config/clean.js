module.exports = function(config) {
  config = config || {};

  return {
    build: {
      src: [
        'doc',
        'dist',
        '.tmp'
      ]
    },
    sdk: {
      src: [
        '.bower_packages',
        // 'client/bower_components/camunda-bpm-form',
        // 'client/bower_components/camunda-bpm-sdk-js',
        // 'client/bower_components/camunda-bpm-sdk-js-mock'
      ]
    }
  };
};
