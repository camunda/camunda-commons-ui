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
  var commons = require('./index');

  var pkg = require('./package.json');

  var config = pkg.gruntConfig || {};

  config.grunt = grunt;
  config.pkg = pkg;

  grunt.initConfig({
    protractor: {
      widgets: {   // Grunt requires at least one target to run so you can simply put 'all: {}' here too.
        options: {
          configFile: 'conf.js',
          seleniumAddress: 'http://localhost:4444/wd/hub',
        },
      },
    },

    connect: {
      options: {
        port: pkg.gruntConfig.connectPort
      },
      widgetTests: {
        options: {
          middleware: function (connect, options, middlewares) {
            middlewares.unshift(function (req, res, next) {
              if (req.url === '/test-conf.json') {
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify(commons.requirejs({pathPrefix: ''})));
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
      widgets: {
        files: {
          'styles.css': 'resources/less/styles.less'
        }
      }
    }
  });

  grunt.registerTask('default', ['less:widgets', 'connect:widgetTests', 'protractor:widgets']);
};
