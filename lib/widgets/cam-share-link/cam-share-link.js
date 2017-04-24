'use strict';

var fs = require('fs');

var template = fs.readFileSync(__dirname + '/cam-share-link.html', 'utf8');

module.exports = ['$location', function($location) {
  return {
    restrict: 'A',
    template: template,
    link: function($scope) {
      $scope.getLink = $location.absUrl.bind($location);
    }
  };
}];
