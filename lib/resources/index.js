define([
  'angular',
  './authorizationResource'
], function(
  angular,
  authorizationResource
) {
  'use strict';
  var resourcesModule = angular.module('camunda.common.resources', []);

  resourcesModule.factory('AuthorizationResource', authorizationResource);

  return resourcesModule;
});
