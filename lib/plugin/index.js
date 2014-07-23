define([
  'angular',
  './view',
  './service'
],
function(
  angular,
  view,
  service
) {
  'use strict';

  var pluginModule = angular.module('cockpit.plugin', []);


  // this module is a bit different, so we handle it differently...
  view(pluginModule);
  service(pluginModule);


  return pluginModule;
});
