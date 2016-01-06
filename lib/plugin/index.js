'use strict';

var angular = require('angular'),
    view = require('./view'),
    service = require('./service');

  var pluginModule = angular.module('cockpit.plugin', []);


  // this module is a bit different, so we handle it differently...
  view(pluginModule);
  service(pluginModule);


  module.exports = pluginModule;
