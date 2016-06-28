  'use strict';
  module.exports = ['$resource', 'Uri',
  function($resource,   Uri) {

    return $resource(Uri.appUri('engine://engine/:engine/authorization/:action'), { action: '@action' }, {
      check : {method:'GET', params: { 'action' : 'check'},  cache : true},
      count : {method:'GET', params: { 'action' : 'count'}},
      create : {method:'POST', params: { 'action' : 'create'}}
    });

  }];
