define([
  'angular',
  './inline-field/cam-widget-inline-field',
  './search-pill/search-pill',
  './search-pill/cam-query-component',
  './header/cam-widget-header',
  './footer/cam-widget-footer',
  '../filter/date/index',
  '../directives/index',
  'angular-bootstrap'
], function(
  angular,
  inlineField,
  searchPill,
  camQueryComponent,
  header,
  footer,
  filtersModule,
  directivesModule
  ) {
  'use strict';

  var widgetModule = angular.module('camunda.common.widgets', [filtersModule.name, directivesModule.name, 'ui.bootstrap']);

  widgetModule.directive('camWidgetInlineField', inlineField);
  widgetModule.directive('camWidgetSearchPill', searchPill);
  widgetModule.directive('camWidgetHeader', header);
  widgetModule.directive('camWidgetFooter', footer);
  widgetModule.filter('camQueryComponent', camQueryComponent);

  return widgetModule;
});
