'use strict';

let browserify = require('browserify');
let derequire = require('browserify-derequire');
let flattenBundle = require('browser-pack-flat/plugin');

let fs = require('fs');
let bundleFs = fs.createWriteStream(__dirname + '/index.js');

browserify({
  standalone: 'CmmnJS',
  builtins: false,
  insertGlobalVars: {
    process: function() {
      return 'undefined';
    },
    Buffer: function() {
      return 'undefined';
    }
  }
})
    .add('node_modules/cmmn-js/lib/NavigatedViewer')
    .transform('babelify', {
      babelrc: false,
      global: true,
      presets: [
        ['@babel/preset-env', {
          targets: {
            browsers: ['ie >= 9']
          }
        }]
      ]
    })
    .plugin(flattenBundle)
    .plugin(derequire)
    .bundle()
    .pipe(bundleFs);
