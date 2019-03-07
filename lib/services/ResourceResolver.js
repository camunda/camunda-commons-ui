'use strict';
// depends on 'cam.commons.util Notifications'

module.exports = ['$route', '$q', '$location', 'Notifications', '$translate',
  function($route, $q, $location, Notifications, $translate) {

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
          message = $translate.instant('SERVICES_RESOURCE_RESOLVER_ID_NOT_FOUND', {resourceName: resourceName, id: id});
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
          message = $translate.instant('SERVICES_RESOURCE_RESOLVER_AUTH_FAILED');
          redirectTo = '/login';
        }
        else {
          message = $translate.instant('SERVICES_RESOURCE_RESOLVER_RECEIVED_STATUS', {status: errorResponse.status});
          redirectTo = '/dashboard';
        }

        if (!preventRedirection) {
          $location
            .path(redirectTo);

          if (replace) {
            $location.replace();
          }

          Notifications.addError({
            status: $translate.instant('SERVICES_RESOURCE_RESOLVER_DISPLAY_FAILED', {resourceName: resourceName}),
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
        throw new Error($translate.instant('SERVICES_RESOURCE_RESOLVER_NO_PROMISE'));
      }

      return deferred.promise;
    }

    return {
      getByRouteParam: getByRouteParam
    };
  }];
