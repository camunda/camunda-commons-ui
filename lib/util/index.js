'use strict';

var angular = require('camunda-bpm-sdk-js/vendor/angular'),
    uriFilter = require('./uriFilter'),
    uriProvider = require('./uriProvider'),
    notifications = require('./notifications');


/**
 * @module cam.commons.util
 */

/**
 * @memberof cam.commons
 */

module.exports = angular.module('cam.commons.util', [])
  .filter('uri', uriFilter)
  .provider('Uri', uriProvider)
  .service('Notifications', notifications);
