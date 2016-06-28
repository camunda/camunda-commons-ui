'use strict';

var chai = require('chai'),
    angular = require('camunda-bpm-sdk-js/vendor/angular'),
    ngRoute = require('angular-route'),
    authModule = require('../index');

var expect = chai.expect;

describe('camunda-commons-ui/auth/directives', function() {

  beforeEach(window.module(authModule.name));


  describe('<cam-if-logged-in>', function() {

    var doc, element;

    beforeEach(inject(function($httpBackend, $rootScope, $compile) {
      doc = $('<div><div cam-if-logged-in>logged-in</div></div>').appendTo('body');
      element = doc.find('> div');
    }));

    afterEach(function() {
      doc.remove();
    });


    it('should show on logged in', inject(function($rootScope, $compile) {
        // given
      $rootScope.authentication = { name: 'klaus' };

        // when
      element = $compile(element)($rootScope);
      $rootScope.$digest();

        // then
      expect(doc.text()).to.equal('logged-in');
    }));


    it('should hide on logged out', inject(function($rootScope, $compile) {
        // given
      $rootScope.authentication = null;

        // when
      element = $compile(element)($rootScope);
      $rootScope.$digest();

        // then
      expect(doc.text()).to.equal('');
    }));


    it('should update on <authentication.changed>', inject(function($rootScope, $compile) {
        // given
      $rootScope.authentication = null;

      element = $compile(element)($rootScope);
      $rootScope.$digest();

        // when
      $rootScope.$broadcast('authentication.changed', { name: 'klaus' });
      $rootScope.$digest();

        // then
      expect(doc.text()).to.equal('logged-in');
    }));

  });


  describe('<cam-if-logged-out>', function() {

    var doc, element;

    beforeEach(inject(function($httpBackend, $rootScope, $compile) {
      doc = $('<div><div cam-if-logged-out>logged-out</div></div>').appendTo('body');
      element = doc.find('> div');
    }));

    afterEach(function() {
      doc.remove();
    });


    it('should hide on logged in', inject(function($rootScope, $compile) {
        // given
      $rootScope.authentication = { name: 'klaus' };

        // when
      element = $compile(element)($rootScope);
      $rootScope.$digest();

        // then
      expect(doc.text()).to.equal('');
    }));


    it('should show on logged out', inject(function($rootScope, $compile) {
        // given
      $rootScope.authentication = null;

        // when
      element = $compile(element)($rootScope);
      $rootScope.$digest();

        // then
      expect(doc.text()).to.equal('logged-out');
    }));


    it('should update on <authentication.changed>', inject(function($rootScope, $compile) {
        // given
      $rootScope.authentication = null;

      element = $compile(element)($rootScope);
      $rootScope.$digest();

        // when
      $rootScope.$broadcast('authentication.changed', { name: 'klaus' });
      $rootScope.$digest();

        // then
      expect(doc.text()).to.equal('');
    }));

  });

});
