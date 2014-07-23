define([
  'angular',
  './uriFilter',
  './uriProvider',
  './notifications'
], function(
  angular,
  uriFilter,
  uriProvider,
  notifications
) {
  'use strict';

  /**
   * @module cam.commons.util
   */

  /**
   * @memberof cam.commons
   */

  return angular.module('cam.commons.util', [])
    .filter('uri', uriFilter)
    .provider('Uri', uriProvider)
    .service('Notifications', notifications);
});
