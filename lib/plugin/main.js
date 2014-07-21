/* global define: false, require: false */
define(['angular',
  'camunda-commons-ui/plugin/view',
  'camunda-commons-ui/plugin/service'
],
function(angular) {
  'use strict';

  var pluginModule = angular.module('cockpit.plugin', []);


  // this module is a bit different, so we handle it differently...
  require('camunda-commons-ui/plugin/view')(pluginModule);
  require('camunda-commons-ui/plugin/service')(pluginModule);


  return pluginModule;
});
