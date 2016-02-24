/**
 * @namespace camunda.common
 */

'use strict';

var angular = require('camunda-bpm-sdk-js/vendor/angular'),
    auth = require('./auth/index'),
    util = require('./util/index'),
    pages = require('./pages/index'),
    plugin = require('./plugin/index'),
    directives = require('./directives/index'),
    resources = require('./resources/index'),
    search = require('./search/index'),
    services = require('./services/index'),
    widgets = require('./widgets/index'),
    dateFilter = require('./filter/date/index');

require('../vendor/ui-bootstrap-tpls-0.11.2-camunda');
require('angular-translate');

module.exports = angular.module('cam.commons', [
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
