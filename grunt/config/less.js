module.exports = function(config, lessConfig, pathConfig) {
  'use strict';
  var resolve = require('path').resolve;

  var file = {};
  file[pathConfig.buildTarget+'/styles/styles.css'] = pathConfig.sourceDir + '/styles/styles.less';

  var includePaths = [
    resolve(process.cwd(), 'node_modules/camunda-commons-ui/node_modules/bootstrap/less'),
    resolve(process.cwd(), 'node_modules/camunda-commons-ui/lib/widgets'),
    resolve(process.cwd(), 'node_modules/camunda-commons-ui/resources/less'),
    resolve(process.cwd(), 'node_modules/camunda-commons-ui/resources/css'),
    resolve(process.cwd(), 'node_modules/camunda-commons-ui/node_modules'),
    resolve(process.cwd(), 'node_modules', 'camunda-' + pathConfig.appName +'-ui', 'styles'),
    resolve(process.cwd(), 'node_modules', 'camunda-' + pathConfig.appName +'-ui', 'client/scripts'),

    resolve(__dirname, '../../..', 'camunda-bpm-webapp/webapp/src/main/resources-plugin'),
    resolve(__dirname, '../../..', 'camunda-bpm-platform-ee/webapps/camunda-webapp/plugins/src/main/resources-plugin')
  ];

  lessConfig[pathConfig.appName + '_styles'] = {
    options: {
      paths: includePaths,


      dumpLineNumbers: '<%= buildMode === "prod" ? "" : "comments" %>',
      compress: '<%= buildMode === "prod" ? "true" : "" %>',
      sourceMap: '<%= buildMode === "prod" ? "true" : "" %>',

      sourceMapURL: './styles.css.map',
      sourceMapFilename: pathConfig.buildTarget + '/styles/styles.css.map'
    },
    files: file
  };

};
