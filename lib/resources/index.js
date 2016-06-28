'use strict';

var angular = require('camunda-bpm-sdk-js/vendor/angular');
var authorizationResource = require('./authorizationResource');

var resourcesModule = angular.module('camunda.common.resources', []);

resourcesModule.factory('AuthorizationResource', authorizationResource);

module.exports = resourcesModule;
