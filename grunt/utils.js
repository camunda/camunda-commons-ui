var utils = module.exports = {};

utils.copy = {};

var removeAtDistExp = /<!-- #production-remove.*\/production-remove -->/igm;
utils.copy.removeAtDist = function(mode) {
  mode = mode || 'dist';
  return function(content, srcpath) {
    return content;
  };
}

utils.copy.livereloadPort = function(mode) {
  mode = mode || 'dist';
  return function(content, srcpath) {
    return content;
  };
};
