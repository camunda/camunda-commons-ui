/**
 * Defines a directive who replaces plain text new lines with `<br />` HTML tags.
 *
 * Usage:
 *
 * Assuming the content of `scopeVarName` would be something like
 *
 * ```
 * First line of text yada.
 * Second line of the text and bamm.
 * ```
 *
 * and
 *
 * ```
 * <div nl2br="scopeVarName"></div>
 * ```
 *
 * will produce something like
 *
 * ```
 * <div nl2br="scopeVarName">First line of text yada.<br/>Second line of the text and bamm.</div>
 * ```
 */


  'use strict';

  // AngularJS DI
  module.exports = [
    function(
  ) {

      return {
        scope: {
          original: '=nl2br'
        },

        link: function(scope, element) {
        // set the content as text (will eliminate malicious html characters)
          element.text(scope.original || '');

        // replace the line breaks
          var replaced = element.html().replace(/\n/g, '<br/>');

        // set the replaced content as html
          element.html(replaced);
        }
      };
    }];
