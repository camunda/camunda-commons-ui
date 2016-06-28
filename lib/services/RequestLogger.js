 'use strict';
  /**
   * A request logger that broadcasts the events
   * requestStarted and requestFinished requests on the
   * page have been made.
   */
 module.exports = [ '$rootScope',
  function($rootScope) {

    var activeCount = 0;

    return {
      logStarted: function() {
        if (!activeCount) {
          $rootScope.$broadcast('requestStarted');
        }

        activeCount++;
      },

      logFinished: function() {
        activeCount--;

        if (!activeCount) {
          $rootScope.$broadcast('requestFinished');
        }
      }
    };
  }];
