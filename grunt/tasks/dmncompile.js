var child_process = require('child_process');
var path = require('path');

module.exports = function(grunt) {
  grunt.registerTask('dmncompile', function() {
    var done = this.async();
    var dmnPath = path.join(__dirname, '../../dmn-js/');
    child_process.exec('npm i && rollup -c', { cwd: dmnPath }, function(err) {
      if(err) {
        console.log(err);
      }
      done();
    });
  });
};
