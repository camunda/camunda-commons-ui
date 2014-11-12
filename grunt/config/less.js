module.exports = function(config) {
  return {
    options: {
      paths: [
        'styles',
        'scripts'
      ],

      dumpLineNumbers: '<%= buildTarget === "dist" ? "" : "comments" %>',
      compress: '<%= buildTarget === "dist" ? "true" : "" %>',
      sourceMap: '<%= buildTarget === "dist" ? "true" : "" %>',

      sourceMapURL: './styles.css.map',
      sourceMapFilename: '<%= buildTarget %>/styles/styles.css.map'
    },
    styles: {
      files: {
        '<%= buildTarget %>/styles/styles.css': '<%= pkg.gruntConfig.clientDir %>/styles/styles.less'
      }
    }
  };
};
