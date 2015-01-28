define([
  'angular',
  './inline-field/cam-widget-inline-field',
  './search-pill/search-pill',
  './search-pill/cam-query-component'
], function(
  angular,
  inlineField,
  searchPill,
  camQueryComponent
  ) {
  'use strict';

  var widgetModule = angular.module('camunda.common.widgets', []);

  widgetModule.directive('camWidgetInlineField', inlineField);
  widgetModule.directive('camWidgetSearchPill', searchPill);
  widgetModule.filter('camQueryComponent', camQueryComponent);

  return widgetModule;
});
