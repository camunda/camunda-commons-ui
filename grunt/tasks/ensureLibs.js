var fs = require('fs');
var persistify = require('persistify');

var commonPackage = fs.readFileSync(__dirname + '/../../package.json', 'utf8');

var excluded = [
  'bpmn-font',
  'camunda-bpm-sdk-js',
  'persistify',
  'mkdirp',
  'dmn-js'
];

var included = [
  'angular',
  'dmn-js/lib/Modeler',
  'q',
  'superagent',
  'bpmn-js/lib/NavigatedViewer'
];


module.exports = function(grunt) {
  'use strict';
  grunt.registerMultiTask('ensureLibs', function() {

    var done = this.async();

    var packageJson = JSON.parse(commonPackage);

    var browserifyOptions = {
      paths: [
        'node_modules',
        'node_modules/camunda-bpm-webapp/node_modules',
        'node_modules/camunda-bpm-webapp/node_modules/camunda-commons-ui/node_modules',
        'node_modules/camunda-commons-ui/node_modules',
        'node_modules/camunda-commons-ui/node_modules/camunda-bpm-sdk-js/node_modules',
        'node_modules/camunda-bpm-sdk-js/node_modules',
        'node_modules/camunda-bpm-webapp/node_modules/camunda-commons-ui/node_modules/camunda-bpm-sdk-js/node_modules',
      ]
    };
    var persistifyOptions = {
      recreate: true,
      cacheId: 'deps'
    };
    var dest = __dirname + '/../../cache/deps.js';
    var cacheDest = __dirname + '/../../cache/deps.json';

    var b = persistify( browserifyOptions, persistifyOptions );

    var cacheData = {};

    for(var key in packageJson.dependencies) {
      if(excluded.indexOf(key) === -1) {
        b.require(key);
        cacheData[key] = packageJson.dependencies[key];
      }
    }
    for(var i = 0; i < included.length; i++) {
      b.require(included[i]);
      cacheData[included[i]] = 'no idea ¯\\_(ツ)_/¯';
    }

    fs.readFile(cacheDest, 'utf8', function(err, previousCache) {
      if(!err && JSON.stringify(cacheData, null, '  ') === previousCache) {
        console.log('everything up to date');
        done();
        return;
      }

      b.on( 'bundle:done', function ( time ) {
        console.log(dest + ' written in ' + time + 'ms');
      } );

      b.on( 'error', function ( err ) {
        console.log( 'error', err );
      } );

      function doBundle(cb) {
        b.bundle( function ( err, buff ) {
          if ( err ) {
            throw err;
          }
          require( 'mkdirp' )(dest.substr(0, dest.lastIndexOf('/')), function(err) {
            if(err) {
              throw err;
            }
            fs.writeFileSync( dest, buff.toString() );
            fs.writeFileSync( cacheDest, JSON.stringify(cacheData, null, '  '));
            done();
          });
        });
      };

      doBundle();
    });
  });
};
