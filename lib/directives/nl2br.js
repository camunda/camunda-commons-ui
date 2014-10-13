/* global define: false */

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


// RequireJS dependencies
define([
], function(
) {
  'use strict';

  // AngularJS DI
  return [
  function(
  ) {

    return {
      scope: {
        original: '=nl2br'
      },

      link: function(scope, element, attributes) {
        element.html((scope.original || '').replace(/\n/g, '<br/>'));
      }
    };
  }];
});
