module.exports = function(grunt) {
  'use strict';
  var path = require('path');

  grunt.registerMultiTask('localescompile', function() {
    var lang, file, f, loaded, key, filepath;
    var done = this.async();
    var languages = {};
    var dest = grunt.config.get(this.name +'.'+ this.target +'.options.dest');
    dest = dest || grunt.config.get(this.name +'.options.dest');

    for (f in this.filesSrc) {
      file = this.filesSrc[f];
      lang = path.basename(file, '.json');

      languages[lang] = languages[lang] || {};

      loaded = require(file);
      for (key in loaded) {
        languages[lang][key] = loaded[key];
      }
    }

    for (lang in languages) {
      filepath = path.join(dest, lang +'.json');
      grunt.file.write(filepath, JSON.stringify(languages[lang], null, 2));
      grunt.log.writeln('Wrote "%s" translations in %s', lang, filepath);
    }

    done();
  });
};
