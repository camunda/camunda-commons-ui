/* global define: false, require: false */
define(['angular', 'camunda-commons-ui/resources/authorizationResource'],
function(angular) {
  'use strict';
  var resourcesModule = angular.module('camunda.common.resources', []);

  resourcesModule.factory('AuthorizationResource', require('camunda-commons-ui/resources/authorizationResource'));

  return resourcesModule;
});
