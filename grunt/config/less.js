module.exports = function(config, lessConfig, pathConfig) {
  'use strict';

  var file = {};
  file[pathConfig.buildTarget+'/styles/styles.css'] = pathConfig.sourceDir+'/styles/styles.less';

  lessConfig[pathConfig.appName + '_styles'] = {
    options: {
      paths: [
        'node_modules',
        'node_modules/camunda-commons-ui/node_modules',
        'styles',
        'scripts'
      ],


      dumpLineNumbers: '<%= buildMode === "prod" ? "" : "comments" %>',
      compress: '<%= buildMode === "prod" ? "true" : "" %>',
      sourceMap: '<%= buildMode === "prod" ? "true" : "" %>',

      sourceMapURL: './styles.css.map',
      sourceMapFilename: pathConfig.buildTarget+'/styles/styles.css.map'
    },
    files: file
  };

};
