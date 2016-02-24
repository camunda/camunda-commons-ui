  'use strict';

  var angular = require('camunda-bpm-sdk-js/vendor/angular');
  /**
   * @memberOf camunda.common.auth
   */

  /**
   * Authentication placeholde
   *
   * @class Authentication
   * @constructor
   *
   * @param {Object}        data data to instantiate the authentication with
   * @param {String}        data.name the user name
   * @param {Array<String>} data.authorizedApps list of applications the user is authorized for
   */
  function Authentication(data) {
    angular.extend(this, data);
  }

  /**
   * Name of the authenticated user
   * @member Authentication#name
   */

  /**
   * @method Authentication#canAccess
   *
   * @param  {String} app name of the app
   * @return {Boolean} true if can access
   */
  Authentication.prototype.canAccess = function(app) {
    return this.authorizedApps && this.authorizedApps.indexOf(app) !== -1;
  };

  module.exports = Authentication;
