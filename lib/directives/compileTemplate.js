'use strict';
module.exports = ['$compile', '$parse',
  function($compile,   $parse) {
    return {
      restrict: 'A',
      link: function(scope, element, attr) {
        var parsed = $parse(attr.ngBindHtml);
        function getStringValue() { return (parsed(scope) || '').toString(); }

        //Recompile if the template changes
        scope.$watch(getStringValue, function() {
          $compile(element.contents())(scope);
        });

      }
    };
  }];
