'use strict';

var angular = require('camunda-bpm-sdk-js/vendor/angular'),
    footerDefinition = require('../cam-widget-footer');

var footerModule = angular.module('footerModule', []);

require('angular-translate');

footerModule.directive('camWidgetFooter', footerDefinition);

angular.bootstrap(document.body, [footerModule.name, 'pascalprecht.translate']);
