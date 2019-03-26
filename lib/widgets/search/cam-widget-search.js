/*
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership. Camunda licenses this file to you under the Apache License,
 * Version 2.0; you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';
var fs = require('fs');

var angular = require('camunda-bpm-sdk-js/vendor/angular'),
    copy = angular.copy,
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

module.exports = ['$timeout', '$location', 'search', 'widgetLocalConf',
  function($timeout,   $location,   searchService, widgetLocalConf) {

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
        storageGroup: '=?camWidgetSearchStorageGroup',
        searchId: '@camWidgetSearchId',
        total: '=?camWidgetSearchTotal',
        matchAny: '=?camWidgetSearchMatchAny',
        variableCaseHandling: '=?camWidgetSearchVariableCaseHandling'
      },

      link: function($scope, element) {
        $scope.isMatchAnyActive = typeof $scope.matchAny !== 'undefined';
        $scope.isVariableCaseHandlingActive = typeof $scope.variableCaseHandling !== 'undefined';

        if($scope.isVariableCaseHandlingActive) {
          $scope.caseHandeling = {};
          $scope.caseHandeling.ignoreValues = ($scope.variableCaseHandling === 'values' || $scope.variableCaseHandling === 'all');
          $scope.caseHandeling.ignoreNames  = ($scope.variableCaseHandling === 'names'  || $scope.variableCaseHandling === 'all');
        }

        $scope.switchMatchType = function() {
          if ($scope.isMatchAnyActive) {
            $scope.matchAny = !$scope.matchAny;
          }
        };

        $scope.focused = false;
        var formElement = angular.element(element).find('form')[0];
        formElement.addEventListener('focus', function() {
          $timeout(function() {
            $scope.focused = true;
          });
        }, true);
        formElement.addEventListener('blur', function() {
          $timeout(function() {
            $scope.focused = false;
          });
        }, true);

        var searchHasVariableQuery = function() {
          var hasVariableQuery = false;
          angular.forEach($scope.searches, function(value) {
            if(['caseInstanceVariables', 'taskVariables', 'processVariables'].indexOf(value.type.value.key) > -1) {
              hasVariableQuery = true;
            }
          });

          return hasVariableQuery;
        };

        $scope.searchHasVariableQuery = searchHasVariableQuery();

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

        $scope.searchTypes = $scope.types.map(function(el) {
          return el.id;
        });

        $scope.getRightPadding = function() {
          if (element.width() > 400) {
            return '125px';
          }

          return '12px';
        };

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
            return getConfigByTypeKey(el)? getConfigByTypeKey(el).groups: null;
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

        var filteredSearches = function(original) {
          return original
            .map(function(search) {
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
                return newSearch;
              }
            })
            .filter(function(search) { return search; });
        };

        var searchId = $scope.searchId || 'search';

        var getSearchesFromURL = function() {
          var urlSearches = JSON.parse(($location.search() || {})[searchId+'Query'] || '[]');
          return filteredSearches(urlSearches);
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
            var dd = $(element[0].querySelectorAll('.dropdown-menu[id^="typeahead"]'));
            if(dd.length === 0) {
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

          if ($scope.isMatchAnyActive) {
            var newLocation;

            if ($scope.matchAny && !$location.search().hasOwnProperty(searchId+'OrQuery')) {
              newLocation = $location.url() + '&' + searchId + 'OrQuery';
            } else if (!$scope.matchAny) {
              newLocation = $location.url().replace('&' + searchId + 'OrQuery', '');
            }

            $location.url(newLocation);
            $location.replace();
          }

          if ($scope.isVariableCaseHandlingActive) {
            $scope.searchHasVariableQuery = searchHasVariableQuery();
            var options = ['none', 'names', 'values', 'all'];
            $location.search('variableCaseHandling', options[!!$scope.caseHandeling.ignoreNames + !!$scope.caseHandeling.ignoreValues * 2]);
          }

          // ignore URL updates for all search widget instances for this update
          IGNORE_URL_UPDATE = true;

          searchService.updateSilently(queryObj, !$location.search()[searchId+'Query']);

          // listen to URL changes again AFTER the locationchange event has fired
          $timeout(function() {IGNORE_URL_UPDATE = false;});

          updateSearchTypes();
        };

        $scope.$watch('[searches, matchAny, variableCaseHandling, caseHandeling]', handleSearchesUpdate, true);

        $scope.$on('$locationChangeSuccess', function() {
          $scope.matchAny = $location.search().hasOwnProperty(searchId+'OrQuery');

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
            search.potentialNames = getConfigByTypeKey(search.type.value.key)?
              getConfigByTypeKey(search.type.value.key).potentialNames || []:
              null;
          });
        }, true);

        $scope.dropdownTypes = getTypes();

        /////////////////////////////////////////////////////////////////////
        // criteria persistence
        /////////////////////////////////////////////////////////////////////

        var searchCriteriaStorage = $scope.searchCriteriaStorage = {
          group: null,
          nameInput: '',
          available: {}
        };
        var stored = {};

        var types = $scope.storageGroup ? [$scope.storageGroup] : $scope.types
          .map(function(item) {
            return item.groups;
          })
          .reduce(function(current, previous) {
            return (current || []).concat(previous);
          })
          .filter(function(value) {
            return value;
          });

        var groups = [];
        for (var i = 0; i < types.length; i++) {
          if (groups.indexOf(types[i]) < 0 && types[i]) groups.push(types[i]);
        }

        if (!groups.length && $scope.storageGroup) {
          groups.push($scope.storageGroup);
        }

        groups.forEach(function(group) {
          stored[group] = {};
        });


        $scope.$watch('validSearches', function determineGroup() {
          if ($scope.storageGroup) {
            searchCriteriaStorage.group = $scope.storageGroup;
            filterCriteria();
            return;
          }

          var _group = null;
          $scope.validSearches.forEach(function(search) {
            if (_group) return;

            var key = search.type.value.key;
            $scope.types.forEach(function(type) {
              if (_group) return;

              // I know that sucks...
              // I mean... it sucks that type.groups is supposed to be an array
              // because if the array has more than 1 item, we can't reliably
              // determine which group is the relevant one
              // (unless we iterate more... which would be the worst nightmare
              // of the guy who will have to maintain that code)
              if (type.id.key === key && (type.groups || []).length === 1) {
                _group = (type.groups || [])[0];
              }
            });
          });

          searchCriteriaStorage.group = _group;

          filterCriteria();
        }, true);


        function filterCriteria() {
          searchCriteriaStorage.available = {};
          if (searchCriteriaStorage.group) {
            searchCriteriaStorage.available = copy(stored[searchCriteriaStorage.group]);
            return;
          }
          groups.forEach(function(group) {
            Object.keys(stored[group] || {}).forEach(function(key) {
              searchCriteriaStorage.available[group + ': ' + key] = stored[group][key];
            });
          });
        }

        function groupAndName(str) {
          if (str.indexOf(':') > 0) {
            var parts = str.split(':').map(function(s) { return s.trim(); });
            return {group: parts[0], name: parts[1]};
          }
          else if (searchCriteriaStorage.group) {
            return {group: searchCriteriaStorage.group, name: str};
          }
        }

        stored = widgetLocalConf.get('searchCriteria', stored);
        filterCriteria();

        $scope.$watch('storageGroup', function() {
          if ($scope.storageGroup && groups.indexOf($scope.storageGroup) < 0) {
            return;
          }
          searchCriteriaStorage.group = $scope.storageGroup;
          filterCriteria();
        });


        $scope.storedCriteriaInputClick = function($evt) {
          $evt.stopPropagation();
        };

        $scope.searchCriteriaInputKeydown = function($evt) {
          if ($evt.keyCode === 13) {
            return $scope.storedCriteriaSaveClick($evt);
          }
        };


        $scope.hasCriteriaSets = function() {
          return !!Object.keys(searchCriteriaStorage.available || {}).length;
        };


        $scope.loadCriteriaSet = function($evt, name) {
          var info = groupAndName(name);
          if (!info) return;
          var original = stored[info.group][info.name];
          $scope.searches = filteredSearches(original);
          // provided by Harry Potter, DO NOT REMOVE
          if ($scope.isMatchAnyActive) {
            $scope.matchAny = original[original.length - 1]['matchAny'];
          }
          handleSearchesUpdate();
        };


        $scope.dropCriteriaSet = function($evt, name) {
          $evt.stopPropagation();

          var info = groupAndName(name);
          if (!info) return;
          delete stored[info.group][info.name];

          widgetLocalConf.set('searchCriteria', stored);
          filterCriteria();
        };


        $scope.storedCriteriaSaveClick = function($evt) {
          $evt.stopPropagation();

          var name = searchCriteriaStorage.nameInput;
          if (!name) {
            return;
          }

          stored[searchCriteriaStorage.group] = stored[searchCriteriaStorage.group] || {};
          stored[searchCriteriaStorage.group][name] = extractSearches($scope.validSearchesBuffer);

          if ($scope.isMatchAnyActive) {
            stored[searchCriteriaStorage.group][name].push({matchAny: $scope.matchAny});
          }

          widgetLocalConf.set('searchCriteria', stored);
          filterCriteria();
          searchCriteriaStorage.nameInput = '';
        };
      },

      template: template
    };
  }];
