'use strict';

var expect = require('chai').expect;
var escape = require('../escape');
var unescape = require('../unescape');

describe('unescape', function() {
  it('should reverse escape', function() {
    var input = 'a%s/^$@\\d*';

    expect(unescape()(escape()(input))).to.eql(input);
  });
});
