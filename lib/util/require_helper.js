require('moment');

module.exports = function loadPackage(packageName) {
  return require(packageName);
};
