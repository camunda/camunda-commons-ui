define([
  'angular',
  './inline-field/cam-widget-inline-field',
  './search-pill/search-pill',
  './search-pill/cam-query-component',
  './header/cam-widget-header',
  './footer/cam-widget-footer',
  './loader/cam-widget-loader',
  './search/cam-widget-search',
  '../filter/date/index',
  '../directives/index',
  '../search/index',
  'angular-bootstrap'
], function(
  angular,
  inlineField,
  searchPill,
  camQueryComponent,
  header,
  footer,
  loader,
  search,
  filtersModule,
  directivesModule,
  searchModule
  ) {
  'use strict';

  var widgetModule = angular.module('camunda.common.widgets', [filtersModule.name, directivesModule.name, searchModule.name, 'ui.bootstrap']);

  widgetModule.directive('camWidgetInlineField', inlineField);
  widgetModule.directive('camWidgetSearchPill', searchPill);
  widgetModule.directive('camWidgetHeader', header);
  widgetModule.directive('camWidgetFooter', footer);
  widgetModule.directive('camWidgetLoader', loader);
  widgetModule.directive('camWidgetSearch', search);

  widgetModule.filter('camQueryComponent', camQueryComponent);

  return widgetModule;
});
