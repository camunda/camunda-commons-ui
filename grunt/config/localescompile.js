module.exports = function(config, localesConfig, pathConfig) {
  'use strict';

  localesConfig[pathConfig.appName + '_locales'] = {
      options: {
        dest: pathConfig.buildTarget + '/locales',
        onlyProd: 1,
        anOption: 'for production'
      },
      src: [
        pathConfig.sourceDir + '/../../camunda-commons-ui/resources/locales/*.json',
        pathConfig.sourceDir + '/../../camunda-commons-ui/lib/*/locales/*.json',
        pathConfig.sourceDir + '/scripts/**/locales/*.json'
      ]
  };
};
