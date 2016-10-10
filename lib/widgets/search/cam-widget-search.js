'use strict';
var fs = require('fs');

var angular = require('camunda-bpm-sdk-js/vendor/angular'),
    $ = require('jquery'),

    template = fs.readFileSync(__dirname + '/cam-widget-search.html', 'utf8');


var dateRegex = /(\d\d\d\d)-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)(?:.(\d\d\d)| )?$/;
function getType(value) {
  if(value && typeof value === 'string' && value.match(dateRegex)) {
    return 'date';
  }
  return typeof value;
}

var isValid = function(search) {
  return search.type.value &&
      (!search.extended || search.name.value) &&
      (search.basic || search.operator.value) &&
      (search.basic || search.value.value) &&
      (getType(search.value.value) === 'date' || !search.enforceDates);
};

var validateOperator = function(operator) {
  if(!operator.value) {
    operator.value = operator.values[0];
    return;
  }
  var idx = operator.values.map(function(el) {
    return el.key;
  }).indexOf(operator.value.key);
  operator.value = operator.values[idx === -1 ? 0 : idx];
};

var parseValue = function(value, enforceString) {
  if(enforceString) {
    return '' + value;
  }
  if(!isNaN(value) && value.trim() !== '') {
      // value must be transformed to number
    return +value;
  }
  if(value === 'true') {
    return true;
  }
  if(value === 'false') {
    return false;
  }
  if(value === 'NULL') {
    return null;
  }
  return value;
};

  // global flag for all instances to ignore URL updates to update searches
var IGNORE_URL_UPDATE = false;

