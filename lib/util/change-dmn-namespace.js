'use strict';

var OLD_NAMESPACES = [
  'http://www.omg.org/spec/DMN/20151101/dmn11.xsd'
];
var NEW_NAMESPACE = 'http://www.omg.org/spec/DMN/20151101/dmn.xsd';

module.exports = function(xml) {
  return OLD_NAMESPACES.reduce(replaceNamespace, xml);
};

function replaceNamespace(xml, namespace) {
  return xml.replace('xmlns="' + namespace + '"', 'xmlns="' + NEW_NAMESPACE + '"');
}
