'use strict';

var expect = require('chai').expect;
var changeDmnNamespace = require('../change-dmn-namespace');
var fs = require('fs');

var oldXML = fs.readFileSync(__dirname + '/old-dmn.dmn', 'utf8');
var currentXML = fs.readFileSync(__dirname + '/current-dmn.dmn', 'utf8');

describe('changeDmnNamespace', function() {
  it('should change dmn namespace in xml file', function() {
    var newXML = changeDmnNamespace(oldXML);
    var lines = newXML.split('\n');
    var expectedLine = '<definitions xmlns="http://www.omg.org/spec/DMN/20151101/dmn.xsd"' +
      ' id="definitions" name="camunda" namespace="http://camunda.org/schema/1.0/dmn">';

    expect(lines[1]).to.eql(expectedLine);
  });

  it('should not change random occurrence of old namespace in text', function() {
    var result = changeDmnNamespace('http://www.omg.org/spec/DMN/20151101/dmn11.xsd');

    expect(result).to.eql('http://www.omg.org/spec/DMN/20151101/dmn11.xsd');
  });

  it('should not change current dmn file', function() {
    var newXML = changeDmnNamespace(currentXML);

    expect(newXML).to.eql(currentXML);
  });
});