module.exports = ['$timeout', '$location', 'search',
  function($timeout,   $location,   searchService) {

    // check if browser is affected by IE focus bug:
    // https://connect.microsoft.com/IE/feedback/details/810538/ie-11-fires-input-event-on-focus
    var checkIEfocusBug = function(cb) {

      // special timeout so we do not fall into an apply cycle
      $timeout(function() {

        // create input field to make "feature" detection of the bug
        var el = document.createElement('input');
        el.setAttribute('type', 'text');

        // bug only happens when placeholder is set
        el.setAttribute('placeholder', 'set');

        // this event listener is only called when the browser is affected by the bug
        var weAreScrewed = false;
        el.addEventListener('input', function() {
          // we are affected by the IE focus bug and cannot use the placeholder attribute on the search input field
          weAreScrewed = true;
        });

        // perform the test
        document.body.appendChild(el);
        el.focus();
        document.body.removeChild(el);

        // the event is handled asynchronously, so we have to wait for the result
        $timeout(function() {
          cb(weAreScrewed);
        });
      },0,false);
    };

    return {
      restrict: 'A',

      scope: {
        types: '=camWidgetSearchTypes',
        translations: '=camWidgetSearchTranslations',
        operators: '=camWidgetSearchOperators',

        searches: '=?camWidgetSearchSearches',
        validSearches: '=?camWidgetSearchValidSearches',

        mode: '@?camWidgetSearchMode',

        searchId: '@camWidgetSearchId'
      },

      link: function($scope, element) {
        // test for IE focus bug
        checkIEfocusBug(function(hasBug) {
          if(hasBug) {
            // if we are afftected by the focus bug, we cannot set a placeholder on the input field
            // add another indication for the search field
            var node = document.createElement('div');
            node.textContent = $scope.translations.inputPlaceholder + ':';
            element[0].insertBefore(node, element[0].firstChild);
            $scope.$root.$broadcast('plugin:search:change');
          } else {
            // if we are not affected by the focus bug, we can set the placeholder on the input field
            element[0].querySelector('input.main-field').setAttribute('placeholder', $scope.translations.inputPlaceholder);
          }
        });

        var searchId = $scope.searchId || 'search';

        $scope.searchTypes = $scope.types.map(function(el) {
          return el.id;
        });

        var defaultType = $scope.types.reduce(function(done, type) {
          return done || (type.default ? type : null);
        }, null);

        var getTypes = function() {

          // check which classes are allowed
          var aggregatedTypeKeys = $scope.searches.map(function(el) {
            return el.type.value.key;
          }).reduce(function(aggregatedList, type) {
            if(aggregatedList.indexOf(type) === -1) {
              aggregatedList.push(type);
            }
            return aggregatedList;
          }, []);

          var allowedGroups = aggregatedTypeKeys.map(function(el) {
            return getConfigByTypeKey(el).groups;
          }).filter(function(el) {
            return !!el;
          }).reduce(function(groupsArray, groups) {
            if(groupsArray) {
              if(groupsArray.length === 0) {
                return angular.copy(groups);
              }
              for(var i = 0; i < groupsArray.length; i++) {
                if(groups.indexOf(groupsArray[i]) === -1) {
                  groupsArray.splice(i,1);
                  i--;
                }
              }
              if(groupsArray.length === 0) {
                return null;
              } else {
                return groupsArray;
              }
            } else {
              return null;
            }
          }, []);

          if(allowedGroups === null) {
            return [];
          } else if (allowedGroups.length === 0) {
            return $scope.searchTypes;
          } else {
            return $scope.searchTypes.filter(function(el) {
              var groups = getConfigByTypeKey(el.key).groups;
              if(!groups) return true;
              for(var i = 0; i < groups.length; i++) {
                if(allowedGroups.indexOf(groups[i]) > -1) {
                  return true;
                }
              }
              return false;
            });
          }
        };

        var getConfigByTypeKey = function(typeKey) {
          return $scope.types.reduce(function(done, type) {
            return done || (type.id.key === typeKey ? type : null);
          }, null);
        };

        var getOperators = function(config, value) {
          return config.operators || ($scope.operators[getType(parseValue(value, config.enforceString))]);
        };

        var getSearchesFromURL = function() {
          var urlSearches = JSON.parse(($location.search() || {})[searchId+'Query'] || '[]');
          var searches = [];
          angular.forEach(urlSearches, function(search) {
            var config = getConfigByTypeKey(search.type);
            if (config) {
              var newSearch =
                  {
                    extended: config.extended,
                    basic: config.basic,
                    type: {
                      values: getTypes(),
                      value: getTypes().reduce(function(done, type) {
                        return done || (type.key === search.type ? type : null);
                      }, null),
                      tooltip: $scope.translations.type
                    },

                    name: {
                      value: search.name,
                      tooltip: $scope.translations.name
                    },

                    options: config.options,

                    operator: {
                      tooltip: $scope.translations.operator
                    },

                    value: {
                      value: search.value,
                      tooltip: $scope.translations.value
                    },
                    allowDates: config.allowDates,
                    enforceDates: config.enforceDates,
                    potentialNames: config.potentialNames || [],
                    enforceString: config.enforceString
                  };
              newSearch.operator.values = getOperators(config, newSearch.value.value);
              newSearch.operator.value = newSearch.operator.values.reduce(function(done, op) {
                return done || (op.key === search.operator ? op : null);
              }, null);

              newSearch.valid = isValid(newSearch);
              searches.push(newSearch);
            }
          });
          return searches;
        };

        $scope.searches = $scope.searches || [];
        $scope.searches = getSearchesFromURL();
        $scope.validSearchesBuffer = $scope.searches.reduce(function(valid, search) {
          if(search.valid) {
            valid.push(search);
          }
          return valid;
        }, []);
        $scope.validSearches = angular.copy($scope.validSearchesBuffer);

        var selectNextInvalidElement = function(startIndex, startField) {
          var search = $scope.searches[startIndex];
          if(!search.valid) {
            if(search.extended && !search.name.value && startField !== 'name') {
              search.name.inEdit = true;
              return;
            } else if(startField !== 'value') {
              search.value.inEdit = true;
              return;
            }
          }
          for(var i = 1; i < $scope.searches.length; i++) {
            var idx = (i + startIndex) % $scope.searches.length;
            search = $scope.searches[idx];
            if(!search.valid) {
              if(search.extended && !search.name.value) {
                search.name.inEdit = true;
              } else {
                search.value.inEdit = true;
              }
              return;
            }
          }
        };

        $scope.createSearch = function(type) {
          if(!type && !$scope.inputQuery) {
            return;
          }

          var value = (!type ? $scope.inputQuery : '');

          type = (type && getConfigByTypeKey(type.key)) || defaultType;

          var operators = getOperators(type, value);

          $scope.searches.push({
            extended: type.extended,
            basic: type.basic,
            type: {
              values: getTypes(),
              value: type.id,
              tooltip: $scope.translations.type
            },
            name: {
              value: '',
              inEdit: type.extended,
              tooltip: $scope.translations.name
            },
            operator: {
              value: operators[0],
              values: operators,
              tooltip: $scope.translations.operator
            },
            options: type.options,
            value: {
              value: value,
              inEdit: !type.extended && !value,
              tooltip: $scope.translations.value
            },
            allowDates: type.allowDates,
            enforceDates: type.enforceDates,
            potentialNames: type.potentialNames,
            enforceString: type.enforceString
          });
          var search = $scope.searches[$scope.searches.length-1];
          search.valid = isValid(search);

          // To those who think, WHAT THE HECK IS THIS?!:
          //
          // Typeahead thinks, it is a good idea to focus the input field after selecting an option via mouse click
          // (see https://github.com/angular-ui/bootstrap/blob/e909b922a2ce09792a733652e5131e9a95b35e5b/src/typeahead/typeahead.js#L274)
          // We do not want this. Since they are registering their focus event per timeout AFTER we register our
          // blur event per timeout, the field is focussed in the end. How to prevent this? More timeouts x_x
          if(!value) {
            $timeout(function() {$timeout(function() {
              $scope.inputQuery = '';
              $(element[0].querySelector('.search-container > input')).blur();
            });});
          } else {
            $scope.inputQuery = '';
          }
        };

        $scope.deleteSearch = function(idx) {
          $scope.searches.splice(idx,1);
          $timeout(function() {
            $(element[0].querySelector('.search-container > input')).focus();
          });
        };

        $scope.handleChange = function(idx, field, before, value, evt) {
          var config;
          var search = $scope.searches[idx];
          if(field === 'type') {
            config = getConfigByTypeKey(value.key);

            search.extended = config.extended;
            search.basic = config.basic;
            search.allowDates = config.allowDates;

            if(!search.enforceDates && config.enforceDates) {
              search.value.value = '';
            }
            search.enforceDates = config.enforceDates;
            search.operator.values = getOperators(config, search.value.value);
            validateOperator(search.operator);
          } else if(field === 'value') {
            if(idx === $scope.searches.length-1) {
              $timeout(function() {
                $(element[0].querySelector('.search-container > input')).focus();
              });
            }
            config = getConfigByTypeKey(search.type.value.key);
            if(!config.operators) {
              search.operator.values = getOperators(config, search.value.value);
              validateOperator(search.operator);
            }
          }
          search.valid = isValid(search);

          if(evt && evt.keyCode === 13) {
            selectNextInvalidElement(idx, field);
          }

        };

        $scope.onKeydown = function(evt) {
          if([38,40,13].indexOf(evt.keyCode) !== -1) {
            if($(element[0].querySelectorAll('.dropdown-menu')).length === 0) {
              $timeout(function() {
                angular.element(evt.target).triggerHandler('input');
              });
            }
          }
        };

        var extractSearches = function(searches) {
          var out = [];
          angular.forEach(searches, function(search) {
            out.push({
              type: search.type.value.key,
              operator: search.operator.value.key,
              value: search.value.value,
              name: search.name.value
            });
          });
          return out;
        };

        var handleSearchesUpdate = function() {
          var searches = $scope.searches;
          // add valid searches to validSearchesBuffer
          angular.forEach(searches, function(search) {
            if(search.valid && $scope.validSearchesBuffer.indexOf(search) === -1) {
              $scope.validSearchesBuffer.push(search);
            }
          });

          // remove invalid searches from valid searches
          angular.forEach($scope.validSearchesBuffer, function(search, idx) {
            if(!search.valid || searches.indexOf(search) === -1) {
              $scope.validSearchesBuffer.splice(idx, 1);
            }
          });

          var queryObj = {};
          queryObj[searchId+'Query'] = JSON.stringify(extractSearches($scope.validSearchesBuffer));

          // ignore URL updates for all search widget instances for this update
          IGNORE_URL_UPDATE = true;

          searchService.updateSilently(queryObj, !$location.search()[searchId+'Query']);

          // listen to URL changes again AFTER the locationchange event has fired
          $timeout(function() {IGNORE_URL_UPDATE = false;});

          updateSearchTypes();
        };

        $scope.$watch('searches', handleSearchesUpdate, true);

        $scope.$on('$locationChangeSuccess', function() {
          if(!IGNORE_URL_UPDATE && $location.search().hasOwnProperty(searchId+'Query')) {

            // make new array of searches from the url
            var searches = getSearchesFromURL();

            // if something has changed in the valid searches
            if(!angular.equals(searches, $scope.validSearchesBuffer)) {
              // now add all invalid searches which exist within the original search array, but are not in the URL
              angular.forEach($scope.searches, function(search) {
                if(!search.valid) {
                  searches.push(search);
                }
              });

              // empty the valid searches buffer (will be automatically refilled by the listener on the searches)
              $scope.validSearchesBuffer = [];

              // replace the original search array with the new one
              $scope.searches = searches;
            }
          }
        });

        var copyValid;
        $scope.$watch('validSearchesBuffer', function() {
          $timeout.cancel(copyValid);
          copyValid = $timeout(function() {
            $scope.validSearches = angular.copy($scope.validSearchesBuffer);
          });
        }, true);

        var updateSearchTypes = function() {
          var types = getTypes();
          $scope.dropdownTypes = types;
          for(var i = 0; i < $scope.searches.length; i++) {
            $scope.searches[i].type.values = types;
          }
        };

        $scope.$watch('types', function() {
          //in case if array of types changed - update dropdown values
          $scope.searchTypes = $scope.types.map(function(el) {
            return el.id;
          });
          $scope.dropdownTypes = getTypes();

          // Currently we only allow to change the potential names of a type, to support changing the filter
          // in the tasklist while preserving existing search queries
          angular.forEach($scope.searches, function(search) {
            search.potentialNames = getConfigByTypeKey(search.type.value.key).potentialNames || [];
          });
        }, true);

        $scope.dropdownTypes = getTypes();
      },

      template: template
    };
  }];
