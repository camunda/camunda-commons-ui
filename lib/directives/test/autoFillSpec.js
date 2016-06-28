'use strict';

var chai = require('chai'),
    directivesModule = require('../index');

var expect = chai.expect;

describe('camunda-commons-ui/directives/autoFill', function() {

  beforeEach(window.module(directivesModule.name));


  describe('bootstrap', function() {

    it('should bootstrap with module', inject(function($compile, $rootScope, $interval) {

      var element = $compile('<input ng-model="foo" auto-fill>')($rootScope);
      $rootScope.$digest();

      element.val('FOO');

      $interval.flush(500);
      $rootScope.$digest();

      expect($rootScope.foo).to.equal('FOO');
    }));

  });

});
