define([
  'angular',
  'angular-ui',
  './email',
  './engineSelect',
  './autoFill',
  './inPlaceTextField',
  './notificationsPanel',
  './password',
  './requestAware',
  './showIfAuthorized',
  '../util/index'
], function(
  angular,
  angularUi,
  email,
  autoFill,
  engineSelect,
  inPlaceTextField,
  notificationsPanel,
  password,
  requestAware,
  showIfAuthorized,
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
  directivesModule.directive('inPlaceTextField',    inPlaceTextField);
  directivesModule.directive('notificationsPanel',  notificationsPanel);
  directivesModule.directive('password',            password);
  directivesModule.directive('showIfAuthorized',    showIfAuthorized);


  directivesModule.config([
          '$modalProvider', '$tooltipProvider',
  function($modalProvider,   $tooltipProvider) {
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
