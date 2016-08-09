'use strict';

var angular = require('camunda-bpm-sdk-js/vendor/angular'),
    inlineField = require('./inline-field/cam-widget-inline-field'),
    searchPill = require('./search-pill/cam-widget-search-pill'),
    camQueryComponent = require('./search-pill/cam-query-component'),
    header = require('./header/cam-widget-header'),
    footer = require('./footer/cam-widget-footer'),
    loader = require('./loader/cam-widget-loader'),
    debug = require('./debug/cam-widget-debug'),
    clipboard = require('./clipboard/cam-widget-clipboard'),
    variable = require('./variable/cam-widget-variable'),
    variablesTable = require('./variables-table/cam-widget-variables-table'),
    camRenderVarTemplate = require('./variables-table/cam-render-var-template'),
    search = require('./search/cam-widget-search'),
    bpmnViewer = require('./bpmn-viewer/cam-widget-bpmn-viewer'),
    cmmnViewer = require('./cmmn-viewer/cam-widget-cmmn-viewer'),
    dmnViewer = require('./dmn-viewer/cam-widget-dmn-viewer'),
    filtersModule = require('../filter/date/index'),
    directivesModule = require('../directives/index'),
    searchModule = require('../search/index'),
    variableValidator = require('./variable/cam-variable-validator');

require('../../vendor/ui-bootstrap-tpls-0.11.2-camunda');

var widgetModule = angular.module('camunda.common.widgets', [filtersModule.name, directivesModule.name, searchModule.name, 'ui.bootstrap']);

widgetModule.directive('camWidgetInlineField', inlineField);
widgetModule.directive('camWidgetSearchPill', searchPill);
widgetModule.directive('camWidgetHeader', header);
widgetModule.directive('camWidgetFooter', footer);
widgetModule.directive('camWidgetLoader', loader);
widgetModule.directive('camWidgetDebug', debug);
widgetModule.directive('camWidgetClipboard', clipboard);
widgetModule.directive('camWidgetVariable', variable);
widgetModule.directive('camWidgetVariablesTable', variablesTable);
widgetModule.directive('camRenderVarTemplate', camRenderVarTemplate);
widgetModule.directive('camWidgetSearch', search);
widgetModule.directive('camWidgetBpmnViewer', bpmnViewer);
widgetModule.directive('camWidgetCmmnViewer', cmmnViewer);
widgetModule.directive('camWidgetDmnViewer', dmnViewer);

widgetModule.directive('camVariableValidator', variableValidator);

widgetModule.filter('camQueryComponent', camQueryComponent);

module.exports = widgetModule;
