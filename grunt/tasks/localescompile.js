/*
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership. Camunda licenses this file to you under the Apache License,
 * Version 2.0; you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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

      languages[lang] = languages[lang] || {labels:{}};

      loaded = grunt.file.readJSON(file);
      for (key in loaded) {
        if(typeof loaded[key] === 'string') {
          if(languages[lang].labels[key]) {
            throw grunt.util.error('Duplicate entry ' + key + ' for translation file ' + lang + '.');
          }
          languages[lang].labels[key] = loaded[key];
        } else {
          if(languages[lang][key]) {
            throw grunt.util.error('Duplicate entry ' + key + ' for translation file ' + lang + '.');
          }
          languages[lang][key] = loaded[key];
        }

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
