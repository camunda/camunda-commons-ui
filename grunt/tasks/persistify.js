var fs = require('fs');
var persistify = require('persistify');

module.exports = function(grunt) {
  'use strict';
  grunt.registerMultiTask('persistify', function() {

    var done = this.async();

    var externalModules = JSON.parse(fs.readFileSync(__dirname + '/../../cache/deps.json', 'utf8'));

    var firstRun = true;
    var dest = this.data.dest;
    var opts = this.data.options;

    this.data.options.neverCache = [
      /\.html$/,
      /\.json$/
    ];

    this.data.options.recreate = !process.env.FAST_BUILD;

    // backwards compatibility with grunt-browserify
    if(this.data.options.transform) {
      this.data.options.browserifyOptions.transform = this.data.options.transform;
    }

    var b = persistify( this.data.options.browserifyOptions, this.data.options );

    for(var key in externalModules) {
      b.external(key);
    }

    b.add( this.data.src );

    b.on( 'bundle:done', function ( time ) {
      console.log(dest + ' written in ' + time + 'ms');
    } );

    b.on( 'error', function ( err ) {
      console.log( 'error', err );
    } );

    function bundleComplete(err, buff) {
        if ( err ) {
          throw err;
        }
        require( 'mkdirp' )(dest.substr(0, dest.lastIndexOf('/')), function(err) {
          if(err) {
            throw err;
          }
          fs.writeFileSync( dest, buff.toString() );
          if(firstRun) {
            firstRun = false;
            done();
          }
        });
    }

    function doBundle() {
      b.bundle( function ( err, buff ) {
        if (opts.postBundleCB) {
          opts.postBundleCB(err, buff, bundleComplete);
        }
        else {
          bundleComplete(err, buff);
        }
      });
    };

    b.on( 'update', function () {
      console.log('change detected, updating ' + dest);
      doBundle();
    });

    doBundle();

  });
};
