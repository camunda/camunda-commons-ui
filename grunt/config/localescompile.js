module.exports = function() {
  'use strict';
  return {
    options: {
      dest: '<%= buildTarget %>/locales'
    },
    prod: {
      options: {
        onlyProd: 1,
        anOption: 'for production'
      },
      src: [
        'node_modules/camunda-commons-ui/resources/locales/*.json',
        'node_modules/camunda-commons-ui/lib/*/locales/*.json',
        'client/scripts/**/locales/*.json'
      ]
    }
  };
};
