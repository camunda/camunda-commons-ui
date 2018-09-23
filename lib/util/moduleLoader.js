'use strict';

module.exports = {
  load: function() {
    return requirejs.s.contexts._.defined;
  }
};
