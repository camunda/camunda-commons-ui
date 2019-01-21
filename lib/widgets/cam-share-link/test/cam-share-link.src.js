'use strict';

var angular = require('camunda-bpm-sdk-js/vendor/angular');
var camShareLink = require('../cam-share-link');
var clipboardDefinition = require('../../clipboard/cam-widget-clipboard');

require('../../../../vendor/ui-bootstrap-tpls-2.5.0-camunda');
require('angular-translate');


var shareModule = angular.module('shareModule', [
  'ui.bootstrap'
]);

shareModule.directive('camShareLink', camShareLink);
shareModule.directive('camWidgetClipboard', clipboardDefinition);

angular.element(document).ready(function() {
  angular.bootstrap(document.body, [shareModule.name, 'pascalprecht.translate']);
});
