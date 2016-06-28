'use strict';

var angular = require('camunda-bpm-sdk-js/vendor/angular'),
    camCommonsUi = require('../../index');

var testModule = angular.module('myModule', [camCommonsUi.name]);

testModule.controller('testController', ['$scope', function($scope) {
  $scope.searches = [];
  $scope.validSearches = [];
  $scope.searches2 = [];
  $scope.validSearches2 = [];
  $scope.translations = {
    'inputPlaceholder': 'Search for Anything',
    'invalid': 'This search query is not valid',
    'deleteSearch': 'Remove search',
    'type': 'Type',
    'name': 'Property',
    'operator': 'Operator',
    'value': 'Value'
  };
  $scope.types = [
    {
      'id': {
        'key': 'PredefinedOperators',
        'value': 'Predefined Operators'
      },
      'operators': [
        {'key': 'eq',  'value': '='},
        {'key': 'lt',  'value': '<'},
        {'key': 'like','value': 'like'}
      ],
      default: true
    },
    {
      'id': {
        'key': 'EnforceDate',
        'value': 'Enforce Date'
      },
      'operators': [
        {'key': 'eq', 'value': '='}
      ],
      allowDates: true,
      enforceDates: true
    },
    {
      'id': {
        'key': 'variableOperator',
        'value': 'Variable Operator'
      },
      allowDates: true,
      extended: true,
      potentialNames: [
        {key:'key1', value:'Label (key1)'},
        {key:'key2', value:'Label2 (key2)'}
      ]
    },
    {
      'id': {
        'key': 'basicQuery',
        'value': 'Basic Query'
      },
      basic: true
    }
  ];
  $scope.types2 = [
    {
      'id': {
        'key': 'A',
        'value': 'A'
      },
      'groups': ['A']
    },
    {
      'id': {
        'key': 'B',
        'value': 'B'
      },
      'groups': ['B']
    },
    {
      'id': {
        'key': 'C',
        'value': 'C'
      }
    }
  ];
  $scope.operators =  {
    'undefined': [
      {'key': 'eq', 'value': '='},
      {'key': 'neq','value': '!='}
    ],
    'string': [
      {'key': 'eq',  'value': '='},
      {'key': 'like','value': 'like'}
    ],
    'number': [
      {'key': 'eq', 'value': '='},
      {'key': 'neq','value': '!='},
      {'key': 'gt', 'value': '>'},
      {'key': 'lt', 'value': '<'}
    ],
    'boolean': [
      {'key': 'eq', 'value': '='}
    ],
    'object': [
      {'key': 'eq', 'value': '='}
    ],
    'date': [
      {'key': 'Before', 'value': 'before'},
      {'key': 'After',  'value': 'after'}
    ]
  };
}]);

angular.element(document).ready(function() {
  angular.bootstrap(document.body, [testModule.name]);
});
