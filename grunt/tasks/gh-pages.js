'use strict';

module.exports = function (grunt) {
  var path = require('path');
  var projectRoot = path.resolve(__dirname, '../../');

  var marked = require('marked');
  var amdConf = grunt.config.data.commonsConf();
  var pkg = grunt.file.readJSON(projectRoot +'/package.json');

  function cloneGhPages(done) {
    if (grunt.file.isDir('gh-pages')) {
      grunt.file.delete('gh-pages');
    }

    grunt.util.spawn({
      cmd: 'git',
      args: [
        'clone',
        pkg.repository.url,
        projectRoot + '/gh-pages'
      ]
    }, function (err) {
      if (err) { return done(err); }

      grunt.util.spawn({
        cwd: projectRoot + '/gh-pages',
        cmd: 'git',
        args: [
          'checkout',
          'gh-pages'
        ]
      }, function (err) {
        if (err) { return done(err); }

        grunt.log.writeln('repository checked out on "gh-pages" branch');
        done();

        // grunt.util.spawn({
        //   cwd: projectRoot + '/gh-pages',
        //   cmd: 'git',
        //   args: [
        //     'rm',
        //     '-rf',
        //     '.'
        //   ]
        // }, function (err) {
        //   if (err) { return done(err); }

        //   grunt.log.writeln('repository checked out on "gh-pages" branch');
        //   done();
        // });
      });
    });
  }

  function pushGhPages(done) {
    grunt.util.spawn({
        cwd: projectRoot + '/gh-pages',
        cmd: 'git',
        args: [
          'add',
          '--all',
          '.'
        ]
    }, function (err) {
      if (err) { return done(err); }
      grunt.verbose.writeln('added changed files');

      grunt.util.spawn({
          cwd: projectRoot + '/gh-pages',
          cmd: 'git',
          args: [
            'commit',
            '-m',
            '"gh-pages update"'
          ]
      }, function (err) {
        if (err) { return done(err); }
        grunt.verbose.writeln('commited changed files');

        grunt.util.spawn({
            cwd: projectRoot + '/gh-pages',
            cmd: 'git',
            args: [
              'push',
              '--force',
              'origin',
              'gh-pages'
            ]
        }, function (err) {
          if (err) { return done(err); }
          grunt.log.writeln('pushed to gh-pages branch');

          grunt.file.delete('gh-pages');
          done();
        });
      });
    });
  }

  grunt.registerTask('gh-pages', function () {
    var done = this.async();

    cloneGhPages(function (err) {
      if (err) { return done(err); }



      var sources = grunt.file.expand([
        'lib/widgets/*/test/*.spec.html'
      ]);

      var destinations = sources.map(function (filepath) {
        var destination = filepath.slice(filepath.lastIndexOf('/test/') + '/test/'.length)
                          .split('.spec').shift();
        return destination;
      });

      var menuTemplate = require('lodash').template([
        '<header><h1><a href="/">Camunda commons UI</a><small><%- version %></small></h1></header>',
        '<div class="page-wrapper">',
        '<nav>',
          '<h4>Widgets</h4>',
          '<ul class="list-inline">',
          '<% destinations.forEach(function (destination, i) { %><li',
            '<% if (destination === current) { %> class="active"<% } %>',
            '>',
            '<a href="/<%- destination %>.html">',
              '<%- destination.replace("cam-widget-", "") %>',
            '</a>',
          '</li><% }); %>',
          '</ul>',,
        '</nav>'
      ].join(''));

      function ghPagesMenu(current) {
        return menuTemplate({
          version: pkg.version,
          destinations: destinations,
          current: current
        });
      }

      var footerTemplate = require('lodash').template([
        '</div>',
        '<footer><nav>',
          '<ul class="list-inline">',
            '<li><a href="//camunda.org">Camunda BPM</a></li>',
            '<li><a href="//github.com/camunda/camunda-commons-ui">commons UI lib</a></li>',
          '</ul>',
        '</nav></footer>'
      ].join(''));

      sources.forEach(function (source, i) {
        grunt.file.copy(source, 'gh-pages/' + destinations[i] + '.html', {
          process: function (content) {
            return content
                    .replace('<!-- gh-pages-menu -->', ghPagesMenu(destinations[i]))
                    .replace('<!-- gh-pages-footer -->', footerTemplate())
                    .replace('<body class="', '<body class="gh-pages ')
                    .replace('<body>', '<body class="gh-pages">')
                    ;
          }
        });
      });


      var readme = marked(grunt.file.read(projectRoot + '/README.md').toString());
      readme = readme.replace(/<h1 id="camunda-commons-ui.*<\/h1>/, '');
      grunt.file.write('gh-pages/index.html', [
        '<html>',
          '<head>',
            '<title>Camunda commons UI library</title>',
            '<link type="text/css" rel="stylesheet" href="/styles.css" />',
            '<link type="text/css" rel="stylesheet" href="/test-styles.css" />',
          '</head>',
          '<body class="gh-pages readme">',
            ghPagesMenu(),
            '<section>',
              '<div class="content">'+ readme +'</div>',
            '</section>',
            footerTemplate(),
          '</body>',
        '</html>'
      ].join(''));



      grunt.file.expand([
        'resources/img/*',

        'node_modules/bpmn-font/dist/font/*',
        'node_modules/bootstrap/fonts/*',
        'vendor/fonts/*'
      ]).forEach(function (filepath) {
        grunt.file.copy(filepath, 'gh-pages/' + filepath);
      });




      var paths = {};
      Object.keys(amdConf.paths).forEach(function (lib) {
        var libPath = amdConf.paths[lib];
        paths[lib] = libPath.replace(/lib\/widgets\//, '');
        grunt.file.expand([
          amdConf.paths[lib].slice(1) +'{*,/**/*}'
        ]).forEach(function (filepath) {
          if (!grunt.file.isFile(filepath)) { return; }
          grunt.file.copy(filepath, 'gh-pages/' + filepath);
        });
      });
      amdConf.paths = paths;
      grunt.file.write('gh-pages/test-conf.json', JSON.stringify(amdConf, null, 2));




      grunt.file.copy('styles.css', 'gh-pages/styles.css');
      grunt.file.copy('test-styles.css', 'gh-pages/test-styles.css');
      grunt.file.copy('lib/widgets/index.js', 'gh-pages/index.js');


      pushGhPages(done);
    });
  });
};
