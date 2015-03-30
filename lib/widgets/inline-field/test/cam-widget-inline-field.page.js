/* jshint node: true, unused: false */
/* global __dirname: false, describe: false, before: false, it: false, browser: false,
          element: false, expect: false, by: false, protractor: false */
'use strict';

var Field = require('./cam-widget-inline-field-object.page.js');

function Page() { }

Page.prototype.field = function(identifier) {
  return new Field(element(by.id(identifier)));
};

Page.prototype.body = function() {
  return element(by.tagName('body'));
};


module.exports = new Page();
