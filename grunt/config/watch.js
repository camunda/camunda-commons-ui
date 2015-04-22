module.exports = function(config) {

  return {
    options: {
      livereload: false
    },

    assets: {
      files: [
        'client/{fonts,images}/**/*',
        'client/index.html',
        'client/favicon.ico'
      ],
      tasks: [
        'newer:copy:assets'
      ]
    },

    styles: {
      files: [
        'client/styles/**/*.{css,less}',
        'client/scripts/*/*.{css,less}'
      ],
      tasks: [
        'less'
      ]
    },

    scripts: {
      files: [
        'grunt/config/requirejs.js',
        'client/tasklist.html',
        'client/scripts/**/*.{js,html}'
      ],
      tasks: [
        'newer:jshint:scripts',
        // 'requirejs:dependencies',
        'requirejs:scripts'
      ]
    },

    sdk: {
      files: [
        'node_modules/camunda-bpm-sdk-js/dist/**/*.js'
      ],
      tasks: [
        'copy:sdk',
        'requirejs:scripts'
      ]
    },

    integrationTest: {
      files: [
        'grunt/config/karma.js',
        'test/integration/main.js',
        'test/integration/**/*Spec.js'
      ],
      tasks: [
        'karma:integration'
      ]
    }
  };
};
