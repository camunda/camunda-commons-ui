'use strict';

var Viewer = require('../../bpmn-js');


var viewers = {};

module.exports = {
  generateViewer: generateViewer,
  cacheViewer: cacheViewer
};

function generateViewer(options) {

  // get cached viewer if it exists
  var cachedViewer = options.key && viewers[options.key];
  if(cachedViewer) {
    cachedViewer.cached = true;
    return cachedViewer;
  }

  // return a new bpmn viewer
  var BpmnViewer = Viewer;
  if(options.disableNavigation) {
    BpmnViewer = Object.getPrototypeOf(Viewer.prototype).constructor;
  }
  return new BpmnViewer(options);
}

function cacheViewer(options) {
  return options.key && (viewers[options.key] = options.viewer);
}

