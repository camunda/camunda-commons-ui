'use strict';

var angular = require('angular');
var authorizationResource = require('./authorizationResource');

  var resourcesModule = angular.module('camunda.common.resources', []);

  resourcesModule.factory('AuthorizationResource', authorizationResource);

  module.exports = resourcesModule;
