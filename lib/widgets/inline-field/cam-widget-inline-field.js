'use strict';
var fs = require('fs');

var angular = require('camunda-bpm-sdk-js/vendor/angular'),
    $ = require('jquery'),

    template = fs.readFileSync(__dirname + '/cam-widget-inline-field.html', 'utf8');

module.exports = [
  '$timeout',
  '$filter',
  '$document',
  function(
    $timeout,
    $filter,
    $document
  ) {

    return {
      scope: {
        varValue:       '=value',
        varType:        '@type',
        validator:      '&validate',
        change:         '&',
        onStart:        '&onStartEditing',
        onCancel:       '&onCancelEditing',

        placeholder:    '@',
        options:        '=?',
        allowNonOptions:'@',
        flexible:       '@'
      },

      template: template,

      link: function(scope, element) {
        var $bdyEl = $('body');
        var $btnsEl;
        var $ctrlsEl;

        var dateFilter = $filter('date'),
            dateFormat = 'yyyy-MM-dd\'T\'HH:mm:ss';

        var dateRegex = /(\d\d\d\d)-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)(?:.(\d\d\d)| )?$/;

        scope.editing = false;

        scope.$on('$locationChangeSuccess', function() {
          scope.cancelChange();
        });
        scope.$on('$destroy', function() {
          removeFromBody(true);
        });

        function convertDateStringToObject(date) {
          var YEAR, MONTH, DAY, HOURS, MINUTES, SECONDS, MILLISECONDS;

          var match = dateRegex.exec(date);

          if (match) {

            YEAR = parseInt(match[1] || 0, 10);
            MONTH = parseInt(match[2] || 0, 10) - 1;
            DAY = parseInt(match[3] || 0, 10);
            HOURS = parseInt(match[4] || 0, 10);
            MINUTES = parseInt(match[5] || 0, 10);
            SECONDS = parseInt(match[6] || 0, 10);
            MILLISECONDS = parseInt(match[7] || 0, 10);

            return new Date(YEAR, MONTH, DAY, HOURS, MINUTES, SECONDS, MILLISECONDS);
          }
        }

        function isDate() {
          return ['datetime', 'date', 'time'].indexOf(scope.varType) > -1;
        }

        function isSimpleField() {
          return ['color', 'email', 'month', 'number', 'range', 'tel', 'text', 'time', 'url', 'week'].indexOf(scope.varType) > -1;
        }

        function reset() {
          scope.editing =       false;
          scope.invalid =       false;
          scope.editValue =     scope.varValue;

          scope.validator =     scope.validator ||     function() {};
          scope.onStart =       scope.onStart ||       function() {};
          scope.onCancel =      scope.onCancel ||      function() {};
          scope.change =        scope.change ||        function() {};
          scope.options =       scope.options ||       [];
          scope.allowNonOptions=scope.allowNonOptions || false;
          scope.flexible =      scope.flexible ||      false;

          scope.varType =       scope.varType ? scope.varType : 'text';

          scope.simpleField = isSimpleField();

          if (isDate()) {
            var dateStr = scope.varValue,
                dateObj = null;

            if (dateStr) {
              dateObj = convertDateStringToObject(dateStr);
            } else {
              dateObj = Date.now();
            }

            scope.dateValue = dateObj;
          }
        }

        function bodyDirectChild($el) {
          if (!$el || !$el.length) {
            return false;
          }

          var $parent = $el.parent();
          if (!$parent || !$parent.length) {
            return false;
          }

          return $parent[0].tagName.toLowerCase() === 'body';
        }

        function positionElements() {
          var offset = $(element).offset();

          if(isDate()) {
            $btnsEl
              .addClass('datepicker-control')
              .show()
              .css({
                left: offset.left + ($ctrlsEl.outerWidth() - $btnsEl.outerWidth()),
                top: offset.top + $ctrlsEl.outerHeight()
              });
          } else {
            $btnsEl
              .removeClass('datepicker-control')
              .show()
              .css({
                left: offset.left + ($(element).outerWidth() - $btnsEl.outerWidth()),
                top: offset.top - $btnsEl.outerHeight()
              });
          }

          $ctrlsEl
            .show()
            .css({
              left: offset.left,
              top: offset.top + $(element).outerHeight()
            });

          if (isDate()) {
            var $datepickerEl = $ctrlsEl[0].querySelector('.cam-widget-inline-field.field-control > .datepicker > table');

            if ($datepickerEl) {
              $datepickerEl.focus();
            }
          }

        }

        function appendToBody() {
          $ctrlsEl = (($ctrlsEl && $ctrlsEl.length) ? $ctrlsEl : $(element[0].querySelector('.field-control')))
                    .hide();
          if (!bodyDirectChild($ctrlsEl)) {
            $bdyEl
              .append($ctrlsEl);
          }

          $btnsEl = (($btnsEl && $btnsEl.length) ? $btnsEl : $(element[0].querySelector('.btn-group')))
                    .hide();
          if (!bodyDirectChild($btnsEl)) {
            $bdyEl
              .append($btnsEl);
          }

          $timeout(positionElements, 50);
        }

        function removeFromBody(force) {
          $timeout(function() {
            if (scope.editing && !force) { return; }

            if ($btnsEl && $btnsEl.remove) {
              $btnsEl.remove();
            }
            $btnsEl = null;

            if ($ctrlsEl && $ctrlsEl.remove) {
              $ctrlsEl.remove();
            }
            $ctrlsEl = null;
          }, 50);
        }



        function bodyClicked(evt) {
          return element[0].contains(evt.target) ||
            ($btnsEl && $btnsEl.length && $btnsEl[0].contains(evt.target)) ||
            ($ctrlsEl && $ctrlsEl.length && $ctrlsEl[0].contains(evt.target));
        }



        scope.$watch('editing', function(after, before) {
          if (after === before) { return; }

          if (scope.editing) {
            appendToBody();
            element.addClass('inline-editing');
          }
          else {
            removeFromBody();
            element.removeClass('inline-editing');
          }
        });

        function stopEditing(evt) {
          if(!scope.editing) {
            return;
          }

          if(bodyClicked(evt)) {
            return;
          }

          var targetElement = $(evt.target),
              expectedClasses = 'ng-binding text-muted';

          if (targetElement.hasClass(expectedClasses)) {
            return;
          }

          var children = targetElement.children();
          if (children.hasClass(expectedClasses)) {
            return;
          }

          scope.$apply(scope.cancelChange);
        }

        scope.changeType = function() {
          if(scope.varType === 'datetime') {
            scope.varType = 'text';
          } else {
            scope.varType = 'datetime';
          }
          reset();
          scope.editing = true;
          element[0].attributes.type.value = scope.varType;
          scope.simpleField = isSimpleField();
        };

        scope.startEditing = function() {
          if(!scope.editing) {
            reset();

            scope.editing = true;
            scope.onStart(scope);

            // save the current edit value to restore later
            var savedEditValue = scope.editValue;

            // clear the edit value so that typeahead shows all options
            scope.editValue = '';

            // Here is where it gets ugly: We have to wait for angular to apply the changes to the edit value, so that the
            // input field is rendered and we can open the typeahead dropdown (first timeout). However, the instantTypeahead directive does
            // not immediately register its functions to prevent IE from going crazy. Therefore, we have to wait for another cycle
            // (second timeout), before triggering an input event on the input field can open the instant typeahead dropdown.
            $timeout(function() {
              $timeout(function() {
                // trigger the typeahead (which shows all options)
                angular.element(element[0].querySelector('[ng-model="editValue"]')).triggerHandler('input');
                // and reset the edit value, so that the user can type
                scope.editValue = savedEditValue;

                // in the next apply cycle, the dropdown is open. We now have to
                // select the default value, if it exists:
                if(savedEditValue) {
                  $timeout(function() {
                    var compareValue = typeof savedEditValue === 'object' ? savedEditValue.value : savedEditValue;
                    var elems = $(element[0].querySelector('li[ng-mouseenter]'));
                    for(var i = 0; i < elems.length; i++) {
                      var elem = elems[i];
                      if(elem.innerText.indexOf(compareValue) === 0) {
                        $(elem).trigger('mouseenter');
                        return;
                      }
                    }
                  });
                }
              });
            });

            $timeout(function() {
              $('[ng-model="editValue"]').focus();
              $('[ng-model="editValue"]').select();
              $document.bind('click', stopEditing);
            }, 50);
          }
        };

        scope.applyChange = function(selection, evt) {
          scope.invalid = scope.validator(scope);

          if (!scope.invalid) {

            if(scope.simpleField) {
              scope.editValue = $('[ng-model="editValue"]').val();
              scope.varValue = scope.editValue;
            }
            else if (scope.varType === 'option') {
              if(scope.options.indexOf(selection) === -1 && !scope.allowNonOptions) {
                scope.cancelChange();
                return;
              }
              scope.editValue = selection || $('[ng-model="editValue"]').val();
              scope.varValue = scope.editValue;
            }
            else if (isDate()) {
              scope.varValue = dateFilter(scope.dateValue, dateFormat);
            }

            scope.$event = evt;
            scope.change(scope);

            scope.editing = false;

            $document.unbind('click', stopEditing);
          }
        };

        scope.cancelChange = function() {
          if(scope.editing) {
            scope.editing = false;
            scope.onCancel(scope);

            $document.unbind('click', stopEditing);
          }
        };

        scope.changeDate = function(pickerScope) {
          scope.editValue = scope.dateValue = pickerScope.dateValue;
        };

        scope.selectNextInlineField = function(reversed) {
          var allFields = $('[cam-widget-inline-field][type=\'text\'], [cam-widget-inline-field][type=\'option\']');
          for(var i = reversed*(allFields.length - 1); i !== !reversed*(allFields.length-1); i += !reversed*2-1) {

            if(allFields[i] === element[0]) {
              $timeout(function() {
                var element = $(allFields[i+!reversed*2-1]);
                element.find('.view-value').click();
                // after clicking the next inline field, wait for the input to appear, then select all
                $timeout(function() {
                  element.find('input').select();
                });
              });
              return;
            }
          }
          // take the first/last one
          $timeout(function() {
            $(allFields[reversed*allFields.length - 1]).find('.view-value').click();
          });
        };

        scope.trapKeyboard = function(evt, reverse) {
          if(isDate() && evt.keyCode === 9) {
            // only trap tab key on date inputs
            if(!reverse && !evt.shiftKey) {
              // focus the date picker
              $('.cam-widget-inline-field.field-control > .datepicker > table')[0].focus();
              evt.preventDefault();
            } else if(reverse && evt.shiftKey) {
              // focus the cancel button
              $('.cam-widget-inline-field.btn-group > button[ng-click="cancelChange($event)"]')[0].focus();
              evt.preventDefault();
            }
          }
        };

        scope.cancelOnEsc = function(evt) {
          if(isDate() && evt.keyCode === 27) {
            scope.cancelChange();
          }
        };

        scope.handleKeydown = function(evt) {
          if(evt.keyCode === 13) {
            scope.applyChange(scope.selection, evt);
            evt.preventDefault();
          } else if(evt.keyCode === 27) {
            scope.cancelChange(evt);
            evt.preventDefault();
          } else if(evt.keyCode === 9) {
            scope.applyChange(scope.selection, evt);
            scope.selectNextInlineField(evt.shiftKey);
            evt.preventDefault();
          }
          scope.selection = null;
        };

        scope.selection = null;
        scope.saveSelection = function(selection) {
          scope.selection = selection;
          $timeout(function() {
            // check if the selection has been applied
            if(scope.selection === selection) {
              scope.applyChange(selection);
            }
          });
        };

      },

      transclude: true
    };
  }];
