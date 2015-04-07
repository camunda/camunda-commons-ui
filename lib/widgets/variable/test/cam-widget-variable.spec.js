/* jshint node: true, unused: false */
/* global __dirname: false, describe: false, before: false, it: false, browser: false,
          element: false, expect: false, by: false, protractor: false, xit: false,
          xdescribe: false */
'use strict';
var path = require('path');
var projectRoot = path.resolve(__dirname, '../../../../');
var pkg = require(path.join(projectRoot, 'package.json'));
var pageUrl = 'http://localhost:' + pkg.gruntConfig.connectPort +
              '/lib/widgets/variable/test/cam-widget-variable.spec.html';

var page = require('./cam-widget-variable.page.js');

describe('Variable', function() {
  var variable;
  describe('editing', function() {
    before(function () {
      browser.get(pageUrl + '#example-1');
    });

    describe('when empty', function () {
      before(function () {
        variable = page.variable('#example-1', 0);
      });

      it('has a dropdown', function () {
        expect(variable.typeDropdownText()).to.eventually.eql('Type');
      });

      it('has a name input', function () {
        expect(variable.nameValue()).to.eventually.eql('');
      });

      it('has a value input', function () {
        expect(variable.valueValue()).to.eventually.eql('');
      });

      it('is not valid', function () {
        expect(variable.editingGroupClass())
            .to.eventually.match(/invalid/);
      });
    });



    describe('validation', function () {
      before(function () {
        // the integer variable
        variable = page.variable('#example-1', 5);
      });



      it('adds the invalid CSS class when value is not of the correct type', function () {
        variable.value().sendKeys('leet').then(function () {
          expect(variable.editingGroupClass())
            .to.eventually.match(/invalid/);
        });
      });

      it('removes the invalid CSS class when is of the correct type', function () {
        variable.value().clear().sendKeys('1337');
        expect(variable.editingGroupClass())
          .not.to.eventually.match(/invalid/);
      });



      it('adds the invalid CSS class when no name is given', function () {
        variable.name().clear();

        expect(variable.nameValue()).to.eventually.eql('');

        expect(variable.editingGroupClass())
          .to.eventually.match(/invalid/);
      });

      it('removes the invalid CSS class when a name is given', function () {
        variable.name().sendKeys('integerVar');

        expect(variable.nameValue()).to.eventually.eql('integerVar');

        expect(variable.editingGroupClass())
          .not.to.eventually.match(/invalid/);
      });
    });


    describe('"null" support', function () {
      before(function () {
        // the empty variable
        variable = page.variable('#example-1', 0);

        variable.typeSelect('String');
        variable.name().sendKeys('aName');
        variable.value().sendKeys('a value');
      });

      it('allows to set a variable value to "null"', function () {
        expect(variable.setNullBtn().isPresent())
          .to.eventually.eql(true);
        expect(variable.setNonNullBtn().isPresent())
          .to.eventually.eql(false);
      });

      it('allows to revert a variable value to its previous value', function () {
        variable.setNullBtn().click();

        expect(variable.setNullBtn().isPresent())
          .to.eventually.eql(false);
        expect(variable.setNonNullBtn().isPresent())
          .to.eventually.eql(true);

        variable.setNonNullBtn().click();
        expect(variable.valueValue()).to.eventually.eql('a value');
      });
    });


    describe('Boolean variable', function () {
      var variable2;
      before(function () {
        variable = page.variable('#example-1', 1);
      });

      it('has a dropdown', function () {
        expect(variable.typeDropdownText()).to.eventually.eql('Boolean');
      });

      it('has a name input', function () {
        expect(variable.nameValue()).to.eventually.eql('booleanVar');
      });

      describe('value input', function () {
        it('is a checkbox input', function () {
          expect(variable.valueValue()).to.eventually.eql('on');
          expect(variable.valueType()).to.eventually.eql('checkbox');
        });
      });
    });



    xdescribe('Bytes variable', function () {
      before(function () {
        variable = page.variable('#example-1', 2);
      });

      it('has a dropdown', function () {
        expect(variable.typeDropdownText()).to.eventually.eql('Bytes');
      });

      it('has a name input', function () {
        expect(variable.nameValue()).to.eventually.eql('bytesVar');
      });


      xdescribe('value input', function () {
        it('is disabled', function () {
          expect(variable.value().getAttribute('disabled')).to.eventually.eql('disabled');
        });

        it('shows the object type', function () {
          expect(variable.valueValue()).to.eventually.eql('');
        });
      });
    });



    xdescribe('Date variable', function () {
      before(function () {
        variable = page.variable('#example-1', 3);
      });

      it('has a dropdown', function () {
        expect(variable.typeDropdownText()).to.eventually.eql('Date');
      });

      it('has a name input', function () {
        expect(variable.nameValue()).to.eventually.eql('dateVar');
      });

      it('has a value input', function () {
        expect(variable.valueValue()).to.eventually.eql('2015-03-23T13:14:06.340Z');
      });

      describe('value input', function () {
        it('has a datepicker button', function () {
          expect(variable.value().element(by.css('.btn')).isPresent()).to.eventually.eql(true);
        });
      });
    });



    describe('Double variable', function () {
      before(function () {
        variable = page.variable('#example-1', 4);
      });

      it('has a dropdown', function () {
        expect(variable.typeDropdownText()).to.eventually.eql('Double');
      });

      it('has a name input', function () {
        expect(variable.nameValue()).to.eventually.eql('doubleVar');
      });

      it('has a value input', function () {
        expect(variable.valueValue()).to.eventually.eql('12.34');
      });
    });



    describe('Integer variable', function () {
      before(function () {
        variable = page.variable('#example-1', 5);
      });

      it('has a dropdown', function () {
        expect(variable.typeDropdownText()).to.eventually.eql('Integer');
      });

      it('has a name input', function () {
        expect(variable.nameValue()).to.eventually.eql('integerVar');
      });

      it('has a value input', function () {
        expect(variable.valueValue()).to.eventually.eql('1337');
      });
    });



    describe('Long variable', function () {
      before(function () {
        variable = page.variable('#example-1', 6);
      });

      it('has a dropdown', function () {
        expect(variable.typeDropdownText()).to.eventually.eql('Long');
      });

      it('has a name input', function () {
        expect(variable.nameValue()).to.eventually.eql('longVar');
      });

      it('has a value input', function () {
        expect(variable.valueValue()).to.eventually.eql('-100000000');
      });
    });



    describe('Null variable', function () {
      before(function () {
        variable = page.variable('#example-1', 7);
      });

      it('has a dropdown', function () {
        expect(variable.typeDropdownText()).to.eventually.eql('Null');
      });

      it('has a name input', function () {
        expect(variable.nameValue()).to.eventually.eql('nullVar');
      });

      xit('has a value input', function () {
        expect(variable.valueValue()).to.eventually.eql('null');
      });
    });



    xdescribe('Object variable', function () {
      before(function () {
        variable = page.variable('#example-1', 8);
      });

      it('has a dropdown', function () {
        expect(variable.typeDropdownText()).to.eventually.eql('Object');
      });

      it('has a name input', function () {
        expect(variable.nameValue()).to.eventually.eql('objectVar');
      });

      describe('value input', function () {
        it('has a button to open a dialog', function () {
          expect(variable.name().element(by.css('.btn')).isPresent()).to.eventually.eql(true);
        });
      });
    });



    describe('Short variable', function () {
      before(function () {
        variable = page.variable('#example-1', 9);
      });

      it('has a dropdown', function () {
        expect(variable.typeDropdownText()).to.eventually.eql('Short');
      });

      it('has a name input', function () {
        expect(variable.nameValue()).to.eventually.eql('shortVar');
      });

      it('has a value input', function () {
        expect(variable.valueValue()).to.eventually.eql('-32768');
      });
    });



    describe('String variable', function () {
      before(function () {
        variable = page.variable('#example-1', 10);
      });

      it('has a dropdown', function () {
        expect(variable.typeDropdownText()).to.eventually.eql('String');
      });

      it('has a name input', function () {
        expect(variable.nameValue()).to.eventually.eql('stringVar');
      });

      it('has a value input', function () {
        expect(variable.valueValue()).to.eventually.eql('Some string value');
      });

      it('is valid when empty', function () {
        // when
        variable.value().clear();

        // then
        expect(variable.editingGroupClass())
            .not.to.eventually.match(/invalid/);
      });
    });
  });


  xdescribe('display', function () {
    describe('when value is set', function () {
      before(function () {
        browser.get(pageUrl + '#example-2');
        variable = page.variable('#example-2', 1);
      });
    });
  });


  xdescribe('partially shown', function () {
    describe('when value is set', function () {
      before(function () {
        browser.get(pageUrl + '#example-3');
      });

      it('shows the name and value', function () {
        variable = page.variable('#example-3', 0);
        expect(variable.nameValue()).to.eventually.eql('stringVar');
        expect(variable.valueValue()).to.eventually.eql('Some string value');
      });

      it('shows the type and value', function () {
        variable = page.variable('#example-3', 1);
        expect(variable.typeDropdownText()).to.eventually.eql('String');
        expect(variable.valueValue()).to.eventually.eql('Some string value');
      });

      it('shows the type and name', function () {
        variable = page.variable('#example-3', 2);
        expect(variable.typeDropdownText()).to.eventually.eql('String');
        expect(variable.nameValue()).to.eventually.eql('stringVar');
      });
    });
  });
});
