define([
  'angular',
  './email',
  './engineSelect',
  './autoFill',
  './inPlaceTextField',
  './notificationsPanel',
  './password',
  './passwordRepeat',
  './requestAware',
  './showIfAuthorized',
  './compileTemplate',
  './nl2br',
  './instantTypeahead',
  '../util/index',
  'angular-bootstrap'
], function(
  angular,
  email,
  engineSelect,
  autoFill,
  inPlaceTextField,
  notificationsPanel,
  password,
  passwordRepeat,
  requestAware,
  showIfAuthorized,
  compileTemplate,
  nl2br,
  instantTypeahead,
  util
) {
  'use strict';

  var directivesModule = angular.module('camunda.common.directives', [
    'ui.bootstrap',
    util.name
  ]);


  directivesModule.directive('email',               email);
  directivesModule.directive('autoFill',            autoFill);
  directivesModule.directive('engineSelect',        engineSelect);
  directivesModule.directive('camInPlaceTextField', inPlaceTextField);
  directivesModule.directive('notificationsPanel',  notificationsPanel);
  directivesModule.directive('password',            password);
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


  return directivesModule;
});
