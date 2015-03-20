/**
 * @namespace camunda.common
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
  './services/index',
  './widgets/index',
  './filter/date/index',
  'angular-bootstrap',
  'angular-translate'
], function(
  angular,
  auth,
  util,
  pages,
  plugin,
  directives,
  resources,
  search,
  services,
  widgets,
  dateFilter
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
    services.name,
    widgets.name,
    dateFilter.name,
    'ui.bootstrap',
    'pascalprecht.translate'
  ]);
});
