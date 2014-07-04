var utils = module.exports = {};

utils.copy = {};

var removeAtDistExp = /<!-- #production-remove.*\/production-remove -->/igm;
utils.copy.removeAtDist = function(mode) {
  mode = mode || 'dist';
  return function(content, srcpath) {
    if (mode !== 'dist') { return content; }

    return content.replace(removeAtDistExp, '');
  };
}

utils.copy.livereloadPort = function(mode) {
  mode = mode || 'dist';
  return function(content, srcpath) {
    if (mode === 'dist') { return content; }

    return content.replace('LIVERELOAD_PORT', config.livereloadPort);
  };
};
