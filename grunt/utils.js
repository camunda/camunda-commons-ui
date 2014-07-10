var utils = module.exports = {};

utils.copy = {};


utils.copy.removeAtDist = function(mode) {
  mode = mode || 'dist';
  var removeAtDistExp = /<!-- #production-remove.*\/production-remove -->/igm;

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


utils.copy.cacheBusting = function(mode) {
  mode = mode || 'dist';

  return function(content, srcpath) {
    var date = new Date();
    var cacheBuster = mode === 'dist' ?
                      [date.getFullYear(), date.getMonth(), date.getDate()].join('-') :
                      (new Date()).getTime();

    content = content
              .replace(/\/\* cache-busting /, '/* cache-busting */')
              .replace(/CACHE_BUSTER/g, requireConfExp.test(srcpath) ? '\''+ cacheBuster +'\'' : cacheBuster);

    return content;
  };
};


utils.copy.templateComments = function(mode) {
  mode = mode || 'dist';
  var commentLineExp =  /^[\s]*<!-- (\/|#) (CE|EE)/;

  return function(content, srcpath) {
    if (mode !== 'dist' || srcpath.slice(-4) !== 'html') {
      return content;
    }

    content = content
          .split('\n').filter(function(line) {
            return !commentLineExp.test(line);
          }).join('\n');

    return content;
  };
};
