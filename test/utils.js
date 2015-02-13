'use strict';
var utils = module.exports = {};

function once(func) {
  var ran = false;
  var memo;
  return function () {
    if (ran) {
      return memo;
    }
    ran = true;
    memo = func.apply(this, arguments);
    func = null;
    return memo;
  };
}

utils.once = once;
