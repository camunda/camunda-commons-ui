/* global define: false, require: false */
define([
  'angular',
  'angular-ui',
  'camunda-commons-ui/directives/email',
  'camunda-commons-ui/directives/engineSelect',
  'camunda-commons-ui/directives/if',
  'camunda-commons-ui/directives/ifLoggedIn',
  'camunda-commons-ui/directives/ifLoggedOut',
  'camunda-commons-ui/directives/inPlaceTextField',
  'camunda-commons-ui/directives/notificationsPanel',
  'camunda-commons-ui/directives/password',
  'camunda-commons-ui/directives/requestAware',
  'camunda-commons-ui/directives/showIfAuthorized'
], function(angular) {
  'use strict';

  var directivesModule = angular.module('camunda.common.directives', ['ui.bootstrap']);


  directivesModule.directive('email',               require('camunda-commons-ui/directives/email'));
  directivesModule.directive('engineSelect',        require('camunda-commons-ui/directives/engineSelect'));
  directivesModule.directive('if',                  require('camunda-commons-ui/directives/if'));
  directivesModule.directive('ifLoggedIn',          require('camunda-commons-ui/directives/ifLoggedIn'));
  directivesModule.directive('ifLoggedOut',         require('camunda-commons-ui/directives/ifLoggedOut'));
  directivesModule.directive('inPlaceTextField',    require('camunda-commons-ui/directives/inPlaceTextField'));
  // directivesModule.directive('notificationsPanel',  require('camunda-commons-ui/directives/notificationsPanel'));
  directivesModule.directive('password',            require('camunda-commons-ui/directives/password'));
  directivesModule.directive('showIfAuthorized',    require('camunda-commons-ui/directives/showIfAuthorized'));


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
