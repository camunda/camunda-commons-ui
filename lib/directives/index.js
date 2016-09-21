'use strict';

var angular = require('camunda-bpm-sdk-js/vendor/angular'),
    email = require('./email'),
    engineSelect = require('./engineSelect'),
    autoFill = require('./autoFill'),
    inPlaceTextField = require('./inPlaceTextField'),
    notificationsPanel = require('./notificationsPanel'),
    passwordRepeat = require('./passwordRepeat'),
    showIfAuthorized = require('./showIfAuthorized'),
    compileTemplate = require('./compileTemplate'),
    nl2br = require('./nl2br'),
    instantTypeahead = require('./instantTypeahead'),
    util = require('../util/index');

require('../../vendor/ui-bootstrap-tpls-0.11.2-camunda');


var directivesModule = angular.module('camunda.common.directives', [
  'ui.bootstrap',
  util.name
]);

directivesModule.directive('email',               email);
directivesModule.directive('autoFill',            autoFill);
directivesModule.directive('engineSelect',        engineSelect);
directivesModule.directive('camInPlaceTextField', inPlaceTextField);
directivesModule.directive('notificationsPanel',  notificationsPanel);
directivesModule.directive('passwordRepeat',      passwordRepeat);
directivesModule.directive('showIfAuthorized',    showIfAuthorized);
directivesModule.directive('compileTemplate',     compileTemplate);
directivesModule.directive('nl2br',               nl2br);
directivesModule.directive('instantTypeahead',    instantTypeahead);

directivesModule.config([
  '$modalProvider',
  '$tooltipProvider',
  function(
  $modalProvider,
  $tooltipProvider
) {
    $modalProvider.options = {
      backdrop:     true, //can be also false or 'static'
      keyboard:     true
    };

    $tooltipProvider.options({
      animation:    true,
      popupDelay:   100,
      appendToBody: true
    });
  }]);


module.exports = directivesModule;
