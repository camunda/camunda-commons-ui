'use strict';

/**
 * $translate supports default translations, but that does not work for applications without translation configuration
 * setup. So this function provides that functionality.
 * @type {[*]}
 */
module.exports = ['$translate', '$q', function($translate, $q) {
  return function(translationObject) {
    var promises = Object
      .keys(translationObject)
      .reduce(function(promises, key) {
        promises[key] = translateKey(key);

        return promises;
      }, {});

    return $q.all(promises);

    function translateKey(key) {
      return $translate(key)
        .catch(function() {
          return translationObject[key];
        });
    }
  };
}];
