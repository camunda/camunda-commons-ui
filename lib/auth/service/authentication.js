define([
], function() {
  'use strict';

  return [  '$rootScope',
    function($rootScope) {

    var user = null;

    function clear() {
      user = null;
    }

    function username() {
      return user ? user.name : null;
    }

    function canAccess(app) {
      return !user || (user.authorizedApps && user.authorizedApps.indexOf(app) !== -1);
    }

    function update(data) {
      if ((!user && data) || (user && data && data.name != user.name)) {
        authentication.user = user = data;
      }
    }

    var authentication = {
      username: username,
      canAccess: canAccess,
      clear: clear,
      update: update,
      user: user
    };

    // register with root scope
    $rootScope.authentication = authentication;

    return authentication;
  }];
});
