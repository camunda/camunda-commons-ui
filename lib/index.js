/**
 * @namespace cammunda.common
 */

define([
  'angular',
  './auth/index',
  './util/index',
  './pages/index',
  './plugin/index',
  './directives/index',
  './resources/index',
  './search/index',
  './services/index'
], function(
  angular,
  auth,
  util,
  pages,
  plugin,
  directives,
  resources,
  search,
  services
) {
  'use strict';
  return angular.module('cam.commons', [
    auth.name,
    util.name,
    pages.name,
    plugin.name,
    directives.name,
    resources.name,
    search.name,
    services.name
  ]);
});
