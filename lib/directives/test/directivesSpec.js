define([ 'chai', 'lib/directives/index' ], function(chai, directivesModule) {
  'use strict';

  /* global module:false */

  var expect = chai.expect;

  return describe('camunda-commons-ui/directives', function() {

    beforeEach(module(directivesModule.name));


    describe('bootstrap', function() {

      it('should bootstrap with module', function() { });

    });

  });

});