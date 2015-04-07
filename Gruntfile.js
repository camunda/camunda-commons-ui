/* global require: false */
var specHtmlExp = /\.spec\.html$/;
/**
  This file is used to configure the [grunt](http://gruntjs.com/) tasks
  aimed to generate the web frontend of the camunda BPM platform.
  @author Valentin Vago <valentin.vago@camunda.com>
  @author Sebastian Stamm  <sebastian.stamm@camunda.com>
 */

module.exports = function(grunt) {
  'use strict';
  require('load-grunt-tasks')(grunt);
  try {
    grunt.task.loadNpmTasks('grunt-contrib-watch');
  }
  catch (err) {
    grunt.log.errorlns(err.stack);
  }

  var commons = require('./index');

  var pkg = require('./package.json');

  var config = pkg.gruntConfig || {};

  config.grunt = grunt;
  config.pkg = pkg;

  grunt.initConfig({

    karma: {
      unit: {
        configFile: './test/karma.conf.js',
        singleRun: true
      }
    },

    protractor: {
      widgets: {   // Grunt requires at least one target to run so you can simply put 'all: {}' here too.
        options: {
          configFile: 'test/protractor.conf.js',
          seleniumAddress: 'http://localhost:4444/wd/hub',
        },
      },
    },

    connect: {
      options: {
        port: pkg.gruntConfig.connectPort,
        livereload: pkg.gruntConfig.livereloadPort
      },
      widgetTests: {
        options: {
          middleware: function (connect, options, middlewares) {
            middlewares.unshift(function (req, res, next) {
              if (req.url === '/test-conf.json') {
                res.setHeader('Content-Type', 'application/json');
                var conf = commons.requirejs({ pathPrefix: '' });
                conf.baseUrl = '/';
                conf.packages.push({
                  name: 'camunda-commons-ui/widgets',
                  location: 'lib/widgets',
                  main: 'index'
                });
                return res.end(JSON.stringify(conf));
              }
              next();
            });
            return middlewares;
          },
          base: [
            '.'
          ]
        }
      }
    },

    less: {
      options: {
        dumpLineNumbers: 'comments',
        compress: false,
        sourceMap: false
      },

      widgets: {
        files: {
          'test-styles.css': 'resources/less/test-styles.less'
        }
      }
    },

    watch: {
      options: {
        livereload: false,
      },

      styles: {
        files: [
          'lib/**/*.less',
          'resources/less/**/*.less'
        ],
        tasks: ['less']
      },

      served: {
        options: {
          livereload: pkg.gruntConfig.livereloadPort
        },
        files: [
          '*.css',
          'lib/**/*.{html,js}'
        ],
        tasks: []
      }
    }
  });

  grunt.registerTask('build-sdk-type-utils', function () {
    var done = this.async();
    grunt.util.spawn({
      cmd: 'grunt',
      args: [
        '--gruntfile', './node_modules/camunda-bpm-sdk-js/Gruntfile.js',
        'browserify:distTypeUtils'
      ]
    }, done);
  });

  grunt.registerTask('build', ['build-sdk-type-utils', 'less:widgets']);

  grunt.registerTask('auto-build', ['build', 'connect:widgetTests', 'watch']);

  grunt.registerTask('default', ['build', 'karma', 'connect:widgetTests', 'protractor:widgets']);

  grunt.registerTask('protractorTests', ['connect:widgetTests', 'protractor:widgets']);
};
