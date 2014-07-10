module.exports = function(config) {
  return {
    options: {
      paths: [
        'styles',
        'scripts'
      ],
      compress: true,
      sourceMap: true,
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
