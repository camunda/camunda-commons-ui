'use strict';

module.exports = function (grunt) {
  grunt.registerTask('gh-pages', function () {
    var amdConf = grunt.config.data.commonsConf();


    grunt.file.delete('gh-pages');

    grunt.file.copy('lib/widgets/index.js', 'gh-pages/index.js');

    var sources = grunt.file.expand([
      'lib/widgets/*/test/*.spec.html'
    ]);

    var destinations = sources.map(function (filepath) {
      var destination = filepath.slice(filepath.lastIndexOf('/test/') + '/test/'.length)
                        .split('.spec').shift();
      return destination;
    });

    var menuTemplate = require('lodash').template([
      '<nav>',
        '<h4>Widgets</h4>',
        '<ul>',
        '<% destinations.forEach(function (destination, i) { %><li',
          '<% if (destination === current) { %> class="active"<% } %>',
          '>',
          '<a href="/<%- destination %>.html">',
            '<%- destination.replace("cam-widget-", "") %>',
          '</a>',
        '</li><% }); %>',
        '</ul>',
      '</nav>'
    ].join(''));

    function ghPagesMenu(current) {
      return menuTemplate({
        destinations: destinations,
        current: current
      });
    }

    var footerTemplate = require('lodash').template([
      '<nav>',
        '<ul class="list-inline">',
          '<li><a href="//camunda.org">Camunda BPM</a></li>',
          '<li><a href="//github.com/camunda/camunda-commons-ui">commons UI lib</a></li>',
        '</ul>',
      '</nav>'
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




    grunt.file.expand([
      'node_modules/bootstrap/fonts/*'
    ]).forEach(function (filepath) {
      grunt.file.copy(filepath, 'gh-pages/' + filepath);
    });

    grunt.file.expand([
      'vendor/fonts/*'
    ]).forEach(function (filepath) {
      grunt.file.copy(filepath, 'gh-pages/' + filepath.replace('vendor/', ''));
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
  });
};
