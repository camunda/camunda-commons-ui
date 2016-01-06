  'use strict';
  // depends on 'cam.commons.util Notifications'

  module.exports = ['$route', '$q', '$location', 'Notifications',
  function($route,   $q,   $location,   Notifications) {

    function getByRouteParam(paramName, options) {
      var deferred = $q.defer();

      var id = $route.current.params[paramName],
          resolve = options.resolve,
          resourceName = options.name || 'entity';

      function succeed(result) {
        deferred.resolve(result);
      }

      function fail(errorResponse) {
        var message, replace, redirectTo;
        var preventRedirection = false;


        if (errorResponse.status === 404) {
          message = 'No ' + resourceName + ' with ID ' + id;
          replace = true;

          redirectTo = options.redirectTo || '/dashboard';

          if (typeof redirectTo == 'function') {
            // the redirection should be executed
            // inside the custom implementation of
            // redirectTo()
            preventRedirection = true;
            redirectTo(errorResponse);
          }

        }
        else if (errorResponse.status === 401) {
          message = 'Authentication failed. Your session might have expired, you need to login.';
          redirectTo = '/login';
        }
        else {
          message = 'Received ' + errorResponse.status + ' from server.';
          redirectTo = '/dashboard';
        }

        if (!preventRedirection) {
          $location
            .path(redirectTo);

          if (replace) {
            $location.replace();
          }

          Notifications.addError({
            status: 'Failed to display ' + resourceName,
            message: message,
            http: true,
            exclusive: [ 'http' ]
          });
        }

        deferred.reject(message);
      }

      // resolve
      var promise = resolve(id);
      if (promise.$promise && promise.$promise.then) {
        promise = promise.$promise.then(function(response) { succeed(response); }, fail);
      }
      else if (promise.then) {
        promise = promise.then(succeed, fail);
      }
      else {
        throw new Error('No promise returned by #resolve');
      }

      return deferred.promise;
    }

    return {
      getByRouteParam: getByRouteParam
    };
  }];
