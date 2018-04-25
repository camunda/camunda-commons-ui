var child_process = require('child_process');
var path = require('path');

module.exports = function(grunt) {
  grunt.registerTask('dmncompile', function() {
    var done = this.async();
    var dmnPath = path.join(__dirname, '../../dmn-js/');

    var cmd = 'npm i --silent && node_modules/.bin/rollup -c --silent';
    if (process.platform === 'win32') {
      cmd = cmd.replace(/\//g, '\\');
    }

    child_process.exec(cmd, { maxBuffer: 1024 * 500, cwd: dmnPath }, function(err) {
      if(err) {
        console.log(err);
      }
      done();
    });
  });
};
