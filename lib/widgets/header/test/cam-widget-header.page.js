/* jshint node: true, unused: false */
/* global __dirname: false, describe: false, before: false, it: false, browser: false,
          element: false, expect: false, by: false, protractor: false */
'use strict';

function Header(node) {
  this.node = node;
}

Header.prototype.transcludedElement = function() {
  return this.node.element(by.css('[ng-transclude]'));
};
Header.prototype.transcludedText = function() {
  return this.transcludedElement().getText();
};
Header.prototype.account = function() {
  return this.node.element(by.css('.cam-nav .account'));
};
Header.prototype.accountText = function() {
  return this.node.element(by.css('.cam-nav .account > a')).getText();
};
Header.prototype.adminLink = function() {
  return this.node.element(by.css('.cam-nav .app-switch .admin'));
};
Header.prototype.cockpitLink = function() {
  return this.node.element(by.css('.cam-nav .app-switch .cockpit'));
};
Header.prototype.tasklistLink = function() {
  return this.node.element(by.css('.cam-nav .app-switch .tasklist'));
};
Header.prototype.hamburgerButton = function() {
  return this.node.element(by.css('.navbar-toggle'));
};

function Page() { }

Page.prototype.header = function(identifier) {
  return new Header(element(by.css(identifier)));
};


module.exports = new Page();
