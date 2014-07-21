/* global require: false, define: false */

/**
 * @namespace cammunda.common
 */

define([
  'angular',
  'camunda-commons-ui/auth/index',
  'camunda-commons-ui/util/index',
  'camunda-commons-ui/pages/main',
  'camunda-commons-ui/plugin/main',
  'camunda-commons-ui/directives/main',
  'camunda-commons-ui/resources/main',
  'camunda-commons-ui/services/main'
], function(angular) {
  'use strict';
  return angular.module('cam.commons', [
    require('camunda-commons-ui/auth/index').name,
    require('camunda-commons-ui/util/index').name,
    require('camunda-commons-ui/pages/main').name,
    require('camunda-commons-ui/plugin/main').name,
    require('camunda-commons-ui/directives/main').name,
    require('camunda-commons-ui/resources/main').name,
    require('camunda-commons-ui/services/main').name
  ]);
});
