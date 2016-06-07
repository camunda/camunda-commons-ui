/* jshint node: true, unused: false */
/* global __dirname: false, describe: false, before: false, it: false, browser: false,
          element: false, expect: false, by: false, protractor: false */
'use strict';

function Variable(node) {
  this.node = node;
}

function Page() { }

Page.prototype.variable = function() {
  var varSelector = '[cam-widget-clipboard]';
  return new Variable(element.all(by.css(varSelector)));
};

module.exports = new Page();

module.exports.Variable = Variable;
