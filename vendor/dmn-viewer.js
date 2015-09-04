/*!
 * dmn-js - dmn-viewer v0.1.0

 * Copyright 2015 camunda Services GmbH and other contributors
 *
 * Released under the bpmn.io license
 * http://bpmn.io/license
 *
 * Source Code: https://github.com/dmn-io/dmn-js
 *
 * Date: 2015-09-07
 */

!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.DmnJS=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
'use strict';

var assign = _dereq_(390),
    omit = _dereq_(393),
    isString = _dereq_(388),
    isNumber = _dereq_(386);

var domify = _dereq_(401),
    domQuery = _dereq_(402),
    domRemove = _dereq_(403);

var Table = _dereq_(408),
    DmnModdle = _dereq_(62);

var IdSupport = _dereq_(64),
    Ids = _dereq_(320);

var Importer = _dereq_(25);


function initListeners(table, listeners) {
  var events = table.get('eventBus');

  listeners.forEach(function(l) {
    events.on(l.event, l.handler);
  });
}

function checkValidationError(err) {

  // check if we can help the user by indicating wrong DMN xml
  // (in case he or the exporting tool did not get that right)

  var pattern = /unparsable content <([^>]+)> detected([\s\S]*)$/;
  var match = pattern.exec(err.message);

  if (match) {
    err.message =
      'unparsable content <' + match[1] + '> detected; ' +
      'this may indicate an invalid DMN file' + match[2];
  }

  return err;
}

var DEFAULT_OPTIONS = {
  width: '100%',
  height: '100%',
  position: 'relative',
  container: 'body'
};


/**
 * Ensure the passed argument is a proper unit (defaulting to px)
 */
function ensureUnit(val) {
  return val + (isNumber(val) ? 'px' : '');
}

/**
 * A viewer for DMN tables.
 *
 *
 * ## Extending the Viewer
 *
 * In order to extend the viewer pass extension modules to bootstrap via the
 * `additionalModules` option. An extension module is an object that exposes
 * named services.
 *
 * The following example depicts the integration of a simple
 * logging component that integrates with interaction events:
 *
 *
 * ```javascript
 *
 * // logging component
 * function InteractionLogger(eventBus) {
 *   eventBus.on('element.hover', function(event) {
 *     console.log()
 *   })
 * }
 *
 * InteractionLogger.$inject = [ 'eventBus' ]; // minification save
 *
 * // extension module
 * var extensionModule = {
 *   __init__: [ 'interactionLogger' ],
 *   interactionLogger: [ 'type', InteractionLogger ]
 * };
 *
 * // extend the viewer
 * var dmnViewer = new Viewer({ additionalModules: [ extensionModule ] });
 * dmnViewer.importXML(...);
 * ```
 *
 * @param {Object} [options] configuration options to pass to the viewer
 * @param {DOMElement} [options.container] the container to render the viewer in, defaults to body.
 * @param {String|Number} [options.width] the width of the viewer
 * @param {String|Number} [options.height] the height of the viewer
 * @param {Object} [options.moddleExtensions] extension packages to provide
 * @param {Array<didi.Module>} [options.modules] a list of modules to override the default modules
 * @param {Array<didi.Module>} [options.additionalModules] a list of modules to use with the default modules
 */
function Viewer(options) {

  this.options = options = assign({}, DEFAULT_OPTIONS, options || {});

  var parent = options.container;

  // support jquery element
  // unwrap it if passed
  if (parent.get) {
    parent = parent.get(0);
  }

  // support selector
  if (isString(parent)) {
    parent = domQuery(parent);
  }

  var container = this.container = domify('<div class="dmn-table"></div>');
  parent.appendChild(container);

  assign(container.style, {
    width: ensureUnit(options.width),
    height: ensureUnit(options.height),
    position: options.position
  });
}

Viewer.prototype.importXML = function(xml, done) {

  var self = this;

  this.moddle = this.createModdle();

  this.moddle.fromXML(xml, 'dmn:Definitions', function(err, definitions, context) {
    if (err) {
      err = checkValidationError(err);
      return done(err);
    }

    var parseWarnings = context.warnings;

    self.importDefinitions(definitions, function(err, importWarnings) {
      if (err) {
        return done(err);
      }

      done(null, parseWarnings.concat(importWarnings || []));
    });
  });
};

Viewer.prototype.saveXML = function(options, done) {

  if (!done) {
    done = options;
    options = {};
  }

  var definitions = this.definitions;

  if (!definitions) {
    return done(new Error('no definitions loaded'));
  }

  this.moddle.toXML(definitions, options, done);
};

Viewer.prototype.createModdle = function() {
  var moddle = new DmnModdle(this.options.moddleExtensions);

  IdSupport.extend(moddle, new Ids([ 32, 36, 1 ]));

  return moddle;
};

Viewer.prototype.get = function(name) {

  if (!this.table) {
    throw new Error('no table loaded');
  }

  return this.table.get(name);
};

Viewer.prototype.invoke = function(fn) {

  if (!this.table) {
    throw new Error('no table loaded');
  }

  return this.table.invoke(fn);
};

Viewer.prototype.importDefinitions = function(definitions, done) {

  // use try/catch to not swallow synchronous exceptions
  // that may be raised during model parsing
  try {
    if (this.table) {
      this.clear();
    }

    this.definitions = definitions;

    var table = this.table = this._createTable(this.options);

    this._init(table);

    Importer.importDmnTable(table, definitions, done);
  } catch (e) {
    done(e);
  }
};

Viewer.prototype._init = function(table) {
  initListeners(table, this.__listeners || []);
};

Viewer.prototype._createTable = function(options) {

  var modules = [].concat(options.modules || this.getModules(), options.additionalModules || []);

  // add self as an available service
  modules.unshift({
    dmnjs: [ 'value', this ],
    moddle: [ 'value', this.moddle ]
  });

  options = omit(options, 'additionalModules');

  options = assign(options, {
    sheet: { container: this.container },
    modules: modules
  });

  return new Table(options);
};


Viewer.prototype.getModules = function() {
  return this._modules;
};

/**
 * Remove all drawn elements from the viewer.
 *
 * After calling this method the viewer can still
 * be reused for opening another table.
 */
Viewer.prototype.clear = function() {
  var table = this.table;

  if (table) {
    table.destroy();
  }
};

/**
 * Destroy the viewer instance and remove all its remainders
 * from the document tree.
 */
Viewer.prototype.destroy = function() {
  // clear underlying diagram
  this.clear();

  // remove container
  domRemove(this.container);
};

/**
 * Register an event listener on the viewer
 *
 * @param {String} event
 * @param {Function} handler
 */
Viewer.prototype.on = function(event, handler) {
  var table = this.table,
      listeners = this.__listeners = this.__listeners || [];

  listeners.push({ event: event, handler: handler });

  if (table) {
    table.get('eventBus').on(event, handler);
  }
};

// modules the viewer is composed of
Viewer.prototype._modules = [
  _dereq_(2),
  _dereq_(423),
  _dereq_(14),
  _dereq_(19),
  _dereq_(7),
  _dereq_(17),
  _dereq_(22),
  _dereq_(421),
  _dereq_(419)
];

module.exports = Viewer;

},{"14":14,"17":17,"19":19,"2":2,"22":22,"25":25,"320":320,"386":386,"388":388,"390":390,"393":393,"401":401,"402":402,"403":403,"408":408,"419":419,"421":421,"423":423,"62":62,"64":64,"7":7}],2:[function(_dereq_,module,exports){
module.exports = {
  __depends__: [
    _dereq_(27),
    _dereq_(4)
  ]
};

},{"27":27,"4":4}],3:[function(_dereq_,module,exports){
'use strict';

var domClasses = _dereq_(399);

function DmnRenderer(eventBus) {

  eventBus.on('row.render', function(event) {
    if(event.data.isClauseRow) {
      domClasses(event.gfx).add('labels');
    }
  });

  eventBus.on('cell.render', function(event) {
    var data = event.data,
        gfx  = event.gfx;

    if(!data.column.businessObject) {
      return;
    }

    if(data.row.isClauseRow) {
      // clause names
      gfx.childNodes[0].textContent = data.column.businessObject.name;
    } else if(data.content) {
      if(!data.content.tagName && data.row.businessObject) {
        // conditions and conclusions
        gfx.childNodes[0].textContent = data.content.text;
      }
    }
    if(!data.row.isFoot) {
      if(!!data.column.businessObject.inputExpression) {
        gfx.classList.add('input');
      } else {
        gfx.classList.add('output');
      }
    }
  });
}

DmnRenderer.$inject = [ 'eventBus' ];

module.exports = DmnRenderer;

},{"399":399}],4:[function(_dereq_,module,exports){
module.exports = {
  __init__: [ 'dmnRenderer' ],
  dmnRenderer: [ 'type', _dereq_(3) ]
};

},{"3":3}],5:[function(_dereq_,module,exports){
'use strict';

var domify = _dereq_(401)

/**
 * Adds an annotation column to the table
 *
 * @param {EventBus} eventBus
 */
function Annotations(eventBus, sheet, elementRegistry, graphicsFactory) {

  this.column = null;

  var self = this;
  eventBus.on('import.success', function(event) {

    eventBus.fire('annotations.add', event);

    self.column = sheet.addColumn({
      id: 'annotations',
      isAnnotationsColumn: true
    });

    var cell = elementRegistry.filter(function(element) {
        return element._type === 'cell' && element.column === self.column && element.row.isLabelRow;
      })[0];
    cell.rowspan = 4;
    /**
     * The code in the <project-logo></project-logo> area
     * must not be changed, see http://bpmn.io/license for more information
     *
     * <project-logo>
     */

    cell.content = domify('<a href="http://bpmn.io" class="dmn-js-logo"></a>Annotation');

    /* </project-logo> */

    graphicsFactory.update('column', self.column, elementRegistry.getGraphics(self.column.id));

    eventBus.fire('annotations.added', self.column);
  });

  eventBus.on('sheet.destroy', function(event) {

    eventBus.fire('annotations.destroy', self.column);

    sheet.removeColumn({
      id: 'annotations'
    });

    eventBus.fire('annotations.destroyed', self.column);
  });
}

Annotations.$inject = [ 'eventBus', 'sheet', 'elementRegistry', 'graphicsFactory' ];

module.exports = Annotations;

Annotations.prototype.getColumn = function() {
  return this.column;
};

},{"401":401}],6:[function(_dereq_,module,exports){
'use strict';

var domClasses = _dereq_(399);

function AnnotationsRenderer(
    eventBus,
    annotations) {

  eventBus.on('cell.render', function(event) {
    if(event.data.column === annotations.getColumn() && !event.data.row.isFoot) {
      domClasses(event.gfx).add('annotation');
      if(!event.data.row.isHead) {
        // render the description of the rule inside the cell
        event.gfx.childNodes[0].textContent = event.data.row.businessObject.description;
      }
    }
  });
}

AnnotationsRenderer.$inject = [
  'eventBus',
  'annotations'
];

module.exports = AnnotationsRenderer;

},{"399":399}],7:[function(_dereq_,module,exports){
module.exports = {
  __init__: [ 'annotations', 'annotationsRenderer'],
  __depends__: [
  ],
  annotations: [ 'type', _dereq_(5) ],
  annotationsRenderer: [ 'type', _dereq_(6) ]
};

},{"5":5,"6":6}],8:[function(_dereq_,module,exports){
'use strict';

function DmnFactory(moddle) {
  this._model = moddle;
}

DmnFactory.$inject = [ 'moddle' ];


DmnFactory.prototype._needsId = function(element) {
  return element.$instanceOf('dmn:DMNElement');
};

DmnFactory.prototype._ensureId = function(element) {

  // generate semantic ids for elements
  // bpmn:SequenceFlow -> SequenceFlow_ID
  var prefix = (element.$type || '').replace(/^[^:]*:/g, '') + '_';

  if (!element.id && this._needsId(element)) {
    element.id = this._model.ids.nextPrefixed(prefix, element);
  }
};


DmnFactory.prototype.create = function(type, attrs) {
  var element = this._model.create(type, attrs || {});

  this._ensureId(element);

  return element;
};

DmnFactory.prototype.createRule = function(type, attrs) {
  attrs = attrs || {};
  attrs.condition = attrs.condition || [];
  attrs.conclusion = attrs.conclusion || [];

  var element = this.create(type, attrs);

  return element;
};

DmnFactory.prototype.createInputEntry = function(text, clause, rule) {
  var element = this.create('dmn:LiteralExpression', {
    text: text
  });
  element.$parent = clause;
  clause.inputEntry.push(element);
  rule.condition.push(element);

  return element;
};

DmnFactory.prototype.createInputClause = function(name) {
  var element = this.create('dmn:Clause', {
    name: name
  });
  element.inputEntry = [];
  element.inputExpression = this.create('dmn:LiteralExpression', {});
  element.inputExpression.itemDefinition = this.create('dmn:DMNElementReference', {});

  return element;
};

DmnFactory.prototype.createOutputClause = function(name) {
  var element = this.create('dmn:Clause', {
    name: name
  });
  element.outputEntry = [];
  element.outputDefinition = this.create('dmn:DMNElementReference', {});

  return element;
};

DmnFactory.prototype.createOutputEntry = function(text, clause, rule) {
  var element = this.create('dmn:LiteralExpression', {
    text: text
  });
  element.$parent = clause;
  clause.outputEntry.push(element);
  rule.conclusion.push(element);

  return element;
};

DmnFactory.prototype.createItemDefinition = function() {
  var element = this.create('dmn:ItemDefinition', {
    typeDefinition: 'string'
  });

  return element;
};

DmnFactory.prototype.createAllowedValue = function(text, itemDefinition) {
  var element = this.create('dmn:LiteralExpression', {
    text: text
  });
  element.$parent = itemDefinition;
  itemDefinition.allowedValue = itemDefinition.allowedValue || [];
  itemDefinition.allowedValue.push(element);

  return element;
};

module.exports = DmnFactory;

},{}],9:[function(_dereq_,module,exports){
'use strict';

var inherits = _dereq_(322);

var BaseElementFactory = _dereq_(410);


/**
 * A dmn-aware factory for table-js elements
 */
function ElementFactory(moddle, dmnFactory) {
  BaseElementFactory.call(this);

  this._moddle = moddle;
  this._dmnFactory = dmnFactory;
}

inherits(ElementFactory, BaseElementFactory);


ElementFactory.$inject = [ 'moddle', 'dmnFactory' ];

module.exports = ElementFactory;

ElementFactory.prototype.baseCreate = BaseElementFactory.prototype.create;

ElementFactory.prototype.create = function(elementType, attrs) {
  attrs = attrs || {};

  var businessObject = attrs.businessObject;
  if(elementType === 'row') {
    attrs.type = 'dmn:DecisionRule';
  } else if(elementType === 'column') {
    attrs.type = 'dmn:Clause';
  }

  if (!businessObject) {
    if (!attrs.type) {
      throw new Error('no type specified');
    }
    else if(attrs.type === 'dmn:DecisionRule') {
      businessObject = this._dmnFactory.createRule(attrs.type);
    } else if(attrs.type === 'dmn:Clause') {
      if(attrs.isInput) {
        businessObject = this._dmnFactory.createInputClause(attrs.name);
        businessObject.inputExpression.itemDefinition.ref = this._dmnFactory.createItemDefinition();
        businessObject.inputExpression.itemDefinition.href = '#' + businessObject.inputExpression.itemDefinition.ref.id;
      } else {
        businessObject = this._dmnFactory.createOutputClause(attrs.name);
        businessObject.outputDefinition.ref = this._dmnFactory.createItemDefinition();
        businessObject.outputDefinition.href = '#' + businessObject.outputDefinition.ref.id;
      }
    } else {
      businessObject = this._dmnFactory.create(attrs.type);
    }
  }

  attrs.businessObject = businessObject;
  attrs.id = businessObject.id;

  return this.baseCreate(elementType, attrs);

};

},{"322":322,"410":410}],10:[function(_dereq_,module,exports){
module.exports = {
  __init__: [ ],
  __depends__: [ ],
  dmnFactory: [ 'type', _dereq_(8) ],
  elementFactory: [ 'type', _dereq_(9) ]
};

},{"8":8,"9":9}],11:[function(_dereq_,module,exports){
'use strict';

var domify = _dereq_(401),
    forEach = _dereq_(324);

// document wide unique overlay ids
var ids = new (_dereq_(30))('clause');

/**
 * Adds a control to the table to add more columns
 *
 * @param {EventBus} eventBus
 */
function IoLabel(eventBus, sheet, elementRegistry, graphicsFactory) {

  this.row = null;

  var self = this;
  eventBus.on('sheet.init', function(event) {

    eventBus.fire('ioLabel.add', event);

    self.row = sheet.addRow({
      id: 'ioLabel',
      isHead: true,
      isLabelRow: true,
      useTH: true
    });

    eventBus.fire('ioLabel.added', self.row);
  });

  eventBus.on('sheet.destroy', function(event) {

    eventBus.fire('ioLabel.destroy', self.row);

    sheet.removeRow({
      id: 'ioLabel'
    });

    eventBus.fire('ioLabel.destroyed', self.row);
  });

  function updateColspans(evt) {
    if(evt._type === 'column') {
      var cells = elementRegistry.filter(function(element) {
        return element._type === 'cell' && element.row === self.row;
      });

      var inputs = cells.filter(function(cell) {
        return cell.column.businessObject && cell.column.businessObject.inputExpression;
      });

      forEach(inputs, function(input) {
        if(!input.column.previous.businessObject) {
          // first cell of the inputs array has the colspan attribute set
          input.colspan = inputs.length;

          var node = domify('Input <a class="icon-dmn icon-plus"></a>');
          node.querySelector('a').addEventListener('mouseup', function() {
            var type = input.column.businessObject.inputEntry ? 'inputEntry' : 'outputEntry';
            var col = input.column;
            while(col.next && col.next.businessObject[type]) {
              col = col.next;
            }

            var newColumn = {
              id: ids.next(),
              previous: col,
              name: '',
              isInput: type === 'inputEntry'
            };

            eventBus.fire('ioLabel.createColumn', {
              newColumn: newColumn
            });
          });

          input.content = node;
        }
      });

      var outputs = cells.filter(function(cell) {
        return cell.column.businessObject && cell.column.businessObject.outputDefinition;
      });

      forEach(outputs, function(output) {
        if(output.column.previous.businessObject.inputExpression) {
          // first cell of the outputs array has the colspan attribute set
          output.colspan = outputs.length;

          var node = domify('Output <a class="icon-dmn icon-plus"></a>');
          node.querySelector('a').addEventListener('mouseup', function() {
            var type = output.column.businessObject.inputEntry ? 'inputEntry' : 'outputEntry';
            var col = output.column;
            while(col.next && col.next.businessObject && col.next.businessObject[type]) {
              col = col.next;
            }

            var newColumn = {
              id: ids.next(),
              previous: col,
              name: '',
              isInput: type === 'inputEntry'
            };

            eventBus.fire('ioLabel.createColumn', {
              newColumn: newColumn
            });
          });

          output.content = node;
        }
      });

      if(cells.length > 0) {
        graphicsFactory.update('row', cells[0].row, elementRegistry.getGraphics(cells[0].row.id));
      }
    }
  }
  eventBus.on(['cells.added', 'cells.removed'], updateColspans);

  var utilityColumn = null;
  var setRowSpanOfFirstCell = function() {
    if(utilityColumn && self.row) {
      var cell = elementRegistry.filter(function(element) {
        return element._type === 'cell' && element.row === self.row && element.column === utilityColumn;
      })[0];
      cell.rowspan = 4;
    }
  };
  eventBus.on('utilityColumn.added', function(event) {
    utilityColumn = event.column;
  });
  eventBus.on(['utilityColumn.added', 'ioLabel.added'], function(event) {
    setRowSpanOfFirstCell();
  });
}

IoLabel.$inject = [ 'eventBus', 'sheet', 'elementRegistry', 'graphicsFactory' ];

module.exports = IoLabel;

IoLabel.prototype.getRow = function() {
  return this.row;
};

},{"30":30,"324":324,"401":401}],12:[function(_dereq_,module,exports){
'use strict';

function IoLabelRenderer(
    eventBus,
    ioLabel) {

  eventBus.on('cell.render', function(event) {
    if (event.data.row === ioLabel.getRow() &&
        event.data.content &&
        !event.gfx.childNodes[0].firstChild) {
      event.gfx.childNodes[0].appendChild(event.data.content);
    }
  });

}

IoLabelRenderer.$inject = [
  'eventBus',
  'ioLabel'
];

module.exports = IoLabelRenderer;

},{}],13:[function(_dereq_,module,exports){
'use strict';

var inherits = _dereq_(322);

var RuleProvider = _dereq_(29);

/**
 * LineNumber specific modeling rule
 */
function IoLabelRules(eventBus, ioLabel) {
  RuleProvider.call(this, eventBus);

  this._ioLabel = ioLabel;
}

inherits(IoLabelRules, RuleProvider);

IoLabelRules.$inject = [ 'eventBus', 'ioLabel' ];

module.exports = IoLabelRules;

IoLabelRules.prototype.init = function() {
  var self = this;
  this.addRule('cell.edit', function(context) {
    if(context.row === self._ioLabel.row) {
      return false;
    }
  });

};

},{"29":29,"322":322}],14:[function(_dereq_,module,exports){
module.exports = {
  __init__: [ 'ioLabel', 'ioLabelRules', 'ioLabelRenderer' ],
  __depends__: [],
  ioLabel: [ 'type', _dereq_(11) ],
  ioLabelRules: [ 'type', _dereq_(13) ],
  ioLabelRenderer: [ 'type', _dereq_(12) ]
};

},{"11":11,"12":12,"13":13}],15:[function(_dereq_,module,exports){
'use strict';



var domify = _dereq_(401),
    domClasses = _dereq_(399),
    assign = _dereq_(390),
    ComboBox = _dereq_(417);

/**
 * Adds a control to the table to define the input- and output-mappings for clauses
 */
function MappingsRow(eventBus, sheet, elementRegistry, graphicsFactory, complexCell) {

  this.row = null;

  var self = this;

  // add row when the sheet is initialized
  eventBus.on('sheet.init', function(event) {

    eventBus.fire('mappingsRow.add', event);

    self.row = sheet.addRow({
      id: 'mappingsRow',
      isHead: true,
      isMappingsRow: true
    });

    eventBus.fire('mappingsRow.added', self.row);

    graphicsFactory.update('row', self.row, elementRegistry.getGraphics(self.row.id));
  });

  // remove the row when the sheet is destroyed
  eventBus.on('sheet.destroy', function(event) {

    eventBus.fire('mappingsRow.destroy', self.row);

    sheet.removeRow({
      id: 'mappingsRow'
    });

    eventBus.fire('mappingsRow.destroyed', self.row);
  });

  /**
   * Helper function to position and resize the template. This is needed for the switch between
   * the large format script editor and the small expression editor
   *
   * @param {DOMNode}   node        template root node
   * @param {TableCell} element     cell for which the template is opened
   * @param {boolean}   large       indicating whether to switch to large mode
   */
  var positionTemplate = function(node, element, large) {
    var table = sheet.getRootElement();
    if(large) {
      var e = table;
      var offset = {x:0,y:0};
      while (e)
      {
          offset.x += e.offsetLeft;
          offset.y += e.offsetTop;
          e = e.offsetParent;
      }

      assign(node.style, {
        top: offset.y + 'px',
        left: offset.x + 'px',
        width: table.clientWidth + 'px'
      });
    } else {
      var gfx = elementRegistry.getGraphics(element);

      // traverse the offset parent chain to find the offset sum
      var e = gfx;
      var offset = {x:0,y:0};
      while (e)
      {
          offset.x += e.offsetLeft;
          offset.y += e.offsetTop;
          e = e.offsetParent;
      }

      assign(node.style, {
        left: (offset.x + 2) + 'px',
        top: (offset.y - 72)  + 'px',
        width: 'auto',
        height: 'auto'
      });
    }
  };

  // when an input cell on the mappings row is added, setup the complex cell
  eventBus.on('cell.added', function(evt) {
    if(evt.element.row.id === 'mappingsRow' &&
       evt.element.column.businessObject &&
       evt.element.column.businessObject.inputExpression) {

      // cell content is the input expression of the clause
      evt.element.content = evt.element.column.businessObject.inputExpression;

      var template = domify("<div>\r\n  <div class=\"links\">\r\n    <div class=\"toggle-type\">\r\n      <a class=\"expression\">Expression</a><a class=\"script\">Script</a>\r\n    </div>\r\n    <a class=\"icon-dmn icon-clear\"></a>\r\n  </div>\r\n  <div class=\"expression region\">\r\n    <label>Expression:</label>\r\n    <input placeholder=\"propertyName\">\r\n  </div>\r\n  <div class=\"script region\">\r\n    <textarea placeholder=\"return obj.propertyName;\"></textarea>\r\n  </div>\r\n</div>\r\n");

      // initializing the comboBox
      var comboBox = new ComboBox({
        label: 'Language',
        classNames: ['dmn-combobox', 'language'],
        options: ['Javascript', 'Groovy', 'Python', 'Ruby'],
        dropdownClassNames: ['dmn-combobox-suggestions']
      });

      // When the inputExpression has a defined expressionLanguage, we assume that it is a script
      if(typeof evt.element.content.expressionLanguage !== 'undefined') {
        template.querySelector('textarea').value = evt.element.content.text || '';
        comboBox.setValue(evt.element.content.expressionLanguage);
      } else {
        template.querySelector('input').value = evt.element.content.text || '';
      }

      // --- setup event listeners ---

      // click on close button closes the template
      template.querySelector('.icon-clear').addEventListener('click', function() {
        complexCell.close();
      });

      // click on Expression link switches to expression mode
      template.querySelector('.expression').addEventListener('click', function() {
        domClasses(template.parentNode).remove('use-script');
        positionTemplate(template.parentNode, evt.element, false);
        evt.element.complex.mappingType = 'expression';
      });

      // click on Script link switches to script mode
      template.querySelector('.script').addEventListener('click', function() {
        domClasses(template.parentNode).add('use-script');
        positionTemplate(template.parentNode, evt.element, true);
        evt.element.complex.mappingType = 'script';
      });

      // add comboBox to the template
      template.querySelector('.script.region').insertBefore(
        comboBox.getNode(),
        template.querySelector('textarea')
      );

      // set the complex property to initialize complex-cell behavior
      evt.element.complex = {
        className: 'dmn-clauseexpression-setter',
        template: template,
        element: evt.element,
        mappingType: typeof evt.element.content.expressionLanguage !== 'undefined' ? 'script' : 'expression',
        comboBox: comboBox,
        type: 'mapping',
        offset: {
          x: 2,
          y: -72
        }
      };

      graphicsFactory.update('cell', evt.element, elementRegistry.getGraphics(evt.element));
    } else if(evt.element.row.id === 'mappingsRow' &&
              evt.element.column.businessObject) {

      // setup output mappings as simple cells with inline editing
      evt.element.content = evt.element.column.businessObject;
      graphicsFactory.update('cell', evt.element, elementRegistry.getGraphics(evt.element));
    }

  });

  // whenever an input mapping cell is opened, set the required mode (script vs. Expression)
  // and position the template accordingly
  eventBus.on('complexCell.open', function(evt) {
    if(evt.config.type === 'mapping') {
      if(typeof evt.config.element.content.expressionLanguage !== 'undefined') {
        evt.config.mappingType = 'script';
        domClasses(evt.container).add('use-script');
        positionTemplate(evt.container, evt.config.element, true);
      } else {
        evt.config.mappingType = 'expression';
      }
    }
  });

  // whenever an input mapping cell is closed, apply the changes to the underlying model
  eventBus.on('complexCell.close', function(evt) {
    if(evt.config.type === 'mapping') {
      var template = evt.config.template;
      if(evt.config.mappingType === 'expression') {
        eventBus.fire('mappingsRow.editInputMapping', {
          element: evt.config.element,
          expression: template.querySelector('input[placeholder="propertyName"]').value
        });
      } else if(evt.config.mappingType === 'script') {
        eventBus.fire('mappingsRow.editInputMapping', {
          element: evt.config.element,
          expression: template.querySelector('textarea').value,
          language: evt.config.comboBox.getValue()
        });
      }

    }
  });
}

MappingsRow.$inject = [ 'eventBus', 'sheet', 'elementRegistry', 'graphicsFactory', 'complexCell' ];

module.exports = MappingsRow;

MappingsRow.prototype.getRow = function() {
  return this.row;
};

},{"390":390,"399":399,"401":401,"417":417}],16:[function(_dereq_,module,exports){
'use strict';

var domClasses = _dereq_(399);

function MappingsRowRenderer(
    eventBus,
    mappingsRow) {

  // row has class 'mappings'
  eventBus.on('row.render', function(event) {
    if (event.data === mappingsRow.getRow()) {
      domClasses(event.gfx).add('mappings');
    }
  });

  eventBus.on('cell.render', function(event) {
    // input cell contains the expression or the expression language for scripts
    if (event.data.row === mappingsRow.getRow() && event.data.content &&
        event.data.column.businessObject.inputExpression) {
      if(event.data.content.expressionLanguage) {
        event.gfx.childNodes[0].textContent = event.data.content.expressionLanguage;
      } else {
        event.gfx.childNodes[0].textContent = event.data.content.text;
      }
    // output cell contains content of camunda:output attribute (which is a variable name)
    } else if (event.data.row === mappingsRow.getRow() && event.data.content) {
      event.gfx.childNodes[0].textContent = event.data.content.output;
    }
  });

}

MappingsRowRenderer.$inject = [
  'eventBus',
  'mappingsRow'
];

module.exports = MappingsRowRenderer;

},{"399":399}],17:[function(_dereq_,module,exports){
module.exports = {
  __init__: [ 'mappingsRow', 'mappingsRowRenderer' ],
  __depends__: [ _dereq_(419) ],
  mappingsRow: [ 'type', _dereq_(15) ],
  mappingsRowRenderer: [ 'type', _dereq_(16) ]
};

},{"15":15,"16":16,"419":419}],18:[function(_dereq_,module,exports){
'use strict';

var domify = _dereq_(401);

var inherits = _dereq_(322);

var BaseModule = _dereq_(424);
/**
 * Adds a header to the table containing the table name
 *
 * @param {EventBus} eventBus
 */
function TableName(eventBus, sheet, tableName) {

  BaseModule.call(this, eventBus, sheet, tableName);

  this.node = domify('<header><h3>'+this.tableName+'</h3><div class="table-id"></div></header');

  var self = this;

  eventBus.on('tableName.allowEdit', function(event) {
    if(event.editAllowed) {
      self.node.querySelector('.table-id').setAttribute('contenteditable', true);

      self.node.querySelector('.table-id').addEventListener('blur', function(evt) {
        var newId = evt.target.textContent;
        if(newId !== self.getId()) {
          eventBus.fire('tableName.editId', {
            newId: newId
          });
        }
      }, true);
    }
  });

  this.semantic = null;
}

inherits(TableName, BaseModule);

TableName.$inject = [ 'eventBus', 'sheet', 'config.tableName' ];

module.exports = TableName;

TableName.prototype.setSemantic = function(semantic) {
  this.semantic = semantic;
  this.setName(semantic.name);
  this.setId(semantic.id);
};

TableName.prototype.setName = function(newName) {
  this.semantic.name = newName;
  this.node.querySelector('h3').textContent = newName;
};

TableName.prototype.getName = function() {
  return this.semantic.name;
};

TableName.prototype.setId = function(newId) {
  if(!!newId) {
    this.semantic.id = newId;
  }
  this.node.querySelector('div').textContent = this.semantic.id;
};

TableName.prototype.getId = function() {
  return this.semantic.id;
};

},{"322":322,"401":401,"424":424}],19:[function(_dereq_,module,exports){
module.exports = {
  __init__: [ 'tableName' ],
  __depends__: [],
  tableName: [ 'type', _dereq_(18) ]
};

},{"18":18}],20:[function(_dereq_,module,exports){
'use strict';



var domify = _dereq_(401),
    domClasses = _dereq_(399),
    domClear = _dereq_(400),
    assign = _dereq_(390),
    forEach = _dereq_(324),
    ComboBox = _dereq_(417);

/**
 * Adds a control to the table to define the datatypes for clauses
 */
function TypeRow(eventBus, sheet, elementRegistry, graphicsFactory, complexCell) {

  this.row = null;

  var self = this;

  // add row when the sheet is initialized
  eventBus.on('sheet.init', function(event) {

    eventBus.fire('typeRow.add', event);

    self.row = sheet.addRow({
      id: 'typeRow',
      isHead: true,
      isTypeRow: true
    });

    eventBus.fire('typeRow.added', self.row);

    graphicsFactory.update('row', self.row, elementRegistry.getGraphics(self.row.id));
  });

  // remove the row when the sheet is destroyed
  eventBus.on('sheet.destroy', function(event) {

    eventBus.fire('typeRow.destroy', self.row);

    sheet.removeRow({
      id: 'typeRow'
    });

    eventBus.fire('typeRow.destroyed', self.row);
  });

  // when an input cell on the mappings row is added, setup the complex cell
  eventBus.on('cell.added', function(evt) {
    if(evt.element.row.id === 'typeRow' &&
       evt.element.column.businessObject) {

      // cell content is the item Definition of the clause
      if(evt.element.column.businessObject.inputExpression) {
        evt.element.content = evt.element.column.businessObject.inputExpression.itemDefinition.ref;
      } else if(evt.element.column.businessObject.outputDefinition) {
        evt.element.content = evt.element.column.businessObject.outputDefinition.ref;
      }

      var template = domify("<div>\r\n<div class=\"allowed-values\"><label>Allowed values:</label>\r\n  <ul></ul>\r\n</div>\r\n</div>\r\n");

      // initializing the comboBox
      var comboBox = new ComboBox({
        label: 'Type',
        classNames: ['dmn-combobox', 'datatype'],
        options: ['string', 'boolean', 'short', 'integer', 'long', 'double'],
        dropdownClassNames: ['dmn-combobox-suggestions']
      });

      // --- setup event listeners ---

      // display and hide the allowed value choices based on type input
      comboBox.addEventListener('valueChanged', function(evt) {
        if(evt.newValue.toLowerCase() === 'string') {
          domClasses(template.parentNode).add('choices');
        } else {
          domClasses(template.parentNode).remove('choices');
        }
      });

      // create new input fields for the allowed values list
      template.querySelector('.allowed-values ul').addEventListener('input', function(evt) {
        var list = template.querySelectorAll('.allowed-values ul li');

        // if the last element contains text, we need to add another list element for future input
        if(!!list[list.length - 1].firstChild.value) {
          var newElement = domify('<li><input tabindex="1" placeholder="Possible Value"></li>');
          template.querySelector('.allowed-values ul').appendChild(newElement);
        }
      });

      // remove empty input fields (if it is not the last one)
      template.querySelector('.allowed-values ul').addEventListener('blur', function(evt) {
        if(!evt.target.value && evt.target.parentNode.parentNode.lastChild !== evt.target.parentNode) {
          evt.target.parentNode.parentNode.removeChild(evt.target.parentNode);
        }
      }, true);


      // add comboBox to the template
      template.insertBefore(
        comboBox.getNode(),
        template.firstChild
      );

      // set the complex property to initialize complex-cell behavior
      evt.element.complex = {
        className: 'dmn-clausevalues-setter',
        template: template,
        element: evt.element,
        comboBox: comboBox,
        type: 'type',
        offset: {
          x: 0,
          y: 0
        }
      };

      graphicsFactory.update('cell', evt.element, elementRegistry.getGraphics(evt.element));
    }
  });


  // whenever an type cell is opened, we have to position the template, because the x offset changes
  // over time, when columns are added and deleted
  eventBus.on('complexCell.open', function(evt) {
    if(evt.config.type === 'type') {
      var gfx = elementRegistry.getGraphics(evt.config.element);

      // traverse the offset parent chain to find the offset sum
      var e = gfx;
      var offset = {x:0,y:0};
      while (e)
      {
          offset.x += e.offsetLeft;
          offset.y += e.offsetTop;
          e = e.offsetParent;
      }

      assign(evt.container.style, {
        left: (offset.x + gfx.clientWidth) + 'px',
        top: (offset.y - 15)  + 'px',
        width: 'auto',
        height: 'auto'
      });

      // feed the values to the template and combobox
      evt.config.comboBox.setValue(evt.config.element.content.typeDefinition);

      var template = evt.config.template;
      // clear allowed values
      domClear(template.querySelector('.allowed-values ul'));

      // set the allowed values
      if(evt.config.element.content.allowedValue) {
        forEach(evt.config.element.content.allowedValue, function(allowedValue) {
          var newElement = domify('<li><input tabindex="1" placeholder="Possible Value"></li>');
          newElement.firstChild.value = allowedValue.text;
          template.querySelector('.allowed-values ul').appendChild(newElement);
        });
      }
      // add empty input field
      var newElement = domify('<li><input tabindex="1" placeholder="Possible Value"></li>');
      template.querySelector('.allowed-values ul').appendChild(newElement);
    }
  });

  // whenever a datatype cell is closed, apply the changes to the underlying model
  eventBus.on('complexCell.close', function(evt) {
    if(evt.config.type === 'type') {
      if(evt.config.comboBox.getValue().toLowerCase() === 'string') {

        // special string handling for allowed values
        var nodeList = evt.config.template.querySelectorAll('.allowed-values ul li');

        // node list is not an array, so we have to do the mapping manually
        var arrayOfValues = [];
        for(var i = 0; i < nodeList.length - 1; i++) {
          arrayOfValues.push(nodeList[i].firstChild.value);
        }

        eventBus.fire('typeRow.editDataType', {
          element: evt.config.element,
          dataType: evt.config.comboBox.getValue(),
          allowedValues: arrayOfValues
        });

      } else {
        eventBus.fire('typeRow.editDataType', {
          element: evt.config.element,
          dataType: evt.config.comboBox.getValue()
        });

      }
    }
  });

}

TypeRow.$inject = [ 'eventBus', 'sheet', 'elementRegistry', 'graphicsFactory', 'complexCell' ];

module.exports = TypeRow;

TypeRow.prototype.getRow = function() {
  return this.row;
};

},{"324":324,"390":390,"399":399,"400":400,"401":401,"417":417}],21:[function(_dereq_,module,exports){
'use strict';

var domClasses = _dereq_(399);

function TypeRowRenderer(
    eventBus,
    typeRow) {

  // row has class 'mappings'
  eventBus.on('row.render', function(event) {
    if (event.data === typeRow.getRow()) {
      domClasses(event.gfx).add('values');
    }
  });

  eventBus.on('cell.render', function(event) {
    if (event.data.row === typeRow.getRow() && event.data.content) {
      if(event.data.content.allowedValue && event.data.content.allowedValue.length > 0) {
        event.gfx.childNodes[0].textContent = '(' + event.data.content.allowedValue.map(function(allowedValueObj) {
          return allowedValueObj.text;
        }).join(', ') + ')';
      } else {
        event.gfx.childNodes[0].textContent = event.data.content.typeDefinition;
      }
    }
  });

}

TypeRowRenderer.$inject = [
  'eventBus',
  'typeRow'
];

module.exports = TypeRowRenderer;

},{"399":399}],22:[function(_dereq_,module,exports){
module.exports = {
  __init__: [ 'typeRow', 'typeRowRenderer' ],
  __depends__: [ _dereq_(419) ],
  typeRow: [ 'type', _dereq_(20) ],
  typeRowRenderer: [ 'type', _dereq_(21) ]
};

},{"20":20,"21":21,"419":419}],23:[function(_dereq_,module,exports){
'use strict';

var assign = _dereq_(390);

var elementToString = _dereq_(26).elementToString;


function elementData(semantic, attrs) {
  return assign({
    id: semantic.id,
    type: semantic.$type,
    businessObject: semantic
  }, attrs);
}


/**
 * An importer that adds dmn elements to the sheet
 *
 * @param {EventBus} eventBus
 * @param {Sheet} sheet
 * @param {ElementFactory} elementFactory
 * @param {ElementRegistry} elementRegistry
 */
function DmnImporter(eventBus, sheet, elementRegistry, elementFactory, moddle, tableName, ioLabel, dmnFactory) {
  this._eventBus = eventBus;
  this._sheet = sheet;

  this._elementRegistry = elementRegistry;
  this._elementFactory = elementFactory;
  this._tableName = tableName;
  this._dmnFactory = dmnFactory;

  this._ioLabel = ioLabel;

  this._moddle = moddle;

  this.usedEntries = [];
}

DmnImporter.$inject = [ 'eventBus', 'sheet', 'elementRegistry', 'elementFactory', 'moddle', 'tableName', 'ioLabel', 'dmnFactory' ];

module.exports = DmnImporter;


DmnImporter.prototype._makeCopy = function(semantic) {
  var newSemantic = this._moddle.create(semantic.$type);

  for(var prop in semantic) {
    if(semantic.hasOwnProperty(prop) && prop !== '$type') {
      newSemantic[prop] = semantic[prop];
    }
  }
  newSemantic.$parent = semantic.$parent;

  return newSemantic;
};

/**
 * Add dmn element (semantic) to the sheet onto the
 * parent element.
 */
DmnImporter.prototype.add = function(semantic, parentElement, definitions) {

  var element;

  if (semantic.$instanceOf('dmn:DecisionTable')) {
    // Add the header row
    element = this._elementFactory.createRow(elementData(semantic, {
      isHead: true,
      isClauseRow: true,
      previous: this._ioLabel.getRow()
    }));
    this._sheet.addRow(element, parentElement);

    this._tableName.setSemantic(semantic.$parent);
  }

  // CLAUSE
  else if (semantic.$instanceOf('dmn:Clause')) {
    if(semantic.inputExpression && !semantic.inputEntry) {
      semantic.inputEntry = [];
    } else
    if(semantic.outputDefinition && !semantic.outputEntry) {
      semantic.outputEntry = [];
    }

    if(!definitions.ItemDefinition) {
      // must create the ItemDefinition array
      definitions.ItemDefinition = [];
    }

    // wire the itemDefinition
    // TODO: create an itemdefinition if none exist
    var link;
    if(semantic.inputExpression) {
      if(!semantic.inputExpression.itemDefinition) {
        // need to create an itemdefinition for the inputExpression
        semantic.inputExpression.itemDefinition = this._dmnFactory.create('dmn:DMNElementReference', {});
        semantic.inputExpression.itemDefinition.ref = this._dmnFactory.createItemDefinition();
        definitions.ItemDefinition.push(semantic.inputExpression.itemDefinition.ref);
        semantic.inputExpression.itemDefinition.href = '#' + semantic.inputExpression.itemDefinition.ref.id;
      }
      link = semantic.inputExpression.itemDefinition.href;
    } else {
      if(!semantic.outputDefinition) {
        semantic.outputDefinition = this._dmnFactory.create('dmn:DMNElementReference', {});
        semantic.outputDefinition.ref = this._dmnFactory.createItemDefinition();
        definitions.ItemDefinition.push(semantic.outputDefinition.ref);
        semantic.outputDefinition.href = '#' + semantic.outputDefinition.ref.id;
      }
      link = semantic.outputDefinition.href;
    }
    var prop = semantic.inputExpression ?
               semantic.inputExpression.itemDefinition :
               semantic.outputDefinition;
    prop.ref =
      definitions.ItemDefinition.filter(function(itemDefinition) {
        return itemDefinition.id === link.substr(link.indexOf('#')+1);
      })[0];

    element = this._elementFactory.createColumn(elementData(semantic, {

    }));

    this._sheet.addColumn(element, parentElement);
  }

  // RULE
  else if (semantic.$instanceOf('dmn:DecisionRule')) {
    if(!semantic.condition) {
      semantic.condition = [];
    }
    if(!semantic.conclusion) {
      semantic.conclusion = [];
    }
    element = this._elementFactory.createRow(elementData(semantic, {

    }));
    this._sheet.addRow(element, parentElement);

  }

  // CELL
  else if (semantic.$instanceOf('dmn:LiteralExpression')) {

    // now I have to get the ID of the row and the column
    var column = this._elementRegistry.filter(function(ea) {
      return ea.businessObject === semantic.$parent;
    })[0].id;

    var row = this._elementRegistry.filter(function(ea) {
      return ea.businessObject === parentElement;
    })[0].id;

    var content = semantic;
    if(this.usedEntries.indexOf(semantic) !== -1) {
      content = this._makeCopy(semantic);
      content.id = row + '_' + column;
      content.$parent[content.$parent.inputEntry ? 'inputEntry' : 'outputEntry'].push(content);
      var ruleProp = !!content.$parent.inputEntry ? 'condition' : 'conclusion';
      parentElement[ruleProp].splice(parentElement[ruleProp].indexOf(semantic), 1, content);
    }

    this._sheet.setCellContent({
      row: row,
      column: column,
      content: content
    });

    this.usedEntries.push(content);

  } else {
    throw new Error('can not render element ' + elementToString(semantic));
  }

  this._eventBus.fire('dmnElement.added', { element: element });

  return element;
};

},{"26":26,"390":390}],24:[function(_dereq_,module,exports){
'use strict';

var forEach = _dereq_(324),
    sortBy = _dereq_(325);

var elementToString = _dereq_(26).elementToString;

function DmnTreeWalker(handler) {

  function visit(element, ctx, definitions) {

    var gfx = element.gfx;

    // avoid multiple rendering of elements
    if (gfx) {
      throw new Error('already rendered ' + elementToString(element));
    }

    // call handler
    return handler.element(element, ctx, definitions);
  }

  function visitTable(element) {
    return handler.table(element);
  }

  ////// Semantic handling //////////////////////

  function handleDefinitions(definitions) {
    // make sure we walk the correct bpmnElement

    var decisions = definitions.Decision,
        decision;

    if (decisions && decisions.length) {
      decision = decisions[0];
    }

    // no decision -> nothing to import
    if (!decision) {
      return;
    }

    var table = decision.DecisionTable;


    // no decision table -> nothing to import
    if(!table) {
      throw new Error('no table for ' + elementToString(decision));
    }

    var ctx = visitTable(table);

    handleClauses(table.clause, ctx, definitions);

    handleRules(table.rule, ctx, definitions);

  }

  function handleClauses(clauses, context, definitions) {
    forEach(sortBy(clauses, function(clause) {
      return !clause.inputExpression;
    }), function(e) {
      visit(e, context, definitions);
    });
  }

  function handleRules(rules, context, definitions) {
    forEach(rules, function(e) {
      visit(e, context, definitions);

      handleConditions(e.condition, e);

      handleConclusions(e.conclusion, e);
    });
  }

  function handleConditions(conditions, context, definitions) {
    forEach(conditions, function(e) {
      visit(e, context, definitions);
    });
  }

  function handleConclusions(conclusions, context, definitions) {
    forEach(conclusions, function(e) {
      visit(e, context, definitions);
    });
  }

  ///// API ////////////////////////////////

  return {
    handleDefinitions: handleDefinitions
  };
}

module.exports = DmnTreeWalker;

},{"26":26,"324":324,"325":325}],25:[function(_dereq_,module,exports){
'use strict';

var DmnTreeWalker = _dereq_(24);


/**
 * Import the definitions into a table.
 *
 * Errors and warnings are reported through the specified callback.
 *
 * @param  {Sheet} sheet
 * @param  {ModdleElement} definitions
 * @param  {Function} done the callback, invoked with (err, [ warning ]) once the import is done
 */
function importDmnTable(sheet, definitions, done) {

  var importer = sheet.get('dmnImporter'),
      eventBus = sheet.get('eventBus');

  var error,
      warnings = [];

  function parse(definitions) {

    var visitor = {

      table: function(element) {
        return importer.add(element);
      },

      element: function(element, parentShape, definitions) {
        return importer.add(element, parentShape, definitions);
      },

      error: function(message, context) {
        warnings.push({ message: message, context: context });
      }
    };

    var walker = new DmnTreeWalker(visitor);

    // import
    walker.handleDefinitions(definitions);
  }

  eventBus.fire('import.start');

  try {
    parse(definitions);
  } catch (e) {
    error = e;
  }

  eventBus.fire(error ? 'import.error' : 'import.success', { error: error, warnings: warnings });
  done(error, warnings);
}

module.exports.importDmnTable = importDmnTable;

},{"24":24}],26:[function(_dereq_,module,exports){
'use strict';

module.exports.elementToString = function(e) {
  if (!e) {
    return '<null>';
  }

  return '<' + e.$type + (e.id ? ' id="' + e.id : '') + '" />';
};
},{}],27:[function(_dereq_,module,exports){
module.exports = {
  __depends__: [
    _dereq_(10)
  ],
  dmnImporter: [ 'type', _dereq_(23) ]
};

},{"10":10,"23":23}],28:[function(_dereq_,module,exports){
'use strict';

var forEach = _dereq_(32),
    isFunction = _dereq_(54),
    isArray = _dereq_(53),
    isNumber = _dereq_(56);


var DEFAULT_PRIORITY = 1000;


/**
 * A utility that can be used to plug-in into the command execution for
 * extension and/or validation.
 *
 * @param {EventBus} eventBus
 *
 * @example
 *
 * var inherits = require('inherits');
 *
 * var CommandInterceptor = require('diagram-js/lib/command/CommandInterceptor');
 *
 * function CommandLogger(eventBus) {
 *   CommandInterceptor.call(this, eventBus);
 *
 *   this.preExecute(function(event) {
 *     console.log('command pre-execute', event);
 *   });
 * }
 *
 * inherits(CommandLogger, CommandInterceptor);
 *
 */
function CommandInterceptor(eventBus) {
  this._eventBus = eventBus;
}

CommandInterceptor.$inject = [ 'eventBus' ];

module.exports = CommandInterceptor;

function unwrapEvent(fn) {
  return function(event) {
    return fn(event.context, event.command, event);
  };
}

/**
 * Register an interceptor for a command execution
 *
 * @param {String|Array<String>} [events] list of commands to register on
 * @param {String} [hook] command hook, i.e. preExecute, executed to listen on
 * @param {Number} [priority] the priority on which to hook into the execution
 * @param {Function} handlerFn interceptor to be invoked with (event)
 * @param {Boolean} unwrap if true, unwrap the event and pass (context, command, event) to the
 *                          listener instead
 */
CommandInterceptor.prototype.on = function(events, hook, priority, handlerFn, unwrap) {

  if (isFunction(hook) || isNumber(hook)) {
    unwrap = handlerFn;
    handlerFn = priority;
    priority = hook;
    hook = null;
  }

  if (isFunction(priority)) {
    unwrap = handlerFn;
    handlerFn = priority;
    priority = DEFAULT_PRIORITY;
  }

  if (!isFunction(handlerFn)) {
    throw new Error('handlerFn must be a function');
  }

  if (!isArray(events)) {
    events = [ events ];
  }

  var eventBus = this._eventBus;

  forEach(events, function(event) {
    // concat commandStack(.event)?(.hook)?
    var fullEvent = [ 'commandStack', event, hook ].filter(function(e) { return e; }).join('.');

    eventBus.on(fullEvent, priority, unwrap ? unwrapEvent(handlerFn) : handlerFn);
  });
};


var hooks = [
  'canExecute',
  'preExecute',
  'execute',
  'executed',
  'postExecute',
  'revert',
  'reverted'
];

/*
 * Install hook shortcuts
 *
 * This will generate the CommandInterceptor#(preExecute|...|reverted) methods
 * which will in term forward to CommandInterceptor#on.
 */
forEach(hooks, function(hook) {

  /**
   * {canExecute|preExecute|execute|executed|postExecute|revert|reverted}
   *
   * A named hook for plugging into the command execution
   *
   * @param {String|Array<String>} [events] list of commands to register on
   * @param {Number} [priority] the priority on which to hook into the execution
   * @param {Function} handlerFn interceptor to be invoked with (event)
   * @param {Boolean} [unwrap=false] if true, unwrap the event and pass (context, command, event) to the
   *                          listener instead
   */
  CommandInterceptor.prototype[hook] = function(events, priority, handlerFn, unwrap) {

    if (isFunction(events) || isNumber(events)) {
      unwrap = handlerFn;
      handlerFn = priority;
      priority = events;
      events = null;
    }

    this.on(events, hook, priority, handlerFn, unwrap);
  };
});
},{"32":32,"53":53,"54":54,"56":56}],29:[function(_dereq_,module,exports){
'use strict';

var inherits = _dereq_(31);

var CommandInterceptor = _dereq_(28);

/**
 * A basic provider that may be extended to implement modeling rules.
 *
 * Extensions should implement the init method to actually add their custom
 * modeling checks. Checks may be added via the #addRule(action, fn) method.
 *
 * @param {EventBus} eventBus
 */
function RuleProvider(eventBus) {
  CommandInterceptor.call(this, eventBus);

  this.init();
}

RuleProvider.$inject = [ 'eventBus' ];

inherits(RuleProvider, CommandInterceptor);

module.exports = RuleProvider;


/**
 * Adds a modeling rule for the given action, implemented through a callback function.
 *
 * The function will receive the modeling specific action context to perform its check.
 * It must return false or null to disallow the action from happening.
 *
 * Returning <code>null</code> may encode simply ignoring the action.
 *
 * @example
 *
 * ResizableRules.prototype.init = function() {
 *
 *   this.addRule('shape.resize', function(context) {
 *
 *     var shape = context.shape;
 *
 *     if (!context.newBounds) {
 *       // check general resizability
 *       if (!shape.resizable) {
 *         return false;
 *       }
 *     } else {
 *       // element must have minimum size of 10*10 points
 *       return context.newBounds.width > 10 && context.newBounds.height > 10;
 *     }
 *   });
 * };
 *
 * @param {String|Array<String>} actions the identifier for the modeling action to check
 * @param {Number} [priority] the priority at which this rule is being applied
 * @param {Function} fn the callback function that performs the actual check
 */
RuleProvider.prototype.addRule = function(actions, priority, fn) {

  var self = this;

  if (typeof actions === 'string') {
    actions = [ actions ];
  }

  actions.forEach(function(action) {

    self.canExecute(action, priority, function(context, action, event) {
      return fn(context);
    }, true);
  });
};
},{"28":28,"31":31}],30:[function(_dereq_,module,exports){
'use strict';

/**
 * Util that provides unique IDs.
 *
 * @class djs.util.IdGenerator
 * @constructor
 * @memberOf djs.util
 *
 * The ids can be customized via a given prefix and contain a random value to avoid collisions.
 *
 * @param {String} prefix a prefix to prepend to generated ids (for better readability)
 */
function IdGenerator(prefix) {

  this._counter = 0;
  this._prefix = (prefix ? prefix + '-' : '') + Math.floor(Math.random() * 1000000000) + '-';
}

module.exports = IdGenerator;

/**
 * Returns a next unique ID.
 *
 * @method djs.util.IdGenerator#next
 *
 * @returns {String} the id
 */
IdGenerator.prototype.next = function() {
  return this._prefix + (++this._counter);
};

},{}],31:[function(_dereq_,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],32:[function(_dereq_,module,exports){
var arrayEach = _dereq_(33),
    baseEach = _dereq_(34),
    createForEach = _dereq_(43);

/**
 * Iterates over elements of `collection` invoking `iteratee` for each element.
 * The `iteratee` is bound to `thisArg` and invoked with three arguments:
 * (value, index|key, collection). Iteratee functions may exit iteration early
 * by explicitly returning `false`.
 *
 * **Note:** As with other "Collections" methods, objects with a "length" property
 * are iterated like arrays. To avoid this behavior `_.forIn` or `_.forOwn`
 * may be used for object iteration.
 *
 * @static
 * @memberOf _
 * @alias each
 * @category Collection
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
 * @param {*} [thisArg] The `this` binding of `iteratee`.
 * @returns {Array|Object|string} Returns `collection`.
 * @example
 *
 * _([1, 2]).forEach(function(n) {
 *   console.log(n);
 * }).value();
 * // => logs each value from left to right and returns the array
 *
 * _.forEach({ 'a': 1, 'b': 2 }, function(n, key) {
 *   console.log(n, key);
 * });
 * // => logs each value-key pair and returns the object (iteration order is not guaranteed)
 */
var forEach = createForEach(arrayEach, baseEach);

module.exports = forEach;

},{"33":33,"34":34,"43":43}],33:[function(_dereq_,module,exports){
/**
 * A specialized version of `_.forEach` for arrays without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns `array`.
 */
function arrayEach(array, iteratee) {
  var index = -1,
      length = array.length;

  while (++index < length) {
    if (iteratee(array[index], index, array) === false) {
      break;
    }
  }
  return array;
}

module.exports = arrayEach;

},{}],34:[function(_dereq_,module,exports){
var baseForOwn = _dereq_(36),
    createBaseEach = _dereq_(41);

/**
 * The base implementation of `_.forEach` without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array|Object|string} Returns `collection`.
 */
var baseEach = createBaseEach(baseForOwn);

module.exports = baseEach;

},{"36":36,"41":41}],35:[function(_dereq_,module,exports){
var createBaseFor = _dereq_(42);

/**
 * The base implementation of `baseForIn` and `baseForOwn` which iterates
 * over `object` properties returned by `keysFunc` invoking `iteratee` for
 * each property. Iteratee functions may exit iteration early by explicitly
 * returning `false`.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @returns {Object} Returns `object`.
 */
var baseFor = createBaseFor();

module.exports = baseFor;

},{"42":42}],36:[function(_dereq_,module,exports){
var baseFor = _dereq_(35),
    keys = _dereq_(58);

/**
 * The base implementation of `_.forOwn` without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Object} Returns `object`.
 */
function baseForOwn(object, iteratee) {
  return baseFor(object, iteratee, keys);
}

module.exports = baseForOwn;

},{"35":35,"58":58}],37:[function(_dereq_,module,exports){
/**
 * The base implementation of `_.isFunction` without support for environments
 * with incorrect `typeof` results.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 */
function baseIsFunction(value) {
  // Avoid a Chakra JIT bug in compatibility modes of IE 11.
  // See https://github.com/jashkenas/underscore/issues/1621 for more details.
  return typeof value == 'function' || false;
}

module.exports = baseIsFunction;

},{}],38:[function(_dereq_,module,exports){
/**
 * The base implementation of `_.property` without support for deep paths.
 *
 * @private
 * @param {string} key The key of the property to get.
 * @returns {Function} Returns the new function.
 */
function baseProperty(key) {
  return function(object) {
    return object == null ? undefined : object[key];
  };
}

module.exports = baseProperty;

},{}],39:[function(_dereq_,module,exports){
/**
 * Converts `value` to a string if it's not one. An empty string is returned
 * for `null` or `undefined` values.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
 */
function baseToString(value) {
  if (typeof value == 'string') {
    return value;
  }
  return value == null ? '' : (value + '');
}

module.exports = baseToString;

},{}],40:[function(_dereq_,module,exports){
var identity = _dereq_(61);

/**
 * A specialized version of `baseCallback` which only supports `this` binding
 * and specifying the number of arguments to provide to `func`.
 *
 * @private
 * @param {Function} func The function to bind.
 * @param {*} thisArg The `this` binding of `func`.
 * @param {number} [argCount] The number of arguments to provide to `func`.
 * @returns {Function} Returns the callback.
 */
function bindCallback(func, thisArg, argCount) {
  if (typeof func != 'function') {
    return identity;
  }
  if (thisArg === undefined) {
    return func;
  }
  switch (argCount) {
    case 1: return function(value) {
      return func.call(thisArg, value);
    };
    case 3: return function(value, index, collection) {
      return func.call(thisArg, value, index, collection);
    };
    case 4: return function(accumulator, value, index, collection) {
      return func.call(thisArg, accumulator, value, index, collection);
    };
    case 5: return function(value, other, key, object, source) {
      return func.call(thisArg, value, other, key, object, source);
    };
  }
  return function() {
    return func.apply(thisArg, arguments);
  };
}

module.exports = bindCallback;

},{"61":61}],41:[function(_dereq_,module,exports){
var getLength = _dereq_(44),
    isLength = _dereq_(48),
    toObject = _dereq_(51);

/**
 * Creates a `baseEach` or `baseEachRight` function.
 *
 * @private
 * @param {Function} eachFunc The function to iterate over a collection.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new base function.
 */
function createBaseEach(eachFunc, fromRight) {
  return function(collection, iteratee) {
    var length = collection ? getLength(collection) : 0;
    if (!isLength(length)) {
      return eachFunc(collection, iteratee);
    }
    var index = fromRight ? length : -1,
        iterable = toObject(collection);

    while ((fromRight ? index-- : ++index < length)) {
      if (iteratee(iterable[index], index, iterable) === false) {
        break;
      }
    }
    return collection;
  };
}

module.exports = createBaseEach;

},{"44":44,"48":48,"51":51}],42:[function(_dereq_,module,exports){
var toObject = _dereq_(51);

/**
 * Creates a base function for `_.forIn` or `_.forInRight`.
 *
 * @private
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new base function.
 */
function createBaseFor(fromRight) {
  return function(object, iteratee, keysFunc) {
    var iterable = toObject(object),
        props = keysFunc(object),
        length = props.length,
        index = fromRight ? length : -1;

    while ((fromRight ? index-- : ++index < length)) {
      var key = props[index];
      if (iteratee(iterable[key], key, iterable) === false) {
        break;
      }
    }
    return object;
  };
}

module.exports = createBaseFor;

},{"51":51}],43:[function(_dereq_,module,exports){
var bindCallback = _dereq_(40),
    isArray = _dereq_(53);

/**
 * Creates a function for `_.forEach` or `_.forEachRight`.
 *
 * @private
 * @param {Function} arrayFunc The function to iterate over an array.
 * @param {Function} eachFunc The function to iterate over a collection.
 * @returns {Function} Returns the new each function.
 */
function createForEach(arrayFunc, eachFunc) {
  return function(collection, iteratee, thisArg) {
    return (typeof iteratee == 'function' && thisArg === undefined && isArray(collection))
      ? arrayFunc(collection, iteratee)
      : eachFunc(collection, bindCallback(iteratee, thisArg, 3));
  };
}

module.exports = createForEach;

},{"40":40,"53":53}],44:[function(_dereq_,module,exports){
var baseProperty = _dereq_(38);

/**
 * Gets the "length" property value of `object`.
 *
 * **Note:** This function is used to avoid a [JIT bug](https://bugs.webkit.org/show_bug.cgi?id=142792)
 * that affects Safari on at least iOS 8.1-8.3 ARM64.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {*} Returns the "length" value.
 */
var getLength = baseProperty('length');

module.exports = getLength;

},{"38":38}],45:[function(_dereq_,module,exports){
var isNative = _dereq_(55);

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative(object, key) {
  var value = object == null ? undefined : object[key];
  return isNative(value) ? value : undefined;
}

module.exports = getNative;

},{"55":55}],46:[function(_dereq_,module,exports){
var getLength = _dereq_(44),
    isLength = _dereq_(48);

/**
 * Checks if `value` is array-like.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 */
function isArrayLike(value) {
  return value != null && isLength(getLength(value));
}

module.exports = isArrayLike;

},{"44":44,"48":48}],47:[function(_dereq_,module,exports){
/** Used to detect unsigned integer values. */
var reIsUint = /^\d+$/;

/**
 * Used as the [maximum length](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-number.max_safe_integer)
 * of an array-like value.
 */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex(value, length) {
  value = (typeof value == 'number' || reIsUint.test(value)) ? +value : -1;
  length = length == null ? MAX_SAFE_INTEGER : length;
  return value > -1 && value % 1 == 0 && value < length;
}

module.exports = isIndex;

},{}],48:[function(_dereq_,module,exports){
/**
 * Used as the [maximum length](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-number.max_safe_integer)
 * of an array-like value.
 */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This function is based on [`ToLength`](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength).
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 */
function isLength(value) {
  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

module.exports = isLength;

},{}],49:[function(_dereq_,module,exports){
/**
 * Checks if `value` is object-like.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

module.exports = isObjectLike;

},{}],50:[function(_dereq_,module,exports){
var isArguments = _dereq_(52),
    isArray = _dereq_(53),
    isIndex = _dereq_(47),
    isLength = _dereq_(48),
    keysIn = _dereq_(59);

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * A fallback implementation of `Object.keys` which creates an array of the
 * own enumerable property names of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function shimKeys(object) {
  var props = keysIn(object),
      propsLength = props.length,
      length = propsLength && object.length;

  var allowIndexes = !!length && isLength(length) &&
    (isArray(object) || isArguments(object));

  var index = -1,
      result = [];

  while (++index < propsLength) {
    var key = props[index];
    if ((allowIndexes && isIndex(key, length)) || hasOwnProperty.call(object, key)) {
      result.push(key);
    }
  }
  return result;
}

module.exports = shimKeys;

},{"47":47,"48":48,"52":52,"53":53,"59":59}],51:[function(_dereq_,module,exports){
var isObject = _dereq_(57);

/**
 * Converts `value` to an object if it's not one.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {Object} Returns the object.
 */
function toObject(value) {
  return isObject(value) ? value : Object(value);
}

module.exports = toObject;

},{"57":57}],52:[function(_dereq_,module,exports){
var isArrayLike = _dereq_(46),
    isObjectLike = _dereq_(49);

/** `Object#toString` result references. */
var argsTag = '[object Arguments]';

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * Checks if `value` is classified as an `arguments` object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
function isArguments(value) {
  return isObjectLike(value) && isArrayLike(value) && objToString.call(value) == argsTag;
}

module.exports = isArguments;

},{"46":46,"49":49}],53:[function(_dereq_,module,exports){
var getNative = _dereq_(45),
    isLength = _dereq_(48),
    isObjectLike = _dereq_(49);

/** `Object#toString` result references. */
var arrayTag = '[object Array]';

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/* Native method references for those with the same name as other `lodash` methods. */
var nativeIsArray = getNative(Array, 'isArray');

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(function() { return arguments; }());
 * // => false
 */
var isArray = nativeIsArray || function(value) {
  return isObjectLike(value) && isLength(value.length) && objToString.call(value) == arrayTag;
};

module.exports = isArray;

},{"45":45,"48":48,"49":49}],54:[function(_dereq_,module,exports){
(function (global){
var baseIsFunction = _dereq_(37),
    getNative = _dereq_(45);

/** `Object#toString` result references. */
var funcTag = '[object Function]';

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/** Native method references. */
var Uint8Array = getNative(global, 'Uint8Array');

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
var isFunction = !(baseIsFunction(/x/) || (Uint8Array && !baseIsFunction(Uint8Array))) ? baseIsFunction : function(value) {
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in older versions of Chrome and Safari which return 'function' for regexes
  // and Safari 8 equivalents which return 'object' for typed array constructors.
  return objToString.call(value) == funcTag;
};

module.exports = isFunction;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"37":37,"45":45}],55:[function(_dereq_,module,exports){
var escapeRegExp = _dereq_(60),
    isObjectLike = _dereq_(49);

/** `Object#toString` result references. */
var funcTag = '[object Function]';

/** Used to detect host constructors (Safari > 5). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var fnToString = Function.prototype.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the [`toStringTag`](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' +
  escapeRegExp(fnToString.call(hasOwnProperty))
  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
);

/**
 * Checks if `value` is a native function.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function, else `false`.
 * @example
 *
 * _.isNative(Array.prototype.push);
 * // => true
 *
 * _.isNative(_);
 * // => false
 */
function isNative(value) {
  if (value == null) {
    return false;
  }
  if (objToString.call(value) == funcTag) {
    return reIsNative.test(fnToString.call(value));
  }
  return isObjectLike(value) && reIsHostCtor.test(value);
}

module.exports = isNative;

},{"49":49,"60":60}],56:[function(_dereq_,module,exports){
var isObjectLike = _dereq_(49);

/** `Object#toString` result references. */
var numberTag = '[object Number]';

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * Checks if `value` is classified as a `Number` primitive or object.
 *
 * **Note:** To exclude `Infinity`, `-Infinity`, and `NaN`, which are classified
 * as numbers, use the `_.isFinite` method.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isNumber(8.4);
 * // => true
 *
 * _.isNumber(NaN);
 * // => true
 *
 * _.isNumber('8.4');
 * // => false
 */
function isNumber(value) {
  return typeof value == 'number' || (isObjectLike(value) && objToString.call(value) == numberTag);
}

module.exports = isNumber;

},{"49":49}],57:[function(_dereq_,module,exports){
/**
 * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(1);
 * // => false
 */
function isObject(value) {
  // Avoid a V8 JIT bug in Chrome 19-20.
  // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

module.exports = isObject;

},{}],58:[function(_dereq_,module,exports){
var getNative = _dereq_(45),
    isArrayLike = _dereq_(46),
    isObject = _dereq_(57),
    shimKeys = _dereq_(50);

/* Native method references for those with the same name as other `lodash` methods. */
var nativeKeys = getNative(Object, 'keys');

/**
 * Creates an array of the own enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects. See the
 * [ES spec](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.keys)
 * for more details.
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keys(new Foo);
 * // => ['a', 'b'] (iteration order is not guaranteed)
 *
 * _.keys('hi');
 * // => ['0', '1']
 */
var keys = !nativeKeys ? shimKeys : function(object) {
  var Ctor = object == null ? null : object.constructor;
  if ((typeof Ctor == 'function' && Ctor.prototype === object) ||
      (typeof object != 'function' && isArrayLike(object))) {
    return shimKeys(object);
  }
  return isObject(object) ? nativeKeys(object) : [];
};

module.exports = keys;

},{"45":45,"46":46,"50":50,"57":57}],59:[function(_dereq_,module,exports){
var isArguments = _dereq_(52),
    isArray = _dereq_(53),
    isIndex = _dereq_(47),
    isLength = _dereq_(48),
    isObject = _dereq_(57);

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Creates an array of the own and inherited enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects.
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keysIn(new Foo);
 * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
 */
function keysIn(object) {
  if (object == null) {
    return [];
  }
  if (!isObject(object)) {
    object = Object(object);
  }
  var length = object.length;
  length = (length && isLength(length) &&
    (isArray(object) || isArguments(object)) && length) || 0;

  var Ctor = object.constructor,
      index = -1,
      isProto = typeof Ctor == 'function' && Ctor.prototype === object,
      result = Array(length),
      skipIndexes = length > 0;

  while (++index < length) {
    result[index] = (index + '');
  }
  for (var key in object) {
    if (!(skipIndexes && isIndex(key, length)) &&
        !(key == 'constructor' && (isProto || !hasOwnProperty.call(object, key)))) {
      result.push(key);
    }
  }
  return result;
}

module.exports = keysIn;

},{"47":47,"48":48,"52":52,"53":53,"57":57}],60:[function(_dereq_,module,exports){
var baseToString = _dereq_(39);

/**
 * Used to match `RegExp` [special characters](http://www.regular-expressions.info/characters.html#special).
 * In addition to special characters the forward slash is escaped to allow for
 * easier `eval` use and `Function` compilation.
 */
var reRegExpChars = /[.*+?^${}()|[\]\/\\]/g,
    reHasRegExpChars = RegExp(reRegExpChars.source);

/**
 * Escapes the `RegExp` special characters "\", "/", "^", "$", ".", "|", "?",
 * "*", "+", "(", ")", "[", "]", "{" and "}" in `string`.
 *
 * @static
 * @memberOf _
 * @category String
 * @param {string} [string=''] The string to escape.
 * @returns {string} Returns the escaped string.
 * @example
 *
 * _.escapeRegExp('[lodash](https://lodash.com/)');
 * // => '\[lodash\]\(https:\/\/lodash\.com\/\)'
 */
function escapeRegExp(string) {
  string = baseToString(string);
  return (string && reHasRegExpChars.test(string))
    ? string.replace(reRegExpChars, '\\$&')
    : string;
}

module.exports = escapeRegExp;

},{"39":39}],61:[function(_dereq_,module,exports){
/**
 * This method returns the first argument provided to it.
 *
 * @static
 * @memberOf _
 * @category Utility
 * @param {*} value Any value.
 * @returns {*} Returns `value`.
 * @example
 *
 * var object = { 'user': 'fred' };
 *
 * _.identity(object) === object;
 * // => true
 */
function identity(value) {
  return value;
}

module.exports = identity;

},{}],62:[function(_dereq_,module,exports){
module.exports = _dereq_(65);
},{"65":65}],63:[function(_dereq_,module,exports){
'use strict';

var isString = _dereq_(88),
    isFunction = _dereq_(85),
    assign = _dereq_(89);

var Moddle = _dereq_(245),
    XmlReader = _dereq_(95),
    XmlWriter = _dereq_(96);

/**
 * A sub class of {@link Moddle} with support for import and export of DMN xml files.
 *
 * @class DmnModdle
 * @extends Moddle
 *
 * @param {Object|Array} packages to use for instantiating the model
 * @param {Object} [options] additional options to pass over
 */
function DmnModdle(packages, options) {
  Moddle.call(this, packages, options);
}

DmnModdle.prototype = Object.create(Moddle.prototype);

module.exports = DmnModdle;


/**
 * Instantiates a DMN model tree from a given xml string.
 *
 * @param {String}   xmlStr
 * @param {String}   [typeName='bpmn:Definitions'] name of the root element
 * @param {Object}   [options]  options to pass to the underlying reader
 * @param {Function} done       callback that is invoked with (err, result, parseContext)
 *                              once the import completes
 */
DmnModdle.prototype.fromXML = function(xmlStr, typeName, options, done) {

  if (!isString(typeName)) {
    done = options;
    options = typeName;
    typeName = 'Definitions';
  }

  if (isFunction(options)) {
    done = options;
    options = {};
  }

  var reader = new XmlReader(assign({ model: this, lax: true }, options));
  var rootHandler = reader.handler(typeName);

  reader.fromXML(xmlStr, rootHandler, done);
};


/**
 * Serializes a DMN object tree to XML.
 *
 * @param {String}   element    the root element, typically an instance of `Definitions`
 * @param {Object}   [options]  to pass to the underlying writer
 * @param {Function} done       callback invoked with (err, xmlStr) once the import completes
 */
DmnModdle.prototype.toXML = function(element, options, done) {

  if (isFunction(options)) {
    done = options;
    options = {};
  }

  var writer = new XmlWriter(options);
  try {
    var result = writer.toXML(element);
    done(null, result);
  } catch (e) {
    done(e);
  }
};

},{"245":245,"85":85,"88":88,"89":89,"95":95,"96":96}],64:[function(_dereq_,module,exports){
'use strict';

var ID_PATTERN = /^(.*:)?id$/;

/**
 * Extends the bpmn instance with id support.
 *
 * @example
 *
 * var moddle, ids;
 *
 * require('id-support').extend(moddle, ids);
 *
 * moddle.ids.next(); // create a next id
 * moddle.ids; // ids instance
 *
 * // claims id as used
 * moddle.create('foo:Bar', { id: 'fooobar1' });
 *
 *
 * @param  {Moddle} model
 * @param  {Ids} ids
 *
 * @return {Moddle} the extended moddle instance
 */
module.exports.extend = function(model, ids) {

  var set = model.properties.set;

  // do not reinitialize setter
  // unless it is already initialized
  if (!model.ids) {

    model.properties.set = function(target, property, value) {

      // ensure we log used ids once they are assigned
      // to model elements
      if (ID_PATTERN.test(property)) {

        var assigned = model.ids.assigned(value);
        if (assigned && assigned !== target) {
          throw new Error('id <' + value + '> already used');
        }

        model.ids.claim(value, target);
      }

      set.call(this, target, property, value);
    };
  }

  model.ids = ids;

  return model;
};

},{}],65:[function(_dereq_,module,exports){
'use strict';

var assign = _dereq_(89);

var DmnModdle = _dereq_(63);

var packages = {
  dmn: _dereq_(319)
};

module.exports = function(additionalPackages, options) {
  return new DmnModdle(assign({}, packages, additionalPackages), options);
};

},{"319":319,"63":63,"89":89}],66:[function(_dereq_,module,exports){
/** Used as the `TypeError` message for "Functions" methods. */
var FUNC_ERROR_TEXT = 'Expected a function';

/* Native method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;

/**
 * Creates a function that invokes `func` with the `this` binding of the
 * created function and arguments from `start` and beyond provided as an array.
 *
 * **Note:** This method is based on the [rest parameter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters).
 *
 * @static
 * @memberOf _
 * @category Function
 * @param {Function} func The function to apply a rest parameter to.
 * @param {number} [start=func.length-1] The start position of the rest parameter.
 * @returns {Function} Returns the new function.
 * @example
 *
 * var say = _.restParam(function(what, names) {
 *   return what + ' ' + _.initial(names).join(', ') +
 *     (_.size(names) > 1 ? ', & ' : '') + _.last(names);
 * });
 *
 * say('hello', 'fred', 'barney', 'pebbles');
 * // => 'hello fred, barney, & pebbles'
 */
function restParam(func, start) {
  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  start = nativeMax(start === undefined ? (func.length - 1) : (+start || 0), 0);
  return function() {
    var args = arguments,
        index = -1,
        length = nativeMax(args.length - start, 0),
        rest = Array(length);

    while (++index < length) {
      rest[index] = args[start + index];
    }
    switch (start) {
      case 0: return func.call(this, rest);
      case 1: return func.call(this, args[0], rest);
      case 2: return func.call(this, args[0], args[1], rest);
    }
    var otherArgs = Array(start + 1);
    index = -1;
    while (++index < start) {
      otherArgs[index] = args[index];
    }
    otherArgs[start] = rest;
    return func.apply(this, otherArgs);
  };
}

module.exports = restParam;

},{}],67:[function(_dereq_,module,exports){
var keys = _dereq_(90);

/**
 * A specialized version of `_.assign` for customizing assigned values without
 * support for argument juggling, multiple sources, and `this` binding `customizer`
 * functions.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @param {Function} customizer The function to customize assigned values.
 * @returns {Object} Returns `object`.
 */
function assignWith(object, source, customizer) {
  var index = -1,
      props = keys(source),
      length = props.length;

  while (++index < length) {
    var key = props[index],
        value = object[key],
        result = customizer(value, source[key], key, object, source);

    if ((result === result ? (result !== value) : (value === value)) ||
        (value === undefined && !(key in object))) {
      object[key] = result;
    }
  }
  return object;
}

module.exports = assignWith;

},{"90":90}],68:[function(_dereq_,module,exports){
var baseCopy = _dereq_(69),
    keys = _dereq_(90);

/**
 * The base implementation of `_.assign` without support for argument juggling,
 * multiple sources, and `customizer` functions.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @returns {Object} Returns `object`.
 */
function baseAssign(object, source) {
  return source == null
    ? object
    : baseCopy(source, keys(source), object);
}

module.exports = baseAssign;

},{"69":69,"90":90}],69:[function(_dereq_,module,exports){
/**
 * Copies properties of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy properties from.
 * @param {Array} props The property names to copy.
 * @param {Object} [object={}] The object to copy properties to.
 * @returns {Object} Returns `object`.
 */
function baseCopy(source, props, object) {
  object || (object = {});

  var index = -1,
      length = props.length;

  while (++index < length) {
    var key = props[index];
    object[key] = source[key];
  }
  return object;
}

module.exports = baseCopy;

},{}],70:[function(_dereq_,module,exports){
arguments[4][37][0].apply(exports,arguments)
},{"37":37}],71:[function(_dereq_,module,exports){
arguments[4][38][0].apply(exports,arguments)
},{"38":38}],72:[function(_dereq_,module,exports){
arguments[4][39][0].apply(exports,arguments)
},{"39":39}],73:[function(_dereq_,module,exports){
arguments[4][40][0].apply(exports,arguments)
},{"40":40,"93":93}],74:[function(_dereq_,module,exports){
var bindCallback = _dereq_(73),
    isIterateeCall = _dereq_(79),
    restParam = _dereq_(66);

/**
 * Creates a function that assigns properties of source object(s) to a given
 * destination object.
 *
 * **Note:** This function is used to create `_.assign`, `_.defaults`, and `_.merge`.
 *
 * @private
 * @param {Function} assigner The function to assign values.
 * @returns {Function} Returns the new assigner function.
 */
function createAssigner(assigner) {
  return restParam(function(object, sources) {
    var index = -1,
        length = object == null ? 0 : sources.length,
        customizer = length > 2 ? sources[length - 2] : undefined,
        guard = length > 2 ? sources[2] : undefined,
        thisArg = length > 1 ? sources[length - 1] : undefined;

    if (typeof customizer == 'function') {
      customizer = bindCallback(customizer, thisArg, 5);
      length -= 2;
    } else {
      customizer = typeof thisArg == 'function' ? thisArg : undefined;
      length -= (customizer ? 1 : 0);
    }
    if (guard && isIterateeCall(sources[0], sources[1], guard)) {
      customizer = length < 3 ? undefined : customizer;
      length = 1;
    }
    while (++index < length) {
      var source = sources[index];
      if (source) {
        assigner(object, source, customizer);
      }
    }
    return object;
  });
}

module.exports = createAssigner;

},{"66":66,"73":73,"79":79}],75:[function(_dereq_,module,exports){
arguments[4][44][0].apply(exports,arguments)
},{"44":44,"71":71}],76:[function(_dereq_,module,exports){
arguments[4][45][0].apply(exports,arguments)
},{"45":45,"86":86}],77:[function(_dereq_,module,exports){
arguments[4][46][0].apply(exports,arguments)
},{"46":46,"75":75,"80":80}],78:[function(_dereq_,module,exports){
arguments[4][47][0].apply(exports,arguments)
},{"47":47}],79:[function(_dereq_,module,exports){
var isArrayLike = _dereq_(77),
    isIndex = _dereq_(78),
    isObject = _dereq_(87);

/**
 * Checks if the provided arguments are from an iteratee call.
 *
 * @private
 * @param {*} value The potential iteratee value argument.
 * @param {*} index The potential iteratee index or key argument.
 * @param {*} object The potential iteratee object argument.
 * @returns {boolean} Returns `true` if the arguments are from an iteratee call, else `false`.
 */
function isIterateeCall(value, index, object) {
  if (!isObject(object)) {
    return false;
  }
  var type = typeof index;
  if (type == 'number'
      ? (isArrayLike(object) && isIndex(index, object.length))
      : (type == 'string' && index in object)) {
    var other = object[index];
    return value === value ? (value === other) : (other !== other);
  }
  return false;
}

module.exports = isIterateeCall;

},{"77":77,"78":78,"87":87}],80:[function(_dereq_,module,exports){
arguments[4][48][0].apply(exports,arguments)
},{"48":48}],81:[function(_dereq_,module,exports){
arguments[4][49][0].apply(exports,arguments)
},{"49":49}],82:[function(_dereq_,module,exports){
arguments[4][50][0].apply(exports,arguments)
},{"50":50,"78":78,"80":80,"83":83,"84":84,"91":91}],83:[function(_dereq_,module,exports){
arguments[4][52][0].apply(exports,arguments)
},{"52":52,"77":77,"81":81}],84:[function(_dereq_,module,exports){
arguments[4][53][0].apply(exports,arguments)
},{"53":53,"76":76,"80":80,"81":81}],85:[function(_dereq_,module,exports){
(function (global){
var baseIsFunction = _dereq_(70),
    getNative = _dereq_(76);

/** `Object#toString` result references. */
var funcTag = '[object Function]';

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/** Native method references. */
var Uint8Array = getNative(global, 'Uint8Array');

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
var isFunction = !(baseIsFunction(/x/) || (Uint8Array && !baseIsFunction(Uint8Array))) ? baseIsFunction : function(value) {
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in older versions of Chrome and Safari which return 'function' for regexes
  // and Safari 8 equivalents which return 'object' for typed array constructors.
  return objToString.call(value) == funcTag;
};

module.exports = isFunction;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"70":70,"76":76}],86:[function(_dereq_,module,exports){
arguments[4][55][0].apply(exports,arguments)
},{"55":55,"81":81,"92":92}],87:[function(_dereq_,module,exports){
arguments[4][57][0].apply(exports,arguments)
},{"57":57}],88:[function(_dereq_,module,exports){
var isObjectLike = _dereq_(81);

/** `Object#toString` result references. */
var stringTag = '[object String]';

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * Checks if `value` is classified as a `String` primitive or object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isString('abc');
 * // => true
 *
 * _.isString(1);
 * // => false
 */
function isString(value) {
  return typeof value == 'string' || (isObjectLike(value) && objToString.call(value) == stringTag);
}

module.exports = isString;

},{"81":81}],89:[function(_dereq_,module,exports){
var assignWith = _dereq_(67),
    baseAssign = _dereq_(68),
    createAssigner = _dereq_(74);

/**
 * Assigns own enumerable properties of source object(s) to the destination
 * object. Subsequent sources overwrite property assignments of previous sources.
 * If `customizer` is provided it is invoked to produce the assigned values.
 * The `customizer` is bound to `thisArg` and invoked with five arguments:
 * (objectValue, sourceValue, key, object, source).
 *
 * **Note:** This method mutates `object` and is based on
 * [`Object.assign`](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.assign).
 *
 * @static
 * @memberOf _
 * @alias extend
 * @category Object
 * @param {Object} object The destination object.
 * @param {...Object} [sources] The source objects.
 * @param {Function} [customizer] The function to customize assigned values.
 * @param {*} [thisArg] The `this` binding of `customizer`.
 * @returns {Object} Returns `object`.
 * @example
 *
 * _.assign({ 'user': 'barney' }, { 'age': 40 }, { 'user': 'fred' });
 * // => { 'user': 'fred', 'age': 40 }
 *
 * // using a customizer callback
 * var defaults = _.partialRight(_.assign, function(value, other) {
 *   return _.isUndefined(value) ? other : value;
 * });
 *
 * defaults({ 'user': 'barney' }, { 'age': 36 }, { 'user': 'fred' });
 * // => { 'user': 'barney', 'age': 36 }
 */
var assign = createAssigner(function(object, source, customizer) {
  return customizer
    ? assignWith(object, source, customizer)
    : baseAssign(object, source);
});

module.exports = assign;

},{"67":67,"68":68,"74":74}],90:[function(_dereq_,module,exports){
arguments[4][58][0].apply(exports,arguments)
},{"58":58,"76":76,"77":77,"82":82,"87":87}],91:[function(_dereq_,module,exports){
arguments[4][59][0].apply(exports,arguments)
},{"59":59,"78":78,"80":80,"83":83,"84":84,"87":87}],92:[function(_dereq_,module,exports){
arguments[4][60][0].apply(exports,arguments)
},{"60":60,"72":72}],93:[function(_dereq_,module,exports){
arguments[4][61][0].apply(exports,arguments)
},{"61":61}],94:[function(_dereq_,module,exports){
'use strict';

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function lower(string) {
  return string.charAt(0).toLowerCase() + string.slice(1);
}

function hasLowerCaseAlias(pkg) {
  return pkg.xml && pkg.xml.tagAlias === 'lowerCase';
}


module.exports.aliasToName = function(alias, pkg) {
  if (hasLowerCaseAlias(pkg)) {
    return capitalize(alias);
  } else {
    return alias;
  }
};

module.exports.nameToAlias = function(name, pkg) {
  if (hasLowerCaseAlias(pkg)) {
    return lower(name);
  } else {
    return name;
  }
};

module.exports.DEFAULT_NS_MAP = {
  'xsi': 'http://www.w3.org/2001/XMLSchema-instance'
};

var XSI_TYPE = module.exports.XSI_TYPE = 'xsi:type';

function serializeFormat(element) {
  return element.xml && element.xml.serialize;
}

module.exports.serializeAsType = function(element) {
  return serializeFormat(element) === XSI_TYPE;
};

module.exports.serializeAsProperty = function(element) {
  return serializeFormat(element) === 'property';
};
},{}],95:[function(_dereq_,module,exports){
'use strict';

var reduce = _dereq_(102),
    forEach = _dereq_(100),
    find = _dereq_(99),
    assign = _dereq_(162),
    defer = _dereq_(103);

var Stack = _dereq_(244),
    SaxParser = _dereq_(243).parser,
    Moddle = _dereq_(169),
    parseNameNs = _dereq_(174).parseName,
    Types = _dereq_(177),
    coerceType = Types.coerceType,
    isSimpleType = Types.isSimple,
    common = _dereq_(94),
    XSI_TYPE = common.XSI_TYPE,
    XSI_URI = common.DEFAULT_NS_MAP.xsi,
    serializeAsType = common.serializeAsType,
    aliasToName = common.aliasToName;

function parseNodeAttributes(node) {
  var nodeAttrs = node.attributes;

  return reduce(nodeAttrs, function(result, v, k) {
    var name, ns;

    if (!v.local) {
      name = v.prefix;
    } else {
      ns = parseNameNs(v.name, v.prefix);
      name = ns.name;
    }

    result[name] = v.value;
    return result;
  }, {});
}

function normalizeType(node, attr, model) {
  var nameNs = parseNameNs(attr.value);

  var uri = node.ns[nameNs.prefix || ''],
      localName = nameNs.localName,
      pkg = uri && model.getPackage(uri),
      typePrefix;

  if (pkg) {
    typePrefix = pkg.xml && pkg.xml.typePrefix;

    if (typePrefix && localName.indexOf(typePrefix) === 0) {
      localName = localName.slice(typePrefix.length);
    }

    attr.value = pkg.prefix + ':' + localName;
  }
}

/**
 * Normalizes namespaces for a node given an optional default namespace and a
 * number of mappings from uris to default prefixes.
 *
 * @param  {XmlNode} node
 * @param  {Model} model the model containing all registered namespaces
 * @param  {Uri} defaultNsUri
 */
function normalizeNamespaces(node, model, defaultNsUri) {
  var uri, prefix;

  uri = node.uri || defaultNsUri;

  if (uri) {
    var pkg = model.getPackage(uri);

    if (pkg) {
      prefix = pkg.prefix;
    } else {
      prefix = node.prefix;
    }

    node.prefix = prefix;
    node.uri = uri;
  }

  forEach(node.attributes, function(attr) {

    // normalize xsi:type attributes because the
    // assigned type may or may not be namespace prefixed
    if (attr.uri === XSI_URI && attr.local === 'type') {
      normalizeType(node, attr, model);
    }

    normalizeNamespaces(attr, model, null);
  });
}


/**
 * A parse context.
 *
 * @class
 *
 * @param {Object} options
 * @param {ElementHandler} options.parseRoot the root handler for parsing a document
 * @param {boolean} [options.lax=false] whether or not to ignore invalid elements
 */
function Context(options) {

  /**
   * @property {ElementHandler} parseRoot
   */

  /**
   * @property {Boolean} lax
   */

  assign(this, options);

  var elementsById = this.elementsById = {};
  var references = this.references = [];
  var warnings = this.warnings = [];

  this.addReference = function(reference) {
    references.push(reference);
  };

  this.addElement = function(id, element) {

    if (!id || !element) {
      throw new Error('[xml-reader] id or ctx must not be null');
    }

    elementsById[id] = element;
  };

  this.addWarning = function (w) {
    warnings.push(w);
  };
}

function BaseHandler() {}

BaseHandler.prototype.handleEnd = function() {};
BaseHandler.prototype.handleText = function() {};
BaseHandler.prototype.handleNode = function() {};


/**
 * A simple pass through handler that does nothing except for
 * ignoring all input it receives.
 *
 * This is used to ignore unknown elements and
 * attributes.
 */
function NoopHandler() { }

NoopHandler.prototype = new BaseHandler();

NoopHandler.prototype.handleNode = function() {
  return this;
};

function BodyHandler() {}

BodyHandler.prototype = new BaseHandler();

BodyHandler.prototype.handleText = function(text) {
  this.body = (this.body || '') + text;
};

function ReferenceHandler(property, context) {
  this.property = property;
  this.context = context;
}

ReferenceHandler.prototype = new BodyHandler();

ReferenceHandler.prototype.handleNode = function(node) {

  if (this.element) {
    throw new Error('expected no sub nodes');
  } else {
    this.element = this.createReference(node);
  }

  return this;
};

ReferenceHandler.prototype.handleEnd = function() {
  this.element.id = this.body;
};

ReferenceHandler.prototype.createReference = function() {
  return {
    property: this.property.ns.name,
    id: ''
  };
};

function ValueHandler(propertyDesc, element) {
  this.element = element;
  this.propertyDesc = propertyDesc;
}

ValueHandler.prototype = new BodyHandler();

ValueHandler.prototype.handleEnd = function() {

  var value = this.body,
      element = this.element,
      propertyDesc = this.propertyDesc;

  value = coerceType(propertyDesc.type, value);

  if (propertyDesc.isMany) {
    element.get(propertyDesc.name).push(value);
  } else {
    element.set(propertyDesc.name, value);
  }
};


function BaseElementHandler() {}

BaseElementHandler.prototype = Object.create(BodyHandler.prototype);

BaseElementHandler.prototype.handleNode = function(node) {
  var parser = this,
      element = this.element,
      id;

  if (!element) {
    element = this.element = this.createElement(node);
    id = element.id;

    if (id) {
      this.context.addElement(id, element);
    }
  } else {
    parser = this.handleChild(node);
  }

  return parser;
};

/**
 * @class XMLReader.ElementHandler
 *
 */
function ElementHandler(model, type, context) {
  this.model = model;
  this.type = model.getType(type);
  this.context = context;
}

ElementHandler.prototype = new BaseElementHandler();

ElementHandler.prototype.addReference = function(reference) {
  this.context.addReference(reference);
};

ElementHandler.prototype.handleEnd = function() {

  var value = this.body,
      element = this.element,
      descriptor = element.$descriptor,
      bodyProperty = descriptor.bodyProperty;

  if (bodyProperty && value !== undefined) {
    value = coerceType(bodyProperty.type, value);
    element.set(bodyProperty.name, value);
  }
};

/**
 * Create an instance of the model from the given node.
 *
 * @param  {Element} node the xml node
 */
ElementHandler.prototype.createElement = function(node) {
  var attributes = parseNodeAttributes(node),
      Type = this.type,
      descriptor = Type.$descriptor,
      context = this.context,
      instance = new Type({});

  forEach(attributes, function(value, name) {

    var prop = descriptor.propertiesByName[name];

    if (prop && prop.isReference) {
      context.addReference({
        element: instance,
        property: prop.ns.name,
        id: value
      });
    } else {
      if (prop) {
        value = coerceType(prop.type, value);
      }

      instance.set(name, value);
    }
  });

  return instance;
};

ElementHandler.prototype.getPropertyForNode = function(node) {

  var nameNs = parseNameNs(node.local, node.prefix);

  var type = this.type,
      model = this.model,
      descriptor = type.$descriptor;

  var propertyName = nameNs.name,
      property = descriptor.propertiesByName[propertyName],
      elementTypeName,
      elementType,
      typeAnnotation;

  // search for properties by name first

  if (property) {

    if (serializeAsType(property)) {
      typeAnnotation = node.attributes[XSI_TYPE];

      // xsi type is optional, if it does not exists the
      // default type is assumed
      if (typeAnnotation) {

        elementTypeName = typeAnnotation.value;

        // TODO: extract real name from attribute
        elementType = model.getType(elementTypeName);

        return assign({}, property, { effectiveType: elementType.$descriptor.name });
      }
    }

    // search for properties by name first
    return property;
  }


  var pkg = model.getPackage(nameNs.prefix);

  if (pkg) {
    elementTypeName = nameNs.prefix + ':' + aliasToName(nameNs.localName, descriptor.$pkg);
    elementType = model.getType(elementTypeName);

    // search for collection members later
    property = find(descriptor.properties, function(p) {
      return !p.isVirtual && !p.isReference && !p.isAttribute && elementType.hasType(p.type);
    });

    if (property) {
      return assign({}, property, { effectiveType: elementType.$descriptor.name });
    }
  } else {
    // parse unknown element (maybe extension)
    property = find(descriptor.properties, function(p) {
      return !p.isReference && !p.isAttribute && p.type === 'Element';
    });

    if (property) {
      return property;
    }
  }

  throw new Error('unrecognized element <' + nameNs.name + '>');
};

ElementHandler.prototype.toString = function() {
  return 'ElementDescriptor[' + this.type.$descriptor.name + ']';
};

ElementHandler.prototype.valueHandler = function(propertyDesc, element) {
  return new ValueHandler(propertyDesc, element);
};

ElementHandler.prototype.referenceHandler = function(propertyDesc) {
  return new ReferenceHandler(propertyDesc, this.context);
};

ElementHandler.prototype.handler = function(type) {
  if (type === 'Element') {
    return new GenericElementHandler(this.model, type, this.context);
  } else {
    return new ElementHandler(this.model, type, this.context);
  }
};

/**
 * Handle the child element parsing
 *
 * @param  {Element} node the xml node
 */
ElementHandler.prototype.handleChild = function(node) {
  var propertyDesc, type, element, childHandler;

  propertyDesc = this.getPropertyForNode(node);
  element = this.element;

  type = propertyDesc.effectiveType || propertyDesc.type;

  if (isSimpleType(type)) {
    return this.valueHandler(propertyDesc, element);
  }

  if (propertyDesc.isReference) {
    childHandler = this.referenceHandler(propertyDesc).handleNode(node);
  } else {
    childHandler = this.handler(type).handleNode(node);
  }

  var newElement = childHandler.element;

  // child handles may decide to skip elements
  // by not returning anything
  if (newElement !== undefined) {

    if (propertyDesc.isMany) {
      element.get(propertyDesc.name).push(newElement);
    } else {
      element.set(propertyDesc.name, newElement);
    }

    if (propertyDesc.isReference) {
      assign(newElement, {
        element: element
      });

      this.context.addReference(newElement);
    } else {
      // establish child -> parent relationship
      newElement.$parent = element;
    }
  }

  return childHandler;
};


function GenericElementHandler(model, type, context) {
  this.model = model;
  this.context = context;
}

GenericElementHandler.prototype = Object.create(BaseElementHandler.prototype);

GenericElementHandler.prototype.createElement = function(node) {

  var name = node.name,
      prefix = node.prefix,
      uri = node.ns[prefix],
      attributes = node.attributes;

  return this.model.createAny(name, uri, attributes);
};

GenericElementHandler.prototype.handleChild = function(node) {

  var handler = new GenericElementHandler(this.model, 'Element', this.context).handleNode(node),
      element = this.element;

  var newElement = handler.element,
      children;

  if (newElement !== undefined) {
    children = element.$children = element.$children || [];
    children.push(newElement);

    // establish child -> parent relationship
    newElement.$parent = element;
  }

  return handler;
};

GenericElementHandler.prototype.handleText = function(text) {
  this.body = this.body || '' + text;
};

GenericElementHandler.prototype.handleEnd = function() {
  if (this.body) {
    this.element.$body = this.body;
  }
};

/**
 * A reader for a meta-model
 *
 * @param {Object} options
 * @param {Model} options.model used to read xml files
 * @param {Boolean} options.lax whether to make parse errors warnings
 */
function XMLReader(options) {

  if (options instanceof Moddle) {
    options = {
      model: options
    };
  }

  assign(this, { lax: false }, options);
}


XMLReader.prototype.fromXML = function(xml, rootHandler, done) {

  var model = this.model,
      lax = this.lax,
      context = new Context({
        parseRoot: rootHandler
      });

  var parser = new SaxParser(true, { xmlns: true, trim: true }),
      stack = new Stack();

  rootHandler.context = context;

  // push root handler
  stack.push(rootHandler);


  function resolveReferences() {

    var elementsById = context.elementsById;
    var references = context.references;

    var i, r;

    for (i = 0; !!(r = references[i]); i++) {
      var element = r.element;
      var reference = elementsById[r.id];
      var property = element.$descriptor.propertiesByName[r.property];

      if (!reference) {
        context.addWarning({
          message: 'unresolved reference <' + r.id + '>',
          element: r.element,
          property: r.property,
          value: r.id
        });
      }

      if (property.isMany) {
        var collection = element.get(property.name),
            idx = collection.indexOf(r);

        if (!reference) {
          // remove unresolvable reference
          collection.splice(idx, 1);
        } else {
          // update reference
          collection[idx] = reference;
        }
      } else {
        element.set(property.name, reference);
      }
    }
  }

  function handleClose(tagName) {
    stack.pop().handleEnd();
  }

  function handleOpen(node) {
    var handler = stack.peek();

    normalizeNamespaces(node, model);

    try {
      stack.push(handler.handleNode(node));
    } catch (e) {

      var line = this.line,
          column = this.column;

      var message =
        'unparsable content <' + node.name + '> detected\n\t' +
          'line: ' + line + '\n\t' +
          'column: ' + column + '\n\t' +
          'nested error: ' + e.message;

      if (lax) {
        context.addWarning({
          message: message,
          error: e
        });

        console.warn('could not parse node');
        console.warn(e);

        stack.push(new NoopHandler());
      } else {
        console.error('could not parse document');
        console.error(e);

        throw new Error(message);
      }
    }
  }

  function handleText(text) {
    stack.peek().handleText(text);
  }

  parser.onopentag = handleOpen;
  parser.oncdata = parser.ontext = handleText;
  parser.onclosetag = handleClose;
  parser.onend = resolveReferences;

  // deferred parse XML to make loading really ascnchronous
  // this ensures the execution environment (node or browser)
  // is kept responsive and that certain optimization strategies
  // can kick in
  defer(function() {
    var error;

    try {
      parser.write(xml).close();
    } catch (e) {
      error = e;
    }

    done(error, error ? undefined : rootHandler.element, context);
  });
};

XMLReader.prototype.handler = function(name) {
  return new ElementHandler(this.model, name);
};

module.exports = XMLReader;
module.exports.ElementHandler = ElementHandler;
},{"100":100,"102":102,"103":103,"162":162,"169":169,"174":174,"177":177,"243":243,"244":244,"94":94,"99":99}],96:[function(_dereq_,module,exports){
'use strict';

var map = _dereq_(101),
    forEach = _dereq_(100),
    isString = _dereq_(160),
    filter = _dereq_(98),
    assign = _dereq_(162);

var Types = _dereq_(177),
    parseNameNs = _dereq_(174).parseName,
    common = _dereq_(94),
    nameToAlias = common.nameToAlias,
    serializeAsType = common.serializeAsType,
    serializeAsProperty = common.serializeAsProperty;

var XML_PREAMBLE = '<?xml version="1.0" encoding="UTF-8"?>\n',
    ESCAPE_CHARS = /(<|>|'|"|&|\n\r|\n)/g,
    DEFAULT_NS_MAP = common.DEFAULT_NS_MAP,
    XSI_TYPE = common.XSI_TYPE;


function nsName(ns) {
  if (isString(ns)) {
    return ns;
  } else {
    return (ns.prefix ? ns.prefix + ':' : '') + ns.localName;
  }
}

function getElementNs(ns, descriptor) {
  if (descriptor.isGeneric) {
    return descriptor.name;
  } else {
    return assign({ localName: nameToAlias(descriptor.ns.localName, descriptor.$pkg) }, ns);
  }
}

function getPropertyNs(ns, descriptor) {
  return assign({ localName: descriptor.ns.localName }, ns);
}

function getSerializableProperties(element) {
  var descriptor = element.$descriptor;

  return filter(descriptor.properties, function(p) {
    var name = p.name;

    // do not serialize defaults
    if (!element.hasOwnProperty(name)) {
      return false;
    }

    var value = element[name];

    // do not serialize default equals
    if (value === p.default) {
      return false;
    }

    return p.isMany ? value.length : true;
  });
}

var ESCAPE_MAP = {
  '\n': '10',
  '\n\r': '10',
  '"': '34',
  '\'': '39',
  '<': '60',
  '>': '62',
  '&': '38'
};

/**
 * Escape a string attribute to not contain any bad values (line breaks, '"', ...)
 *
 * @param {String} str the string to escape
 * @return {String} the escaped string
 */
function escapeAttr(str) {

  // ensure we are handling strings here
  str = isString(str) ? str : '' + str;

  return str.replace(ESCAPE_CHARS, function(str) {
    return '&#' + ESCAPE_MAP[str] + ';';
  });
}

function filterAttributes(props) {
  return filter(props, function(p) { return p.isAttr; });
}

function filterContained(props) {
  return filter(props, function(p) { return !p.isAttr; });
}


function ReferenceSerializer(parent, ns) {
  this.ns = ns;
}

ReferenceSerializer.prototype.build = function(element) {
  this.element = element;
  return this;
};

ReferenceSerializer.prototype.serializeTo = function(writer) {
  writer
    .appendIndent()
    .append('<' + nsName(this.ns) + '>' + this.element.id + '</' + nsName(this.ns) + '>')
    .appendNewLine();
};

function BodySerializer() {}

BodySerializer.prototype.serializeValue = BodySerializer.prototype.serializeTo = function(writer) {
  var escape = this.escape;

  if (escape) {
    writer.append('<![CDATA[');
  }

  writer.append(this.value);

  if (escape) {
    writer.append(']]>');
  }
};

BodySerializer.prototype.build = function(prop, value) {
  this.value = value;

  if (prop.type === 'String' && ESCAPE_CHARS.test(value)) {
    this.escape = true;
  }

  return this;
};

function ValueSerializer(ns) {
  this.ns = ns;
}

ValueSerializer.prototype = new BodySerializer();

ValueSerializer.prototype.serializeTo = function(writer) {

  writer
    .appendIndent()
    .append('<' + nsName(this.ns) + '>');

  this.serializeValue(writer);

  writer
    .append( '</' + nsName(this.ns) + '>')
    .appendNewLine();
};

function ElementSerializer(parent, ns) {
  this.body = [];
  this.attrs = [];

  this.parent = parent;
  this.ns = ns;
}

ElementSerializer.prototype.build = function(element) {
  this.element = element;

  var otherAttrs = this.parseNsAttributes(element);

  if (!this.ns) {
    this.ns = this.nsTagName(element.$descriptor);
  }

  if (element.$descriptor.isGeneric) {
    this.parseGeneric(element);
  } else {
    var properties = getSerializableProperties(element);

    this.parseAttributes(filterAttributes(properties));
    this.parseContainments(filterContained(properties));

    this.parseGenericAttributes(element, otherAttrs);
  }

  return this;
};

ElementSerializer.prototype.nsTagName = function(descriptor) {
  var effectiveNs = this.logNamespaceUsed(descriptor.ns);
  return getElementNs(effectiveNs, descriptor);
};

ElementSerializer.prototype.nsPropertyTagName = function(descriptor) {
  var effectiveNs = this.logNamespaceUsed(descriptor.ns);
  return getPropertyNs(effectiveNs, descriptor);
};

ElementSerializer.prototype.isLocalNs = function(ns) {
  return ns.uri === this.ns.uri;
};

ElementSerializer.prototype.nsAttributeName = function(element) {

  var ns;

  if (isString(element)) {
    ns = parseNameNs(element);
  } else
  if (element.ns) {
    ns = element.ns;
  }

  var effectiveNs = this.logNamespaceUsed(ns);

  // strip prefix if same namespace like parent
  if (this.isLocalNs(effectiveNs)) {
    return { localName: ns.localName };
  } else {
    return assign({ localName: ns.localName }, effectiveNs);
  }
};

ElementSerializer.prototype.parseGeneric = function(element) {

  var self = this,
      body = this.body,
      attrs = this.attrs;

  forEach(element, function(val, key) {

    if (key === '$body') {
      body.push(new BodySerializer().build({ type: 'String' }, val));
    } else
    if (key === '$children') {
      forEach(val, function(child) {
        body.push(new ElementSerializer(self).build(child));
      });
    } else
    if (key.indexOf('$') !== 0) {
      attrs.push({ name: key, value: escapeAttr(val) });
    }
  });
};

/**
 * Parse namespaces and return a list of left over generic attributes
 *
 * @param  {Object} element
 * @return {Array<Object>}
 */
ElementSerializer.prototype.parseNsAttributes = function(element) {
  var self = this;

  var genericAttrs = element.$attrs;

  var attributes = [];

  // parse namespace attributes first
  // and log them. push non namespace attributes to a list
  // and process them later
  forEach(genericAttrs, function(value, name) {
    var nameNs = parseNameNs(name);

    if (nameNs.prefix === 'xmlns') {
      self.logNamespace({ prefix: nameNs.localName, uri: value });
    } else
    if (!nameNs.prefix && nameNs.localName === 'xmlns') {
      self.logNamespace({ uri: value });
    } else {
      attributes.push({ name: name, value: value });
    }
  });

  return attributes;
};

ElementSerializer.prototype.parseGenericAttributes = function(element, attributes) {

  var self = this;

  forEach(attributes, function(attr) {

    // do not serialize xsi:type attribute
    // it is set manually based on the actual implementation type
    if (attr.name === XSI_TYPE) {
      return;
    }

    try {
      self.addAttribute(self.nsAttributeName(attr.name), attr.value);
    } catch (e) {
      console.warn('[writer] missing namespace information for ', attr.name, '=', attr.value, 'on', element, e);
    }
  });
};

ElementSerializer.prototype.parseContainments = function(properties) {

  var self = this,
      body = this.body,
      element = this.element;

  forEach(properties, function(p) {
    var value = element.get(p.name),
        isReference = p.isReference,
        isMany = p.isMany;

    var ns = self.nsPropertyTagName(p);

    if (!isMany) {
      value = [ value ];
    }

    if (p.isBody) {
      body.push(new BodySerializer().build(p, value[0]));
    } else
    if (Types.isSimple(p.type)) {
      forEach(value, function(v) {
        body.push(new ValueSerializer(ns).build(p, v));
      });
    } else
    if (isReference) {
      forEach(value, function(v) {
        body.push(new ReferenceSerializer(self, ns).build(v));
      });
    } else {
      // allow serialization via type
      // rather than element name
      var asType = serializeAsType(p),
          asProperty = serializeAsProperty(p);

      forEach(value, function(v) {
        var serializer;

        if (asType) {
          serializer = new TypeSerializer(self, ns);
        } else
        if (asProperty) {
          serializer = new ElementSerializer(self, ns);
        } else {
          serializer = new ElementSerializer(self);
        }

        body.push(serializer.build(v));
      });
    }
  });
};

ElementSerializer.prototype.getNamespaces = function() {
  if (!this.parent) {
    if (!this.namespaces) {
      this.namespaces = {
        prefixMap: {},
        uriMap: {},
        used: {}
      };
    }
  } else {
    this.namespaces = this.parent.getNamespaces();
  }

  return this.namespaces;
};

ElementSerializer.prototype.logNamespace = function(ns) {
  var namespaces = this.getNamespaces();

  var existing = namespaces.uriMap[ns.uri];

  if (!existing) {
    namespaces.uriMap[ns.uri] = ns;
  }

  namespaces.prefixMap[ns.prefix] = ns.uri;

  return ns;
};

ElementSerializer.prototype.logNamespaceUsed = function(ns) {
  var element = this.element,
      model = element.$model,
      namespaces = this.getNamespaces();

  // ns may be
  //
  //   * prefix only
  //   * prefix:uri

  var prefix = ns.prefix;
  var uri = ns.uri || DEFAULT_NS_MAP[prefix] ||
            namespaces.prefixMap[prefix] || (model ? (model.getPackage(prefix) || {}).uri : null);

  if (!uri) {
    throw new Error('no namespace uri given for prefix <' + ns.prefix + '>');
  }

  ns = namespaces.uriMap[uri];

  if (!ns) {
    ns = this.logNamespace({ prefix: prefix, uri: uri });
  }

  if (!namespaces.used[ns.uri]) {
    namespaces.used[ns.uri] = ns;
  }

  return ns;
};

ElementSerializer.prototype.parseAttributes = function(properties) {
  var self = this,
      element = this.element;

  forEach(properties, function(p) {
    self.logNamespaceUsed(p.ns);

    var value = element.get(p.name);

    if (p.isReference) {
      value = value.id;
    }

    self.addAttribute(self.nsAttributeName(p), value);
  });
};

ElementSerializer.prototype.addAttribute = function(name, value) {
  var attrs = this.attrs;

  if (isString(value)) {
    value = escapeAttr(value);
  }

  attrs.push({ name: name, value: value });
};

ElementSerializer.prototype.serializeAttributes = function(writer) {
  var attrs = this.attrs,
      root = !this.parent,
      namespaces = this.namespaces;

  function collectNsAttrs() {
    return map(namespaces.used, function(ns) {
      var name = 'xmlns' + (ns.prefix ? ':' + ns.prefix : '');
      return { name: name, value: ns.uri };
    });
  }

  if (root) {
    attrs = collectNsAttrs().concat(attrs);
  }

  forEach(attrs, function(a) {
    writer
      .append(' ')
      .append(nsName(a.name)).append('="').append(a.value).append('"');
  });
};

ElementSerializer.prototype.serializeTo = function(writer) {
  var hasBody = this.body.length,
      indent = !(this.body.length === 1 && this.body[0] instanceof BodySerializer);

  writer
    .appendIndent()
    .append('<' + nsName(this.ns));

  this.serializeAttributes(writer);

  writer.append(hasBody ? '>' : ' />');

  if (hasBody) {

    if (indent) {
      writer
        .appendNewLine()
        .indent();
    }

    forEach(this.body, function(b) {
      b.serializeTo(writer);
    });

    if (indent) {
      writer
        .unindent()
        .appendIndent();
    }

    writer.append('</' + nsName(this.ns) + '>');
  }

  writer.appendNewLine();
};

/**
 * A serializer for types that handles serialization of data types
 */
function TypeSerializer(parent, ns) {
  ElementSerializer.call(this, parent, ns);
}

TypeSerializer.prototype = new ElementSerializer();

TypeSerializer.prototype.build = function(element) {
  var descriptor = element.$descriptor;

  this.element = element;

  this.typeNs = this.nsTagName(descriptor);

  // add xsi:type attribute to represent the elements
  // actual type

  var typeNs = this.typeNs,
      pkg = element.$model.getPackage(typeNs.uri),
      typePrefix = (pkg.xml && pkg.xml.typePrefix) || '';

  this.addAttribute(this.nsAttributeName(XSI_TYPE),
    (typeNs.prefix ? typeNs.prefix + ':' : '') +
    typePrefix + descriptor.ns.localName);

  // do the usual stuff
  return ElementSerializer.prototype.build.call(this, element);
};

TypeSerializer.prototype.isLocalNs = function(ns) {
  return ns.uri === this.typeNs.uri;
};

function SavingWriter() {
  this.value = '';

  this.write = function(str) {
    this.value += str;
  };
}

function FormatingWriter(out, format) {

  var indent = [''];

  this.append = function(str) {
    out.write(str);

    return this;
  };

  this.appendNewLine = function() {
    if (format) {
      out.write('\n');
    }

    return this;
  };

  this.appendIndent = function() {
    if (format) {
      out.write(indent.join('  '));
    }

    return this;
  };

  this.indent = function() {
    indent.push('');
    return this;
  };

  this.unindent = function() {
    indent.pop();
    return this;
  };
}

/**
 * A writer for meta-model backed document trees
 *
 * @param {Object} options output options to pass into the writer
 */
function XMLWriter(options) {

  options = assign({ format: false, preamble: true }, options || {});

  function toXML(tree, writer) {
    var internalWriter = writer || new SavingWriter();
    var formatingWriter = new FormatingWriter(internalWriter, options.format);

    if (options.preamble) {
      formatingWriter.append(XML_PREAMBLE);
    }

    new ElementSerializer().build(tree).serializeTo(formatingWriter);

    if (!writer) {
      return internalWriter.value;
    }
  }

  return {
    toXML: toXML
  };
}

module.exports = XMLWriter;

},{"100":100,"101":101,"160":160,"162":162,"174":174,"177":177,"94":94,"98":98}],97:[function(_dereq_,module,exports){
/**
 * Gets the last element of `array`.
 *
 * @static
 * @memberOf _
 * @category Array
 * @param {Array} array The array to query.
 * @returns {*} Returns the last element of `array`.
 * @example
 *
 * _.last([1, 2, 3]);
 * // => 3
 */
function last(array) {
  var length = array ? array.length : 0;
  return length ? array[length - 1] : undefined;
}

module.exports = last;

},{}],98:[function(_dereq_,module,exports){
var arrayFilter = _dereq_(106),
    baseCallback = _dereq_(112),
    baseFilter = _dereq_(116),
    isArray = _dereq_(157);

/**
 * Iterates over elements of `collection`, returning an array of all elements
 * `predicate` returns truthy for. The predicate is bound to `thisArg` and
 * invoked with three arguments: (value, index|key, collection).
 *
 * If a property name is provided for `predicate` the created `_.property`
 * style callback returns the property value of the given element.
 *
 * If a value is also provided for `thisArg` the created `_.matchesProperty`
 * style callback returns `true` for elements that have a matching property
 * value, else `false`.
 *
 * If an object is provided for `predicate` the created `_.matches` style
 * callback returns `true` for elements that have the properties of the given
 * object, else `false`.
 *
 * @static
 * @memberOf _
 * @alias select
 * @category Collection
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function|Object|string} [predicate=_.identity] The function invoked
 *  per iteration.
 * @param {*} [thisArg] The `this` binding of `predicate`.
 * @returns {Array} Returns the new filtered array.
 * @example
 *
 * _.filter([4, 5, 6], function(n) {
 *   return n % 2 == 0;
 * });
 * // => [4, 6]
 *
 * var users = [
 *   { 'user': 'barney', 'age': 36, 'active': true },
 *   { 'user': 'fred',   'age': 40, 'active': false }
 * ];
 *
 * // using the `_.matches` callback shorthand
 * _.pluck(_.filter(users, { 'age': 36, 'active': true }), 'user');
 * // => ['barney']
 *
 * // using the `_.matchesProperty` callback shorthand
 * _.pluck(_.filter(users, 'active', false), 'user');
 * // => ['fred']
 *
 * // using the `_.property` callback shorthand
 * _.pluck(_.filter(users, 'active'), 'user');
 * // => ['barney']
 */
function filter(collection, predicate, thisArg) {
  var func = isArray(collection) ? arrayFilter : baseFilter;
  predicate = baseCallback(predicate, thisArg, 3);
  return func(collection, predicate);
}

module.exports = filter;

},{"106":106,"112":112,"116":116,"157":157}],99:[function(_dereq_,module,exports){
var baseEach = _dereq_(115),
    createFind = _dereq_(137);

/**
 * Iterates over elements of `collection`, returning the first element
 * `predicate` returns truthy for. The predicate is bound to `thisArg` and
 * invoked with three arguments: (value, index|key, collection).
 *
 * If a property name is provided for `predicate` the created `_.property`
 * style callback returns the property value of the given element.
 *
 * If a value is also provided for `thisArg` the created `_.matchesProperty`
 * style callback returns `true` for elements that have a matching property
 * value, else `false`.
 *
 * If an object is provided for `predicate` the created `_.matches` style
 * callback returns `true` for elements that have the properties of the given
 * object, else `false`.
 *
 * @static
 * @memberOf _
 * @alias detect
 * @category Collection
 * @param {Array|Object|string} collection The collection to search.
 * @param {Function|Object|string} [predicate=_.identity] The function invoked
 *  per iteration.
 * @param {*} [thisArg] The `this` binding of `predicate`.
 * @returns {*} Returns the matched element, else `undefined`.
 * @example
 *
 * var users = [
 *   { 'user': 'barney',  'age': 36, 'active': true },
 *   { 'user': 'fred',    'age': 40, 'active': false },
 *   { 'user': 'pebbles', 'age': 1,  'active': true }
 * ];
 *
 * _.result(_.find(users, function(chr) {
 *   return chr.age < 40;
 * }), 'user');
 * // => 'barney'
 *
 * // using the `_.matches` callback shorthand
 * _.result(_.find(users, { 'age': 1, 'active': true }), 'user');
 * // => 'pebbles'
 *
 * // using the `_.matchesProperty` callback shorthand
 * _.result(_.find(users, 'active', false), 'user');
 * // => 'fred'
 *
 * // using the `_.property` callback shorthand
 * _.result(_.find(users, 'active'), 'user');
 * // => 'barney'
 */
var find = createFind(baseEach);

module.exports = find;

},{"115":115,"137":137}],100:[function(_dereq_,module,exports){
arguments[4][32][0].apply(exports,arguments)
},{"105":105,"115":115,"138":138,"32":32}],101:[function(_dereq_,module,exports){
var arrayMap = _dereq_(107),
    baseCallback = _dereq_(112),
    baseMap = _dereq_(125),
    isArray = _dereq_(157);

/**
 * Creates an array of values by running each element in `collection` through
 * `iteratee`. The `iteratee` is bound to `thisArg` and invoked with three
 * arguments: (value, index|key, collection).
 *
 * If a property name is provided for `iteratee` the created `_.property`
 * style callback returns the property value of the given element.
 *
 * If a value is also provided for `thisArg` the created `_.matchesProperty`
 * style callback returns `true` for elements that have a matching property
 * value, else `false`.
 *
 * If an object is provided for `iteratee` the created `_.matches` style
 * callback returns `true` for elements that have the properties of the given
 * object, else `false`.
 *
 * Many lodash methods are guarded to work as iteratees for methods like
 * `_.every`, `_.filter`, `_.map`, `_.mapValues`, `_.reject`, and `_.some`.
 *
 * The guarded methods are:
 * `ary`, `callback`, `chunk`, `clone`, `create`, `curry`, `curryRight`,
 * `drop`, `dropRight`, `every`, `fill`, `flatten`, `invert`, `max`, `min`,
 * `parseInt`, `slice`, `sortBy`, `take`, `takeRight`, `template`, `trim`,
 * `trimLeft`, `trimRight`, `trunc`, `random`, `range`, `sample`, `some`,
 * `sum`, `uniq`, and `words`
 *
 * @static
 * @memberOf _
 * @alias collect
 * @category Collection
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function|Object|string} [iteratee=_.identity] The function invoked
 *  per iteration.
 * @param {*} [thisArg] The `this` binding of `iteratee`.
 * @returns {Array} Returns the new mapped array.
 * @example
 *
 * function timesThree(n) {
 *   return n * 3;
 * }
 *
 * _.map([1, 2], timesThree);
 * // => [3, 6]
 *
 * _.map({ 'a': 1, 'b': 2 }, timesThree);
 * // => [3, 6] (iteration order is not guaranteed)
 *
 * var users = [
 *   { 'user': 'barney' },
 *   { 'user': 'fred' }
 * ];
 *
 * // using the `_.property` callback shorthand
 * _.map(users, 'user');
 * // => ['barney', 'fred']
 */
function map(collection, iteratee, thisArg) {
  var func = isArray(collection) ? arrayMap : baseMap;
  iteratee = baseCallback(iteratee, thisArg, 3);
  return func(collection, iteratee);
}

module.exports = map;

},{"107":107,"112":112,"125":125,"157":157}],102:[function(_dereq_,module,exports){
var arrayReduce = _dereq_(108),
    baseEach = _dereq_(115),
    createReduce = _dereq_(139);

/**
 * Reduces `collection` to a value which is the accumulated result of running
 * each element in `collection` through `iteratee`, where each successive
 * invocation is supplied the return value of the previous. If `accumulator`
 * is not provided the first element of `collection` is used as the initial
 * value. The `iteratee` is bound to `thisArg` and invoked with four arguments:
 * (accumulator, value, index|key, collection).
 *
 * Many lodash methods are guarded to work as iteratees for methods like
 * `_.reduce`, `_.reduceRight`, and `_.transform`.
 *
 * The guarded methods are:
 * `assign`, `defaults`, `includes`, `merge`, `sortByAll`, and `sortByOrder`
 *
 * @static
 * @memberOf _
 * @alias foldl, inject
 * @category Collection
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
 * @param {*} [accumulator] The initial value.
 * @param {*} [thisArg] The `this` binding of `iteratee`.
 * @returns {*} Returns the accumulated value.
 * @example
 *
 * _.reduce([1, 2], function(total, n) {
 *   return total + n;
 * });
 * // => 3
 *
 * _.reduce({ 'a': 1, 'b': 2 }, function(result, n, key) {
 *   result[key] = n * 3;
 *   return result;
 * }, {});
 * // => { 'a': 3, 'b': 6 } (iteration order is not guaranteed)
 */
var reduce = createReduce(arrayReduce, baseEach);

module.exports = reduce;

},{"108":108,"115":115,"139":139}],103:[function(_dereq_,module,exports){
var baseDelay = _dereq_(114),
    restParam = _dereq_(104);

/**
 * Defers invoking the `func` until the current call stack has cleared. Any
 * additional arguments are provided to `func` when it is invoked.
 *
 * @static
 * @memberOf _
 * @category Function
 * @param {Function} func The function to defer.
 * @param {...*} [args] The arguments to invoke the function with.
 * @returns {number} Returns the timer id.
 * @example
 *
 * _.defer(function(text) {
 *   console.log(text);
 * }, 'deferred');
 * // logs 'deferred' after one or more milliseconds
 */
var defer = restParam(function(func, args) {
  return baseDelay(func, 1, args);
});

module.exports = defer;

},{"104":104,"114":114}],104:[function(_dereq_,module,exports){
arguments[4][66][0].apply(exports,arguments)
},{"66":66}],105:[function(_dereq_,module,exports){
arguments[4][33][0].apply(exports,arguments)
},{"33":33}],106:[function(_dereq_,module,exports){
/**
 * A specialized version of `_.filter` for arrays without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {Array} Returns the new filtered array.
 */
function arrayFilter(array, predicate) {
  var index = -1,
      length = array.length,
      resIndex = -1,
      result = [];

  while (++index < length) {
    var value = array[index];
    if (predicate(value, index, array)) {
      result[++resIndex] = value;
    }
  }
  return result;
}

module.exports = arrayFilter;

},{}],107:[function(_dereq_,module,exports){
/**
 * A specialized version of `_.map` for arrays without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the new mapped array.
 */
function arrayMap(array, iteratee) {
  var index = -1,
      length = array.length,
      result = Array(length);

  while (++index < length) {
    result[index] = iteratee(array[index], index, array);
  }
  return result;
}

module.exports = arrayMap;

},{}],108:[function(_dereq_,module,exports){
/**
 * A specialized version of `_.reduce` for arrays without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {*} [accumulator] The initial value.
 * @param {boolean} [initFromArray] Specify using the first element of `array`
 *  as the initial value.
 * @returns {*} Returns the accumulated value.
 */
function arrayReduce(array, iteratee, accumulator, initFromArray) {
  var index = -1,
      length = array.length;

  if (initFromArray && length) {
    accumulator = array[++index];
  }
  while (++index < length) {
    accumulator = iteratee(accumulator, array[index], index, array);
  }
  return accumulator;
}

module.exports = arrayReduce;

},{}],109:[function(_dereq_,module,exports){
/**
 * A specialized version of `_.some` for arrays without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {boolean} Returns `true` if any element passes the predicate check,
 *  else `false`.
 */
function arraySome(array, predicate) {
  var index = -1,
      length = array.length;

  while (++index < length) {
    if (predicate(array[index], index, array)) {
      return true;
    }
  }
  return false;
}

module.exports = arraySome;

},{}],110:[function(_dereq_,module,exports){
arguments[4][67][0].apply(exports,arguments)
},{"163":163,"67":67}],111:[function(_dereq_,module,exports){
arguments[4][68][0].apply(exports,arguments)
},{"113":113,"163":163,"68":68}],112:[function(_dereq_,module,exports){
var baseMatches = _dereq_(126),
    baseMatchesProperty = _dereq_(127),
    bindCallback = _dereq_(133),
    identity = _dereq_(167),
    property = _dereq_(168);

/**
 * The base implementation of `_.callback` which supports specifying the
 * number of arguments to provide to `func`.
 *
 * @private
 * @param {*} [func=_.identity] The value to convert to a callback.
 * @param {*} [thisArg] The `this` binding of `func`.
 * @param {number} [argCount] The number of arguments to provide to `func`.
 * @returns {Function} Returns the callback.
 */
function baseCallback(func, thisArg, argCount) {
  var type = typeof func;
  if (type == 'function') {
    return thisArg === undefined
      ? func
      : bindCallback(func, thisArg, argCount);
  }
  if (func == null) {
    return identity;
  }
  if (type == 'object') {
    return baseMatches(func);
  }
  return thisArg === undefined
    ? property(func)
    : baseMatchesProperty(func, thisArg);
}

module.exports = baseCallback;

},{"126":126,"127":127,"133":133,"167":167,"168":168}],113:[function(_dereq_,module,exports){
arguments[4][69][0].apply(exports,arguments)
},{"69":69}],114:[function(_dereq_,module,exports){
/** Used as the `TypeError` message for "Functions" methods. */
var FUNC_ERROR_TEXT = 'Expected a function';

/**
 * The base implementation of `_.delay` and `_.defer` which accepts an index
 * of where to slice the arguments to provide to `func`.
 *
 * @private
 * @param {Function} func The function to delay.
 * @param {number} wait The number of milliseconds to delay invocation.
 * @param {Object} args The arguments provide to `func`.
 * @returns {number} Returns the timer id.
 */
function baseDelay(func, wait, args) {
  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  return setTimeout(function() { func.apply(undefined, args); }, wait);
}

module.exports = baseDelay;

},{}],115:[function(_dereq_,module,exports){
arguments[4][34][0].apply(exports,arguments)
},{"120":120,"135":135,"34":34}],116:[function(_dereq_,module,exports){
var baseEach = _dereq_(115);

/**
 * The base implementation of `_.filter` without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {Array} Returns the new filtered array.
 */
function baseFilter(collection, predicate) {
  var result = [];
  baseEach(collection, function(value, index, collection) {
    if (predicate(value, index, collection)) {
      result.push(value);
    }
  });
  return result;
}

module.exports = baseFilter;

},{"115":115}],117:[function(_dereq_,module,exports){
/**
 * The base implementation of `_.find`, `_.findLast`, `_.findKey`, and `_.findLastKey`,
 * without support for callback shorthands and `this` binding, which iterates
 * over `collection` using the provided `eachFunc`.
 *
 * @private
 * @param {Array|Object|string} collection The collection to search.
 * @param {Function} predicate The function invoked per iteration.
 * @param {Function} eachFunc The function to iterate over `collection`.
 * @param {boolean} [retKey] Specify returning the key of the found element
 *  instead of the element itself.
 * @returns {*} Returns the found element or its key, else `undefined`.
 */
function baseFind(collection, predicate, eachFunc, retKey) {
  var result;
  eachFunc(collection, function(value, key, collection) {
    if (predicate(value, key, collection)) {
      result = retKey ? key : value;
      return false;
    }
  });
  return result;
}

module.exports = baseFind;

},{}],118:[function(_dereq_,module,exports){
/**
 * The base implementation of `_.findIndex` and `_.findLastIndex` without
 * support for callback shorthands and `this` binding.
 *
 * @private
 * @param {Array} array The array to search.
 * @param {Function} predicate The function invoked per iteration.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function baseFindIndex(array, predicate, fromRight) {
  var length = array.length,
      index = fromRight ? length : -1;

  while ((fromRight ? index-- : ++index < length)) {
    if (predicate(array[index], index, array)) {
      return index;
    }
  }
  return -1;
}

module.exports = baseFindIndex;

},{}],119:[function(_dereq_,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"136":136,"35":35}],120:[function(_dereq_,module,exports){
arguments[4][36][0].apply(exports,arguments)
},{"119":119,"163":163,"36":36}],121:[function(_dereq_,module,exports){
var toObject = _dereq_(154);

/**
 * The base implementation of `get` without support for string paths
 * and default values.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array} path The path of the property to get.
 * @param {string} [pathKey] The key representation of path.
 * @returns {*} Returns the resolved value.
 */
function baseGet(object, path, pathKey) {
  if (object == null) {
    return;
  }
  if (pathKey !== undefined && pathKey in toObject(object)) {
    path = [pathKey];
  }
  var index = 0,
      length = path.length;

  while (object != null && index < length) {
    object = object[path[index++]];
  }
  return (index && index == length) ? object : undefined;
}

module.exports = baseGet;

},{"154":154}],122:[function(_dereq_,module,exports){
var baseIsEqualDeep = _dereq_(123),
    isObject = _dereq_(159),
    isObjectLike = _dereq_(151);

/**
 * The base implementation of `_.isEqual` without support for `this` binding
 * `customizer` functions.
 *
 * @private
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @param {Function} [customizer] The function to customize comparing values.
 * @param {boolean} [isLoose] Specify performing partial comparisons.
 * @param {Array} [stackA] Tracks traversed `value` objects.
 * @param {Array} [stackB] Tracks traversed `other` objects.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 */
function baseIsEqual(value, other, customizer, isLoose, stackA, stackB) {
  if (value === other) {
    return true;
  }
  if (value == null || other == null || (!isObject(value) && !isObjectLike(other))) {
    return value !== value && other !== other;
  }
  return baseIsEqualDeep(value, other, baseIsEqual, customizer, isLoose, stackA, stackB);
}

module.exports = baseIsEqual;

},{"123":123,"151":151,"159":159}],123:[function(_dereq_,module,exports){
var equalArrays = _dereq_(140),
    equalByTag = _dereq_(141),
    equalObjects = _dereq_(142),
    isArray = _dereq_(157),
    isTypedArray = _dereq_(161);

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    objectTag = '[object Object]';

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the [`toStringTag`](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * A specialized version of `baseIsEqual` for arrays and objects which performs
 * deep comparisons and tracks traversed objects enabling objects with circular
 * references to be compared.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Function} [customizer] The function to customize comparing objects.
 * @param {boolean} [isLoose] Specify performing partial comparisons.
 * @param {Array} [stackA=[]] Tracks traversed `value` objects.
 * @param {Array} [stackB=[]] Tracks traversed `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function baseIsEqualDeep(object, other, equalFunc, customizer, isLoose, stackA, stackB) {
  var objIsArr = isArray(object),
      othIsArr = isArray(other),
      objTag = arrayTag,
      othTag = arrayTag;

  if (!objIsArr) {
    objTag = objToString.call(object);
    if (objTag == argsTag) {
      objTag = objectTag;
    } else if (objTag != objectTag) {
      objIsArr = isTypedArray(object);
    }
  }
  if (!othIsArr) {
    othTag = objToString.call(other);
    if (othTag == argsTag) {
      othTag = objectTag;
    } else if (othTag != objectTag) {
      othIsArr = isTypedArray(other);
    }
  }
  var objIsObj = objTag == objectTag,
      othIsObj = othTag == objectTag,
      isSameTag = objTag == othTag;

  if (isSameTag && !(objIsArr || objIsObj)) {
    return equalByTag(object, other, objTag);
  }
  if (!isLoose) {
    var objIsWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__'),
        othIsWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');

    if (objIsWrapped || othIsWrapped) {
      return equalFunc(objIsWrapped ? object.value() : object, othIsWrapped ? other.value() : other, customizer, isLoose, stackA, stackB);
    }
  }
  if (!isSameTag) {
    return false;
  }
  // Assume cyclic values are equal.
  // For more information on detecting circular references see https://es5.github.io/#JO.
  stackA || (stackA = []);
  stackB || (stackB = []);

  var length = stackA.length;
  while (length--) {
    if (stackA[length] == object) {
      return stackB[length] == other;
    }
  }
  // Add `object` and `other` to the stack of traversed objects.
  stackA.push(object);
  stackB.push(other);

  var result = (objIsArr ? equalArrays : equalObjects)(object, other, equalFunc, customizer, isLoose, stackA, stackB);

  stackA.pop();
  stackB.pop();

  return result;
}

module.exports = baseIsEqualDeep;

},{"140":140,"141":141,"142":142,"157":157,"161":161}],124:[function(_dereq_,module,exports){
var baseIsEqual = _dereq_(122),
    toObject = _dereq_(154);

/**
 * The base implementation of `_.isMatch` without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Object} object The object to inspect.
 * @param {Array} matchData The propery names, values, and compare flags to match.
 * @param {Function} [customizer] The function to customize comparing objects.
 * @returns {boolean} Returns `true` if `object` is a match, else `false`.
 */
function baseIsMatch(object, matchData, customizer) {
  var index = matchData.length,
      length = index,
      noCustomizer = !customizer;

  if (object == null) {
    return !length;
  }
  object = toObject(object);
  while (index--) {
    var data = matchData[index];
    if ((noCustomizer && data[2])
          ? data[1] !== object[data[0]]
          : !(data[0] in object)
        ) {
      return false;
    }
  }
  while (++index < length) {
    data = matchData[index];
    var key = data[0],
        objValue = object[key],
        srcValue = data[1];

    if (noCustomizer && data[2]) {
      if (objValue === undefined && !(key in object)) {
        return false;
      }
    } else {
      var result = customizer ? customizer(objValue, srcValue, key) : undefined;
      if (!(result === undefined ? baseIsEqual(srcValue, objValue, customizer, true) : result)) {
        return false;
      }
    }
  }
  return true;
}

module.exports = baseIsMatch;

},{"122":122,"154":154}],125:[function(_dereq_,module,exports){
var baseEach = _dereq_(115),
    isArrayLike = _dereq_(146);

/**
 * The base implementation of `_.map` without support for callback shorthands
 * and `this` binding.
 *
 * @private
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the new mapped array.
 */
function baseMap(collection, iteratee) {
  var index = -1,
      result = isArrayLike(collection) ? Array(collection.length) : [];

  baseEach(collection, function(value, key, collection) {
    result[++index] = iteratee(value, key, collection);
  });
  return result;
}

module.exports = baseMap;

},{"115":115,"146":146}],126:[function(_dereq_,module,exports){
var baseIsMatch = _dereq_(124),
    getMatchData = _dereq_(144),
    toObject = _dereq_(154);

/**
 * The base implementation of `_.matches` which does not clone `source`.
 *
 * @private
 * @param {Object} source The object of property values to match.
 * @returns {Function} Returns the new function.
 */
function baseMatches(source) {
  var matchData = getMatchData(source);
  if (matchData.length == 1 && matchData[0][2]) {
    var key = matchData[0][0],
        value = matchData[0][1];

    return function(object) {
      if (object == null) {
        return false;
      }
      return object[key] === value && (value !== undefined || (key in toObject(object)));
    };
  }
  return function(object) {
    return baseIsMatch(object, matchData);
  };
}

module.exports = baseMatches;

},{"124":124,"144":144,"154":154}],127:[function(_dereq_,module,exports){
var baseGet = _dereq_(121),
    baseIsEqual = _dereq_(122),
    baseSlice = _dereq_(131),
    isArray = _dereq_(157),
    isKey = _dereq_(149),
    isStrictComparable = _dereq_(152),
    last = _dereq_(97),
    toObject = _dereq_(154),
    toPath = _dereq_(155);

/**
 * The base implementation of `_.matchesProperty` which does not clone `srcValue`.
 *
 * @private
 * @param {string} path The path of the property to get.
 * @param {*} srcValue The value to compare.
 * @returns {Function} Returns the new function.
 */
function baseMatchesProperty(path, srcValue) {
  var isArr = isArray(path),
      isCommon = isKey(path) && isStrictComparable(srcValue),
      pathKey = (path + '');

  path = toPath(path);
  return function(object) {
    if (object == null) {
      return false;
    }
    var key = pathKey;
    object = toObject(object);
    if ((isArr || !isCommon) && !(key in object)) {
      object = path.length == 1 ? object : baseGet(object, baseSlice(path, 0, -1));
      if (object == null) {
        return false;
      }
      key = last(path);
      object = toObject(object);
    }
    return object[key] === srcValue
      ? (srcValue !== undefined || (key in object))
      : baseIsEqual(srcValue, object[key], undefined, true);
  };
}

module.exports = baseMatchesProperty;

},{"121":121,"122":122,"131":131,"149":149,"152":152,"154":154,"155":155,"157":157,"97":97}],128:[function(_dereq_,module,exports){
arguments[4][38][0].apply(exports,arguments)
},{"38":38}],129:[function(_dereq_,module,exports){
var baseGet = _dereq_(121),
    toPath = _dereq_(155);

/**
 * A specialized version of `baseProperty` which supports deep paths.
 *
 * @private
 * @param {Array|string} path The path of the property to get.
 * @returns {Function} Returns the new function.
 */
function basePropertyDeep(path) {
  var pathKey = (path + '');
  path = toPath(path);
  return function(object) {
    return baseGet(object, path, pathKey);
  };
}

module.exports = basePropertyDeep;

},{"121":121,"155":155}],130:[function(_dereq_,module,exports){
/**
 * The base implementation of `_.reduce` and `_.reduceRight` without support
 * for callback shorthands and `this` binding, which iterates over `collection`
 * using the provided `eachFunc`.
 *
 * @private
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {*} accumulator The initial value.
 * @param {boolean} initFromCollection Specify using the first or last element
 *  of `collection` as the initial value.
 * @param {Function} eachFunc The function to iterate over `collection`.
 * @returns {*} Returns the accumulated value.
 */
function baseReduce(collection, iteratee, accumulator, initFromCollection, eachFunc) {
  eachFunc(collection, function(value, index, collection) {
    accumulator = initFromCollection
      ? (initFromCollection = false, value)
      : iteratee(accumulator, value, index, collection);
  });
  return accumulator;
}

module.exports = baseReduce;

},{}],131:[function(_dereq_,module,exports){
/**
 * The base implementation of `_.slice` without an iteratee call guard.
 *
 * @private
 * @param {Array} array The array to slice.
 * @param {number} [start=0] The start position.
 * @param {number} [end=array.length] The end position.
 * @returns {Array} Returns the slice of `array`.
 */
function baseSlice(array, start, end) {
  var index = -1,
      length = array.length;

  start = start == null ? 0 : (+start || 0);
  if (start < 0) {
    start = -start > length ? 0 : (length + start);
  }
  end = (end === undefined || end > length) ? length : (+end || 0);
  if (end < 0) {
    end += length;
  }
  length = start > end ? 0 : ((end - start) >>> 0);
  start >>>= 0;

  var result = Array(length);
  while (++index < length) {
    result[index] = array[index + start];
  }
  return result;
}

module.exports = baseSlice;

},{}],132:[function(_dereq_,module,exports){
arguments[4][39][0].apply(exports,arguments)
},{"39":39}],133:[function(_dereq_,module,exports){
arguments[4][40][0].apply(exports,arguments)
},{"167":167,"40":40}],134:[function(_dereq_,module,exports){
arguments[4][74][0].apply(exports,arguments)
},{"104":104,"133":133,"148":148,"74":74}],135:[function(_dereq_,module,exports){
arguments[4][41][0].apply(exports,arguments)
},{"143":143,"150":150,"154":154,"41":41}],136:[function(_dereq_,module,exports){
arguments[4][42][0].apply(exports,arguments)
},{"154":154,"42":42}],137:[function(_dereq_,module,exports){
var baseCallback = _dereq_(112),
    baseFind = _dereq_(117),
    baseFindIndex = _dereq_(118),
    isArray = _dereq_(157);

/**
 * Creates a `_.find` or `_.findLast` function.
 *
 * @private
 * @param {Function} eachFunc The function to iterate over a collection.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new find function.
 */
function createFind(eachFunc, fromRight) {
  return function(collection, predicate, thisArg) {
    predicate = baseCallback(predicate, thisArg, 3);
    if (isArray(collection)) {
      var index = baseFindIndex(collection, predicate, fromRight);
      return index > -1 ? collection[index] : undefined;
    }
    return baseFind(collection, predicate, eachFunc);
  };
}

module.exports = createFind;

},{"112":112,"117":117,"118":118,"157":157}],138:[function(_dereq_,module,exports){
arguments[4][43][0].apply(exports,arguments)
},{"133":133,"157":157,"43":43}],139:[function(_dereq_,module,exports){
var baseCallback = _dereq_(112),
    baseReduce = _dereq_(130),
    isArray = _dereq_(157);

/**
 * Creates a function for `_.reduce` or `_.reduceRight`.
 *
 * @private
 * @param {Function} arrayFunc The function to iterate over an array.
 * @param {Function} eachFunc The function to iterate over a collection.
 * @returns {Function} Returns the new each function.
 */
function createReduce(arrayFunc, eachFunc) {
  return function(collection, iteratee, accumulator, thisArg) {
    var initFromArray = arguments.length < 3;
    return (typeof iteratee == 'function' && thisArg === undefined && isArray(collection))
      ? arrayFunc(collection, iteratee, accumulator, initFromArray)
      : baseReduce(collection, baseCallback(iteratee, thisArg, 4), accumulator, initFromArray, eachFunc);
  };
}

module.exports = createReduce;

},{"112":112,"130":130,"157":157}],140:[function(_dereq_,module,exports){
var arraySome = _dereq_(109);

/**
 * A specialized version of `baseIsEqualDeep` for arrays with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Array} array The array to compare.
 * @param {Array} other The other array to compare.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Function} [customizer] The function to customize comparing arrays.
 * @param {boolean} [isLoose] Specify performing partial comparisons.
 * @param {Array} [stackA] Tracks traversed `value` objects.
 * @param {Array} [stackB] Tracks traversed `other` objects.
 * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
 */
function equalArrays(array, other, equalFunc, customizer, isLoose, stackA, stackB) {
  var index = -1,
      arrLength = array.length,
      othLength = other.length;

  if (arrLength != othLength && !(isLoose && othLength > arrLength)) {
    return false;
  }
  // Ignore non-index properties.
  while (++index < arrLength) {
    var arrValue = array[index],
        othValue = other[index],
        result = customizer ? customizer(isLoose ? othValue : arrValue, isLoose ? arrValue : othValue, index) : undefined;

    if (result !== undefined) {
      if (result) {
        continue;
      }
      return false;
    }
    // Recursively compare arrays (susceptible to call stack limits).
    if (isLoose) {
      if (!arraySome(other, function(othValue) {
            return arrValue === othValue || equalFunc(arrValue, othValue, customizer, isLoose, stackA, stackB);
          })) {
        return false;
      }
    } else if (!(arrValue === othValue || equalFunc(arrValue, othValue, customizer, isLoose, stackA, stackB))) {
      return false;
    }
  }
  return true;
}

module.exports = equalArrays;

},{"109":109}],141:[function(_dereq_,module,exports){
/** `Object#toString` result references. */
var boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    numberTag = '[object Number]',
    regexpTag = '[object RegExp]',
    stringTag = '[object String]';

/**
 * A specialized version of `baseIsEqualDeep` for comparing objects of
 * the same `toStringTag`.
 *
 * **Note:** This function only supports comparing values with tags of
 * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
 *
 * @private
 * @param {Object} value The object to compare.
 * @param {Object} other The other object to compare.
 * @param {string} tag The `toStringTag` of the objects to compare.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalByTag(object, other, tag) {
  switch (tag) {
    case boolTag:
    case dateTag:
      // Coerce dates and booleans to numbers, dates to milliseconds and booleans
      // to `1` or `0` treating invalid dates coerced to `NaN` as not equal.
      return +object == +other;

    case errorTag:
      return object.name == other.name && object.message == other.message;

    case numberTag:
      // Treat `NaN` vs. `NaN` as equal.
      return (object != +object)
        ? other != +other
        : object == +other;

    case regexpTag:
    case stringTag:
      // Coerce regexes to strings and treat strings primitives and string
      // objects as equal. See https://es5.github.io/#x15.10.6.4 for more details.
      return object == (other + '');
  }
  return false;
}

module.exports = equalByTag;

},{}],142:[function(_dereq_,module,exports){
var keys = _dereq_(163);

/** Used for native method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * A specialized version of `baseIsEqualDeep` for objects with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Function} [customizer] The function to customize comparing values.
 * @param {boolean} [isLoose] Specify performing partial comparisons.
 * @param {Array} [stackA] Tracks traversed `value` objects.
 * @param {Array} [stackB] Tracks traversed `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalObjects(object, other, equalFunc, customizer, isLoose, stackA, stackB) {
  var objProps = keys(object),
      objLength = objProps.length,
      othProps = keys(other),
      othLength = othProps.length;

  if (objLength != othLength && !isLoose) {
    return false;
  }
  var index = objLength;
  while (index--) {
    var key = objProps[index];
    if (!(isLoose ? key in other : hasOwnProperty.call(other, key))) {
      return false;
    }
  }
  var skipCtor = isLoose;
  while (++index < objLength) {
    key = objProps[index];
    var objValue = object[key],
        othValue = other[key],
        result = customizer ? customizer(isLoose ? othValue : objValue, isLoose? objValue : othValue, key) : undefined;

    // Recursively compare objects (susceptible to call stack limits).
    if (!(result === undefined ? equalFunc(objValue, othValue, customizer, isLoose, stackA, stackB) : result)) {
      return false;
    }
    skipCtor || (skipCtor = key == 'constructor');
  }
  if (!skipCtor) {
    var objCtor = object.constructor,
        othCtor = other.constructor;

    // Non `Object` object instances with different constructors are not equal.
    if (objCtor != othCtor &&
        ('constructor' in object && 'constructor' in other) &&
        !(typeof objCtor == 'function' && objCtor instanceof objCtor &&
          typeof othCtor == 'function' && othCtor instanceof othCtor)) {
      return false;
    }
  }
  return true;
}

module.exports = equalObjects;

},{"163":163}],143:[function(_dereq_,module,exports){
arguments[4][44][0].apply(exports,arguments)
},{"128":128,"44":44}],144:[function(_dereq_,module,exports){
var isStrictComparable = _dereq_(152),
    pairs = _dereq_(165);

/**
 * Gets the propery names, values, and compare flags of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the match data of `object`.
 */
function getMatchData(object) {
  var result = pairs(object),
      length = result.length;

  while (length--) {
    result[length][2] = isStrictComparable(result[length][1]);
  }
  return result;
}

module.exports = getMatchData;

},{"152":152,"165":165}],145:[function(_dereq_,module,exports){
arguments[4][45][0].apply(exports,arguments)
},{"158":158,"45":45}],146:[function(_dereq_,module,exports){
arguments[4][46][0].apply(exports,arguments)
},{"143":143,"150":150,"46":46}],147:[function(_dereq_,module,exports){
arguments[4][47][0].apply(exports,arguments)
},{"47":47}],148:[function(_dereq_,module,exports){
arguments[4][79][0].apply(exports,arguments)
},{"146":146,"147":147,"159":159,"79":79}],149:[function(_dereq_,module,exports){
var isArray = _dereq_(157),
    toObject = _dereq_(154);

/** Used to match property names within property paths. */
var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\n\\]|\\.)*?\1)\]/,
    reIsPlainProp = /^\w*$/;

/**
 * Checks if `value` is a property name and not a property path.
 *
 * @private
 * @param {*} value The value to check.
 * @param {Object} [object] The object to query keys on.
 * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
 */
function isKey(value, object) {
  var type = typeof value;
  if ((type == 'string' && reIsPlainProp.test(value)) || type == 'number') {
    return true;
  }
  if (isArray(value)) {
    return false;
  }
  var result = !reIsDeepProp.test(value);
  return result || (object != null && value in toObject(object));
}

module.exports = isKey;

},{"154":154,"157":157}],150:[function(_dereq_,module,exports){
arguments[4][48][0].apply(exports,arguments)
},{"48":48}],151:[function(_dereq_,module,exports){
arguments[4][49][0].apply(exports,arguments)
},{"49":49}],152:[function(_dereq_,module,exports){
var isObject = _dereq_(159);

/**
 * Checks if `value` is suitable for strict equality comparisons, i.e. `===`.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` if suitable for strict
 *  equality comparisons, else `false`.
 */
function isStrictComparable(value) {
  return value === value && !isObject(value);
}

module.exports = isStrictComparable;

},{"159":159}],153:[function(_dereq_,module,exports){
arguments[4][50][0].apply(exports,arguments)
},{"147":147,"150":150,"156":156,"157":157,"164":164,"50":50}],154:[function(_dereq_,module,exports){
arguments[4][51][0].apply(exports,arguments)
},{"159":159,"51":51}],155:[function(_dereq_,module,exports){
var baseToString = _dereq_(132),
    isArray = _dereq_(157);

/** Used to match property names within property paths. */
var rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\n\\]|\\.)*?)\2)\]/g;

/** Used to match backslashes in property paths. */
var reEscapeChar = /\\(\\)?/g;

/**
 * Converts `value` to property path array if it's not one.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {Array} Returns the property path array.
 */
function toPath(value) {
  if (isArray(value)) {
    return value;
  }
  var result = [];
  baseToString(value).replace(rePropName, function(match, number, quote, string) {
    result.push(quote ? string.replace(reEscapeChar, '$1') : (number || match));
  });
  return result;
}

module.exports = toPath;

},{"132":132,"157":157}],156:[function(_dereq_,module,exports){
arguments[4][52][0].apply(exports,arguments)
},{"146":146,"151":151,"52":52}],157:[function(_dereq_,module,exports){
arguments[4][53][0].apply(exports,arguments)
},{"145":145,"150":150,"151":151,"53":53}],158:[function(_dereq_,module,exports){
arguments[4][55][0].apply(exports,arguments)
},{"151":151,"166":166,"55":55}],159:[function(_dereq_,module,exports){
arguments[4][57][0].apply(exports,arguments)
},{"57":57}],160:[function(_dereq_,module,exports){
arguments[4][88][0].apply(exports,arguments)
},{"151":151,"88":88}],161:[function(_dereq_,module,exports){
var isLength = _dereq_(150),
    isObjectLike = _dereq_(151);

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    funcTag = '[object Function]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    objectTag = '[object Object]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    weakMapTag = '[object WeakMap]';

var arrayBufferTag = '[object ArrayBuffer]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';

/** Used to identify `toStringTag` values of typed arrays. */
var typedArrayTags = {};
typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
typedArrayTags[uint32Tag] = true;
typedArrayTags[argsTag] = typedArrayTags[arrayTag] =
typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
typedArrayTags[dateTag] = typedArrayTags[errorTag] =
typedArrayTags[funcTag] = typedArrayTags[mapTag] =
typedArrayTags[numberTag] = typedArrayTags[objectTag] =
typedArrayTags[regexpTag] = typedArrayTags[setTag] =
typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/**
 * Checks if `value` is classified as a typed array.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isTypedArray(new Uint8Array);
 * // => true
 *
 * _.isTypedArray([]);
 * // => false
 */
function isTypedArray(value) {
  return isObjectLike(value) && isLength(value.length) && !!typedArrayTags[objToString.call(value)];
}

module.exports = isTypedArray;

},{"150":150,"151":151}],162:[function(_dereq_,module,exports){
arguments[4][89][0].apply(exports,arguments)
},{"110":110,"111":111,"134":134,"89":89}],163:[function(_dereq_,module,exports){
arguments[4][58][0].apply(exports,arguments)
},{"145":145,"146":146,"153":153,"159":159,"58":58}],164:[function(_dereq_,module,exports){
arguments[4][59][0].apply(exports,arguments)
},{"147":147,"150":150,"156":156,"157":157,"159":159,"59":59}],165:[function(_dereq_,module,exports){
var keys = _dereq_(163),
    toObject = _dereq_(154);

/**
 * Creates a two dimensional array of the key-value pairs for `object`,
 * e.g. `[[key1, value1], [key2, value2]]`.
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the new array of key-value pairs.
 * @example
 *
 * _.pairs({ 'barney': 36, 'fred': 40 });
 * // => [['barney', 36], ['fred', 40]] (iteration order is not guaranteed)
 */
function pairs(object) {
  object = toObject(object);

  var index = -1,
      props = keys(object),
      length = props.length,
      result = Array(length);

  while (++index < length) {
    var key = props[index];
    result[index] = [key, object[key]];
  }
  return result;
}

module.exports = pairs;

},{"154":154,"163":163}],166:[function(_dereq_,module,exports){
arguments[4][60][0].apply(exports,arguments)
},{"132":132,"60":60}],167:[function(_dereq_,module,exports){
arguments[4][61][0].apply(exports,arguments)
},{"61":61}],168:[function(_dereq_,module,exports){
var baseProperty = _dereq_(128),
    basePropertyDeep = _dereq_(129),
    isKey = _dereq_(149);

/**
 * Creates a function that returns the property value at `path` on a
 * given object.
 *
 * @static
 * @memberOf _
 * @category Utility
 * @param {Array|string} path The path of the property to get.
 * @returns {Function} Returns the new function.
 * @example
 *
 * var objects = [
 *   { 'a': { 'b': { 'c': 2 } } },
 *   { 'a': { 'b': { 'c': 1 } } }
 * ];
 *
 * _.map(objects, _.property('a.b.c'));
 * // => [2, 1]
 *
 * _.pluck(_.sortBy(objects, _.property(['a', 'b', 'c'])), 'a.b.c');
 * // => [1, 2]
 */
function property(path) {
  return isKey(path) ? baseProperty(path) : basePropertyDeep(path);
}

module.exports = property;

},{"128":128,"129":129,"149":149}],169:[function(_dereq_,module,exports){
module.exports = _dereq_(173);
},{"173":173}],170:[function(_dereq_,module,exports){
'use strict';

function Base() { }

Base.prototype.get = function(name) {
  return this.$model.properties.get(this, name);
};

Base.prototype.set = function(name, value) {
  this.$model.properties.set(this, name, value);
};


module.exports = Base;
},{}],171:[function(_dereq_,module,exports){
'use strict';

var pick = _dereq_(239),
    assign = _dereq_(235),
    forEach = _dereq_(180);

var parseNameNs = _dereq_(174).parseName;


function DescriptorBuilder(nameNs) {
  this.ns = nameNs;
  this.name = nameNs.name;
  this.allTypes = [];
  this.properties = [];
  this.propertiesByName = {};
}

module.exports = DescriptorBuilder;


DescriptorBuilder.prototype.build = function() {
  return pick(this, [ 'ns', 'name', 'allTypes', 'properties', 'propertiesByName', 'bodyProperty' ]);
};

DescriptorBuilder.prototype.addProperty = function(p, idx) {
  this.addNamedProperty(p, true);

  var properties = this.properties;

  if (idx !== undefined) {
    properties.splice(idx, 0, p);
  } else {
    properties.push(p);
  }
};


DescriptorBuilder.prototype.replaceProperty = function(oldProperty, newProperty) {
  var oldNameNs = oldProperty.ns;

  var props = this.properties,
      propertiesByName = this.propertiesByName,
      rename = oldProperty.name !== newProperty.name;

  if (oldProperty.isBody) {

    if (!newProperty.isBody) {
      throw new Error(
        'property <' + newProperty.ns.name + '> must be body property ' +
        'to refine <' + oldProperty.ns.name + '>');
    }

    // TODO: Check compatibility
    this.setBodyProperty(newProperty, false);
  }

  // replacing the named property is intentional
  // thus, validate only if this is a "rename" operation
  this.addNamedProperty(newProperty, rename);

  // replace old property at index with new one
  var idx = props.indexOf(oldProperty);
  if (idx === -1) {
    throw new Error('property <' + oldNameNs.name + '> not found in property list');
  }

  props[idx] = newProperty;

  // replace propertiesByName entry with new property
  propertiesByName[oldNameNs.name] = propertiesByName[oldNameNs.localName] = newProperty;
};


DescriptorBuilder.prototype.redefineProperty = function(p) {

  var nsPrefix = p.ns.prefix;
  var parts = p.redefines.split('#');

  var name = parseNameNs(parts[0], nsPrefix);
  var attrName = parseNameNs(parts[1], name.prefix).name;

  var redefinedProperty = this.propertiesByName[attrName];
  if (!redefinedProperty) {
    throw new Error('refined property <' + attrName + '> not found');
  } else {
    this.replaceProperty(redefinedProperty, p);
  }

  delete p.redefines;
};

DescriptorBuilder.prototype.addNamedProperty = function(p, validate) {
  var ns = p.ns,
      propsByName = this.propertiesByName;

  if (validate) {
    this.assertNotDefined(p, ns.name);
    this.assertNotDefined(p, ns.localName);
  }

  propsByName[ns.name] = propsByName[ns.localName] = p;
};

DescriptorBuilder.prototype.removeNamedProperty = function(p) {
  var ns = p.ns,
      propsByName = this.propertiesByName;

  delete propsByName[ns.name];
  delete propsByName[ns.localName];
};

DescriptorBuilder.prototype.setBodyProperty = function(p, validate) {

  if (validate && this.bodyProperty) {
    throw new Error(
      'body property defined multiple times ' +
      '(<' + this.bodyProperty.ns.name + '>, <' + p.ns.name + '>)');
  }

  this.bodyProperty = p;
};

DescriptorBuilder.prototype.addIdProperty = function(name) {
  var nameNs = parseNameNs(name, this.ns.prefix);

  var p = {
    name: nameNs.localName,
    type: 'String',
    isAttr: true,
    ns: nameNs
  };

  // ensure that id is always the first attribute (if present)
  this.addProperty(p, 0);
};

DescriptorBuilder.prototype.assertNotDefined = function(p, name) {
  var propertyName = p.name,
      definedProperty = this.propertiesByName[propertyName];

  if (definedProperty) {
    throw new Error(
      'property <' + propertyName + '> already defined; ' +
      'override of <' + definedProperty.definedBy.ns.name + '#' + definedProperty.ns.name + '> by ' +
      '<' + p.definedBy.ns.name + '#' + p.ns.name + '> not allowed without redefines');
  }
};

DescriptorBuilder.prototype.hasProperty = function(name) {
  return this.propertiesByName[name];
};

DescriptorBuilder.prototype.addTrait = function(t) {

  var allTypes = this.allTypes;

  if (allTypes.indexOf(t) !== -1) {
    return;
  }

  forEach(t.properties, function(p) {

    // clone property to allow extensions
    p = assign({}, p, {
      name: p.ns.localName
    });

    Object.defineProperty(p, 'definedBy', {
      value: t
    });

    // add redefine support
    if (p.redefines) {
      this.redefineProperty(p);
    } else {
      if (p.isBody) {
        this.setBodyProperty(p);
      }
      this.addProperty(p);
    }
  }, this);

  allTypes.push(t);
};

},{"174":174,"180":180,"235":235,"239":239}],172:[function(_dereq_,module,exports){
'use strict';

var forEach = _dereq_(180);

var Base = _dereq_(170);


function Factory(model, properties) {
  this.model = model;
  this.properties = properties;
}

module.exports = Factory;


Factory.prototype.createType = function(descriptor) {

  var model = this.model;

  var props = this.properties,
      prototype = Object.create(Base.prototype);

  // initialize default values
  forEach(descriptor.properties, function(p) {
    if (!p.isMany && p.default !== undefined) {
      prototype[p.name] = p.default;
    }
  });

  props.defineModel(prototype, model);
  props.defineDescriptor(prototype, descriptor);

  var name = descriptor.ns.name;

  /**
   * The new type constructor
   */
  function ModdleElement(attrs) {
    props.define(this, '$type', { value: name, enumerable: true });
    props.define(this, '$attrs', { value: {} });
    props.define(this, '$parent', { writable: true });

    forEach(attrs, function(val, key) {
      this.set(key, val);
    }, this);
  }

  ModdleElement.prototype = prototype;

  ModdleElement.hasType = prototype.$instanceOf = this.model.hasType;

  // static links
  props.defineModel(ModdleElement, model);
  props.defineDescriptor(ModdleElement, descriptor);

  return ModdleElement;
};
},{"170":170,"180":180}],173:[function(_dereq_,module,exports){
'use strict';

var isString = _dereq_(233),
    isObject = _dereq_(232),
    forEach = _dereq_(180),
    find = _dereq_(179);


var Factory = _dereq_(172),
    Registry = _dereq_(176),
    Properties = _dereq_(175);

var parseNameNs = _dereq_(174).parseName;


//// Moddle implementation /////////////////////////////////////////////////

/**
 * @class Moddle
 *
 * A model that can be used to create elements of a specific type.
 *
 * @example
 *
 * var Moddle = require('moddle');
 *
 * var pkg = {
 *   name: 'mypackage',
 *   prefix: 'my',
 *   types: [
 *     { name: 'Root' }
 *   ]
 * };
 *
 * var moddle = new Moddle([pkg]);
 *
 * @param {Array<Package>} packages  the packages to contain
 * @param {Object} options  additional options to pass to the model
 */
function Moddle(packages, options) {

  options = options || {};

  this.properties = new Properties(this);

  this.factory = new Factory(this, this.properties);
  this.registry = new Registry(packages, this.properties, options);

  this.typeCache = {};
}

module.exports = Moddle;


/**
 * Create an instance of the specified type.
 *
 * @method Moddle#create
 *
 * @example
 *
 * var foo = moddle.create('my:Foo');
 * var bar = moddle.create('my:Bar', { id: 'BAR_1' });
 *
 * @param  {String|Object} descriptor the type descriptor or name know to the model
 * @param  {Object} attrs   a number of attributes to initialize the model instance with
 * @return {Object}         model instance
 */
Moddle.prototype.create = function(descriptor, attrs) {
  var Type = this.getType(descriptor);

  if (!Type) {
    throw new Error('unknown type <' + descriptor + '>');
  }

  return new Type(attrs);
};


/**
 * Returns the type representing a given descriptor
 *
 * @method Moddle#getType
 *
 * @example
 *
 * var Foo = moddle.getType('my:Foo');
 * var foo = new Foo({ 'id' : 'FOO_1' });
 *
 * @param  {String|Object} descriptor the type descriptor or name know to the model
 * @return {Object}         the type representing the descriptor
 */
Moddle.prototype.getType = function(descriptor) {

  var cache = this.typeCache;

  var name = isString(descriptor) ? descriptor : descriptor.ns.name;

  var type = cache[name];

  if (!type) {
    descriptor = this.registry.getEffectiveDescriptor(name);
    type = cache[name] = this.factory.createType(descriptor);
  }

  return type;
};


/**
 * Creates an any-element type to be used within model instances.
 *
 * This can be used to create custom elements that lie outside the meta-model.
 * The created element contains all the meta-data required to serialize it
 * as part of meta-model elements.
 *
 * @method Moddle#createAny
 *
 * @example
 *
 * var foo = moddle.createAny('vendor:Foo', 'http://vendor', {
 *   value: 'bar'
 * });
 *
 * var container = moddle.create('my:Container', 'http://my', {
 *   any: [ foo ]
 * });
 *
 * // go ahead and serialize the stuff
 *
 *
 * @param  {String} name  the name of the element
 * @param  {String} nsUri the namespace uri of the element
 * @param  {Object} [properties] a map of properties to initialize the instance with
 * @return {Object} the any type instance
 */
Moddle.prototype.createAny = function(name, nsUri, properties) {

  var nameNs = parseNameNs(name);

  var element = {
    $type: name
  };

  var descriptor = {
    name: name,
    isGeneric: true,
    ns: {
      prefix: nameNs.prefix,
      localName: nameNs.localName,
      uri: nsUri
    }
  };

  this.properties.defineDescriptor(element, descriptor);
  this.properties.defineModel(element, this);
  this.properties.define(element, '$parent', { enumerable: false, writable: true });

  forEach(properties, function(a, key) {
    if (isObject(a) && a.value !== undefined) {
      element[a.name] = a.value;
    } else {
      element[key] = a;
    }
  });

  return element;
};

/**
 * Returns a registered package by uri or prefix
 *
 * @return {Object} the package
 */
Moddle.prototype.getPackage = function(uriOrPrefix) {
  return this.registry.getPackage(uriOrPrefix);
};

/**
 * Returns a snapshot of all known packages
 *
 * @return {Object} the package
 */
Moddle.prototype.getPackages = function() {
  return this.registry.getPackages();
};

/**
 * Returns the descriptor for an element
 */
Moddle.prototype.getElementDescriptor = function(element) {
  return element.$descriptor;
};

/**
 * Returns true if the given descriptor or instance
 * represents the given type.
 *
 * May be applied to this, if element is omitted.
 */
Moddle.prototype.hasType = function(element, type) {
  if (type === undefined) {
    type = element;
    element = this;
  }

  var descriptor = element.$model.getElementDescriptor(element);

  return !!find(descriptor.allTypes, function(t) {
    return t.name === type;
  });
};


/**
 * Returns the descriptor of an elements named property
 */
Moddle.prototype.getPropertyDescriptor = function(element, property) {
  return this.getElementDescriptor(element).propertiesByName[property];
};

},{"172":172,"174":174,"175":175,"176":176,"179":179,"180":180,"232":232,"233":233}],174:[function(_dereq_,module,exports){
'use strict';

/**
 * Parses a namespaced attribute name of the form (ns:)localName to an object,
 * given a default prefix to assume in case no explicit namespace is given.
 *
 * @param {String} name
 * @param {String} [defaultPrefix] the default prefix to take, if none is present.
 *
 * @return {Object} the parsed name
 */
module.exports.parseName = function(name, defaultPrefix) {
  var parts = name.split(/:/),
      localName, prefix;

  // no prefix (i.e. only local name)
  if (parts.length === 1) {
    localName = name;
    prefix = defaultPrefix;
  } else
  // prefix + local name
  if (parts.length === 2) {
    localName = parts[1];
    prefix = parts[0];
  } else {
    throw new Error('expected <prefix:localName> or <localName>, got ' + name);
  }

  name = (prefix ? prefix + ':' : '') + localName;

  return {
    name: name,
    prefix: prefix,
    localName: localName
  };
};
},{}],175:[function(_dereq_,module,exports){
'use strict';


/**
 * A utility that gets and sets properties of model elements.
 *
 * @param {Model} model
 */
function Properties(model) {
  this.model = model;
}

module.exports = Properties;


/**
 * Sets a named property on the target element
 *
 * @param {Object} target
 * @param {String} name
 * @param {Object} value
 */
Properties.prototype.set = function(target, name, value) {

  var property = this.model.getPropertyDescriptor(target, name);

  if (!property) {
    target.$attrs[name] = value;
  } else {
    Object.defineProperty(target, property.name, {
      enumerable: !property.isReference,
      writable: true,
      value: value
    });
  }
};

/**
 * Returns the named property of the given element
 *
 * @param  {Object} target
 * @param  {String} name
 *
 * @return {Object}
 */
Properties.prototype.get = function(target, name) {

  var property = this.model.getPropertyDescriptor(target, name);

  if (!property) {
    return target.$attrs[name];
  }

  var propertyName = property.name;

  // check if access to collection property and lazily initialize it
  if (!target[propertyName] && property.isMany) {
    Object.defineProperty(target, propertyName, {
      enumerable: !property.isReference,
      writable: true,
      value: []
    });
  }

  return target[propertyName];
};


/**
 * Define a property on the target element
 *
 * @param  {Object} target
 * @param  {String} name
 * @param  {Object} options
 */
Properties.prototype.define = function(target, name, options) {
  Object.defineProperty(target, name, options);
};


/**
 * Define the descriptor for an element
 */
Properties.prototype.defineDescriptor = function(target, descriptor) {
  this.define(target, '$descriptor', { value: descriptor });
};

/**
 * Define the model for an element
 */
Properties.prototype.defineModel = function(target, model) {
  this.define(target, '$model', { value: model });
};
},{}],176:[function(_dereq_,module,exports){
'use strict';

var assign = _dereq_(235),
    forEach = _dereq_(180);

var Types = _dereq_(177),
    DescriptorBuilder = _dereq_(171);

var parseNameNs = _dereq_(174).parseName,
    isBuiltInType = Types.isBuiltIn;


function Registry(packages, properties, options) {
  this.options = assign({ generateId: 'id' }, options || {});

  this.packageMap = {};
  this.typeMap = {};

  this.packages = [];

  this.properties = properties;

  forEach(packages, this.registerPackage, this);
}

module.exports = Registry;


Registry.prototype.getPackage = function(uriOrPrefix) {
  return this.packageMap[uriOrPrefix];
};

Registry.prototype.getPackages = function() {
  return this.packages;
};


Registry.prototype.registerPackage = function(pkg) {

  // copy package
  pkg = assign({}, pkg);

  // register types
  forEach(pkg.types, function(descriptor) {
    this.registerType(descriptor, pkg);
  }, this);

  this.packageMap[pkg.uri] = this.packageMap[pkg.prefix] = pkg;
  this.packages.push(pkg);
};


/**
 * Register a type from a specific package with us
 */
Registry.prototype.registerType = function(type, pkg) {

  type = assign({}, type, {
    superClass: (type.superClass || []).slice(),
    extends: (type.extends || []).slice(),
    properties: (type.properties || []).slice()
  });

  var ns = parseNameNs(type.name, pkg.prefix),
      name = ns.name,
      propertiesByName = {};

  // parse properties
  forEach(type.properties, function(p) {

    // namespace property names
    var propertyNs = parseNameNs(p.name, ns.prefix),
        propertyName = propertyNs.name;

    // namespace property types
    if (!isBuiltInType(p.type)) {
      p.type = parseNameNs(p.type, propertyNs.prefix).name;
    }

    assign(p, {
      ns: propertyNs,
      name: propertyName
    });

    propertiesByName[propertyName] = p;
  });

  // update ns + name
  assign(type, {
    ns: ns,
    name: name,
    propertiesByName: propertiesByName
  });

  forEach(type.extends, function(extendsName) {
    var extended = this.typeMap[extendsName];

    extended.traits = extended.traits || [];
    extended.traits.push(name);
  }, this);

  // link to package
  this.definePackage(type, pkg);

  // register
  this.typeMap[name] = type;
};


/**
 * Traverse the type hierarchy from bottom to top.
 */
Registry.prototype.mapTypes = function(nsName, iterator) {

  var type = isBuiltInType(nsName.name) ? { name: nsName.name } : this.typeMap[nsName.name];

  var self = this;

  /**
   * Traverse the selected super type or trait
   *
   * @param {String} cls
   */
  function traverseSuper(cls) {
    var parentNs = parseNameNs(cls, isBuiltInType(cls) ? '' : nsName.prefix);
    self.mapTypes(parentNs, iterator);
  }

  if (!type) {
    throw new Error('unknown type <' + nsName.name + '>');
  }

  forEach(type.superClass, traverseSuper);

  iterator(type);

  forEach(type.traits, traverseSuper);
};


/**
 * Returns the effective descriptor for a type.
 *
 * @param  {String} type the namespaced name (ns:localName) of the type
 *
 * @return {Descriptor} the resulting effective descriptor
 */
Registry.prototype.getEffectiveDescriptor = function(name) {

  var nsName = parseNameNs(name);

  var builder = new DescriptorBuilder(nsName);

  this.mapTypes(nsName, function(type) {
    builder.addTrait(type);
  });

  // check we have an id assigned
  var id = this.options.generateId;
  if (id && !builder.hasProperty(id)) {
    builder.addIdProperty(id);
  }

  var descriptor = builder.build();

  // define package link
  this.definePackage(descriptor, descriptor.allTypes[descriptor.allTypes.length - 1].$pkg);

  return descriptor;
};


Registry.prototype.definePackage = function(target, pkg) {
  this.properties.define(target, '$pkg', { value: pkg });
};
},{"171":171,"174":174,"177":177,"180":180,"235":235}],177:[function(_dereq_,module,exports){
'use strict';

/**
 * Built-in moddle types
 */
var BUILTINS = {
  String: true,
  Boolean: true,
  Integer: true,
  Real: true,
  Element: true
};

/**
 * Converters for built in types from string representations
 */
var TYPE_CONVERTERS = {
  String: function(s) { return s; },
  Boolean: function(s) { return s === 'true'; },
  Integer: function(s) { return parseInt(s, 10); },
  Real: function(s) { return parseFloat(s, 10); }
};

/**
 * Convert a type to its real representation
 */
module.exports.coerceType = function(type, value) {

  var converter = TYPE_CONVERTERS[type];

  if (converter) {
    return converter(value);
  } else {
    return value;
  }
};

/**
 * Return whether the given type is built-in
 */
module.exports.isBuiltIn = function(type) {
  return !!BUILTINS[type];
};

/**
 * Return whether the given type is simple
 */
module.exports.isSimple = function(type) {
  return !!TYPE_CONVERTERS[type];
};
},{}],178:[function(_dereq_,module,exports){
arguments[4][97][0].apply(exports,arguments)
},{"97":97}],179:[function(_dereq_,module,exports){
arguments[4][99][0].apply(exports,arguments)
},{"188":188,"209":209,"99":99}],180:[function(_dereq_,module,exports){
arguments[4][32][0].apply(exports,arguments)
},{"182":182,"188":188,"210":210,"32":32}],181:[function(_dereq_,module,exports){
arguments[4][66][0].apply(exports,arguments)
},{"66":66}],182:[function(_dereq_,module,exports){
arguments[4][33][0].apply(exports,arguments)
},{"33":33}],183:[function(_dereq_,module,exports){
arguments[4][109][0].apply(exports,arguments)
},{"109":109}],184:[function(_dereq_,module,exports){
arguments[4][67][0].apply(exports,arguments)
},{"236":236,"67":67}],185:[function(_dereq_,module,exports){
arguments[4][68][0].apply(exports,arguments)
},{"187":187,"236":236,"68":68}],186:[function(_dereq_,module,exports){
arguments[4][112][0].apply(exports,arguments)
},{"112":112,"199":199,"200":200,"205":205,"241":241,"242":242}],187:[function(_dereq_,module,exports){
arguments[4][69][0].apply(exports,arguments)
},{"69":69}],188:[function(_dereq_,module,exports){
arguments[4][34][0].apply(exports,arguments)
},{"194":194,"207":207,"34":34}],189:[function(_dereq_,module,exports){
arguments[4][117][0].apply(exports,arguments)
},{"117":117}],190:[function(_dereq_,module,exports){
arguments[4][118][0].apply(exports,arguments)
},{"118":118}],191:[function(_dereq_,module,exports){
var isArguments = _dereq_(229),
    isArray = _dereq_(230),
    isArrayLike = _dereq_(217),
    isObjectLike = _dereq_(222);

/**
 * The base implementation of `_.flatten` with added support for restricting
 * flattening and specifying the start index.
 *
 * @private
 * @param {Array} array The array to flatten.
 * @param {boolean} [isDeep] Specify a deep flatten.
 * @param {boolean} [isStrict] Restrict flattening to arrays-like objects.
 * @returns {Array} Returns the new flattened array.
 */
function baseFlatten(array, isDeep, isStrict) {
  var index = -1,
      length = array.length,
      resIndex = -1,
      result = [];

  while (++index < length) {
    var value = array[index];
    if (isObjectLike(value) && isArrayLike(value) &&
        (isStrict || isArray(value) || isArguments(value))) {
      if (isDeep) {
        // Recursively flatten arrays (susceptible to call stack limits).
        value = baseFlatten(value, isDeep, isStrict);
      }
      var valIndex = -1,
          valLength = value.length;

      while (++valIndex < valLength) {
        result[++resIndex] = value[valIndex];
      }
    } else if (!isStrict) {
      result[++resIndex] = value;
    }
  }
  return result;
}

module.exports = baseFlatten;

},{"217":217,"222":222,"229":229,"230":230}],192:[function(_dereq_,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"208":208,"35":35}],193:[function(_dereq_,module,exports){
var baseFor = _dereq_(192),
    keysIn = _dereq_(237);

/**
 * The base implementation of `_.forIn` without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Object} Returns `object`.
 */
function baseForIn(object, iteratee) {
  return baseFor(object, iteratee, keysIn);
}

module.exports = baseForIn;

},{"192":192,"237":237}],194:[function(_dereq_,module,exports){
arguments[4][36][0].apply(exports,arguments)
},{"192":192,"236":236,"36":36}],195:[function(_dereq_,module,exports){
arguments[4][121][0].apply(exports,arguments)
},{"121":121,"227":227}],196:[function(_dereq_,module,exports){
arguments[4][122][0].apply(exports,arguments)
},{"122":122,"197":197,"222":222,"232":232}],197:[function(_dereq_,module,exports){
arguments[4][123][0].apply(exports,arguments)
},{"123":123,"211":211,"212":212,"213":213,"230":230,"234":234}],198:[function(_dereq_,module,exports){
arguments[4][124][0].apply(exports,arguments)
},{"124":124,"196":196,"227":227}],199:[function(_dereq_,module,exports){
arguments[4][126][0].apply(exports,arguments)
},{"126":126,"198":198,"215":215,"227":227}],200:[function(_dereq_,module,exports){
arguments[4][127][0].apply(exports,arguments)
},{"127":127,"178":178,"195":195,"196":196,"203":203,"220":220,"223":223,"227":227,"228":228,"230":230}],201:[function(_dereq_,module,exports){
arguments[4][38][0].apply(exports,arguments)
},{"38":38}],202:[function(_dereq_,module,exports){
arguments[4][129][0].apply(exports,arguments)
},{"129":129,"195":195,"228":228}],203:[function(_dereq_,module,exports){
arguments[4][131][0].apply(exports,arguments)
},{"131":131}],204:[function(_dereq_,module,exports){
arguments[4][39][0].apply(exports,arguments)
},{"39":39}],205:[function(_dereq_,module,exports){
arguments[4][40][0].apply(exports,arguments)
},{"241":241,"40":40}],206:[function(_dereq_,module,exports){
arguments[4][74][0].apply(exports,arguments)
},{"181":181,"205":205,"219":219,"74":74}],207:[function(_dereq_,module,exports){
arguments[4][41][0].apply(exports,arguments)
},{"214":214,"221":221,"227":227,"41":41}],208:[function(_dereq_,module,exports){
arguments[4][42][0].apply(exports,arguments)
},{"227":227,"42":42}],209:[function(_dereq_,module,exports){
arguments[4][137][0].apply(exports,arguments)
},{"137":137,"186":186,"189":189,"190":190,"230":230}],210:[function(_dereq_,module,exports){
arguments[4][43][0].apply(exports,arguments)
},{"205":205,"230":230,"43":43}],211:[function(_dereq_,module,exports){
arguments[4][140][0].apply(exports,arguments)
},{"140":140,"183":183}],212:[function(_dereq_,module,exports){
arguments[4][141][0].apply(exports,arguments)
},{"141":141}],213:[function(_dereq_,module,exports){
arguments[4][142][0].apply(exports,arguments)
},{"142":142,"236":236}],214:[function(_dereq_,module,exports){
arguments[4][44][0].apply(exports,arguments)
},{"201":201,"44":44}],215:[function(_dereq_,module,exports){
arguments[4][144][0].apply(exports,arguments)
},{"144":144,"223":223,"238":238}],216:[function(_dereq_,module,exports){
arguments[4][45][0].apply(exports,arguments)
},{"231":231,"45":45}],217:[function(_dereq_,module,exports){
arguments[4][46][0].apply(exports,arguments)
},{"214":214,"221":221,"46":46}],218:[function(_dereq_,module,exports){
arguments[4][47][0].apply(exports,arguments)
},{"47":47}],219:[function(_dereq_,module,exports){
arguments[4][79][0].apply(exports,arguments)
},{"217":217,"218":218,"232":232,"79":79}],220:[function(_dereq_,module,exports){
arguments[4][149][0].apply(exports,arguments)
},{"149":149,"227":227,"230":230}],221:[function(_dereq_,module,exports){
arguments[4][48][0].apply(exports,arguments)
},{"48":48}],222:[function(_dereq_,module,exports){
arguments[4][49][0].apply(exports,arguments)
},{"49":49}],223:[function(_dereq_,module,exports){
arguments[4][152][0].apply(exports,arguments)
},{"152":152,"232":232}],224:[function(_dereq_,module,exports){
var toObject = _dereq_(227);

/**
 * A specialized version of `_.pick` which picks `object` properties specified
 * by `props`.
 *
 * @private
 * @param {Object} object The source object.
 * @param {string[]} props The property names to pick.
 * @returns {Object} Returns the new object.
 */
function pickByArray(object, props) {
  object = toObject(object);

  var index = -1,
      length = props.length,
      result = {};

  while (++index < length) {
    var key = props[index];
    if (key in object) {
      result[key] = object[key];
    }
  }
  return result;
}

module.exports = pickByArray;

},{"227":227}],225:[function(_dereq_,module,exports){
var baseForIn = _dereq_(193);

/**
 * A specialized version of `_.pick` which picks `object` properties `predicate`
 * returns truthy for.
 *
 * @private
 * @param {Object} object The source object.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {Object} Returns the new object.
 */
function pickByCallback(object, predicate) {
  var result = {};
  baseForIn(object, function(value, key, object) {
    if (predicate(value, key, object)) {
      result[key] = value;
    }
  });
  return result;
}

module.exports = pickByCallback;

},{"193":193}],226:[function(_dereq_,module,exports){
arguments[4][50][0].apply(exports,arguments)
},{"218":218,"221":221,"229":229,"230":230,"237":237,"50":50}],227:[function(_dereq_,module,exports){
arguments[4][51][0].apply(exports,arguments)
},{"232":232,"51":51}],228:[function(_dereq_,module,exports){
arguments[4][155][0].apply(exports,arguments)
},{"155":155,"204":204,"230":230}],229:[function(_dereq_,module,exports){
arguments[4][52][0].apply(exports,arguments)
},{"217":217,"222":222,"52":52}],230:[function(_dereq_,module,exports){
arguments[4][53][0].apply(exports,arguments)
},{"216":216,"221":221,"222":222,"53":53}],231:[function(_dereq_,module,exports){
arguments[4][55][0].apply(exports,arguments)
},{"222":222,"240":240,"55":55}],232:[function(_dereq_,module,exports){
arguments[4][57][0].apply(exports,arguments)
},{"57":57}],233:[function(_dereq_,module,exports){
arguments[4][88][0].apply(exports,arguments)
},{"222":222,"88":88}],234:[function(_dereq_,module,exports){
arguments[4][161][0].apply(exports,arguments)
},{"161":161,"221":221,"222":222}],235:[function(_dereq_,module,exports){
arguments[4][89][0].apply(exports,arguments)
},{"184":184,"185":185,"206":206,"89":89}],236:[function(_dereq_,module,exports){
arguments[4][58][0].apply(exports,arguments)
},{"216":216,"217":217,"226":226,"232":232,"58":58}],237:[function(_dereq_,module,exports){
arguments[4][59][0].apply(exports,arguments)
},{"218":218,"221":221,"229":229,"230":230,"232":232,"59":59}],238:[function(_dereq_,module,exports){
arguments[4][165][0].apply(exports,arguments)
},{"165":165,"227":227,"236":236}],239:[function(_dereq_,module,exports){
var baseFlatten = _dereq_(191),
    bindCallback = _dereq_(205),
    pickByArray = _dereq_(224),
    pickByCallback = _dereq_(225),
    restParam = _dereq_(181);

/**
 * Creates an object composed of the picked `object` properties. Property
 * names may be specified as individual arguments or as arrays of property
 * names. If `predicate` is provided it is invoked for each property of `object`
 * picking the properties `predicate` returns truthy for. The predicate is
 * bound to `thisArg` and invoked with three arguments: (value, key, object).
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The source object.
 * @param {Function|...(string|string[])} [predicate] The function invoked per
 *  iteration or property names to pick, specified as individual property
 *  names or arrays of property names.
 * @param {*} [thisArg] The `this` binding of `predicate`.
 * @returns {Object} Returns the new object.
 * @example
 *
 * var object = { 'user': 'fred', 'age': 40 };
 *
 * _.pick(object, 'user');
 * // => { 'user': 'fred' }
 *
 * _.pick(object, _.isString);
 * // => { 'user': 'fred' }
 */
var pick = restParam(function(object, props) {
  if (object == null) {
    return {};
  }
  return typeof props[0] == 'function'
    ? pickByCallback(object, bindCallback(props[0], props[1], 3))
    : pickByArray(object, baseFlatten(props));
});

module.exports = pick;

},{"181":181,"191":191,"205":205,"224":224,"225":225}],240:[function(_dereq_,module,exports){
arguments[4][60][0].apply(exports,arguments)
},{"204":204,"60":60}],241:[function(_dereq_,module,exports){
arguments[4][61][0].apply(exports,arguments)
},{"61":61}],242:[function(_dereq_,module,exports){
arguments[4][168][0].apply(exports,arguments)
},{"168":168,"201":201,"202":202,"220":220}],243:[function(_dereq_,module,exports){
(function (Buffer){
// wrapper for non-node envs
;(function (sax) {

sax.parser = function (strict, opt) { return new SAXParser(strict, opt) }
sax.SAXParser = SAXParser
sax.SAXStream = SAXStream
sax.createStream = createStream

// When we pass the MAX_BUFFER_LENGTH position, start checking for buffer overruns.
// When we check, schedule the next check for MAX_BUFFER_LENGTH - (max(buffer lengths)),
// since that's the earliest that a buffer overrun could occur.  This way, checks are
// as rare as required, but as often as necessary to ensure never crossing this bound.
// Furthermore, buffers are only tested at most once per write(), so passing a very
// large string into write() might have undesirable effects, but this is manageable by
// the caller, so it is assumed to be safe.  Thus, a call to write() may, in the extreme
// edge case, result in creating at most one complete copy of the string passed in.
// Set to Infinity to have unlimited buffers.
sax.MAX_BUFFER_LENGTH = 64 * 1024

var buffers = [
  "comment", "sgmlDecl", "textNode", "tagName", "doctype",
  "procInstName", "procInstBody", "entity", "attribName",
  "attribValue", "cdata", "script"
]

sax.EVENTS = // for discoverability.
  [ "text"
  , "processinginstruction"
  , "sgmldeclaration"
  , "doctype"
  , "comment"
  , "attribute"
  , "opentag"
  , "closetag"
  , "opencdata"
  , "cdata"
  , "closecdata"
  , "error"
  , "end"
  , "ready"
  , "script"
  , "opennamespace"
  , "closenamespace"
  ]

function SAXParser (strict, opt) {
  if (!(this instanceof SAXParser)) return new SAXParser(strict, opt)

  var parser = this
  clearBuffers(parser)
  parser.q = parser.c = ""
  parser.bufferCheckPosition = sax.MAX_BUFFER_LENGTH
  parser.opt = opt || {}
  parser.opt.lowercase = parser.opt.lowercase || parser.opt.lowercasetags
  parser.looseCase = parser.opt.lowercase ? "toLowerCase" : "toUpperCase"
  parser.tags = []
  parser.closed = parser.closedRoot = parser.sawRoot = false
  parser.tag = parser.error = null
  parser.strict = !!strict
  parser.noscript = !!(strict || parser.opt.noscript)
  parser.state = S.BEGIN
  parser.ENTITIES = Object.create(sax.ENTITIES)
  parser.attribList = []

  // namespaces form a prototype chain.
  // it always points at the current tag,
  // which protos to its parent tag.
  if (parser.opt.xmlns) parser.ns = Object.create(rootNS)

  // mostly just for error reporting
  parser.trackPosition = parser.opt.position !== false
  if (parser.trackPosition) {
    parser.position = parser.line = parser.column = 0
  }
  emit(parser, "onready")
}

if (!Object.create) Object.create = function (o) {
  function f () { this.__proto__ = o }
  f.prototype = o
  return new f
}

if (!Object.getPrototypeOf) Object.getPrototypeOf = function (o) {
  return o.__proto__
}

if (!Object.keys) Object.keys = function (o) {
  var a = []
  for (var i in o) if (o.hasOwnProperty(i)) a.push(i)
  return a
}

function checkBufferLength (parser) {
  var maxAllowed = Math.max(sax.MAX_BUFFER_LENGTH, 10)
    , maxActual = 0
  for (var i = 0, l = buffers.length; i < l; i ++) {
    var len = parser[buffers[i]].length
    if (len > maxAllowed) {
      // Text/cdata nodes can get big, and since they're buffered,
      // we can get here under normal conditions.
      // Avoid issues by emitting the text node now,
      // so at least it won't get any bigger.
      switch (buffers[i]) {
        case "textNode":
          closeText(parser)
        break

        case "cdata":
          emitNode(parser, "oncdata", parser.cdata)
          parser.cdata = ""
        break

        case "script":
          emitNode(parser, "onscript", parser.script)
          parser.script = ""
        break

        default:
          error(parser, "Max buffer length exceeded: "+buffers[i])
      }
    }
    maxActual = Math.max(maxActual, len)
  }
  // schedule the next check for the earliest possible buffer overrun.
  parser.bufferCheckPosition = (sax.MAX_BUFFER_LENGTH - maxActual)
                             + parser.position
}

function clearBuffers (parser) {
  for (var i = 0, l = buffers.length; i < l; i ++) {
    parser[buffers[i]] = ""
  }
}

function flushBuffers (parser) {
  closeText(parser)
  if (parser.cdata !== "") {
    emitNode(parser, "oncdata", parser.cdata)
    parser.cdata = ""
  }
  if (parser.script !== "") {
    emitNode(parser, "onscript", parser.script)
    parser.script = ""
  }
}

SAXParser.prototype =
  { end: function () { end(this) }
  , write: write
  , resume: function () { this.error = null; return this }
  , close: function () { return this.write(null) }
  , flush: function () { flushBuffers(this) }
  }

try {
  var Stream = _dereq_("stream").Stream
} catch (ex) {
  var Stream = function () {}
}


var streamWraps = sax.EVENTS.filter(function (ev) {
  return ev !== "error" && ev !== "end"
})

function createStream (strict, opt) {
  return new SAXStream(strict, opt)
}

function SAXStream (strict, opt) {
  if (!(this instanceof SAXStream)) return new SAXStream(strict, opt)

  Stream.apply(this)

  this._parser = new SAXParser(strict, opt)
  this.writable = true
  this.readable = true


  var me = this

  this._parser.onend = function () {
    me.emit("end")
  }

  this._parser.onerror = function (er) {
    me.emit("error", er)

    // if didn't throw, then means error was handled.
    // go ahead and clear error, so we can write again.
    me._parser.error = null
  }

  this._decoder = null;

  streamWraps.forEach(function (ev) {
    Object.defineProperty(me, "on" + ev, {
      get: function () { return me._parser["on" + ev] },
      set: function (h) {
        if (!h) {
          me.removeAllListeners(ev)
          return me._parser["on"+ev] = h
        }
        me.on(ev, h)
      },
      enumerable: true,
      configurable: false
    })
  })
}

SAXStream.prototype = Object.create(Stream.prototype,
  { constructor: { value: SAXStream } })

SAXStream.prototype.write = function (data) {
  if (typeof Buffer === 'function' &&
      typeof Buffer.isBuffer === 'function' &&
      Buffer.isBuffer(data)) {
    if (!this._decoder) {
      var SD = _dereq_('string_decoder').StringDecoder
      this._decoder = new SD('utf8')
    }
    data = this._decoder.write(data);
  }

  this._parser.write(data.toString())
  this.emit("data", data)
  return true
}

SAXStream.prototype.end = function (chunk) {
  if (chunk && chunk.length) this.write(chunk)
  this._parser.end()
  return true
}

SAXStream.prototype.on = function (ev, handler) {
  var me = this
  if (!me._parser["on"+ev] && streamWraps.indexOf(ev) !== -1) {
    me._parser["on"+ev] = function () {
      var args = arguments.length === 1 ? [arguments[0]]
               : Array.apply(null, arguments)
      args.splice(0, 0, ev)
      me.emit.apply(me, args)
    }
  }

  return Stream.prototype.on.call(me, ev, handler)
}



// character classes and tokens
var whitespace = "\r\n\t "
  // this really needs to be replaced with character classes.
  // XML allows all manner of ridiculous numbers and digits.
  , number = "0124356789"
  , letter = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
  // (Letter | "_" | ":")
  , quote = "'\""
  , entity = number+letter+"#"
  , attribEnd = whitespace + ">"
  , CDATA = "[CDATA["
  , DOCTYPE = "DOCTYPE"
  , XML_NAMESPACE = "http://www.w3.org/XML/1998/namespace"
  , XMLNS_NAMESPACE = "http://www.w3.org/2000/xmlns/"
  , rootNS = { xml: XML_NAMESPACE, xmlns: XMLNS_NAMESPACE }

// turn all the string character sets into character class objects.
whitespace = charClass(whitespace)
number = charClass(number)
letter = charClass(letter)

// http://www.w3.org/TR/REC-xml/#NT-NameStartChar
// This implementation works on strings, a single character at a time
// as such, it cannot ever support astral-plane characters (10000-EFFFF)
// without a significant breaking change to either this  parser, or the
// JavaScript language.  Implementation of an emoji-capable xml parser
// is left as an exercise for the reader.
var nameStart = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/

var nameBody = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040\.\d-]/

quote = charClass(quote)
entity = charClass(entity)
attribEnd = charClass(attribEnd)

function charClass (str) {
  return str.split("").reduce(function (s, c) {
    s[c] = true
    return s
  }, {})
}

function isRegExp (c) {
  return Object.prototype.toString.call(c) === '[object RegExp]'
}

function is (charclass, c) {
  return isRegExp(charclass) ? !!c.match(charclass) : charclass[c]
}

function not (charclass, c) {
  return !is(charclass, c)
}

var S = 0
sax.STATE =
{ BEGIN                     : S++
, TEXT                      : S++ // general stuff
, TEXT_ENTITY               : S++ // &amp and such.
, OPEN_WAKA                 : S++ // <
, SGML_DECL                 : S++ // <!BLARG
, SGML_DECL_QUOTED          : S++ // <!BLARG foo "bar
, DOCTYPE                   : S++ // <!DOCTYPE
, DOCTYPE_QUOTED            : S++ // <!DOCTYPE "//blah
, DOCTYPE_DTD               : S++ // <!DOCTYPE "//blah" [ ...
, DOCTYPE_DTD_QUOTED        : S++ // <!DOCTYPE "//blah" [ "foo
, COMMENT_STARTING          : S++ // <!-
, COMMENT                   : S++ // <!--
, COMMENT_ENDING            : S++ // <!-- blah -
, COMMENT_ENDED             : S++ // <!-- blah --
, CDATA                     : S++ // <![CDATA[ something
, CDATA_ENDING              : S++ // ]
, CDATA_ENDING_2            : S++ // ]]
, PROC_INST                 : S++ // <?hi
, PROC_INST_BODY            : S++ // <?hi there
, PROC_INST_ENDING          : S++ // <?hi "there" ?
, OPEN_TAG                  : S++ // <strong
, OPEN_TAG_SLASH            : S++ // <strong /
, ATTRIB                    : S++ // <a
, ATTRIB_NAME               : S++ // <a foo
, ATTRIB_NAME_SAW_WHITE     : S++ // <a foo _
, ATTRIB_VALUE              : S++ // <a foo=
, ATTRIB_VALUE_QUOTED       : S++ // <a foo="bar
, ATTRIB_VALUE_CLOSED       : S++ // <a foo="bar"
, ATTRIB_VALUE_UNQUOTED     : S++ // <a foo=bar
, ATTRIB_VALUE_ENTITY_Q     : S++ // <foo bar="&quot;"
, ATTRIB_VALUE_ENTITY_U     : S++ // <foo bar=&quot;
, CLOSE_TAG                 : S++ // </a
, CLOSE_TAG_SAW_WHITE       : S++ // </a   >
, SCRIPT                    : S++ // <script> ...
, SCRIPT_ENDING             : S++ // <script> ... <
}

sax.ENTITIES =
{ "amp" : "&"
, "gt" : ">"
, "lt" : "<"
, "quot" : "\""
, "apos" : "'"
, "AElig" : 198
, "Aacute" : 193
, "Acirc" : 194
, "Agrave" : 192
, "Aring" : 197
, "Atilde" : 195
, "Auml" : 196
, "Ccedil" : 199
, "ETH" : 208
, "Eacute" : 201
, "Ecirc" : 202
, "Egrave" : 200
, "Euml" : 203
, "Iacute" : 205
, "Icirc" : 206
, "Igrave" : 204
, "Iuml" : 207
, "Ntilde" : 209
, "Oacute" : 211
, "Ocirc" : 212
, "Ograve" : 210
, "Oslash" : 216
, "Otilde" : 213
, "Ouml" : 214
, "THORN" : 222
, "Uacute" : 218
, "Ucirc" : 219
, "Ugrave" : 217
, "Uuml" : 220
, "Yacute" : 221
, "aacute" : 225
, "acirc" : 226
, "aelig" : 230
, "agrave" : 224
, "aring" : 229
, "atilde" : 227
, "auml" : 228
, "ccedil" : 231
, "eacute" : 233
, "ecirc" : 234
, "egrave" : 232
, "eth" : 240
, "euml" : 235
, "iacute" : 237
, "icirc" : 238
, "igrave" : 236
, "iuml" : 239
, "ntilde" : 241
, "oacute" : 243
, "ocirc" : 244
, "ograve" : 242
, "oslash" : 248
, "otilde" : 245
, "ouml" : 246
, "szlig" : 223
, "thorn" : 254
, "uacute" : 250
, "ucirc" : 251
, "ugrave" : 249
, "uuml" : 252
, "yacute" : 253
, "yuml" : 255
, "copy" : 169
, "reg" : 174
, "nbsp" : 160
, "iexcl" : 161
, "cent" : 162
, "pound" : 163
, "curren" : 164
, "yen" : 165
, "brvbar" : 166
, "sect" : 167
, "uml" : 168
, "ordf" : 170
, "laquo" : 171
, "not" : 172
, "shy" : 173
, "macr" : 175
, "deg" : 176
, "plusmn" : 177
, "sup1" : 185
, "sup2" : 178
, "sup3" : 179
, "acute" : 180
, "micro" : 181
, "para" : 182
, "middot" : 183
, "cedil" : 184
, "ordm" : 186
, "raquo" : 187
, "frac14" : 188
, "frac12" : 189
, "frac34" : 190
, "iquest" : 191
, "times" : 215
, "divide" : 247
, "OElig" : 338
, "oelig" : 339
, "Scaron" : 352
, "scaron" : 353
, "Yuml" : 376
, "fnof" : 402
, "circ" : 710
, "tilde" : 732
, "Alpha" : 913
, "Beta" : 914
, "Gamma" : 915
, "Delta" : 916
, "Epsilon" : 917
, "Zeta" : 918
, "Eta" : 919
, "Theta" : 920
, "Iota" : 921
, "Kappa" : 922
, "Lambda" : 923
, "Mu" : 924
, "Nu" : 925
, "Xi" : 926
, "Omicron" : 927
, "Pi" : 928
, "Rho" : 929
, "Sigma" : 931
, "Tau" : 932
, "Upsilon" : 933
, "Phi" : 934
, "Chi" : 935
, "Psi" : 936
, "Omega" : 937
, "alpha" : 945
, "beta" : 946
, "gamma" : 947
, "delta" : 948
, "epsilon" : 949
, "zeta" : 950
, "eta" : 951
, "theta" : 952
, "iota" : 953
, "kappa" : 954
, "lambda" : 955
, "mu" : 956
, "nu" : 957
, "xi" : 958
, "omicron" : 959
, "pi" : 960
, "rho" : 961
, "sigmaf" : 962
, "sigma" : 963
, "tau" : 964
, "upsilon" : 965
, "phi" : 966
, "chi" : 967
, "psi" : 968
, "omega" : 969
, "thetasym" : 977
, "upsih" : 978
, "piv" : 982
, "ensp" : 8194
, "emsp" : 8195
, "thinsp" : 8201
, "zwnj" : 8204
, "zwj" : 8205
, "lrm" : 8206
, "rlm" : 8207
, "ndash" : 8211
, "mdash" : 8212
, "lsquo" : 8216
, "rsquo" : 8217
, "sbquo" : 8218
, "ldquo" : 8220
, "rdquo" : 8221
, "bdquo" : 8222
, "dagger" : 8224
, "Dagger" : 8225
, "bull" : 8226
, "hellip" : 8230
, "permil" : 8240
, "prime" : 8242
, "Prime" : 8243
, "lsaquo" : 8249
, "rsaquo" : 8250
, "oline" : 8254
, "frasl" : 8260
, "euro" : 8364
, "image" : 8465
, "weierp" : 8472
, "real" : 8476
, "trade" : 8482
, "alefsym" : 8501
, "larr" : 8592
, "uarr" : 8593
, "rarr" : 8594
, "darr" : 8595
, "harr" : 8596
, "crarr" : 8629
, "lArr" : 8656
, "uArr" : 8657
, "rArr" : 8658
, "dArr" : 8659
, "hArr" : 8660
, "forall" : 8704
, "part" : 8706
, "exist" : 8707
, "empty" : 8709
, "nabla" : 8711
, "isin" : 8712
, "notin" : 8713
, "ni" : 8715
, "prod" : 8719
, "sum" : 8721
, "minus" : 8722
, "lowast" : 8727
, "radic" : 8730
, "prop" : 8733
, "infin" : 8734
, "ang" : 8736
, "and" : 8743
, "or" : 8744
, "cap" : 8745
, "cup" : 8746
, "int" : 8747
, "there4" : 8756
, "sim" : 8764
, "cong" : 8773
, "asymp" : 8776
, "ne" : 8800
, "equiv" : 8801
, "le" : 8804
, "ge" : 8805
, "sub" : 8834
, "sup" : 8835
, "nsub" : 8836
, "sube" : 8838
, "supe" : 8839
, "oplus" : 8853
, "otimes" : 8855
, "perp" : 8869
, "sdot" : 8901
, "lceil" : 8968
, "rceil" : 8969
, "lfloor" : 8970
, "rfloor" : 8971
, "lang" : 9001
, "rang" : 9002
, "loz" : 9674
, "spades" : 9824
, "clubs" : 9827
, "hearts" : 9829
, "diams" : 9830
}

Object.keys(sax.ENTITIES).forEach(function (key) {
    var e = sax.ENTITIES[key]
    var s = typeof e === 'number' ? String.fromCharCode(e) : e
    sax.ENTITIES[key] = s
})

for (var S in sax.STATE) sax.STATE[sax.STATE[S]] = S

// shorthand
S = sax.STATE

function emit (parser, event, data) {
  parser[event] && parser[event](data)
}

function emitNode (parser, nodeType, data) {
  if (parser.textNode) closeText(parser)
  emit(parser, nodeType, data)
}

function closeText (parser) {
  parser.textNode = textopts(parser.opt, parser.textNode)
  if (parser.textNode) emit(parser, "ontext", parser.textNode)
  parser.textNode = ""
}

function textopts (opt, text) {
  if (opt.trim) text = text.trim()
  if (opt.normalize) text = text.replace(/\s+/g, " ")
  return text
}

function error (parser, er) {
  closeText(parser)
  if (parser.trackPosition) {
    er += "\nLine: "+parser.line+
          "\nColumn: "+parser.column+
          "\nChar: "+parser.c
  }
  er = new Error(er)
  parser.error = er
  emit(parser, "onerror", er)
  return parser
}

function end (parser) {
  if (!parser.closedRoot) strictFail(parser, "Unclosed root tag")
  if ((parser.state !== S.BEGIN) && (parser.state !== S.TEXT)) error(parser, "Unexpected end")
  closeText(parser)
  parser.c = ""
  parser.closed = true
  emit(parser, "onend")
  SAXParser.call(parser, parser.strict, parser.opt)
  return parser
}

function strictFail (parser, message) {
  if (typeof parser !== 'object' || !(parser instanceof SAXParser))
    throw new Error('bad call to strictFail');
  if (parser.strict) error(parser, message)
}

function newTag (parser) {
  if (!parser.strict) parser.tagName = parser.tagName[parser.looseCase]()
  var parent = parser.tags[parser.tags.length - 1] || parser
    , tag = parser.tag = { name : parser.tagName, attributes : {} }

  // will be overridden if tag contails an xmlns="foo" or xmlns:foo="bar"
  if (parser.opt.xmlns) tag.ns = parent.ns
  parser.attribList.length = 0
}

function qname (name, attribute) {
  var i = name.indexOf(":")
    , qualName = i < 0 ? [ "", name ] : name.split(":")
    , prefix = qualName[0]
    , local = qualName[1]

  // <x "xmlns"="http://foo">
  if (attribute && name === "xmlns") {
    prefix = "xmlns"
    local = ""
  }

  return { prefix: prefix, local: local }
}

function attrib (parser) {
  if (!parser.strict) parser.attribName = parser.attribName[parser.looseCase]()

  if (parser.attribList.indexOf(parser.attribName) !== -1 ||
      parser.tag.attributes.hasOwnProperty(parser.attribName)) {
    return parser.attribName = parser.attribValue = ""
  }

  if (parser.opt.xmlns) {
    var qn = qname(parser.attribName, true)
      , prefix = qn.prefix
      , local = qn.local

    if (prefix === "xmlns") {
      // namespace binding attribute; push the binding into scope
      if (local === "xml" && parser.attribValue !== XML_NAMESPACE) {
        strictFail( parser
                  , "xml: prefix must be bound to " + XML_NAMESPACE + "\n"
                  + "Actual: " + parser.attribValue )
      } else if (local === "xmlns" && parser.attribValue !== XMLNS_NAMESPACE) {
        strictFail( parser
                  , "xmlns: prefix must be bound to " + XMLNS_NAMESPACE + "\n"
                  + "Actual: " + parser.attribValue )
      } else {
        var tag = parser.tag
          , parent = parser.tags[parser.tags.length - 1] || parser
        if (tag.ns === parent.ns) {
          tag.ns = Object.create(parent.ns)
        }
        tag.ns[local] = parser.attribValue
      }
    }

    // defer onattribute events until all attributes have been seen
    // so any new bindings can take effect; preserve attribute order
    // so deferred events can be emitted in document order
    parser.attribList.push([parser.attribName, parser.attribValue])
  } else {
    // in non-xmlns mode, we can emit the event right away
    parser.tag.attributes[parser.attribName] = parser.attribValue
    emitNode( parser
            , "onattribute"
            , { name: parser.attribName
              , value: parser.attribValue } )
  }

  parser.attribName = parser.attribValue = ""
}

function openTag (parser, selfClosing) {
  if (parser.opt.xmlns) {
    // emit namespace binding events
    var tag = parser.tag

    // add namespace info to tag
    var qn = qname(parser.tagName)
    tag.prefix = qn.prefix
    tag.local = qn.local
    tag.uri = tag.ns[qn.prefix] || ""

    if (tag.prefix && !tag.uri) {
      strictFail(parser, "Unbound namespace prefix: "
                       + JSON.stringify(parser.tagName))
      tag.uri = qn.prefix
    }

    var parent = parser.tags[parser.tags.length - 1] || parser
    if (tag.ns && parent.ns !== tag.ns) {
      Object.keys(tag.ns).forEach(function (p) {
        emitNode( parser
                , "onopennamespace"
                , { prefix: p , uri: tag.ns[p] } )
      })
    }

    // handle deferred onattribute events
    // Note: do not apply default ns to attributes:
    //   http://www.w3.org/TR/REC-xml-names/#defaulting
    for (var i = 0, l = parser.attribList.length; i < l; i ++) {
      var nv = parser.attribList[i]
      var name = nv[0]
        , value = nv[1]
        , qualName = qname(name, true)
        , prefix = qualName.prefix
        , local = qualName.local
        , uri = prefix == "" ? "" : (tag.ns[prefix] || "")
        , a = { name: name
              , value: value
              , prefix: prefix
              , local: local
              , uri: uri
              }

      // if there's any attributes with an undefined namespace,
      // then fail on them now.
      if (prefix && prefix != "xmlns" && !uri) {
        strictFail(parser, "Unbound namespace prefix: "
                         + JSON.stringify(prefix))
        a.uri = prefix
      }
      parser.tag.attributes[name] = a
      emitNode(parser, "onattribute", a)
    }
    parser.attribList.length = 0
  }

  parser.tag.isSelfClosing = !!selfClosing

  // process the tag
  parser.sawRoot = true
  parser.tags.push(parser.tag)
  emitNode(parser, "onopentag", parser.tag)
  if (!selfClosing) {
    // special case for <script> in non-strict mode.
    if (!parser.noscript && parser.tagName.toLowerCase() === "script") {
      parser.state = S.SCRIPT
    } else {
      parser.state = S.TEXT
    }
    parser.tag = null
    parser.tagName = ""
  }
  parser.attribName = parser.attribValue = ""
  parser.attribList.length = 0
}

function closeTag (parser) {
  if (!parser.tagName) {
    strictFail(parser, "Weird empty close tag.")
    parser.textNode += "</>"
    parser.state = S.TEXT
    return
  }

  if (parser.script) {
    if (parser.tagName !== "script") {
      parser.script += "</" + parser.tagName + ">"
      parser.tagName = ""
      parser.state = S.SCRIPT
      return
    }
    emitNode(parser, "onscript", parser.script)
    parser.script = ""
  }

  // first make sure that the closing tag actually exists.
  // <a><b></c></b></a> will close everything, otherwise.
  var t = parser.tags.length
  var tagName = parser.tagName
  if (!parser.strict) tagName = tagName[parser.looseCase]()
  var closeTo = tagName
  while (t --) {
    var close = parser.tags[t]
    if (close.name !== closeTo) {
      // fail the first time in strict mode
      strictFail(parser, "Unexpected close tag")
    } else break
  }

  // didn't find it.  we already failed for strict, so just abort.
  if (t < 0) {
    strictFail(parser, "Unmatched closing tag: "+parser.tagName)
    parser.textNode += "</" + parser.tagName + ">"
    parser.state = S.TEXT
    return
  }
  parser.tagName = tagName
  var s = parser.tags.length
  while (s --> t) {
    var tag = parser.tag = parser.tags.pop()
    parser.tagName = parser.tag.name
    emitNode(parser, "onclosetag", parser.tagName)

    var x = {}
    for (var i in tag.ns) x[i] = tag.ns[i]

    var parent = parser.tags[parser.tags.length - 1] || parser
    if (parser.opt.xmlns && tag.ns !== parent.ns) {
      // remove namespace bindings introduced by tag
      Object.keys(tag.ns).forEach(function (p) {
        var n = tag.ns[p]
        emitNode(parser, "onclosenamespace", { prefix: p, uri: n })
      })
    }
  }
  if (t === 0) parser.closedRoot = true
  parser.tagName = parser.attribValue = parser.attribName = ""
  parser.attribList.length = 0
  parser.state = S.TEXT
}

function parseEntity (parser) {
  var entity = parser.entity
    , entityLC = entity.toLowerCase()
    , num
    , numStr = ""
  if (parser.ENTITIES[entity])
    return parser.ENTITIES[entity]
  if (parser.ENTITIES[entityLC])
    return parser.ENTITIES[entityLC]
  entity = entityLC
  if (entity.charAt(0) === "#") {
    if (entity.charAt(1) === "x") {
      entity = entity.slice(2)
      num = parseInt(entity, 16)
      numStr = num.toString(16)
    } else {
      entity = entity.slice(1)
      num = parseInt(entity, 10)
      numStr = num.toString(10)
    }
  }
  entity = entity.replace(/^0+/, "")
  if (numStr.toLowerCase() !== entity) {
    strictFail(parser, "Invalid character entity")
    return "&"+parser.entity + ";"
  }

  return String.fromCodePoint(num)
}

function write (chunk) {
  var parser = this
  if (this.error) throw this.error
  if (parser.closed) return error(parser,
    "Cannot write after close. Assign an onready handler.")
  if (chunk === null) return end(parser)
  var i = 0, c = ""
  while (parser.c = c = chunk.charAt(i++)) {
    if (parser.trackPosition) {
      parser.position ++
      if (c === "\n") {
        parser.line ++
        parser.column = 0
      } else parser.column ++
    }
    switch (parser.state) {

      case S.BEGIN:
        if (c === "<") {
          parser.state = S.OPEN_WAKA
          parser.startTagPosition = parser.position
        } else if (not(whitespace,c)) {
          // have to process this as a text node.
          // weird, but happens.
          strictFail(parser, "Non-whitespace before first tag.")
          parser.textNode = c
          parser.state = S.TEXT
        }
      continue

      case S.TEXT:
        if (parser.sawRoot && !parser.closedRoot) {
          var starti = i-1
          while (c && c!=="<" && c!=="&") {
            c = chunk.charAt(i++)
            if (c && parser.trackPosition) {
              parser.position ++
              if (c === "\n") {
                parser.line ++
                parser.column = 0
              } else parser.column ++
            }
          }
          parser.textNode += chunk.substring(starti, i-1)
        }
        if (c === "<") {
          parser.state = S.OPEN_WAKA
          parser.startTagPosition = parser.position
        } else {
          if (not(whitespace, c) && (!parser.sawRoot || parser.closedRoot))
            strictFail(parser, "Text data outside of root node.")
          if (c === "&") parser.state = S.TEXT_ENTITY
          else parser.textNode += c
        }
      continue

      case S.SCRIPT:
        // only non-strict
        if (c === "<") {
          parser.state = S.SCRIPT_ENDING
        } else parser.script += c
      continue

      case S.SCRIPT_ENDING:
        if (c === "/") {
          parser.state = S.CLOSE_TAG
        } else {
          parser.script += "<" + c
          parser.state = S.SCRIPT
        }
      continue

      case S.OPEN_WAKA:
        // either a /, ?, !, or text is coming next.
        if (c === "!") {
          parser.state = S.SGML_DECL
          parser.sgmlDecl = ""
        } else if (is(whitespace, c)) {
          // wait for it...
        } else if (is(nameStart,c)) {
          parser.state = S.OPEN_TAG
          parser.tagName = c
        } else if (c === "/") {
          parser.state = S.CLOSE_TAG
          parser.tagName = ""
        } else if (c === "?") {
          parser.state = S.PROC_INST
          parser.procInstName = parser.procInstBody = ""
        } else {
          strictFail(parser, "Unencoded <")
          // if there was some whitespace, then add that in.
          if (parser.startTagPosition + 1 < parser.position) {
            var pad = parser.position - parser.startTagPosition
            c = new Array(pad).join(" ") + c
          }
          parser.textNode += "<" + c
          parser.state = S.TEXT
        }
      continue

      case S.SGML_DECL:
        if ((parser.sgmlDecl+c).toUpperCase() === CDATA) {
          emitNode(parser, "onopencdata")
          parser.state = S.CDATA
          parser.sgmlDecl = ""
          parser.cdata = ""
        } else if (parser.sgmlDecl+c === "--") {
          parser.state = S.COMMENT
          parser.comment = ""
          parser.sgmlDecl = ""
        } else if ((parser.sgmlDecl+c).toUpperCase() === DOCTYPE) {
          parser.state = S.DOCTYPE
          if (parser.doctype || parser.sawRoot) strictFail(parser,
            "Inappropriately located doctype declaration")
          parser.doctype = ""
          parser.sgmlDecl = ""
        } else if (c === ">") {
          emitNode(parser, "onsgmldeclaration", parser.sgmlDecl)
          parser.sgmlDecl = ""
          parser.state = S.TEXT
        } else if (is(quote, c)) {
          parser.state = S.SGML_DECL_QUOTED
          parser.sgmlDecl += c
        } else parser.sgmlDecl += c
      continue

      case S.SGML_DECL_QUOTED:
        if (c === parser.q) {
          parser.state = S.SGML_DECL
          parser.q = ""
        }
        parser.sgmlDecl += c
      continue

      case S.DOCTYPE:
        if (c === ">") {
          parser.state = S.TEXT
          emitNode(parser, "ondoctype", parser.doctype)
          parser.doctype = true // just remember that we saw it.
        } else {
          parser.doctype += c
          if (c === "[") parser.state = S.DOCTYPE_DTD
          else if (is(quote, c)) {
            parser.state = S.DOCTYPE_QUOTED
            parser.q = c
          }
        }
      continue

      case S.DOCTYPE_QUOTED:
        parser.doctype += c
        if (c === parser.q) {
          parser.q = ""
          parser.state = S.DOCTYPE
        }
      continue

      case S.DOCTYPE_DTD:
        parser.doctype += c
        if (c === "]") parser.state = S.DOCTYPE
        else if (is(quote,c)) {
          parser.state = S.DOCTYPE_DTD_QUOTED
          parser.q = c
        }
      continue

      case S.DOCTYPE_DTD_QUOTED:
        parser.doctype += c
        if (c === parser.q) {
          parser.state = S.DOCTYPE_DTD
          parser.q = ""
        }
      continue

      case S.COMMENT:
        if (c === "-") parser.state = S.COMMENT_ENDING
        else parser.comment += c
      continue

      case S.COMMENT_ENDING:
        if (c === "-") {
          parser.state = S.COMMENT_ENDED
          parser.comment = textopts(parser.opt, parser.comment)
          if (parser.comment) emitNode(parser, "oncomment", parser.comment)
          parser.comment = ""
        } else {
          parser.comment += "-" + c
          parser.state = S.COMMENT
        }
      continue

      case S.COMMENT_ENDED:
        if (c !== ">") {
          strictFail(parser, "Malformed comment")
          // allow <!-- blah -- bloo --> in non-strict mode,
          // which is a comment of " blah -- bloo "
          parser.comment += "--" + c
          parser.state = S.COMMENT
        } else parser.state = S.TEXT
      continue

      case S.CDATA:
        if (c === "]") parser.state = S.CDATA_ENDING
        else parser.cdata += c
      continue

      case S.CDATA_ENDING:
        if (c === "]") parser.state = S.CDATA_ENDING_2
        else {
          parser.cdata += "]" + c
          parser.state = S.CDATA
        }
      continue

      case S.CDATA_ENDING_2:
        if (c === ">") {
          if (parser.cdata) emitNode(parser, "oncdata", parser.cdata)
          emitNode(parser, "onclosecdata")
          parser.cdata = ""
          parser.state = S.TEXT
        } else if (c === "]") {
          parser.cdata += "]"
        } else {
          parser.cdata += "]]" + c
          parser.state = S.CDATA
        }
      continue

      case S.PROC_INST:
        if (c === "?") parser.state = S.PROC_INST_ENDING
        else if (is(whitespace, c)) parser.state = S.PROC_INST_BODY
        else parser.procInstName += c
      continue

      case S.PROC_INST_BODY:
        if (!parser.procInstBody && is(whitespace, c)) continue
        else if (c === "?") parser.state = S.PROC_INST_ENDING
        else parser.procInstBody += c
      continue

      case S.PROC_INST_ENDING:
        if (c === ">") {
          emitNode(parser, "onprocessinginstruction", {
            name : parser.procInstName,
            body : parser.procInstBody
          })
          parser.procInstName = parser.procInstBody = ""
          parser.state = S.TEXT
        } else {
          parser.procInstBody += "?" + c
          parser.state = S.PROC_INST_BODY
        }
      continue

      case S.OPEN_TAG:
        if (is(nameBody, c)) parser.tagName += c
        else {
          newTag(parser)
          if (c === ">") openTag(parser)
          else if (c === "/") parser.state = S.OPEN_TAG_SLASH
          else {
            if (not(whitespace, c)) strictFail(
              parser, "Invalid character in tag name")
            parser.state = S.ATTRIB
          }
        }
      continue

      case S.OPEN_TAG_SLASH:
        if (c === ">") {
          openTag(parser, true)
          closeTag(parser)
        } else {
          strictFail(parser, "Forward-slash in opening tag not followed by >")
          parser.state = S.ATTRIB
        }
      continue

      case S.ATTRIB:
        // haven't read the attribute name yet.
        if (is(whitespace, c)) continue
        else if (c === ">") openTag(parser)
        else if (c === "/") parser.state = S.OPEN_TAG_SLASH
        else if (is(nameStart, c)) {
          parser.attribName = c
          parser.attribValue = ""
          parser.state = S.ATTRIB_NAME
        } else strictFail(parser, "Invalid attribute name")
      continue

      case S.ATTRIB_NAME:
        if (c === "=") parser.state = S.ATTRIB_VALUE
        else if (c === ">") {
          strictFail(parser, "Attribute without value")
          parser.attribValue = parser.attribName
          attrib(parser)
          openTag(parser)
        }
        else if (is(whitespace, c)) parser.state = S.ATTRIB_NAME_SAW_WHITE
        else if (is(nameBody, c)) parser.attribName += c
        else strictFail(parser, "Invalid attribute name")
      continue

      case S.ATTRIB_NAME_SAW_WHITE:
        if (c === "=") parser.state = S.ATTRIB_VALUE
        else if (is(whitespace, c)) continue
        else {
          strictFail(parser, "Attribute without value")
          parser.tag.attributes[parser.attribName] = ""
          parser.attribValue = ""
          emitNode(parser, "onattribute",
                   { name : parser.attribName, value : "" })
          parser.attribName = ""
          if (c === ">") openTag(parser)
          else if (is(nameStart, c)) {
            parser.attribName = c
            parser.state = S.ATTRIB_NAME
          } else {
            strictFail(parser, "Invalid attribute name")
            parser.state = S.ATTRIB
          }
        }
      continue

      case S.ATTRIB_VALUE:
        if (is(whitespace, c)) continue
        else if (is(quote, c)) {
          parser.q = c
          parser.state = S.ATTRIB_VALUE_QUOTED
        } else {
          strictFail(parser, "Unquoted attribute value")
          parser.state = S.ATTRIB_VALUE_UNQUOTED
          parser.attribValue = c
        }
      continue

      case S.ATTRIB_VALUE_QUOTED:
        if (c !== parser.q) {
          if (c === "&") parser.state = S.ATTRIB_VALUE_ENTITY_Q
          else parser.attribValue += c
          continue
        }
        attrib(parser)
        parser.q = ""
        parser.state = S.ATTRIB_VALUE_CLOSED
      continue

      case S.ATTRIB_VALUE_CLOSED:
        if (is(whitespace, c)) {
          parser.state = S.ATTRIB
        } else if (c === ">") openTag(parser)
        else if (c === "/") parser.state = S.OPEN_TAG_SLASH
        else if (is(nameStart, c)) {
          strictFail(parser, "No whitespace between attributes")
          parser.attribName = c
          parser.attribValue = ""
          parser.state = S.ATTRIB_NAME
        } else strictFail(parser, "Invalid attribute name")
      continue

      case S.ATTRIB_VALUE_UNQUOTED:
        if (not(attribEnd,c)) {
          if (c === "&") parser.state = S.ATTRIB_VALUE_ENTITY_U
          else parser.attribValue += c
          continue
        }
        attrib(parser)
        if (c === ">") openTag(parser)
        else parser.state = S.ATTRIB
      continue

      case S.CLOSE_TAG:
        if (!parser.tagName) {
          if (is(whitespace, c)) continue
          else if (not(nameStart, c)) {
            if (parser.script) {
              parser.script += "</" + c
              parser.state = S.SCRIPT
            } else {
              strictFail(parser, "Invalid tagname in closing tag.")
            }
          } else parser.tagName = c
        }
        else if (c === ">") closeTag(parser)
        else if (is(nameBody, c)) parser.tagName += c
        else if (parser.script) {
          parser.script += "</" + parser.tagName
          parser.tagName = ""
          parser.state = S.SCRIPT
        } else {
          if (not(whitespace, c)) strictFail(parser,
            "Invalid tagname in closing tag")
          parser.state = S.CLOSE_TAG_SAW_WHITE
        }
      continue

      case S.CLOSE_TAG_SAW_WHITE:
        if (is(whitespace, c)) continue
        if (c === ">") closeTag(parser)
        else strictFail(parser, "Invalid characters in closing tag")
      continue

      case S.TEXT_ENTITY:
      case S.ATTRIB_VALUE_ENTITY_Q:
      case S.ATTRIB_VALUE_ENTITY_U:
        switch(parser.state) {
          case S.TEXT_ENTITY:
            var returnState = S.TEXT, buffer = "textNode"
          break

          case S.ATTRIB_VALUE_ENTITY_Q:
            var returnState = S.ATTRIB_VALUE_QUOTED, buffer = "attribValue"
          break

          case S.ATTRIB_VALUE_ENTITY_U:
            var returnState = S.ATTRIB_VALUE_UNQUOTED, buffer = "attribValue"
          break
        }
        if (c === ";") {
          parser[buffer] += parseEntity(parser)
          parser.entity = ""
          parser.state = returnState
        }
        else if (is(entity, c)) parser.entity += c
        else {
          strictFail(parser, "Invalid character entity")
          parser[buffer] += "&" + parser.entity + c
          parser.entity = ""
          parser.state = returnState
        }
      continue

      default:
        throw new Error(parser, "Unknown state: " + parser.state)
    }
  } // while
  // cdata blocks can get very big under normal conditions. emit and move on.
  // if (parser.state === S.CDATA && parser.cdata) {
  //   emitNode(parser, "oncdata", parser.cdata)
  //   parser.cdata = ""
  // }
  if (parser.position >= parser.bufferCheckPosition) checkBufferLength(parser)
  return parser
}

/*! http://mths.be/fromcodepoint v0.1.0 by @mathias */
if (!String.fromCodePoint) {
        (function() {
                var stringFromCharCode = String.fromCharCode;
                var floor = Math.floor;
                var fromCodePoint = function() {
                        var MAX_SIZE = 0x4000;
                        var codeUnits = [];
                        var highSurrogate;
                        var lowSurrogate;
                        var index = -1;
                        var length = arguments.length;
                        if (!length) {
                                return '';
                        }
                        var result = '';
                        while (++index < length) {
                                var codePoint = Number(arguments[index]);
                                if (
                                        !isFinite(codePoint) || // `NaN`, `+Infinity`, or `-Infinity`
                                        codePoint < 0 || // not a valid Unicode code point
                                        codePoint > 0x10FFFF || // not a valid Unicode code point
                                        floor(codePoint) != codePoint // not an integer
                                ) {
                                        throw RangeError('Invalid code point: ' + codePoint);
                                }
                                if (codePoint <= 0xFFFF) { // BMP code point
                                        codeUnits.push(codePoint);
                                } else { // Astral code point; split in surrogate halves
                                        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
                                        codePoint -= 0x10000;
                                        highSurrogate = (codePoint >> 10) + 0xD800;
                                        lowSurrogate = (codePoint % 0x400) + 0xDC00;
                                        codeUnits.push(highSurrogate, lowSurrogate);
                                }
                                if (index + 1 == length || codeUnits.length > MAX_SIZE) {
                                        result += stringFromCharCode.apply(null, codeUnits);
                                        codeUnits.length = 0;
                                }
                        }
                        return result;
                };
                if (Object.defineProperty) {
                        Object.defineProperty(String, 'fromCodePoint', {
                                'value': fromCodePoint,
                                'configurable': true,
                                'writable': true
                        });
                } else {
                        String.fromCodePoint = fromCodePoint;
                }
        }());
}

})(typeof exports === "undefined" ? sax = {} : exports);

}).call(this,undefined)

},{"undefined":undefined}],244:[function(_dereq_,module,exports){
/**
 * Tiny stack for browser or server
 *
 * @author Jason Mulligan <jason.mulligan@avoidwork.com>
 * @copyright 2014 Jason Mulligan
 * @license BSD-3 <https://raw.github.com/avoidwork/tiny-stack/master/LICENSE>
 * @link http://avoidwork.github.io/tiny-stack
 * @module tiny-stack
 * @version 0.1.0
 */

( function ( global ) {

"use strict";

/**
 * TinyStack
 *
 * @constructor
 */
function TinyStack () {
	this.data = [null];
	this.top  = 0;
}

/**
 * Clears the stack
 *
 * @method clear
 * @memberOf TinyStack
 * @return {Object} {@link TinyStack}
 */
TinyStack.prototype.clear = function clear () {
	this.data = [null];
	this.top  = 0;

	return this;
};

/**
 * Gets the size of the stack
 *
 * @method length
 * @memberOf TinyStack
 * @return {Number} Size of stack
 */
TinyStack.prototype.length = function length () {
	return this.top;
};

/**
 * Gets the item at the top of the stack
 *
 * @method peek
 * @memberOf TinyStack
 * @return {Mixed} Item at the top of the stack
 */
TinyStack.prototype.peek = function peek () {
	return this.data[this.top];
};

/**
 * Gets & removes the item at the top of the stack
 *
 * @method pop
 * @memberOf TinyStack
 * @return {Mixed} Item at the top of the stack
 */
TinyStack.prototype.pop = function pop () {
	if ( this.top > 0 ) {
		this.top--;

		return this.data.pop();
	}
	else {
		return undefined;
	}
};

/**
 * Pushes an item onto the stack
 *
 * @method push
 * @memberOf TinyStack
 * @return {Object} {@link TinyStack}
 */
TinyStack.prototype.push = function push ( arg ) {
	this.data[++this.top] = arg;

	return this;
};

/**
 * TinyStack factory
 *
 * @method factory
 * @return {Object} {@link TinyStack}
 */
function factory () {
	return new TinyStack();
}

// Node, AMD & window supported
if ( typeof exports != "undefined" ) {
	module.exports = factory;
}
else if ( typeof define == "function" ) {
	define( function () {
		return factory;
	} );
}
else {
	global.stack = factory;
}
} )( this );

},{}],245:[function(_dereq_,module,exports){
arguments[4][169][0].apply(exports,arguments)
},{"169":169,"249":249}],246:[function(_dereq_,module,exports){
arguments[4][170][0].apply(exports,arguments)
},{"170":170}],247:[function(_dereq_,module,exports){
arguments[4][171][0].apply(exports,arguments)
},{"171":171,"250":250,"256":256,"311":311,"315":315}],248:[function(_dereq_,module,exports){
arguments[4][172][0].apply(exports,arguments)
},{"172":172,"246":246,"256":256}],249:[function(_dereq_,module,exports){
arguments[4][173][0].apply(exports,arguments)
},{"173":173,"248":248,"250":250,"251":251,"252":252,"255":255,"256":256,"308":308,"309":309}],250:[function(_dereq_,module,exports){
arguments[4][174][0].apply(exports,arguments)
},{"174":174}],251:[function(_dereq_,module,exports){
arguments[4][175][0].apply(exports,arguments)
},{"175":175}],252:[function(_dereq_,module,exports){
arguments[4][176][0].apply(exports,arguments)
},{"176":176,"247":247,"250":250,"253":253,"256":256,"311":311}],253:[function(_dereq_,module,exports){
arguments[4][177][0].apply(exports,arguments)
},{"177":177}],254:[function(_dereq_,module,exports){
arguments[4][97][0].apply(exports,arguments)
},{"97":97}],255:[function(_dereq_,module,exports){
arguments[4][99][0].apply(exports,arguments)
},{"264":264,"285":285,"99":99}],256:[function(_dereq_,module,exports){
arguments[4][32][0].apply(exports,arguments)
},{"258":258,"264":264,"286":286,"32":32}],257:[function(_dereq_,module,exports){
arguments[4][66][0].apply(exports,arguments)
},{"66":66}],258:[function(_dereq_,module,exports){
arguments[4][33][0].apply(exports,arguments)
},{"33":33}],259:[function(_dereq_,module,exports){
arguments[4][109][0].apply(exports,arguments)
},{"109":109}],260:[function(_dereq_,module,exports){
arguments[4][67][0].apply(exports,arguments)
},{"312":312,"67":67}],261:[function(_dereq_,module,exports){
arguments[4][68][0].apply(exports,arguments)
},{"263":263,"312":312,"68":68}],262:[function(_dereq_,module,exports){
arguments[4][112][0].apply(exports,arguments)
},{"112":112,"275":275,"276":276,"281":281,"317":317,"318":318}],263:[function(_dereq_,module,exports){
arguments[4][69][0].apply(exports,arguments)
},{"69":69}],264:[function(_dereq_,module,exports){
arguments[4][34][0].apply(exports,arguments)
},{"270":270,"283":283,"34":34}],265:[function(_dereq_,module,exports){
arguments[4][117][0].apply(exports,arguments)
},{"117":117}],266:[function(_dereq_,module,exports){
arguments[4][118][0].apply(exports,arguments)
},{"118":118}],267:[function(_dereq_,module,exports){
arguments[4][191][0].apply(exports,arguments)
},{"191":191,"293":293,"298":298,"305":305,"306":306}],268:[function(_dereq_,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"284":284,"35":35}],269:[function(_dereq_,module,exports){
arguments[4][193][0].apply(exports,arguments)
},{"193":193,"268":268,"313":313}],270:[function(_dereq_,module,exports){
arguments[4][36][0].apply(exports,arguments)
},{"268":268,"312":312,"36":36}],271:[function(_dereq_,module,exports){
arguments[4][121][0].apply(exports,arguments)
},{"121":121,"303":303}],272:[function(_dereq_,module,exports){
arguments[4][122][0].apply(exports,arguments)
},{"122":122,"273":273,"298":298,"308":308}],273:[function(_dereq_,module,exports){
arguments[4][123][0].apply(exports,arguments)
},{"123":123,"287":287,"288":288,"289":289,"306":306,"310":310}],274:[function(_dereq_,module,exports){
arguments[4][124][0].apply(exports,arguments)
},{"124":124,"272":272,"303":303}],275:[function(_dereq_,module,exports){
arguments[4][126][0].apply(exports,arguments)
},{"126":126,"274":274,"291":291,"303":303}],276:[function(_dereq_,module,exports){
arguments[4][127][0].apply(exports,arguments)
},{"127":127,"254":254,"271":271,"272":272,"279":279,"296":296,"299":299,"303":303,"304":304,"306":306}],277:[function(_dereq_,module,exports){
arguments[4][38][0].apply(exports,arguments)
},{"38":38}],278:[function(_dereq_,module,exports){
arguments[4][129][0].apply(exports,arguments)
},{"129":129,"271":271,"304":304}],279:[function(_dereq_,module,exports){
arguments[4][131][0].apply(exports,arguments)
},{"131":131}],280:[function(_dereq_,module,exports){
arguments[4][39][0].apply(exports,arguments)
},{"39":39}],281:[function(_dereq_,module,exports){
arguments[4][40][0].apply(exports,arguments)
},{"317":317,"40":40}],282:[function(_dereq_,module,exports){
arguments[4][74][0].apply(exports,arguments)
},{"257":257,"281":281,"295":295,"74":74}],283:[function(_dereq_,module,exports){
arguments[4][41][0].apply(exports,arguments)
},{"290":290,"297":297,"303":303,"41":41}],284:[function(_dereq_,module,exports){
arguments[4][42][0].apply(exports,arguments)
},{"303":303,"42":42}],285:[function(_dereq_,module,exports){
arguments[4][137][0].apply(exports,arguments)
},{"137":137,"262":262,"265":265,"266":266,"306":306}],286:[function(_dereq_,module,exports){
arguments[4][43][0].apply(exports,arguments)
},{"281":281,"306":306,"43":43}],287:[function(_dereq_,module,exports){
arguments[4][140][0].apply(exports,arguments)
},{"140":140,"259":259}],288:[function(_dereq_,module,exports){
arguments[4][141][0].apply(exports,arguments)
},{"141":141}],289:[function(_dereq_,module,exports){
arguments[4][142][0].apply(exports,arguments)
},{"142":142,"312":312}],290:[function(_dereq_,module,exports){
arguments[4][44][0].apply(exports,arguments)
},{"277":277,"44":44}],291:[function(_dereq_,module,exports){
arguments[4][144][0].apply(exports,arguments)
},{"144":144,"299":299,"314":314}],292:[function(_dereq_,module,exports){
arguments[4][45][0].apply(exports,arguments)
},{"307":307,"45":45}],293:[function(_dereq_,module,exports){
arguments[4][46][0].apply(exports,arguments)
},{"290":290,"297":297,"46":46}],294:[function(_dereq_,module,exports){
arguments[4][47][0].apply(exports,arguments)
},{"47":47}],295:[function(_dereq_,module,exports){
arguments[4][79][0].apply(exports,arguments)
},{"293":293,"294":294,"308":308,"79":79}],296:[function(_dereq_,module,exports){
arguments[4][149][0].apply(exports,arguments)
},{"149":149,"303":303,"306":306}],297:[function(_dereq_,module,exports){
arguments[4][48][0].apply(exports,arguments)
},{"48":48}],298:[function(_dereq_,module,exports){
arguments[4][49][0].apply(exports,arguments)
},{"49":49}],299:[function(_dereq_,module,exports){
arguments[4][152][0].apply(exports,arguments)
},{"152":152,"308":308}],300:[function(_dereq_,module,exports){
arguments[4][224][0].apply(exports,arguments)
},{"224":224,"303":303}],301:[function(_dereq_,module,exports){
arguments[4][225][0].apply(exports,arguments)
},{"225":225,"269":269}],302:[function(_dereq_,module,exports){
arguments[4][50][0].apply(exports,arguments)
},{"294":294,"297":297,"305":305,"306":306,"313":313,"50":50}],303:[function(_dereq_,module,exports){
arguments[4][51][0].apply(exports,arguments)
},{"308":308,"51":51}],304:[function(_dereq_,module,exports){
arguments[4][155][0].apply(exports,arguments)
},{"155":155,"280":280,"306":306}],305:[function(_dereq_,module,exports){
arguments[4][52][0].apply(exports,arguments)
},{"293":293,"298":298,"52":52}],306:[function(_dereq_,module,exports){
arguments[4][53][0].apply(exports,arguments)
},{"292":292,"297":297,"298":298,"53":53}],307:[function(_dereq_,module,exports){
arguments[4][55][0].apply(exports,arguments)
},{"298":298,"316":316,"55":55}],308:[function(_dereq_,module,exports){
arguments[4][57][0].apply(exports,arguments)
},{"57":57}],309:[function(_dereq_,module,exports){
arguments[4][88][0].apply(exports,arguments)
},{"298":298,"88":88}],310:[function(_dereq_,module,exports){
arguments[4][161][0].apply(exports,arguments)
},{"161":161,"297":297,"298":298}],311:[function(_dereq_,module,exports){
arguments[4][89][0].apply(exports,arguments)
},{"260":260,"261":261,"282":282,"89":89}],312:[function(_dereq_,module,exports){
arguments[4][58][0].apply(exports,arguments)
},{"292":292,"293":293,"302":302,"308":308,"58":58}],313:[function(_dereq_,module,exports){
arguments[4][59][0].apply(exports,arguments)
},{"294":294,"297":297,"305":305,"306":306,"308":308,"59":59}],314:[function(_dereq_,module,exports){
arguments[4][165][0].apply(exports,arguments)
},{"165":165,"303":303,"312":312}],315:[function(_dereq_,module,exports){
arguments[4][239][0].apply(exports,arguments)
},{"239":239,"257":257,"267":267,"281":281,"300":300,"301":301}],316:[function(_dereq_,module,exports){
arguments[4][60][0].apply(exports,arguments)
},{"280":280,"60":60}],317:[function(_dereq_,module,exports){
arguments[4][61][0].apply(exports,arguments)
},{"61":61}],318:[function(_dereq_,module,exports){
arguments[4][168][0].apply(exports,arguments)
},{"168":168,"277":277,"278":278,"296":296}],319:[function(_dereq_,module,exports){
module.exports={
  "name": "DMN",
  "uri": "http://www.omg.org/spec/DMN/20130901",
  "prefix": "dmn",
  "types": [
    {
      "name": "DMNElement",
      "properties": [
        { "name": "description", "type": "String" },
        { "name": "id", "type": "String", "isAttr": true },
        { "name": "name", "type": "String", "isAttr": true }
      ]
    },
    {
      "name": "DMNElementReference",
      "properties": [
        { "name": "href", "type": "String", "isAttr": true }
      ]
    },
    {
      "name": "Definitions",
      "superClass": [ "DMNElement" ],
      "properties": [
        { "name": "namespace", "type": "String", "isAttr": true },
        { "name": "typeLanguage", "type": "String", "isAttr": true, "default": "http://www.omg.org/spec/FEEL/20140401" },
        { "name": "expressionLanguage", "type": "String", "isAttr": true, "default": "http://www.omg.org/spec/FEEL/20140401" },
        { "name": "ItemDefinition", "type": "ItemDefinition", "isMany": true },
        { "name": "Decision", "type": "Decision", "isMany": true }
      ]
    },
    {
      "name": "ItemDefinition",
      "superClass": [ "DMNElement" ],
      "properties": [
        { "name": "typeDefinition", "type": "String" },
        { "name": "typeLanguage", "type": "String", "isAttr": true },
        { "name": "isCollection", "type": "Boolean", "isAttr": true, "default": false },
        { "name": "typeRef", "type": "String", "isAttr": true },
        { "name": "allowedValue", "type": "LiteralExpression", "isMany": true, "xml": { "serialize": "property" } }
      ]
    },
    {
      "name": "Expression",
      "superClass": [ "DMNElement" ],
      "properties": [
        { "name": "inputVariable", "type": "DMNElement", "isReference": true},
        { "name": "itemDefinition", "type": "DMNElementReference", "xml": { "serialize": "property" } }
      ]
    },
    {
      "name": "LiteralExpression",
      "superClass": [ "Expression" ],
      "properties": [
        { "name": "expressionLanguage", "type": "String", "isAttr": true },
        { "name": "text", "type": "String" }
      ]
    },
    {
      "name": "DRGElement",
      "superClass": [ "DMNElement" ],
      "properties": []
    },
    {
      "name": "Decision",
      "superClass": [ "DRGElement" ],
      "properties": [
        { "name": "question", "type": "String", "isAttr": true },
        { "name": "allowedAnswers", "type": "String", "isAttr": true },
        { "name": "DecisionTable", "type": "DecisionTable" },
        { "name": "outputDefinition", "type": "DMNElementReference", "xml": { "serialize": "property" } }
      ]
    },
    {
      "name": "DecisionTable",
      "superClass": [ "Expression" ],
      "properties": [
        { "name": "hitPolicy", "type": "HitPolicy", "isAttr": true , "default": "UNIQUE" },
        { "name": "aggregation", "type": "BuiltinAggregator", "isAttr": true },
        { "name": "preferredOrientation", "type": "DecisionTableOrientation", "isAttr": true },
        { "name": "isComplete", "type": "Boolean", "isAttr": true, "default": false },
        { "name": "isConsistent", "type": "Boolean", "isAttr": true, "default": false },
        { "name": "clause", "type": "Clause", "isMany": true, "xml": { "serialize": "property" } },
        { "name": "rule", "type": "DecisionRule", "isMany": true, "xml": { "serialize": "property" } }
      ]
    },
    {
      "name": "Clause",
      "superClass": [ "DMNElement" ],
      "properties": [
        { "name": "inputExpression", "type": "LiteralExpression", "xml": { "serialize": "property" }  },
        { "name": "outputDefinition", "type": "DMNElementReference", "xml": { "serialize": "property" }  },
        { "name": "inputEntry", "type": "LiteralExpression", "isMany": true, "xml": { "serialize": "property" } },
        { "name": "outputEntry", "type": "LiteralExpression", "isMany": true, "xml": { "serialize": "property" } }
      ]
    },
    {
      "name": "DecisionRule",
      "superClass": [ "DMNElement" ],
      "properties": [
        { "name": "condition", "type": "Expression", "isReference": true, "isMany": true },
        { "name": "conclusion", "type": "Expression", "isReference": true, "isMany": true }
      ]
    }
  ],
  "emumerations": [
    {
      "name": "HitPolicy",
      "literalValues": [
        {
          "name": "UNIQUE"
        },
        {
          "name": "FIRST"
        },
        {
          "name": "PRIORITY"
        },
        {
          "name": "ANY"
        },
        {
          "name": "COLLECT"
        },
        {
          "name": "RULE ORDER"
        },
        {
          "name": "OUTPUT ORDER"
        }
      ]
    },
    {
      "name": "BuiltinAggregator",
      "literalValues": [
        {
          "name": "SUM"
        },
        {
          "name": "COUNT"
        },
        {
          "name": "MIN"
        },
        {
          "name": "MAX"
        }
      ]
    },
    {
      "name": "DecisionTableOrientation",
      "literalValues": [
        {
          "name": "Rule-as-Row"
        },
        {
          "name": "Rule-as-Column"
        },
        {
          "name": "CrossTable"
        }
      ]
    }
  ]
}

},{}],320:[function(_dereq_,module,exports){
'use strict';

var hat = _dereq_(321);


/**
 * Create a new id generator / cache instance.
 *
 * You may optionally provide a seed that is used internally.
 *
 * @param {Seed} seed
 */
function Ids(seed) {
  seed = seed || [ 128, 36, 1 ];
  this._seed = seed.length ? hat.rack(seed[0], seed[1], seed[2]) : seed;
}

module.exports = Ids;

/**
 * Generate a next id.
 *
 * @param {Object} [element] element to bind the id to
 *
 * @return {String} id
 */
Ids.prototype.next = function(element) {
  return this._seed(element || true);
};

/**
 * Generate a next id with a given prefix.
 *
 * @param {Object} [element] element to bind the id to
 *
 * @return {String} id
 */
Ids.prototype.nextPrefixed = function(prefix, element) {
  var id;

  do {
    id = prefix + this.next(true);
  } while (this.assigned(id));

  // claim {prefix}{random}
  this.claim(id, element);

  // return
  return id;
};

/**
 * Manually claim an existing id.
 *
 * @param {String} id
 * @param {String} [element] element the id is claimed by
 */
Ids.prototype.claim = function(id, element) {
  this._seed.set(id, element || true);
};

/**
 * Returns true if the given id has already been assigned.
 *
 * @param  {String} id
 * @return {Boolean}
 */
Ids.prototype.assigned = function(id) {
  return this._seed.get(id) || false;
};
},{"321":321}],321:[function(_dereq_,module,exports){
var hat = module.exports = function (bits, base) {
    if (!base) base = 16;
    if (bits === undefined) bits = 128;
    if (bits <= 0) return '0';
    
    var digits = Math.log(Math.pow(2, bits)) / Math.log(base);
    for (var i = 2; digits === Infinity; i *= 2) {
        digits = Math.log(Math.pow(2, bits / i)) / Math.log(base) * i;
    }
    
    var rem = digits - Math.floor(digits);
    
    var res = '';
    
    for (var i = 0; i < Math.floor(digits); i++) {
        var x = Math.floor(Math.random() * base).toString(base);
        res = x + res;
    }
    
    if (rem) {
        var b = Math.pow(base, rem);
        var x = Math.floor(Math.random() * b).toString(base);
        res = x + res;
    }
    
    var parsed = parseInt(res, base);
    if (parsed !== Infinity && parsed >= Math.pow(2, bits)) {
        return hat(bits, base)
    }
    else return res;
};

hat.rack = function (bits, base, expandBy) {
    var fn = function (data) {
        var iters = 0;
        do {
            if (iters ++ > 10) {
                if (expandBy) bits += expandBy;
                else throw new Error('too many ID collisions, use more bits')
            }
            
            var id = hat(bits, base);
        } while (Object.hasOwnProperty.call(hats, id));
        
        hats[id] = data;
        return id;
    };
    var hats = fn.hats = {};
    
    fn.get = function (id) {
        return fn.hats[id];
    };
    
    fn.set = function (id, value) {
        fn.hats[id] = value;
        return fn;
    };
    
    fn.bits = bits || 128;
    fn.base = base || 16;
    return fn;
};

},{}],322:[function(_dereq_,module,exports){
arguments[4][31][0].apply(exports,arguments)
},{"31":31}],323:[function(_dereq_,module,exports){
arguments[4][97][0].apply(exports,arguments)
},{"97":97}],324:[function(_dereq_,module,exports){
arguments[4][32][0].apply(exports,arguments)
},{"32":32,"328":328,"337":337,"363":363}],325:[function(_dereq_,module,exports){
var baseCallback = _dereq_(333),
    baseMap = _dereq_(347),
    baseSortBy = _dereq_(353),
    compareAscending = _dereq_(358),
    isIterateeCall = _dereq_(373);

/**
 * Creates an array of elements, sorted in ascending order by the results of
 * running each element in a collection through `iteratee`. This method performs
 * a stable sort, that is, it preserves the original sort order of equal elements.
 * The `iteratee` is bound to `thisArg` and invoked with three arguments:
 * (value, index|key, collection).
 *
 * If a property name is provided for `iteratee` the created `_.property`
 * style callback returns the property value of the given element.
 *
 * If a value is also provided for `thisArg` the created `_.matchesProperty`
 * style callback returns `true` for elements that have a matching property
 * value, else `false`.
 *
 * If an object is provided for `iteratee` the created `_.matches` style
 * callback returns `true` for elements that have the properties of the given
 * object, else `false`.
 *
 * @static
 * @memberOf _
 * @category Collection
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function|Object|string} [iteratee=_.identity] The function invoked
 *  per iteration.
 * @param {*} [thisArg] The `this` binding of `iteratee`.
 * @returns {Array} Returns the new sorted array.
 * @example
 *
 * _.sortBy([1, 2, 3], function(n) {
 *   return Math.sin(n);
 * });
 * // => [3, 1, 2]
 *
 * _.sortBy([1, 2, 3], function(n) {
 *   return this.sin(n);
 * }, Math);
 * // => [3, 1, 2]
 *
 * var users = [
 *   { 'user': 'fred' },
 *   { 'user': 'pebbles' },
 *   { 'user': 'barney' }
 * ];
 *
 * // using the `_.property` callback shorthand
 * _.pluck(_.sortBy(users, 'user'), 'user');
 * // => ['barney', 'fred', 'pebbles']
 */
function sortBy(collection, iteratee, thisArg) {
  if (collection == null) {
    return [];
  }
  if (thisArg && isIterateeCall(collection, iteratee, thisArg)) {
    iteratee = null;
  }
  var index = -1;
  iteratee = baseCallback(iteratee, thisArg, 3);

  var result = baseMap(collection, function(value, key, collection) {
    return { 'criteria': iteratee(value, key, collection), 'index': ++index, 'value': value };
  });
  return baseSortBy(result, compareAscending);
}

module.exports = sortBy;

},{"333":333,"347":347,"353":353,"358":358,"373":373}],326:[function(_dereq_,module,exports){
arguments[4][66][0].apply(exports,arguments)
},{"66":66}],327:[function(_dereq_,module,exports){
(function (global){
var cachePush = _dereq_(357),
    getNative = _dereq_(369);

/** Native method references. */
var Set = getNative(global, 'Set');

/* Native method references for those with the same name as other `lodash` methods. */
var nativeCreate = getNative(Object, 'create');

/**
 *
 * Creates a cache object to store unique values.
 *
 * @private
 * @param {Array} [values] The values to cache.
 */
function SetCache(values) {
  var length = values ? values.length : 0;

  this.data = { 'hash': nativeCreate(null), 'set': new Set };
  while (length--) {
    this.push(values[length]);
  }
}

// Add functions to the `Set` cache.
SetCache.prototype.push = cachePush;

module.exports = SetCache;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"357":357,"369":369}],328:[function(_dereq_,module,exports){
arguments[4][33][0].apply(exports,arguments)
},{"33":33}],329:[function(_dereq_,module,exports){
arguments[4][107][0].apply(exports,arguments)
},{"107":107}],330:[function(_dereq_,module,exports){
arguments[4][109][0].apply(exports,arguments)
},{"109":109}],331:[function(_dereq_,module,exports){
arguments[4][67][0].apply(exports,arguments)
},{"391":391,"67":67}],332:[function(_dereq_,module,exports){
arguments[4][68][0].apply(exports,arguments)
},{"335":335,"391":391,"68":68}],333:[function(_dereq_,module,exports){
arguments[4][112][0].apply(exports,arguments)
},{"112":112,"348":348,"349":349,"355":355,"397":397,"398":398}],334:[function(_dereq_,module,exports){
/**
 * The base implementation of `compareAscending` which compares values and
 * sorts them in ascending order without guaranteeing a stable sort.
 *
 * @private
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {number} Returns the sort order indicator for `value`.
 */
function baseCompareAscending(value, other) {
  if (value !== other) {
    var valIsNull = value === null,
        valIsUndef = value === undefined,
        valIsReflexive = value === value;

    var othIsNull = other === null,
        othIsUndef = other === undefined,
        othIsReflexive = other === other;

    if ((value > other && !othIsNull) || !valIsReflexive ||
        (valIsNull && !othIsUndef && othIsReflexive) ||
        (valIsUndef && othIsReflexive)) {
      return 1;
    }
    if ((value < other && !valIsNull) || !othIsReflexive ||
        (othIsNull && !valIsUndef && valIsReflexive) ||
        (othIsUndef && valIsReflexive)) {
      return -1;
    }
  }
  return 0;
}

module.exports = baseCompareAscending;

},{}],335:[function(_dereq_,module,exports){
arguments[4][69][0].apply(exports,arguments)
},{"69":69}],336:[function(_dereq_,module,exports){
var baseIndexOf = _dereq_(343),
    cacheIndexOf = _dereq_(356),
    createCache = _dereq_(362);

/**
 * The base implementation of `_.difference` which accepts a single array
 * of values to exclude.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {Array} values The values to exclude.
 * @returns {Array} Returns the new array of filtered values.
 */
function baseDifference(array, values) {
  var length = array ? array.length : 0,
      result = [];

  if (!length) {
    return result;
  }
  var index = -1,
      indexOf = baseIndexOf,
      isCommon = true,
      cache = (isCommon && values.length >= 200) ? createCache(values) : null,
      valuesLength = values.length;

  if (cache) {
    indexOf = cacheIndexOf;
    isCommon = false;
    values = cache;
  }
  outer:
  while (++index < length) {
    var value = array[index];

    if (isCommon && value === value) {
      var valuesIndex = valuesLength;
      while (valuesIndex--) {
        if (values[valuesIndex] === value) {
          continue outer;
        }
      }
      result.push(value);
    }
    else if (indexOf(values, value, 0) < 0) {
      result.push(value);
    }
  }
  return result;
}

module.exports = baseDifference;

},{"343":343,"356":356,"362":362}],337:[function(_dereq_,module,exports){
arguments[4][34][0].apply(exports,arguments)
},{"34":34,"341":341,"360":360}],338:[function(_dereq_,module,exports){
arguments[4][191][0].apply(exports,arguments)
},{"191":191,"371":371,"376":376,"383":383,"384":384}],339:[function(_dereq_,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"35":35,"361":361}],340:[function(_dereq_,module,exports){
arguments[4][193][0].apply(exports,arguments)
},{"193":193,"339":339,"392":392}],341:[function(_dereq_,module,exports){
arguments[4][36][0].apply(exports,arguments)
},{"339":339,"36":36,"391":391}],342:[function(_dereq_,module,exports){
arguments[4][121][0].apply(exports,arguments)
},{"121":121,"381":381}],343:[function(_dereq_,module,exports){
var indexOfNaN = _dereq_(370);

/**
 * The base implementation of `_.indexOf` without support for binary searches.
 *
 * @private
 * @param {Array} array The array to search.
 * @param {*} value The value to search for.
 * @param {number} fromIndex The index to search from.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function baseIndexOf(array, value, fromIndex) {
  if (value !== value) {
    return indexOfNaN(array, fromIndex);
  }
  var index = fromIndex - 1,
      length = array.length;

  while (++index < length) {
    if (array[index] === value) {
      return index;
    }
  }
  return -1;
}

module.exports = baseIndexOf;

},{"370":370}],344:[function(_dereq_,module,exports){
arguments[4][122][0].apply(exports,arguments)
},{"122":122,"345":345,"376":376,"387":387}],345:[function(_dereq_,module,exports){
arguments[4][123][0].apply(exports,arguments)
},{"123":123,"364":364,"365":365,"366":366,"384":384,"389":389}],346:[function(_dereq_,module,exports){
arguments[4][124][0].apply(exports,arguments)
},{"124":124,"344":344,"381":381}],347:[function(_dereq_,module,exports){
arguments[4][125][0].apply(exports,arguments)
},{"125":125,"337":337,"371":371}],348:[function(_dereq_,module,exports){
arguments[4][126][0].apply(exports,arguments)
},{"126":126,"346":346,"368":368,"381":381}],349:[function(_dereq_,module,exports){
arguments[4][127][0].apply(exports,arguments)
},{"127":127,"323":323,"342":342,"344":344,"352":352,"374":374,"377":377,"381":381,"382":382,"384":384}],350:[function(_dereq_,module,exports){
arguments[4][38][0].apply(exports,arguments)
},{"38":38}],351:[function(_dereq_,module,exports){
arguments[4][129][0].apply(exports,arguments)
},{"129":129,"342":342,"382":382}],352:[function(_dereq_,module,exports){
arguments[4][131][0].apply(exports,arguments)
},{"131":131}],353:[function(_dereq_,module,exports){
/**
 * The base implementation of `_.sortBy` which uses `comparer` to define
 * the sort order of `array` and replaces criteria objects with their
 * corresponding values.
 *
 * @private
 * @param {Array} array The array to sort.
 * @param {Function} comparer The function to define sort order.
 * @returns {Array} Returns `array`.
 */
function baseSortBy(array, comparer) {
  var length = array.length;

  array.sort(comparer);
  while (length--) {
    array[length] = array[length].value;
  }
  return array;
}

module.exports = baseSortBy;

},{}],354:[function(_dereq_,module,exports){
arguments[4][39][0].apply(exports,arguments)
},{"39":39}],355:[function(_dereq_,module,exports){
arguments[4][40][0].apply(exports,arguments)
},{"397":397,"40":40}],356:[function(_dereq_,module,exports){
var isObject = _dereq_(387);

/**
 * Checks if `value` is in `cache` mimicking the return signature of
 * `_.indexOf` by returning `0` if the value is found, else `-1`.
 *
 * @private
 * @param {Object} cache The cache to search.
 * @param {*} value The value to search for.
 * @returns {number} Returns `0` if `value` is found, else `-1`.
 */
function cacheIndexOf(cache, value) {
  var data = cache.data,
      result = (typeof value == 'string' || isObject(value)) ? data.set.has(value) : data.hash[value];

  return result ? 0 : -1;
}

module.exports = cacheIndexOf;

},{"387":387}],357:[function(_dereq_,module,exports){
var isObject = _dereq_(387);

/**
 * Adds `value` to the cache.
 *
 * @private
 * @name push
 * @memberOf SetCache
 * @param {*} value The value to cache.
 */
function cachePush(value) {
  var data = this.data;
  if (typeof value == 'string' || isObject(value)) {
    data.set.add(value);
  } else {
    data.hash[value] = true;
  }
}

module.exports = cachePush;

},{"387":387}],358:[function(_dereq_,module,exports){
var baseCompareAscending = _dereq_(334);

/**
 * Used by `_.sortBy` to compare transformed elements of a collection and stable
 * sort them in ascending order.
 *
 * @private
 * @param {Object} object The object to compare to `other`.
 * @param {Object} other The object to compare to `object`.
 * @returns {number} Returns the sort order indicator for `object`.
 */
function compareAscending(object, other) {
  return baseCompareAscending(object.criteria, other.criteria) || (object.index - other.index);
}

module.exports = compareAscending;

},{"334":334}],359:[function(_dereq_,module,exports){
arguments[4][74][0].apply(exports,arguments)
},{"326":326,"355":355,"373":373,"74":74}],360:[function(_dereq_,module,exports){
arguments[4][41][0].apply(exports,arguments)
},{"367":367,"375":375,"381":381,"41":41}],361:[function(_dereq_,module,exports){
arguments[4][42][0].apply(exports,arguments)
},{"381":381,"42":42}],362:[function(_dereq_,module,exports){
(function (global){
var SetCache = _dereq_(327),
    constant = _dereq_(396),
    getNative = _dereq_(369);

/** Native method references. */
var Set = getNative(global, 'Set');

/* Native method references for those with the same name as other `lodash` methods. */
var nativeCreate = getNative(Object, 'create');

/**
 * Creates a `Set` cache object to optimize linear searches of large arrays.
 *
 * @private
 * @param {Array} [values] The values to cache.
 * @returns {null|Object} Returns the new cache object if `Set` is supported, else `null`.
 */
var createCache = !(nativeCreate && Set) ? constant(null) : function(values) {
  return new SetCache(values);
};

module.exports = createCache;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"327":327,"369":369,"396":396}],363:[function(_dereq_,module,exports){
arguments[4][43][0].apply(exports,arguments)
},{"355":355,"384":384,"43":43}],364:[function(_dereq_,module,exports){
arguments[4][140][0].apply(exports,arguments)
},{"140":140,"330":330}],365:[function(_dereq_,module,exports){
arguments[4][141][0].apply(exports,arguments)
},{"141":141}],366:[function(_dereq_,module,exports){
arguments[4][142][0].apply(exports,arguments)
},{"142":142,"391":391}],367:[function(_dereq_,module,exports){
arguments[4][44][0].apply(exports,arguments)
},{"350":350,"44":44}],368:[function(_dereq_,module,exports){
arguments[4][144][0].apply(exports,arguments)
},{"144":144,"377":377,"394":394}],369:[function(_dereq_,module,exports){
arguments[4][45][0].apply(exports,arguments)
},{"385":385,"45":45}],370:[function(_dereq_,module,exports){
/**
 * Gets the index at which the first occurrence of `NaN` is found in `array`.
 *
 * @private
 * @param {Array} array The array to search.
 * @param {number} fromIndex The index to search from.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {number} Returns the index of the matched `NaN`, else `-1`.
 */
function indexOfNaN(array, fromIndex, fromRight) {
  var length = array.length,
      index = fromIndex + (fromRight ? 0 : -1);

  while ((fromRight ? index-- : ++index < length)) {
    var other = array[index];
    if (other !== other) {
      return index;
    }
  }
  return -1;
}

module.exports = indexOfNaN;

},{}],371:[function(_dereq_,module,exports){
arguments[4][46][0].apply(exports,arguments)
},{"367":367,"375":375,"46":46}],372:[function(_dereq_,module,exports){
arguments[4][47][0].apply(exports,arguments)
},{"47":47}],373:[function(_dereq_,module,exports){
arguments[4][79][0].apply(exports,arguments)
},{"371":371,"372":372,"387":387,"79":79}],374:[function(_dereq_,module,exports){
arguments[4][149][0].apply(exports,arguments)
},{"149":149,"381":381,"384":384}],375:[function(_dereq_,module,exports){
arguments[4][48][0].apply(exports,arguments)
},{"48":48}],376:[function(_dereq_,module,exports){
arguments[4][49][0].apply(exports,arguments)
},{"49":49}],377:[function(_dereq_,module,exports){
arguments[4][152][0].apply(exports,arguments)
},{"152":152,"387":387}],378:[function(_dereq_,module,exports){
arguments[4][224][0].apply(exports,arguments)
},{"224":224,"381":381}],379:[function(_dereq_,module,exports){
arguments[4][225][0].apply(exports,arguments)
},{"225":225,"340":340}],380:[function(_dereq_,module,exports){
arguments[4][50][0].apply(exports,arguments)
},{"372":372,"375":375,"383":383,"384":384,"392":392,"50":50}],381:[function(_dereq_,module,exports){
arguments[4][51][0].apply(exports,arguments)
},{"387":387,"51":51}],382:[function(_dereq_,module,exports){
arguments[4][155][0].apply(exports,arguments)
},{"155":155,"354":354,"384":384}],383:[function(_dereq_,module,exports){
arguments[4][52][0].apply(exports,arguments)
},{"371":371,"376":376,"52":52}],384:[function(_dereq_,module,exports){
arguments[4][53][0].apply(exports,arguments)
},{"369":369,"375":375,"376":376,"53":53}],385:[function(_dereq_,module,exports){
arguments[4][55][0].apply(exports,arguments)
},{"376":376,"395":395,"55":55}],386:[function(_dereq_,module,exports){
arguments[4][56][0].apply(exports,arguments)
},{"376":376,"56":56}],387:[function(_dereq_,module,exports){
arguments[4][57][0].apply(exports,arguments)
},{"57":57}],388:[function(_dereq_,module,exports){
arguments[4][88][0].apply(exports,arguments)
},{"376":376,"88":88}],389:[function(_dereq_,module,exports){
arguments[4][161][0].apply(exports,arguments)
},{"161":161,"375":375,"376":376}],390:[function(_dereq_,module,exports){
arguments[4][89][0].apply(exports,arguments)
},{"331":331,"332":332,"359":359,"89":89}],391:[function(_dereq_,module,exports){
arguments[4][58][0].apply(exports,arguments)
},{"369":369,"371":371,"380":380,"387":387,"58":58}],392:[function(_dereq_,module,exports){
arguments[4][59][0].apply(exports,arguments)
},{"372":372,"375":375,"383":383,"384":384,"387":387,"59":59}],393:[function(_dereq_,module,exports){
var arrayMap = _dereq_(329),
    baseDifference = _dereq_(336),
    baseFlatten = _dereq_(338),
    bindCallback = _dereq_(355),
    keysIn = _dereq_(392),
    pickByArray = _dereq_(378),
    pickByCallback = _dereq_(379),
    restParam = _dereq_(326);

/**
 * The opposite of `_.pick`; this method creates an object composed of the
 * own and inherited enumerable properties of `object` that are not omitted.
 *
 * @static
 * @memberOf _
 * @category Object
 * @param {Object} object The source object.
 * @param {Function|...(string|string[])} [predicate] The function invoked per
 *  iteration or property names to omit, specified as individual property
 *  names or arrays of property names.
 * @param {*} [thisArg] The `this` binding of `predicate`.
 * @returns {Object} Returns the new object.
 * @example
 *
 * var object = { 'user': 'fred', 'age': 40 };
 *
 * _.omit(object, 'age');
 * // => { 'user': 'fred' }
 *
 * _.omit(object, _.isNumber);
 * // => { 'user': 'fred' }
 */
var omit = restParam(function(object, props) {
  if (object == null) {
    return {};
  }
  if (typeof props[0] != 'function') {
    var props = arrayMap(baseFlatten(props), String);
    return pickByArray(object, baseDifference(keysIn(object), props));
  }
  var predicate = bindCallback(props[0], props[1], 3);
  return pickByCallback(object, function(value, key, object) {
    return !predicate(value, key, object);
  });
});

module.exports = omit;

},{"326":326,"329":329,"336":336,"338":338,"355":355,"378":378,"379":379,"392":392}],394:[function(_dereq_,module,exports){
arguments[4][165][0].apply(exports,arguments)
},{"165":165,"381":381,"391":391}],395:[function(_dereq_,module,exports){
arguments[4][60][0].apply(exports,arguments)
},{"354":354,"60":60}],396:[function(_dereq_,module,exports){
/**
 * Creates a function that returns `value`.
 *
 * @static
 * @memberOf _
 * @category Utility
 * @param {*} value The value to return from the new function.
 * @returns {Function} Returns the new function.
 * @example
 *
 * var object = { 'user': 'fred' };
 * var getter = _.constant(object);
 *
 * getter() === object;
 * // => true
 */
function constant(value) {
  return function() {
    return value;
  };
}

module.exports = constant;

},{}],397:[function(_dereq_,module,exports){
arguments[4][61][0].apply(exports,arguments)
},{"61":61}],398:[function(_dereq_,module,exports){
arguments[4][168][0].apply(exports,arguments)
},{"168":168,"350":350,"351":351,"374":374}],399:[function(_dereq_,module,exports){
module.exports = _dereq_(404);
},{"404":404}],400:[function(_dereq_,module,exports){
module.exports = function(el) {

  var c;

  while (el.childNodes.length) {
    c = el.childNodes[0];
    el.removeChild(c);
  }

  return el;
};
},{}],401:[function(_dereq_,module,exports){
module.exports = _dereq_(407);
},{"407":407}],402:[function(_dereq_,module,exports){
module.exports = _dereq_(406);
},{"406":406}],403:[function(_dereq_,module,exports){
module.exports = function(el) {
  el.parentNode && el.parentNode.removeChild(el);
};
},{}],404:[function(_dereq_,module,exports){
/**
 * Module dependencies.
 */

var index = _dereq_(405);

/**
 * Whitespace regexp.
 */

var re = /\s+/;

/**
 * toString reference.
 */

var toString = Object.prototype.toString;

/**
 * Wrap `el` in a `ClassList`.
 *
 * @param {Element} el
 * @return {ClassList}
 * @api public
 */

module.exports = function(el){
  return new ClassList(el);
};

/**
 * Initialize a new ClassList for `el`.
 *
 * @param {Element} el
 * @api private
 */

function ClassList(el) {
  if (!el || !el.nodeType) {
    throw new Error('A DOM element reference is required');
  }
  this.el = el;
  this.list = el.classList;
}

/**
 * Add class `name` if not already present.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.add = function(name){
  // classList
  if (this.list) {
    this.list.add(name);
    return this;
  }

  // fallback
  var arr = this.array();
  var i = index(arr, name);
  if (!~i) arr.push(name);
  this.el.className = arr.join(' ');
  return this;
};

/**
 * Remove class `name` when present, or
 * pass a regular expression to remove
 * any which match.
 *
 * @param {String|RegExp} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.remove = function(name){
  if ('[object RegExp]' == toString.call(name)) {
    return this.removeMatching(name);
  }

  // classList
  if (this.list) {
    this.list.remove(name);
    return this;
  }

  // fallback
  var arr = this.array();
  var i = index(arr, name);
  if (~i) arr.splice(i, 1);
  this.el.className = arr.join(' ');
  return this;
};

/**
 * Remove all classes matching `re`.
 *
 * @param {RegExp} re
 * @return {ClassList}
 * @api private
 */

ClassList.prototype.removeMatching = function(re){
  var arr = this.array();
  for (var i = 0; i < arr.length; i++) {
    if (re.test(arr[i])) {
      this.remove(arr[i]);
    }
  }
  return this;
};

/**
 * Toggle class `name`, can force state via `force`.
 *
 * For browsers that support classList, but do not support `force` yet,
 * the mistake will be detected and corrected.
 *
 * @param {String} name
 * @param {Boolean} force
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.toggle = function(name, force){
  // classList
  if (this.list) {
    if ("undefined" !== typeof force) {
      if (force !== this.list.toggle(name, force)) {
        this.list.toggle(name); // toggle again to correct
      }
    } else {
      this.list.toggle(name);
    }
    return this;
  }

  // fallback
  if ("undefined" !== typeof force) {
    if (!force) {
      this.remove(name);
    } else {
      this.add(name);
    }
  } else {
    if (this.has(name)) {
      this.remove(name);
    } else {
      this.add(name);
    }
  }

  return this;
};

/**
 * Return an array of classes.
 *
 * @return {Array}
 * @api public
 */

ClassList.prototype.array = function(){
  var className = this.el.getAttribute('class') || '';
  var str = className.replace(/^\s+|\s+$/g, '');
  var arr = str.split(re);
  if ('' === arr[0]) arr.shift();
  return arr;
};

/**
 * Check if class `name` is present.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.has =
ClassList.prototype.contains = function(name){
  return this.list
    ? this.list.contains(name)
    : !! ~index(this.array(), name);
};

},{"405":405}],405:[function(_dereq_,module,exports){
module.exports = function(arr, obj){
  if (arr.indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
};
},{}],406:[function(_dereq_,module,exports){
function one(selector, el) {
  return el.querySelector(selector);
}

exports = module.exports = function(selector, el){
  el = el || document;
  return one(selector, el);
};

exports.all = function(selector, el){
  el = el || document;
  return el.querySelectorAll(selector);
};

exports.engine = function(obj){
  if (!obj.one) throw new Error('.one callback required');
  if (!obj.all) throw new Error('.all callback required');
  one = obj.one;
  exports.all = obj.all;
  return exports;
};

},{}],407:[function(_dereq_,module,exports){

/**
 * Expose `parse`.
 */

module.exports = parse;

/**
 * Tests for browser support.
 */

var div = document.createElement('div');
// Setup
div.innerHTML = '  <link/><table></table><a href="/a">a</a><input type="checkbox"/>';
// Make sure that link elements get serialized correctly by innerHTML
// This requires a wrapper element in IE
var innerHTMLBug = !div.getElementsByTagName('link').length;
div = undefined;

/**
 * Wrap map from jquery.
 */

var map = {
  legend: [1, '<fieldset>', '</fieldset>'],
  tr: [2, '<table><tbody>', '</tbody></table>'],
  col: [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],
  // for script/link/style tags to work in IE6-8, you have to wrap
  // in a div with a non-whitespace character in front, ha!
  _default: innerHTMLBug ? [1, 'X<div>', '</div>'] : [0, '', '']
};

map.td =
map.th = [3, '<table><tbody><tr>', '</tr></tbody></table>'];

map.option =
map.optgroup = [1, '<select multiple="multiple">', '</select>'];

map.thead =
map.tbody =
map.colgroup =
map.caption =
map.tfoot = [1, '<table>', '</table>'];

map.polyline =
map.ellipse =
map.polygon =
map.circle =
map.text =
map.line =
map.path =
map.rect =
map.g = [1, '<svg xmlns="http://www.w3.org/2000/svg" version="1.1">','</svg>'];

/**
 * Parse `html` and return a DOM Node instance, which could be a TextNode,
 * HTML DOM Node of some kind (<div> for example), or a DocumentFragment
 * instance, depending on the contents of the `html` string.
 *
 * @param {String} html - HTML string to "domify"
 * @param {Document} doc - The `document` instance to create the Node for
 * @return {DOMNode} the TextNode, DOM Node, or DocumentFragment instance
 * @api private
 */

function parse(html, doc) {
  if ('string' != typeof html) throw new TypeError('String expected');

  // default to the global `document` object
  if (!doc) doc = document;

  // tag name
  var m = /<([\w:]+)/.exec(html);
  if (!m) return doc.createTextNode(html);

  html = html.replace(/^\s+|\s+$/g, ''); // Remove leading/trailing whitespace

  var tag = m[1];

  // body support
  if (tag == 'body') {
    var el = doc.createElement('html');
    el.innerHTML = html;
    return el.removeChild(el.lastChild);
  }

  // wrap map
  var wrap = map[tag] || map._default;
  var depth = wrap[0];
  var prefix = wrap[1];
  var suffix = wrap[2];
  var el = doc.createElement('div');
  el.innerHTML = prefix + html + suffix;
  while (depth--) el = el.lastChild;

  // one element
  if (el.firstChild == el.lastChild) {
    return el.removeChild(el.firstChild);
  }

  // several elements
  var fragment = doc.createDocumentFragment();
  while (el.firstChild) {
    fragment.appendChild(el.removeChild(el.firstChild));
  }

  return fragment;
}

},{}],408:[function(_dereq_,module,exports){
module.exports = _dereq_(409);

},{"409":409}],409:[function(_dereq_,module,exports){
'use strict';

var di = _dereq_(511);


/**
 * Bootstrap an injector from a list of modules, instantiating a number of default components
 *
 * @ignore
 * @param {Array<didi.Module>} bootstrapModules
 *
 * @return {didi.Injector} a injector to use to access the components
 */
function bootstrap(bootstrapModules) {

  var modules = [],
      components = [];

  function hasModule(m) {
    return modules.indexOf(m) >= 0;
  }

  function addModule(m) {
    modules.push(m);
  }

  function visit(m) {
    if (hasModule(m)) {
      return;
    }

    (m.__depends__ || []).forEach(visit);

    if (hasModule(m)) {
      return;
    }

    addModule(m);
    (m.__init__ || []).forEach(function(c) {
      components.push(c);
    });
  }

  bootstrapModules.forEach(visit);

  var injector = new di.Injector(modules);

  components.forEach(function(c) {

    try {
      // eagerly resolve component (fn or string)
      injector[typeof c === 'string' ? 'get' : 'invoke'](c);
    } catch (e) {
      console.error('Failed to instantiate component');
      console.error(e.stack);

      throw e;
    }
  });

  return injector;
}

/**
 * Creates an injector from passed options.
 *
 * @ignore
 * @param  {Object} options
 * @return {didi.Injector}
 */
function createInjector(options) {

  options = options || {};

  var configModule = {
    'config': ['value', options]
  };

  var coreModule = _dereq_(414);

  var modules = [ configModule, coreModule ].concat(options.modules || []);

  return bootstrap(modules);
}


/**
 * The main table-js entry point that bootstraps the table with the given
 * configuration.
 *
 * To register extensions with the table, pass them as Array<didi.Module> to the constructor.
 *
 * @class tjs.Table
 * @memberOf tjs
 * @constructor
 *
 * @param {Object} options
 * @param {Array<didi.Module>} [options.modules] external modules to instantiate with the table
 * @param {didi.Injector} [injector] an (optional) injector to bootstrap the table with
 */
function Table(options, injector) {

  // create injector unless explicitly specified
  this.injector = injector = injector || createInjector(options);

  // API

  /**
   * Resolves a table service
   *
   * @method Table#get
   *
   * @param {String} name the name of the table service to be retrieved
   * @param {Object} [locals] a number of locals to use to resolve certain dependencies
   */
  this.get = injector.get;

  /**
   * Executes a function into which table services are injected
   *
   * @method Table#invoke
   *
   * @param {Function|Object[]} fn the function to resolve
   * @param {Object} locals a number of locals to use to resolve certain dependencies
   */
  this.invoke = injector.invoke;

  // init

  // indicate via event


  /**
   * An event indicating that all plug-ins are loaded.
   *
   * Use this event to fire other events to interested plug-ins
   *
   * @memberOf Table
   *
   * @event table.init
   *
   * @example
   *
   * eventBus.on('table.init', function() {
   *   eventBus.fire('my-custom-event', { foo: 'BAR' });
   * });
   *
   * @type {Object}
   */
  this.get('eventBus').fire('table.init');
}

module.exports = Table;


/**
 * Destroys the table
 *
 * @method  Table#destroy
 */
Table.prototype.destroy = function() {
  this.get('eventBus').fire('table.destroy');
};

},{"414":414,"511":511}],410:[function(_dereq_,module,exports){
'use strict';

var Model = _dereq_(429);


/**
 * A factory for diagram-js shapes
 */
function ElementFactory() {
  this._uid = 12;
}

module.exports = ElementFactory;


ElementFactory.prototype.createTable = function(attrs) {
  return document.createElement('table');
  //return this.create('table', attrs);
};

ElementFactory.prototype.createRow = function(attrs) {
  return this.create('row', attrs);
};

ElementFactory.prototype.createColumn = function(attrs) {
  return this.create('column', attrs);
};

/**
 * Create a model element with the given type and
 * a number of pre-set attributes.
 *
 * @param  {String} type
 * @param  {Object} attrs
 * @return {djs.model.Base} the newly created model instance
 */
ElementFactory.prototype.create = function(type, attrs) {

  attrs = attrs || {};

  if (!attrs.id) {
    attrs.id = type + '_' + (this._uid++);
  }

  return Model.create(type, attrs);
};

},{"429":429}],411:[function(_dereq_,module,exports){
'use strict';

var ELEMENT_ID = 'data-element-id';


/**
 * @class
 *
 * A registry that keeps track of all shapes in the diagram.
 */
function ElementRegistry() {
  this._elements = {};
}

module.exports = ElementRegistry;

/**
 * Register a pair of (element, gfx, (secondaryGfx)).
 *
 * @param {djs.model.Base} element
 * @param {Snap<SVGElement>} gfx
 * @param {Snap<SVGElement>} [secondaryGfx] optional other element to register, too
 */
ElementRegistry.prototype.add = function(element, gfx, secondaryGfx) {

  var id = element.id;

  this._validateId(id);

  // associate dom node with element
  gfx.setAttribute(ELEMENT_ID, id);

  if (secondaryGfx) {
    secondaryGfx.setAttribute(ELEMENT_ID, id);
  }

  this._elements[id] = { element: element, gfx: gfx, secondaryGfx: secondaryGfx };
};

/**
 * Removes an element from the registry.
 *
 * @param {djs.model.Base} element
 */
ElementRegistry.prototype.remove = function(element) {
  var elements = this._elements,
      id = element.id || element,
      container = id && elements[id];

  if (container) {

    // unset element id on gfx
    container.gfx.setAttribute(ELEMENT_ID, null);

    if (container.secondaryGfx) {
      container.secondaryGfx.setAttribute(ELEMENT_ID, null);
    }

    delete elements[id];
  }
};

/**
 * Update the id of an element
 *
 * @param {djs.model.Base} element
 * @param {String} newId
 */
ElementRegistry.prototype.updateId = function(element, newId) {

  this._validateId(newId);

  if (typeof element === 'string') {
    element = this.get(element);
  }

  var gfx = this.getGraphics(element),
      secondaryGfx = this.getGraphics(element, true);

  this.remove(element);

  element.id = newId;

  this.add(element, gfx, secondaryGfx);
};

/**
 * Return the model element for a given id or graphics.
 *
 * @example
 *
 * elementRegistry.get('SomeElementId_1');
 * elementRegistry.get(gfx);
 *
 *
 * @param {String|SVGElement} filter for selecting the element
 *
 * @return {djs.model.Base}
 */
ElementRegistry.prototype.get = function(filter) {
  var id;

  if (typeof filter === 'string') {
    id = filter;
  } else {
    // get by graphics
    id = filter && filter.getAttribute(ELEMENT_ID);
  }

  var container = this._elements[id];
  return container && container.element;
};

/**
 * Return all elements that match a given filter function.
 *
 * @param {Function} fn
 *
 * @return {Array<djs.model.Base>}
 */
ElementRegistry.prototype.filter = function(fn) {

  var filtered = [];

  this.forEach(function(element, gfx) {
    if(fn(element, gfx)) {
      filtered.push(element);
    }
  });

  return filtered;
};

/**
 * Iterate over all diagram elements.
 *
 * @param {Function} fn
 */
ElementRegistry.prototype.forEach = function(fn) {

  var map = this._elements;

  Object.keys(map).forEach(function(id) {
    var container = map[id],
        element = container.element,
        gfx = container.gfx;

    return fn(element, gfx);
  });
};

/**
 * Return the graphical representation of an element or its id.
 *
 * @example
 * elementRegistry.getGraphics('SomeElementId_1');
 * elementRegistry.getGraphics(rootElement); // <g ...>
 *
 * elementRegistry.getGraphics(rootElement, true); // <svg ...>
 *
 *
 * @param {String|djs.model.Base} filter
 * @param {Boolean} [secondary=false] whether to return the secondary connected element
 *
 * @return {SVGElement}
 */
ElementRegistry.prototype.getGraphics = function(filter, secondary) {
  var id = filter.id || filter;

  var container = this._elements[id];
  return container && (secondary ? container.secondaryGfx : container.gfx);
};

/**
 * Validate the suitability of the given id and signals a problem
 * with an exception.
 *
 * @param {String} id
 *
 * @throws {Error} if id is empty or already assigned
 */
ElementRegistry.prototype._validateId = function(id) {
  if (!id) {
    throw new Error('element must have an id');
  }

  if (this._elements[id]) {
    throw new Error('element with id ' + id + ' already added');
  }
};

},{}],412:[function(_dereq_,module,exports){
'use strict';

var forEach = _dereq_(517);

/**
 * A factory that creates graphical elements
 *
 * @param {Renderer} renderer
 */
function GraphicsFactory(elementRegistry, renderer) {
  this._renderer = renderer;
  this._elementRegistry = elementRegistry;
}

GraphicsFactory.$inject = [ 'elementRegistry', 'renderer' ];

module.exports = GraphicsFactory;

GraphicsFactory.prototype.create = function(type, element, parent) {
  var newElement;
  switch(type) {
    case 'row':
      newElement = document.createElement('tr');
      break;
    case 'cell':
      // cells consist of a td element with a nested span which contains the content
      newElement = document.createElement(element.row.useTH ? 'th' : 'td');
      var contentContainer = document.createElement('span');
      newElement.appendChild(contentContainer);
      break;
  }
  if(newElement && type === 'row') {
    if(element.next) {
      parent.insertBefore(newElement, this._elementRegistry.getGraphics(element.next));
    } else {
      parent.appendChild(newElement);
    }
  } else if(type === 'cell') {
    var neighboringCell = this._elementRegistry.filter(function(el) {
      return el.row === element.row && el.column === element.column.next;
    })[0];
    if(neighboringCell) {
      parent.insertBefore(newElement, this._elementRegistry.getGraphics(neighboringCell));
    } else {
      parent.appendChild(newElement);
    }
  }
  return newElement || document.createElement('div');
};


GraphicsFactory.prototype.update = function(type, element, gfx) {

  // Do not update root element
  if (!element.parent) {
    return;
  }

  var self = this;
  // redraw
  if (type === 'row') {
    this._renderer.drawRow(gfx, element);

    // also redraw all cells in this row
    forEach(this._elementRegistry.filter(function(el) {
      return el.row === element;
    }), function(cell) {
      self.update('cell', cell, self._elementRegistry.getGraphics(cell));
    });
  } else
  if (type === 'column') {
    this._renderer.drawColumn(gfx, element);

    // also redraw all cells in this column
    forEach(this._elementRegistry.filter(function(el) {
      return el.column === element;
    }), function(cell) {
      self.update('cell', cell, self._elementRegistry.getGraphics(cell));
    });
  } else
  if (type === 'cell') {
    this._renderer.drawCell(gfx, element);
  } else {
    throw new Error('unknown type: ' + type);
  }
};

GraphicsFactory.prototype.remove = function(element) {
  var gfx = this._elementRegistry.getGraphics(element);

  // remove
  gfx.parentNode && gfx.parentNode.removeChild(gfx);
};

},{"517":517}],413:[function(_dereq_,module,exports){
'use strict';

var isNumber = _dereq_(564),
    assign = _dereq_(567),
    forEach = _dereq_(517),
    every = _dereq_(516);

function ensurePx(number) {
  return isNumber(number) ? number + 'px' : number;
}

/**
 * Creates a HTML container element for a table element with
 * the given configuration
 *
 * @param  {Object} options
 * @return {HTMLElement} the container element
 */
function createContainer(options) {

  options = assign({}, { width: '100%', height: '100%' }, options);

  var container = options.container || document.body;

  // create a <div> around the table element with the respective size
  // this way we can always get the correct container size
  var parent = document.createElement('div');
  parent.setAttribute('class', 'tjs-container');

  assign(parent.style, {
    position: 'relative',
    overflow: 'hidden',
    width: ensurePx(options.width),
    height: ensurePx(options.height)
  });

  container.appendChild(parent);

  return parent;
}

var REQUIRED_MODEL_ATTRS = {
  row: [ 'next', 'previous' ],
  column: [ 'next', 'previous' ],
  cell: [ 'row', 'column' ]
};

/**
 * The main drawing sheet.
 *
 * @class
 * @constructor
 *
 * @emits Sheet#sheet.init
 *
 * @param {Object} config
 * @param {EventBus} eventBus
 * @param {GraphicsFactory} graphicsFactory
 * @param {ElementRegistry} elementRegistry
 */
function Sheet(config, eventBus, elementRegistry, graphicsFactory) {
  this._eventBus = eventBus;
  this._elementRegistry = elementRegistry;
  this._graphicsFactory = graphicsFactory;

  this._init(config || {});
}

Sheet.$inject = [ 'config.sheet', 'eventBus', 'elementRegistry', 'graphicsFactory' ];

module.exports = Sheet;


Sheet.prototype.getLastColumn = function() {
  return this._lastColumn;
};

Sheet.prototype.setLastColumn = function(element) {
  this._lastColumn = element;
};

Sheet.prototype.getLastRow = function(type) {
  return this._lastRow[type];
};

Sheet.prototype.setLastRow = function(element, type) {
  this._lastRow[type] = element;
};

Sheet.prototype.setSibling = function(first, second) {
  if(first) first.next = second;
  if(second) second.previous = first;
};

Sheet.prototype.addSiblings = function(type, element) {
  var tmp, subType;
  if(type === 'row') {
    subType = element.isHead ? 'head' : element.isFoot ? 'foot' : 'body';
  }
  if(!element.previous && !element.next) {
    if(type === 'column') {
      // add column to end of table per default
      element.next = null;
      this.setSibling(this.getLastColumn(), element);
      this.setLastColumn(element);
    } else if(type === 'row') {
      // add row to end of table per default
      element.next = null;
      this.setSibling(this.getLastRow(subType), element);
      this.setLastRow(element, subType);
    }
  } else if(element.previous && !element.next) {
    tmp = element.previous.next;
    this.setSibling(element.previous, element);
    this.setSibling(element, tmp);
  } else if(!element.previous && element.next) {
    tmp = element.next.previous;
    this.setSibling(tmp, element);
    this.setSibling(element, element.next);
  } else if(element.previous && element.next) {
    if(element.previous.next !== element.next) {
      throw new Error('cannot set both previous and next when adding new element <' + type + '>');
    } else {
      this.setSibling(element.previous, element);
      this.setSibling(element, element.next);
    }
  }
};

Sheet.prototype.removeSiblings = function(type, element) {
  var subType;
  if(type === 'row') {
    subType = element.isHead ? 'head' : element.isFoot ? 'foot' : 'body';
  }
  if(type === 'column') {
    if(this.getLastColumn() === element) {
      this.setLastColumn(element.previous);
    }
  } else
  if(type === 'row') {
    if(this.getLastRow(subType) === element) {
      this.setLastRow(element.previous, subType);
    }
  }
  if(element.previous) {
    element.previous.next = element.next;
  }
  if(element.next) {
    element.next.previous = element.previous;
  }
  delete element.previous;
  delete element.next;
};

Sheet.prototype._init = function(config) {

  // Creates a <table> element that is wrapped into a <div>.
  // This way we are always able to correctly figure out the size of the table element
  // by querying the parent node.
  //
  // <div class="tjs-container" style="width: {desired-width}, height: {desired-height}">
  //   <table width="100%" height="100%">
  //    ...
  //   </table>
  // </div>

  // html container
  var eventBus = this._eventBus,
      container = createContainer(config),
      self = this;

  this._container = container;

  this._rootNode = document.createElement('table');

  assign(this._rootNode.style, {
    width: '100%'
  });

  container.appendChild(this._rootNode);

  this._head = document.createElement('thead');
  this._body = document.createElement('tbody');
  this._foot = document.createElement('tfoot');

  this._rootNode.appendChild(this._head);
  this._rootNode.appendChild(this._body);
  this._rootNode.appendChild(this._foot);

  this._lastColumn = null;
  this._lastRow = {
    head: null,
    body: null,
    foot: null
  };

  eventBus.on('table.init', function(event) {

    /**
     * An event indicating that the table is ready to be used.
     *
     * @memberOf Sheet
     *
     * @event sheet.init
     *
     * @type {Object}
     * @property {DOMElement} sheet the created table element
     * @property {Snap<SVGGroup>} viewport the direct parent of diagram elements and shapes
     */

    eventBus.fire('sheet.init', {sheet: self._rootNode});
  });

  eventBus.on('table.destroy', function() {

    var parent = self._container.parentNode;

    if (parent) {
      parent.removeChild(container);
    }

    eventBus.fire('sheet.destroy', { sheet: self._rootNode });
  });

};


/**
 * Returns the html element that encloses the
 * drawing canvas.
 *
 * @return {DOMNode}
 */
Sheet.prototype.getContainer = function() {
  return this._container;
};


///////////// add functionality ///////////////////////////////

Sheet.prototype._ensureValid = function(type, element) {
  if (!element.id) {
    throw new Error('element must have an id');
  }

  if (this._elementRegistry.get(element.id)) {
    throw new Error('element with id ' + element.id + ' already exists');
  }

  var requiredAttrs = REQUIRED_MODEL_ATTRS[type];

  var valid = every(requiredAttrs, function(attr) {
    return typeof element[attr] !== 'undefined';
  });

  if (!valid) {
    throw new Error(
      'must supply { ' + requiredAttrs.join(', ') + ' } with ' + type);
  }
};

/**
 * Adds an element to the sheet.
 *
 * This wires the parent <-> child relationship between the element and
 * a explicitly specified parent or an implicit root element.
 *
 * During add it emits the events
 *
 *  * <{type}.add> (element, parent)
 *  * <{type}.added> (element, gfx)
 *
 * Extensions may hook into these events to perform their magic.
 *
 * @param {String} type
 * @param {Object|djs.model.Base} element
 * @param {Object|djs.model.Base} [parent]
 *
 * @return {Object|djs.model.Base} the added element
 */
Sheet.prototype._addElement = function(type, element, parent) {

  element._type = type;

  var eventBus = this._eventBus,
      graphicsFactory = this._graphicsFactory;

  this._ensureValid(type, element);

  eventBus.fire(type + '.add', element);

  // create graphics

  element.parent = parent || this._rootNode;

  var gfx = graphicsFactory.create(type, element, element.parent);

  this._elementRegistry.add(element, gfx);

  // update its visual
  graphicsFactory.update(type, element, gfx);

  eventBus.fire(type + '.added', { element: element, gfx: gfx });

  return element;
};

Sheet.prototype.addRow = function(row) {
  this.addSiblings('row', row);

  var r = this._addElement('row', row, row.isHead ? this._head : row.isFoot ? this._foot : this._body);

  this._eventBus.fire('cells.add', r);

  // create new cells
  var self = this;
  forEach(this._elementRegistry.filter(function(el) {
    return el._type === 'column';
  }).sort(function(a, b) {
    var c = a;
    while(c = c.next) {
      if(c === b) {
        return -1;
      }
    }
    return 1;
  }), function(el) {
    self._addCell({row: r, column: el, id: 'cell_'+el.id+'_'+r.id});
  });

  this._eventBus.fire('cells.added', r);

  return r;
};

Sheet.prototype.addColumn = function(column) {

  this.addSiblings('column', column);

  var c = this._addElement('column', column);

  this._eventBus.fire('cells.add', c);

  // create new cells
  var self = this;
  forEach(this._elementRegistry.filter(function(el) {
    return el._type === 'row';
  }), function(el) {
    self._addCell({row: el, column: c, id: 'cell_'+c.id+'_'+el.id});
  });

  this._eventBus.fire('cells.added', c);

  return c;
};

Sheet.prototype._addCell = function(cell) {
  return this._addElement('cell', cell, this._elementRegistry.getGraphics(cell.row.id));
};

Sheet.prototype.setCellContent = function(config) {
  if(typeof config.column === 'object') {
    config.column = config.column.id;
  }
  if(typeof config.row === 'object') {
    config.row = config.row.id;
  }

  this._elementRegistry.get('cell_'+config.column+'_'+config.row).content = config.content;
  this._graphicsFactory.update('cell', this._elementRegistry.get('cell_'+config.column+'_'+config.row),
    this._elementRegistry.getGraphics('cell_'+config.column+'_'+config.row));
};

Sheet.prototype.getCellContent = function(config) {
  return this._elementRegistry.get('cell_'+config.column+'_'+config.row).content;
};


/**
 * Internal remove element
 */
Sheet.prototype._removeElement = function(element, type) {

  var elementRegistry = this._elementRegistry,
      graphicsFactory = this._graphicsFactory,
      eventBus = this._eventBus;

  element = elementRegistry.get(element.id || element);

  if (!element) {
    // element was removed already
    return;
  }

  eventBus.fire(type + '.remove', { element: element });

  graphicsFactory.remove(element);

  element.parent = null;

  elementRegistry.remove(element);

  eventBus.fire(type + '.removed', { element: element });

  return element;
};

Sheet.prototype.removeRow = function(element) {

  this.removeSiblings('row', element);

  var el = this._removeElement(element, 'row');

  // remove cells
  this._eventBus.fire('cells.remove', el);

  var self = this;
  forEach(this._elementRegistry.filter(function(el) {
    return el.row === element;
  }), function(el) {
    self._removeElement(el.id, 'cell');
  });

  this._eventBus.fire('cells.removed', el);

  return el;
};

Sheet.prototype.removeColumn = function(element) {

  this.removeSiblings('column', element);

  var el = this._removeElement(element, 'column');

  // remove cells
  this._eventBus.fire('cells.remove', el);

  var self = this;
  forEach(this._elementRegistry.filter(function(el) {
    return el.column === element;
  }), function(el) {
    self._removeElement(el.id, 'cell');
  });

  this._eventBus.fire('cells.removed', el);

  return el;
};

Sheet.prototype.getRootElement = function() {
  return this._rootNode;
};

Sheet.prototype.setRootElement = function(root) {
  this._rootNode = root;
};

},{"516":516,"517":517,"564":564,"567":567}],414:[function(_dereq_,module,exports){
module.exports = {
  __depends__: [ _dereq_(416) ],
  __init__: [ 'sheet' ],
  sheet: [ 'type', _dereq_(413) ],
  elementRegistry: [ 'type', _dereq_(411) ],
  elementFactory: ['type', _dereq_(410)],
  graphicsFactory: [ 'type', _dereq_(412) ],
  eventBus: [ 'type', _dereq_(433) ]
};

},{"410":410,"411":411,"412":412,"413":413,"416":416,"433":433}],415:[function(_dereq_,module,exports){
'use strict';

var forEach = _dereq_(517),
    colDistance = function colDistance(from, to) {
      var i = 0,
          current = from.column;
      while(current && current !== to.column) {
        current = current.next;
        i++;
      }
      return !current ? -1 : i;
    },
    rowDistance = function rowDistance(from, to) {
      var i = 0,
          current = from.row;
      while(current && current !== to.row) {
        current = current.next;
        i++;
      }
      return !current ? -1 : i;
    };

/**
 * The default renderer used for rows, columns and cells.
 *
 */
function Renderer(elementRegistry, eventBus) {
  this._elementRegistry = elementRegistry;
  this._eventBus = eventBus;
}

Renderer.$inject = [ 'elementRegistry', 'eventBus' ];

module.exports = Renderer;

Renderer.prototype.drawRow = function drawRow(gfx, data) {
  this._eventBus.fire('row.render', {
    gfx: gfx,
    data: data
  });
  return gfx;
};

Renderer.prototype.drawColumn = function drawColumn(gfx, data) {
  this._eventBus.fire('column.render', {
    gfx: gfx,
    data: data
  });
  return gfx;
};

Renderer.prototype.drawCell = function drawCell(gfx, data) {
  if(data.colspan) {
    gfx.setAttribute('colspan', data.colspan);
  }
  if(data.rowspan) {
    gfx.setAttribute('rowspan', data.rowspan);
  }

  gfx.setAttribute('style', '');

  // traverse backwards to find colspanned elements which might overlap us
  var cells = this._elementRegistry.filter(function(element) {
    return element._type === 'cell' && element.row === data.row;
  });

  forEach(cells, function(cell) {
    var d = colDistance(cell, data);
    if(cell.colspan && d > 0 && d < cell.colspan) {
      gfx.setAttribute('style', 'display: none;');
    }
  });

  // traverse backwards to find rowspanned elements which might overlap us
  cells = this._elementRegistry.filter(function(element) {
    return element._type === 'cell' && element.column === data.column;
  });

  forEach(cells, function(cell) {
    var d = rowDistance(cell, data);
    if(cell.rowspan && d > 0 && d < cell.rowspan) {
      gfx.setAttribute('style', 'display: none;');
    }
  });

  if(data.content) {
    if(typeof data.content === 'string' && !data.content.tagName) {
      gfx.childNodes[0].textContent = data.content;
    } else if(!!data.content.tagName) {
      gfx.childNodes[0].appendChild(data.content);
    }
  } else {
    gfx.childNodes[0].textContent = '';
  }

  this._eventBus.fire('cell.render', {
    gfx: gfx,
    data: data
  });

  return gfx;
};


},{"517":517}],416:[function(_dereq_,module,exports){
module.exports = {
  renderer: [ 'type', _dereq_(415) ]
};

},{"415":415}],417:[function(_dereq_,module,exports){
'use strict';



var domify = _dereq_(576),
    domClasses = _dereq_(574),
    assign = _dereq_(567),
    forEach = _dereq_(517);

/**
 * Offers the ability to create a combobox which is a combination of an
 *
 * <ul>
 *   <li>input</li>
 *   <li>dropdown</li>
 *   <li>typeahead</li>
 * </ul>
 *
 * @param {Object}   config
 * @param {String}   config.label
 *                            Text of the label which will be placed before the input field
 * @param {String[]} config.classNames
 *                            Array of Strings each identifying a class name of the comboBox container
 * @param {String[]} config.options
 *                            Array of Strings each specifying one option for the dropdown and typeahead feature
 * @param {String[]} config.dropdownClassNames
 *                            Array of Strings each identifying a class name of the dropdown container
 */
function ComboBox(config) {

  var self = this;
  var template = domify("<div>\r\n  <label></label>\r\n  <input tabindex=\"0\" />\r\n  <span class=\"caret\"></span>\r\n</div>\r\n");

  var label = config.label,
      classNames = config.classNames,
      options = config.options,
      dropdownClassNames = config.dropdownClassNames;

  this._dropdown = document.createElement('ul');
  this._template = template;
  this._dropdownOpen = false;

  this._listeners = {};

  // assign classes to the combobox template
  forEach(classNames, function(className) {
    domClasses(template).add(className);
  });

  // assign classes to the dropdown node
  forEach(dropdownClassNames, function(className) {
    domClasses(self._dropdown).add(className);
  });

  // create options
  forEach(options, function(option) {
    var node = document.createElement('li');
    node.setAttribute('tabindex', '1');
    node.textContent = option;
    self._dropdown.appendChild(node);
  });

  // set the label of the combobox
  template.querySelector('label').textContent = label + ':';


  // --- event listeners ---

  // toggles the dropdown on click on the caret symbol
  template.querySelector('span').addEventListener('click', function(evt) {
    self._toggleDropdown(options);
    evt.stopPropagation();
  });

  // closes the dropdown when it is open and the user clicks somewhere
  document.body.addEventListener('click', function(evt) {
    self._closeDropdown();
  });

  // updates the value of the input field when the user
  //   a. clicks on an option in the dropdown
  //   b. focuses an option in the dropdown via keyboard
  var update = function(evt) {
    self.setValue(evt.target.textContent);
  };
  this._dropdown.addEventListener('click', function(evt) {
    update(evt);

    // stop event propagation to prevent closing potential complex cells
    evt.stopPropagation();

    // still close the dropdown
    self._closeDropdown();
  });
  this._dropdown.addEventListener('focus', update, true);

  // keyboard behavior for dropdown and input field
  var keyboardFunction = function(evt) {
    var code = evt.which || evt.keyCode;

    // ESC
    if(code === 27) {
      self._closeDropdown();
    } else

    // ENTER
    if(code === 13) {
      self._toggleDropdown(options);
    } else

    // TAB, DOWN
    if(code === 9 || code === 40) {
      evt.preventDefault();
      self._focusNext(code === 9 && evt.shiftKey);
    } else

    // UP
    if(code === 38) {
      evt.preventDefault();
      self._focusNext(true);
    }

  };
  this._dropdown.addEventListener('keydown', keyboardFunction);
  this._template.querySelector('input').addEventListener('keydown', keyboardFunction);

  // when typing, show only options that match the typed text
  this._template.querySelector('input').addEventListener('input', function(evt) {
    var filteredList = options.filter(function(option) {
      return option.toLowerCase().indexOf(self._template.querySelector('input').value.toLowerCase()) !== -1;
    });
    self._openDropdown(filteredList);

    self._fireEvent('valueChanged', {
      newValue: self._template.querySelector('input').value
    });

  });

  return this;
}

/**
 * Focuses the next field in the dropdown. Opens the dropdown if it is closed.
 *
 * @param {boolean} reverse Focus previous field instead of next field
 */
ComboBox.prototype._focusNext = function(reverse) {

  if(!this._isDropdownOpen()) {
    this._openDropdown();
    return;
  }

  var element = document.activeElement;
  var focus;

  // get the element which should have focus
  if(element === this._template.querySelector('input')) {
    focus = this._dropdown[reverse ? 'lastChild' : 'firstChild'];
  } else if (element.parentNode === this._dropdown) {
    focus = element[reverse ? 'previousSibling' : 'nextSibling'];
  }

  // if the element is not displayed (due to text input),
  // select next visible element instead
  while(focus && focus.style.display === 'none') {
    focus = focus[reverse ? 'previousSibling' : 'nextSibling'];
  }

  // if no element can be selected (search reached end of list), focus input field
  if(!focus) {
    focus = this._template.querySelector('input');
  }
  focus.focus();
};

ComboBox.prototype._toggleDropdown = function(options) {
  if(this._isDropdownOpen()) {
    this._closeDropdown();
  } else {
    this._openDropdown(options);
  }
};

ComboBox.prototype._isDropdownOpen = function() {
  return this._dropdownOpen;
};

ComboBox.prototype._closeDropdown = function() {
  if(this._isDropdownOpen()) {
    this._dropdownOpen = false;
    domClasses(this._template).remove('expanded');
    this._dropdown.parentNode.removeChild(this._dropdown);
  }
};

/**
 *  Opens the dropdown menu for the input field.
 *
 *  @param {String[]} options Array of options which should be displayed in the dropdown
 *        If an option was specified in the constructor, but is not included in this list,
 *        it will be hidden via CSS. If the options array is empty, the dropdown is closed.
 */
ComboBox.prototype._openDropdown = function(options) {

  // close dropdown if options array is empty
  if(options && options.length === 0) {
    this._closeDropdown();
    return;
  }

  // update the display of options depending on options array
  forEach(this._dropdown.childNodes, function(child) {
    if(!options || options.indexOf(child.textContent) !== -1) {
      child.style.display = 'block';
    } else {
      child.style.display = 'none';
    }
  });

  // position the dropdown in relation to the position of the input element
  var input = this._template.querySelector('input');
  var e = input;
  var offset = {x:0,y:0};
  while (e)
  {
      offset.x += e.offsetLeft;
      offset.y += e.offsetTop;
      e = e.offsetParent;
  }

  assign(this._dropdown.style, {
    'display': 'block',
    'position': 'absolute',
    'top': (offset.y + input.clientHeight)+'px',
    'left': offset.x+'px',
    'width': input.clientWidth+'px',
  });
  document.body.appendChild(this._dropdown);
  this._dropdownOpen = true;

  domClasses(this._template).add('expanded');

};

ComboBox.prototype._fireEvent = function(evt, payload) {
  forEach(this._listeners[evt], function(listener) {
    listener(payload);
  });
};

ComboBox.prototype.setValue = function(newValue) {
  this._fireEvent('valueChanged', {
    oldValue: this._template.querySelector('input').value,
    newValue: newValue
  });
  this._template.querySelector('input').value = newValue;
};

ComboBox.prototype.getValue = function() {
  return this._template.querySelector('input').value;
};

ComboBox.prototype.getNode = function() {
  return this._template;
};

ComboBox.prototype.addEventListener = function(event, fct) {
  this._listeners[event] = this._listeners[event] || [];
  this._listeners[event].push(fct);
};

module.exports = ComboBox;

},{"517":517,"567":567,"574":574,"576":576}],418:[function(_dereq_,module,exports){
'use strict';

var assign = _dereq_(567),
    domClasses = _dereq_(574),
    domRemove = _dereq_(577);


/**
 *  A ComplexCell is a table cell that renders a template on click
 *  This can be used for cells containing complex data that can not be edited inline
 *
 *  In order to define a cell as complex, the cell must have a special property complex defining
 *  the configuration of the cell such as template or position:
 *
 *  Complex Property:
 *     - template: {DOMNode}
 *              HTML template of the complex content
 *     - className: {String} (optional, defaults to 'complex-cell')
 *              Defines the className which is set on the container of the complex cell
 *     - offset: {Object} (option, defaults to {x: 0, y: 0})
 *              Defines the offset of the template from the top left corner of the cell
 *
 *  Additional properties can be added to the complex object to retrieve them in events.
 *
 * Example:
 * cell.complex = {
 *      className: 'dmn-clauseexpression-setter',
 *      template: domify('<div>Hello World</div>'),
 *      type: 'mapping',
 *      offset: { x: 0, y: 10 }
 * };
 */
function ComplexCell(eventBus, elementRegistry) {

  this._eventBus = eventBus;
  this._elementRegistry = elementRegistry;

  this.setupListeners();
}


ComplexCell.prototype.setupListeners = function() {
  var self = this;

  // click on body closes open complex cells
  document.body.addEventListener('click', function(event) {
    if(!event.preventDialogClose) {
      self.close();
    }
  });

  // click on elements close potentially open complex cells
  // and open a complex cell at the position of the cell
  this._eventBus.on('element.click', function(event) {

    self.close();

    // set flag on original event to prevent closing the opened dialog
    // this only applies if the event has an original event (so it was generated
    // from a browser event that travels the dom tree)
    if(event.originalEvent) {
      event.originalEvent.preventDialogClose = true;
    }

    if(event.element && event.element.complex) {

      // calculate position based on the position of the cell
      var gfx = self._elementRegistry.getGraphics(event.element);

      // traverse the offset parent chain to find the offset sum
      var e = gfx;
      var offset = {x:0,y:0};
      while (e)
      {
          offset.x += e.offsetLeft;
          offset.y += e.offsetTop;
          e = e.offsetParent;
      }

      event.element.complex.position = {
        x: offset.x,
        y: offset.y
      };

      self.open(event.element.complex);
    }
  });
};

ComplexCell.prototype.close = function() {
  if(this._current) {
    this._eventBus.fire('complexCell.close', this._current);

    domRemove(this._current.container);
    this._current = null;
  }
};

ComplexCell.prototype.isOpen = function() {
  return !!this._current;
};

/**
 * Creates a container that holds the template
 */
ComplexCell.prototype._createContainer = function(className, position) {
  var container = document.createElement('div');

  assign(container.style, {
    position: 'absolute',
    left: position.x + 'px',
    top: position.y  + 'px',
    width: 'auto',
    height: 'auto'
  });

  // stop propagation of click events on the container to avoid closing the template
  container.addEventListener('click', function(event) {
    event.stopPropagation();
  });

  domClasses(container).add(className);

  return container;
};

ComplexCell.prototype.open = function(config) {
  var className = config.className || 'complex-cell',
      template = config.template;

  // make sure, only one complex cell dialog is open at a time
  if (this.isOpen()) {
    this.close();
  }

  // apply the optional offset configuration to the calculated position
  var position = {
    x: config.position.x + (config.offset && config.offset.x || 0),
    y: config.position.y + (config.offset && config.offset.y || 0)
  };

  var parent = document.body,

      // create the template container
      container = this._createContainer(className, position);

  // attach the template container to the document body
  this._attachContainer(container, parent);

  // attach the template node to the container
  this._attachContent(template, container);

  // save the currently open complex cell
  this._current = {
    container: container,
    config: config
  };

  this._eventBus.fire('complexCell.open', this._current);

  return this;
};

/**
 * Attaches the container to the DOM.
 *
 * @param {Object} container
 * @param {Object} parent
 */
ComplexCell.prototype._attachContainer = function(container, parent) {
  // Attach to DOM
  parent.appendChild(container);
};

/**
 * Attaches the content to the container.
 *
 * @param {Object} container
 * @param {Object} parent
 */
ComplexCell.prototype._attachContent = function(content, container) {
  container.appendChild(content);
};

ComplexCell.$inject = [ 'eventBus', 'elementRegistry' ];

module.exports = ComplexCell;

},{"567":567,"574":574,"577":577}],419:[function(_dereq_,module,exports){
'use strict';

module.exports = {
  __init__: [ 'complexCell' ],
  complexCell: [ 'type', _dereq_(418) ]
};

},{"418":418}],420:[function(_dereq_,module,exports){
'use strict';

var forEach = _dereq_(517),
    domDelegate = _dereq_(575);


var isPrimaryButton = _dereq_(438).isPrimaryButton;

/**
 * A plugin that provides interaction events for table elements.
 *
 * It emits the following events:
 *
 *   * element.hover
 *   * element.out
 *   * element.click
 *   * element.dblclick
 *   * element.mousedown
 *   * element.focus
 *   * element.blur
 *
 * Each event is a tuple { element, gfx, originalEvent }.
 *
 * Canceling the event via Event#preventDefault() prevents the original DOM operation.
 *
 * @param {EventBus} eventBus
 */
function InteractionEvents(eventBus, elementRegistry) {

  function fire(type, event) {
    var target = event.delegateTarget || event.target,
        gfx = target,
        element = elementRegistry.get(gfx),
        returnValue;

    if (!gfx || !element) {
      return;
    }

    returnValue = eventBus.fire(type, { element: element, gfx: gfx, originalEvent: event });

    if (returnValue === false) {
      event.stopPropagation();
      event.preventDefault();
    }
  }

  var handlers = {};

  function mouseHandler(type) {

    var fn = handlers[type];

    if (!fn) {
      fn = handlers[type] = function(event) {
        // only indicate left mouse button interactions and contextmenu
        if (isPrimaryButton(event) || type === 'element.contextmenu') {
          fire(type, event);
        }
      };
    }

    return fn;
  }

  var bindings = {
    mouseover: 'element.hover',
    mouseout: 'element.out',
    click: 'element.click',
    dblclick: 'element.dblclick',
    mousedown: 'element.mousedown',
    mouseup: 'element.mouseup',
    focus: 'element.focus',
    blur: 'element.blur',
    contextmenu: 'element.contextmenu'
  };

  var elementSelector = 'td';

  ///// event registration

  function isFocusEvent(event) {
    return event === 'focus' || event === 'blur';
  }

  function registerEvent(node, event, localEvent) {
    var handler = mouseHandler(localEvent);
    handler.$delegate = domDelegate.bind(node, elementSelector, event, handler, isFocusEvent(event));
  }

  function unregisterEvent(node, event, localEvent) {
    domDelegate.unbind(node, event, mouseHandler(localEvent).$delegate, isFocusEvent(event));
  }

  function registerEvents(node) {
    forEach(bindings, function(val, key) {
      registerEvent(node, key, val);
    });
  }

  function unregisterEvents(node) {
    forEach(bindings, function(val, key) {
      unregisterEvent(node, key, val);
    });
  }

  eventBus.on('sheet.destroy', function(event) {
    unregisterEvents(event.sheet);
  });

  eventBus.on('sheet.init', function(event) {
    registerEvents(event.sheet);
  });


  // API

  this.fire = fire;

  this.mouseHandler = mouseHandler;

  this.registerEvent = registerEvent;
  this.unregisterEvent = unregisterEvent;
}


InteractionEvents.$inject = [ 'eventBus', 'elementRegistry' ];

module.exports = InteractionEvents;


/**
 * An event indicating that the mouse hovered over an element
 *
 * @event element.hover
 *
 * @type {Object}
 * @property {djs.model.Base} element
 * @property {element} gfx
 * @property {Event} originalEvent
 */

/**
 * An event indicating that the mouse has left an element
 *
 * @event element.out
 *
 * @type {Object}
 * @property {djs.model.Base} element
 * @property {element} gfx
 * @property {Event} originalEvent
 */

/**
 * An event indicating that the mouse has clicked an element
 *
 * @event element.click
 *
 * @type {Object}
 * @property {djs.model.Base} element
 * @property {element} gfx
 * @property {Event} originalEvent
 */

/**
 * An event indicating that the mouse has double clicked an element
 *
 * @event element.dblclick
 *
 * @type {Object}
 * @property {djs.model.Base} element
 * @property {element} gfx
 * @property {Event} originalEvent
 */

/**
 * An event indicating that the mouse has gone down on an element.
 *
 * @event element.mousedown
 *
 * @type {Object}
 * @property {djs.model.Base} element
 * @property {element} gfx
 * @property {Event} originalEvent
 */

/**
 * An event indicating that the mouse has gone up on an element.
 *
 * @event element.mouseup
 *
 * @type {Object}
 * @property {djs.model.Base} element
 * @property {element} gfx
 * @property {Event} originalEvent
 */

/**
 * An event indicating that the element has gained focus.
 *
 * @event element.focus
 *
 * @type {Object}
 * @property {djs.model.Base} element
 * @property {element} gfx
 * @property {Event} originalEvent
 */

/**
 * An event indicating that the element has lost focus
 *
 * @event element.blur
 *
 * @type {Object}
 * @property {djs.model.Base} element
 * @property {element} gfx
 * @property {Event} originalEvent
 */

},{"438":438,"517":517,"575":575}],421:[function(_dereq_,module,exports){
module.exports = {
  __init__: [ 'interactionEvents' ],
  interactionEvents: [ 'type', _dereq_(420) ]
};

},{"420":420}],422:[function(_dereq_,module,exports){
'use strict';

function LineNumbers(eventBus, sheet) {

  this._sheet = sheet;
  this._utilityColumn = null;

  var self = this;

  eventBus.on('utilityColumn.added', function(event) {
    var column = event.column;
    self._utilityColumn = column;
    self.updateLineNumbers();
  });
  var updateFct = function() {
    self.updateLineNumbers();
  };
  eventBus.on([ 'cells.added', 'row.removed' ], updateFct);
}


LineNumbers.$inject = [ 'eventBus', 'sheet' ];

module.exports = LineNumbers;

LineNumbers.prototype.updateLineNumbers = function() {
  if(!this._utilityColumn || !this._sheet.getLastRow('body')) {
    // only render line numbers if utility column has been added
    return;
  }

  // find the first row
  var currentRow = this._sheet.getLastRow('body');
  while(currentRow.previous) {
    currentRow = currentRow.previous;
  }

  // update the row number for all rows
  var i = 1;
  while(currentRow) {
    this._sheet.setCellContent({
      row: currentRow,
      column: this._utilityColumn,
      content: i
    });
    i++;
    currentRow = currentRow.next;
  }
};

},{}],423:[function(_dereq_,module,exports){
module.exports = {
  __init__: [ 'lineNumbers' ],
  __depends__: [
    _dereq_(428)
  ],
  lineNumbers: [ 'type', _dereq_(422) ]
};

},{"422":422,"428":428}],424:[function(_dereq_,module,exports){
'use strict';

var domify = _dereq_(576);

/**
 * Adds a header to the table containing the table name
 *
 * @param {EventBus} eventBus
 */
function TableName(eventBus, sheet, tableName) {

  this.tableName = tableName;

  this.node = domify('<header><h3>'+this.tableName+'</h3></header');

  var self = this;
  eventBus.on('sheet.init', function(event) {
    sheet.getContainer().insertBefore(self.node, sheet.getRootElement());
    eventBus.fire('tableName.init', {node: self.node.querySelector('h3')});
  });
  eventBus.on('sheet.destroy', function(event) {
    sheet.getContainer().removeChild(self.node);
    eventBus.fire('tableName.destroy', {node: self.node.querySelector('h3')});
  });
}

TableName.$inject = [ 'eventBus', 'sheet', 'config.tableName' ];

module.exports = TableName;

TableName.prototype.setName = function(newName) {
  this.tableName = newName;
  this.node.querySelector('h3').textContent = newName;
};

TableName.prototype.getName = function() {
  return this.tableName;
};

TableName.prototype.getNode = function() {
  return this.node.querySelector('h3');
};

},{"576":576}],425:[function(_dereq_,module,exports){
'use strict';

/**
 * Adds a dedicated column to the table dedicated to hold controls and meta information
 *
 * @param {EventBus} eventBus
 */
function UtilityColumn(eventBus, sheet) {

  // add the row control row
  this.column = null;
  var self = this;
  eventBus.on('sheet.init', function(event) {

    eventBus.fire('utilityColumn.add', event);

    self.column = sheet.addColumn({
      id: 'utilityColumn'
    });

    eventBus.fire('utilityColumn.added', {column: self.column});
  });
  eventBus.on('sheet.destroy', function(event) {

    eventBus.fire('utilityColumn.destroy', {column: self.column});

    sheet.removeColumn({
      id: 'utilityColumn'
    });

    eventBus.fire('utilityColumn.destroyed', {column: self.column});
  });
}

UtilityColumn.$inject = [ 'eventBus', 'sheet' ];

module.exports = UtilityColumn;


UtilityColumn.prototype.getColumn = function() {
  return this.column;
};

},{}],426:[function(_dereq_,module,exports){
'use strict';

var domClasses = _dereq_(574);

function UtilityColumnRenderer(
    eventBus,
    utilityColumn) {

  eventBus.on('cell.render', function(event) {
    if(event.data.column === utilityColumn.getColumn() && !event.data.row.isFoot) {
      event.gfx.childNodes[0].textContent = event.data.content;
      domClasses(event.gfx).add(event.data.row.isHead ? 'hit' : 'number');
    }
  });
}

UtilityColumnRenderer.$inject = [
  'eventBus',
  'utilityColumn'
];

module.exports = UtilityColumnRenderer;

},{"574":574}],427:[function(_dereq_,module,exports){
'use strict';

var inherits = _dereq_(514);

var RuleProvider = _dereq_(434);

/**
 * LineNumber specific modeling rule
 */
function UtilityColumnRules(eventBus, utilityColumn) {
  RuleProvider.call(this, eventBus);

  this._utilityColumn = utilityColumn;
}

inherits(UtilityColumnRules, RuleProvider);

UtilityColumnRules.$inject = [ 'eventBus', 'utilityColumn' ];

module.exports = UtilityColumnRules;

UtilityColumnRules.prototype.init = function() {
  var self = this;
  this.addRule('cell.edit', function(context) {
    if(context.column === self._utilityColumn.getColumn()) {
      return false;
    }
  });

};

},{"434":434,"514":514}],428:[function(_dereq_,module,exports){
module.exports = {
  __init__: [ 'utilityColumn', 'utilityColumnRules', 'utilityColumnRenderer' ],
  __depends__: [
    _dereq_(436)
  ],
  utilityColumn: [ 'type', _dereq_(425) ],
  utilityColumnRules: [ 'type', _dereq_(427) ],
  utilityColumnRenderer: [ 'type', _dereq_(426) ]
};

},{"425":425,"426":426,"427":427,"436":436}],429:[function(_dereq_,module,exports){
'use strict';

var assign = _dereq_(567),
    inherits = _dereq_(514);

function Base() {
  Object.defineProperty(this, 'businessObject', {
    writable: true
  });
}

function Table() {
  Base.call(this);
}

inherits(Table, Base);

function Row() {
  Base.call(this);
}

inherits(Row, Base);

function Column() {
  Base.call(this);
}

inherits(Column, Base);


var types = {
  table: Table,
  row: Row,
  column: Column
};

/**
 * Creates a new model element of the specified type
 *
 * @method create
 *
 * @example
 *
 * var shape1 = Model.create('shape', { x: 10, y: 10, width: 100, height: 100 });
 * var shape2 = Model.create('shape', { x: 210, y: 210, width: 100, height: 100 });
 *
 * var connection = Model.create('connection', { waypoints: [ { x: 110, y: 55 }, {x: 210, y: 55 } ] });
 *
 * @param  {String} type lower-cased model name
 * @param  {Object} attrs attributes to initialize the new model instance with
 *
 * @return {Base} the new model instance
 */
module.exports.create = function(type, attrs) {
  var Type = types[type];
  if (!Type) {
    throw new Error('unknown type: <' + type + '>');
  }
  return assign(new Type(), attrs);
};


module.exports.Table = Table;
module.exports.Row = Row;
module.exports.Column = Column;

},{"514":514,"567":567}],430:[function(_dereq_,module,exports){
arguments[4][28][0].apply(exports,arguments)
},{"28":28,"444":444,"496":496,"497":497,"499":499}],431:[function(_dereq_,module,exports){
'use strict';

var unique = _dereq_(443),
    isArray = _dereq_(496),
    assign = _dereq_(502);

var InternalEvent = _dereq_(433).Event;


/**
 * A service that offers un- and redoable execution of commands.
 *
 * The command stack is responsible for executing modeling actions
 * in a un- and redoable manner. To do this it delegates the actual
 * command execution to {@link CommandHandler}s.
 *
 * Command handlers provide {@link CommandHandler#execute(ctx)} and
 * {@link CommandHandler#revert(ctx)} methods to un- and redo a command
 * identified by a command context.
 *
 *
 * ## Life-Cycle events
 *
 * In the process the command stack fires a number of life-cycle events
 * that other components to participate in the command execution.
 *
 *    * preExecute
 *    * execute
 *    * executed
 *    * postExecute
 *    * revert
 *    * reverted
 *
 * A special event is used for validating, whether a command can be
 * performed prior to its execution.
 *
 *    * canExecute
 *
 * Each of the events is fired as `commandStack.{eventName}` and
 * `commandStack.{commandName}.{eventName}`, respectively. This gives
 * components fine grained control on where to hook into.
 *
 * The event object fired transports `command`, the name of the
 * command and `context`, the command context.
 *
 *
 * ## Creating Command Handlers
 *
 * Command handlers should provide the {@link CommandHandler#execute(ctx)}
 * and {@link CommandHandler#revert(ctx)} methods to implement
 * redoing and undoing of a command. They must ensure undo is performed
 * properly in order not to break the undo chain.
 *
 * Command handlers may execute other modeling operations (and thus
 * commands) in their `preExecute` and `postExecute` phases. The command
 * stack will properly group all commands together into a logical unit
 * that may be re- and undone atomically.
 *
 * Command handlers must not execute other commands from within their
 * core implementation (`execute`, `revert`).
 *
 *
 * ## Change Tracking
 *
 * During the execution of the CommandStack it will keep track of all
 * elements that have been touched during the command's execution.
 *
 * At the end of the CommandStack execution it will notify interested
 * components via an 'elements.changed' event with all the dirty
 * elements.
 *
 * The event can be picked up by components that are interested in the fact
 * that elements have been changed. One use case for this is updating
 * their graphical representation after moving / resizing or deletion.
 *
 *
 * @param {EventBus} eventBus
 * @param {Injector} injector
 */
function CommandStack(eventBus, injector) {

  /**
   * A map of all registered command handlers.
   *
   * @type {Object}
   */
  this._handlerMap = {};

  /**
   * A stack containing all re/undoable actions on the diagram
   *
   * @type {Array<Object>}
   */
  this._stack = [];

  /**
   * The current index on the stack
   *
   * @type {Number}
   */
  this._stackIdx = -1;

  /**
   * Current active commandStack execution
   *
   * @type {Object}
   */
  this._currentExecution = {
    actions: [],
    dirty: []
  };


  this._injector = injector;
  this._eventBus = eventBus;

  this._uid = 1;
}

CommandStack.$inject = [ 'eventBus', 'injector' ];

module.exports = CommandStack;


/**
 * Execute a command
 *
 * @param {String} command the command to execute
 * @param {Object} context the environment to execute the command in
 */
CommandStack.prototype.execute = function(command, context) {
  if (!command) {
    throw new Error('command required');
  }

  var action = { command: command, context: context };

  this._pushAction(action);
  this._internalExecute(action);
  this._popAction(action);
};


/**
 * Ask whether a given command can be executed.
 *
 * Implementors may hook into the mechanism on two ways:
 *
 *   * in event listeners:
 *
 *     Users may prevent the execution via an event listener.
 *     It must prevent the default action for `commandStack.(<command>.)canExecute` events.
 *
 *   * in command handlers:
 *
 *     If the method {@link CommandHandler#canExecute} is implemented in a handler
 *     it will be called to figure out whether the execution is allowed.
 *
 * @param  {String} command the command to execute
 * @param  {Object} context the environment to execute the command in
 *
 * @return {Boolean} true if the command can be executed
 */
CommandStack.prototype.canExecute = function(command, context) {

  var action = { command: command, context: context };

  var handler = this._getHandler(command);

  if (!handler) {
    return false;
  }

  var result = this._fire(command, 'canExecute', action);

  // handler#canExecute will only be called if no listener
  // decided on a result already
  if (result === undefined && handler.canExecute) {
    result = handler.canExecute(context);
  }

  return result;
};


/**
 * Clear the command stack, erasing all undo / redo history
 */
CommandStack.prototype.clear = function() {
  this._stack.length = 0;
  this._stackIdx = -1;

  this._fire('changed');
};


/**
 * Undo last command(s)
 */
CommandStack.prototype.undo = function() {
  var action = this._getUndoAction(),
      next;

  if (action) {
    this._pushAction(action);

    while (action) {
      this._internalUndo(action);
      next = this._getUndoAction();

      if (!next || next.id !== action.id) {
        break;
      }

      action = next;
    }

    this._popAction();
  }
};


/**
 * Redo last command(s)
 */
CommandStack.prototype.redo = function() {
  var action = this._getRedoAction(),
      next;

  if (action) {
    this._pushAction(action);

    while (action) {
      this._internalExecute(action, true);
      next = this._getRedoAction();

      if (!next || next.id !== action.id) {
        break;
      }

      action = next;
    }

    this._popAction();
  }
};


/**
 * Register a handler instance with the command stack
 *
 * @param {String} command
 * @param {CommandHandler} handler
 */
CommandStack.prototype.register = function(command, handler) {
  this._setHandler(command, handler);
};


/**
 * Register a handler type with the command stack
 * by instantiating it and injecting its dependencies.
 *
 * @param {String} command
 * @param {Function} a constructor for a {@link CommandHandler}
 */
CommandStack.prototype.registerHandler = function(command, handlerCls) {

  if (!command || !handlerCls) {
    throw new Error('command and handlerCls must be defined');
  }

  var handler = this._injector.instantiate(handlerCls);
  this.register(command, handler);
};

CommandStack.prototype.canUndo = function() {
  return !!this._getUndoAction();
};

CommandStack.prototype.canRedo = function() {
  return !!this._getRedoAction();
};

////// stack access  //////////////////////////////////////

CommandStack.prototype._getRedoAction = function() {
  return this._stack[this._stackIdx + 1];
};


CommandStack.prototype._getUndoAction = function() {
  return this._stack[this._stackIdx];
};


////// internal functionality /////////////////////////////

CommandStack.prototype._internalUndo = function(action) {
  var command = action.command,
      context = action.context;

  var handler = this._getHandler(command);

  this._fire(command, 'revert', action);

  this._markDirty(handler.revert(context));

  this._revertedAction(action);

  this._fire(command, 'reverted', action);
};


CommandStack.prototype._fire = function(command, qualifier, event) {
  if (arguments.length < 3) {
    event = qualifier;
    qualifier = null;
  }

  var names = qualifier ? [ command + '.' + qualifier, qualifier ] : [ command ],
      i, name, result;

  event = assign(new InternalEvent(), event);

  for (i = 0; !!(name = names[i]); i++) {
    result = this._eventBus.fire('commandStack.' + name, event);

    if (event.cancelBubble) {
      break;
    }
  }

  return result;
};

CommandStack.prototype._createId = function() {
  return this._uid++;
};


CommandStack.prototype._internalExecute = function(action, redo) {
  var command = action.command,
      context = action.context;

  var handler = this._getHandler(command);

  if (!handler) {
    throw new Error('no command handler registered for <' + command + '>');
  }

  this._pushAction(action);

  if (!redo) {
    this._fire(command, 'preExecute', action);

    if (handler.preExecute) {
      handler.preExecute(context);
    }
  }

  this._fire(command, 'execute', action);

  // execute
  this._markDirty(handler.execute(context));

  // log to stack
  this._executedAction(action, redo);

  this._fire(command, 'executed', action);

  if (!redo) {
    if (handler.postExecute) {
      handler.postExecute(context);
    }

    this._fire(command, 'postExecute', action);
  }

  this._popAction(action);
};


CommandStack.prototype._pushAction = function(action) {

  var execution = this._currentExecution,
      actions = execution.actions;

  var baseAction = actions[0];

  if (!action.id) {
    action.id = (baseAction && baseAction.id) || this._createId();
  }

  actions.push(action);
};


CommandStack.prototype._popAction = function() {
  var execution = this._currentExecution,
      actions = execution.actions,
      dirty = execution.dirty;

  actions.pop();

  if (!actions.length) {
    this._eventBus.fire('elements.changed', { elements: unique(dirty) });

    dirty.length = 0;

    this._fire('changed');
  }
};


CommandStack.prototype._markDirty = function(elements) {
  var execution = this._currentExecution;

  if (!elements) {
    return;
  }

  elements = isArray(elements) ? elements : [ elements ];

  execution.dirty = execution.dirty.concat(elements);
};


CommandStack.prototype._executedAction = function(action, redo) {
  var stackIdx = ++this._stackIdx;

  if (!redo) {
    this._stack.splice(stackIdx, this._stack.length, action);
  }
};


CommandStack.prototype._revertedAction = function(action) {
  this._stackIdx--;
};


CommandStack.prototype._getHandler = function(command) {
  return this._handlerMap[command];
};

CommandStack.prototype._setHandler = function(command, handler) {
  if (!command || !handler) {
    throw new Error('command and handler required');
  }

  if (this._handlerMap[command]) {
    throw new Error('overriding handler for command <' + command + '>');
  }

  this._handlerMap[command] = handler;
};

},{"433":433,"443":443,"496":496,"502":502}],432:[function(_dereq_,module,exports){
module.exports = {
  commandStack: [ 'type', _dereq_(431) ]
};

},{"431":431}],433:[function(_dereq_,module,exports){
'use strict';

var isFunction = _dereq_(497),
    isArray = _dereq_(496),
    isNumber = _dereq_(499),
    assign = _dereq_(502);

var DEFAULT_PRIORITY = 1000;


/**
 * A general purpose event bus.
 *
 * This component is used to communicate across a diagram instance.
 * Other parts of a diagram can use it to listen to and broadcast events.
 *
 *
 * ## Registering for Events
 *
 * The event bus provides the {@link EventBus#on} and {@link EventBus#once}
 * methods to register for events. {@link EventBus#off} can be used to
 * remove event registrations. Listeners receive an instance of {@link Event}
 * as the first argument. It allows them to hook into the event execution.
 *
 * ```javascript
 *
 * // listen for event
 * eventBus.on('foo', function(event) {
 *
 *   // access event type
 *   event.type; // 'foo'
 *
 *   // stop propagation to other listeners
 *   event.stopPropagation();
 *
 *   // prevent event default
 *   event.preventDefault();
 * });
 *
 * // listen for event with custom payload
 * eventBus.on('bar', function(event, payload) {
 *   console.log(payload);
 * });
 *
 * // listen for event returning value
 * eventBus.on('foobar', function(event) {
 *
 *   // stop event propagation + prevent default
 *   return false;
 *
 *   // stop event propagation + return custom result
 *   return {
 *     complex: 'listening result'
 *   };
 * });
 *
 *
 * // listen with custom priority (default=1000, higher is better)
 * eventBus.on('priorityfoo', 1500, function(event) {
 *   console.log('invoked first!');
 * });
 * ```
 *
 *
 * ## Emitting Events
 *
 * Events can be emitted via the event bus using {@link EventBus#fire}.
 *
 * ```javascript
 *
 * // false indicates that the default action
 * // was prevented by listeners
 * if (eventBus.fire('foo') === false) {
 *   console.log('default has been prevented!');
 * };
 *
 *
 * // custom args + return value listener
 * eventBus.on('sum', function(event, a, b) {
 *   return a + b;
 * });
 *
 * // you can pass custom arguments + retrieve result values.
 * var sum = eventBus.fire('sum', 1, 2);
 * console.log(sum); // 3
 * ```
 */
function EventBus() {
  this._listeners = {};

  // cleanup on destroy

  var self = this;

  // destroy on lowest priority to allow
  // message passing until the bitter end
  this.on('diagram.destroy', 1, function() {
    self._listeners = null;
  });
}

module.exports = EventBus;


/**
 * Register an event listener for events with the given name.
 *
 * The callback will be invoked with `event, ...additionalArguments`
 * that have been passed to {@link EventBus#fire}.
 *
 * Returning false from a listener will prevent the events default action
 * (if any is specified). To stop an event from being processed further in
 * other listeners execute {@link Event#stopPropagation}.
 *
 * Returning anything but `undefined` from a listener will stop the listener propagation.
 *
 * @param {String|Array<String>} events
 * @param {Number} [priority=1000] the priority in which this listener is called, larger is higher
 * @param {Function} callback
 */
EventBus.prototype.on = function(events, priority, callback) {

  events = isArray(events) ? events : [ events ];

  if (isFunction(priority)) {
    callback = priority;
    priority = DEFAULT_PRIORITY;
  }

  if (!isNumber(priority)) {
    throw new Error('priority must be a number');
  }

  var self = this,
      listener = { priority: priority, callback: callback };

  events.forEach(function(e) {
    self._addListener(e, listener);
  });
};


/**
 * Register an event listener that is executed only once.
 *
 * @param {String} event the event name to register for
 * @param {Function} callback the callback to execute
 */
EventBus.prototype.once = function(event, callback) {

  var self = this;

  function wrappedCallback() {
    callback.apply(self, arguments);
    self.off(event, wrappedCallback);
  }

  this.on(event, wrappedCallback);
};


/**
 * Removes event listeners by event and callback.
 *
 * If no callback is given, all listeners for a given event name are being removed.
 *
 * @param {String} event
 * @param {Function} [callback]
 */
EventBus.prototype.off = function(event, callback) {
  var listeners = this._getListeners(event),
      listener, idx;

  if (callback) {

    // move through listeners from back to front
    // and remove matching listeners
    for (idx = listeners.length - 1; !!(listener = listeners[idx]); idx--) {
      if (listener.callback === callback) {
        listeners.splice(idx, 1);
      }
    }
  } else {
    // clear listeners
    listeners.length = 0;
  }
};


/**
 * Fires a named event.
 *
 * @example
 *
 * // fire event by name
 * events.fire('foo');
 *
 * // fire event object with nested type
 * var event = { type: 'foo' };
 * events.fire(event);
 *
 * // fire event with explicit type
 * var event = { x: 10, y: 20 };
 * events.fire('element.moved', event);
 *
 * // pass additional arguments to the event
 * events.on('foo', function(event, bar) {
 *   alert(bar);
 * });
 *
 * events.fire({ type: 'foo' }, 'I am bar!');
 *
 * @param {String} [name] the optional event name
 * @param {Object} [event] the event object
 * @param {...Object} additional arguments to be passed to the callback functions
 *
 * @return {Boolean} the events return value, if specified or false if the
 *                   default action was prevented by listeners
 */
EventBus.prototype.fire = function(type, data) {

  var event,
      originalType,
      listeners, idx, listener,
      returnValue,
      args;

  args = Array.prototype.slice.call(arguments);

  if (typeof type === 'object') {
    event = type;
    type = event.type;
  }

  if (!type) {
    throw new Error('no event type specified');
  }

  listeners = this._listeners[type];

  if (!listeners) {
    return;
  }

  // we make sure we fire instances of our home made
  // events here. We wrap them only once, though
  if (data instanceof Event) {
    // we are fine, we alread have an event
    event = data;
  } else {
    event = new Event();
    event.init(data);
  }

  // ensure we pass the event as the first parameter
  args[0] = event;

  // original event type (in case we delegate)
  originalType = event.type;

  try {

    // update event type before delegation
    if (type !== originalType) {
      event.type = type;
    }

    for (idx = 0; !!(listener = listeners[idx]); idx++) {

      // handle stopped propagation
      if (event.cancelBubble) {
        break;
      }

      try {
        // returning false prevents the default action
        returnValue = event.returnValue = listener.callback.apply(null, args);

        // stop propagation on return value
        if (returnValue !== undefined) {
          event.stopPropagation();
        }

        // prevent default on return false
        if (returnValue === false) {
          event.preventDefault();
        }
      } catch (e) {
        if (!this.handleError(e)) {
          console.error('unhandled error in event listener');
          console.error(e.stack);

          throw e;
        }
      }
    }
  } finally {
    // reset event type after delegation
    if (type !== originalType) {
      event.type = originalType;
    }
  }

  // set the return value to false if the event default
  // got prevented and no other return value exists
  if (returnValue === undefined && event.defaultPrevented) {
    returnValue = false;
  }

  return returnValue;
};


EventBus.prototype.handleError = function(error) {
  return this.fire('error', { error: error }) === false;
};


/*
 * Add new listener with a certain priority to the list
 * of listeners (for the given event).
 *
 * The semantics of listener registration / listener execution are
 * first register, first serve: New listeners will always be inserted
 * after existing listeners with the same priority.
 *
 * Example: Inserting two listeners with priority 1000 and 1300
 *
 *    * before: [ 1500, 1500, 1000, 1000 ]
 *    * after: [ 1500, 1500, (new=1300), 1000, 1000, (new=1000) ]
 *
 * @param {String} event
 * @param {Object} listener { priority, callback }
 */
EventBus.prototype._addListener = function(event, newListener) {

  var listeners = this._getListeners(event),
      existingListener,
      idx;

  // ensure we order listeners by priority from
  // 0 (high) to n > 0 (low)
  for (idx = 0; !!(existingListener = listeners[idx]); idx++) {
    if (existingListener.priority < newListener.priority) {

      // prepend newListener at before existingListener
      listeners.splice(idx, 0, newListener);
      return;
    }
  }

  listeners.push(newListener);
};


EventBus.prototype._getListeners = function(name) {
  var listeners = this._listeners[name];

  if (!listeners) {
    this._listeners[name] = listeners = [];
  }

  return listeners;
};


/**
 * A event that is emitted via the event bus.
 */
function Event() { }

module.exports.Event = Event;

Event.prototype.stopPropagation = function() {
  this.cancelBubble = true;
};

Event.prototype.preventDefault = function() {
  this.defaultPrevented = true;
};

Event.prototype.init = function(data) {
  assign(this, data || {});
};

},{"496":496,"497":497,"499":499,"502":502}],434:[function(_dereq_,module,exports){
arguments[4][29][0].apply(exports,arguments)
},{"29":29,"430":430,"440":440}],435:[function(_dereq_,module,exports){
'use strict';

/**
 * A service that provides rules for certain diagram actions.
 *
 * @param {CommandStack} commandStack
 */
function Rules(commandStack) {
  this._commandStack = commandStack;
}

Rules.$inject = [ 'commandStack' ];

module.exports = Rules;


/**
 * This method can be queried to ask whether certain modeling actions
 * are allowed or not.
 *
 * @param  {String} action the action to be checked
 * @param  {Object} [context] the context to check the action in
 *
 * @return {Boolean} returns true, false or null depending on whether the
 *                   operation is allowed, not allowed or should be ignored.
 */
Rules.prototype.allowed = function(action, context) {
  var allowed = this._commandStack.canExecute(action, context);

  // map undefined to true, i.e. no rules
  return allowed === undefined ? true : allowed;
};
},{}],436:[function(_dereq_,module,exports){
module.exports = {
  __depends__: [ _dereq_(432) ],
  __init__: [ 'rules' ],
  rules: [ 'type', _dereq_(435) ]
};

},{"432":432,"435":435}],437:[function(_dereq_,module,exports){
'use strict';

function __preventDefault(event) {
  return event && event.preventDefault();
}

function __stopPropagation(event, immediate) {
  if (!event) {
    return;
  }

  if (event.stopPropagation) {
    event.stopPropagation();
  }

  if (immediate && event.stopImmediatePropagation) {
    event.stopImmediatePropagation();
  }
}


function getOriginal(event) {
  return event.originalEvent || event.srcEvent;
}

module.exports.getOriginal = getOriginal;


function stopEvent(event, immediate) {
  stopPropagation(event, immediate);
  preventDefault(event);
}

module.exports.stopEvent = stopEvent;


function preventDefault(event) {
  __preventDefault(event);
  __preventDefault(getOriginal(event));
}

module.exports.preventDefault = preventDefault;


function stopPropagation(event, immediate) {
  __stopPropagation(event, immediate);
  __stopPropagation(getOriginal(event), immediate);
}

module.exports.stopPropagation = stopPropagation;


function toPoint(event) {

  if (event.pointers && event.pointers.length) {
    event = event.pointers[0];
  }

  if (event.touches && event.touches.length) {
    event = event.touches[0];
  }

  return event ? {
    x: event.clientX,
    y: event.clientY
  } : null;
}

module.exports.toPoint = toPoint;

},{}],438:[function(_dereq_,module,exports){
'use strict';

var getOriginalEvent = _dereq_(437).getOriginal;

var isMac = _dereq_(439).isMac;


function isPrimaryButton(event) {
  // button === 0 -> left áka primary mouse button
  return !(getOriginalEvent(event) || event).button;
}

module.exports.isPrimaryButton = isPrimaryButton;

module.exports.isMac = isMac;

module.exports.hasPrimaryModifier = function(event) {
  var originalEvent = getOriginalEvent(event) || event;

  if (!isPrimaryButton(event)) {
    return false;
  }

  // Use alt as primary modifier key for mac OS
  if (isMac()) {
    return originalEvent.altKey;
  } else {
    return originalEvent.ctrlKey;
  }
};


module.exports.hasSecondaryModifier = function(event) {
  var originalEvent = getOriginalEvent(event) || event;

  return isPrimaryButton(event) && originalEvent.shiftKey;
};

},{"437":437,"439":439}],439:[function(_dereq_,module,exports){
'use strict';

module.exports.isMac = function isMac() {
  return (/mac/i).test(navigator.platform);
};
},{}],440:[function(_dereq_,module,exports){
arguments[4][31][0].apply(exports,arguments)
},{"31":31}],441:[function(_dereq_,module,exports){
arguments[4][97][0].apply(exports,arguments)
},{"97":97}],442:[function(_dereq_,module,exports){
var baseCallback = _dereq_(451),
    baseUniq = _dereq_(468),
    isIterateeCall = _dereq_(486),
    sortedUniq = _dereq_(492);

/**
 * Creates a duplicate-free version of an array, using
 * [`SameValueZero`](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-samevaluezero)
 * for equality comparisons, in which only the first occurence of each element
 * is kept. Providing `true` for `isSorted` performs a faster search algorithm
 * for sorted arrays. If an iteratee function is provided it is invoked for
 * each element in the array to generate the criterion by which uniqueness
 * is computed. The `iteratee` is bound to `thisArg` and invoked with three
 * arguments: (value, index, array).
 *
 * If a property name is provided for `iteratee` the created `_.property`
 * style callback returns the property value of the given element.
 *
 * If a value is also provided for `thisArg` the created `_.matchesProperty`
 * style callback returns `true` for elements that have a matching property
 * value, else `false`.
 *
 * If an object is provided for `iteratee` the created `_.matches` style
 * callback returns `true` for elements that have the properties of the given
 * object, else `false`.
 *
 * @static
 * @memberOf _
 * @alias unique
 * @category Array
 * @param {Array} array The array to inspect.
 * @param {boolean} [isSorted] Specify the array is sorted.
 * @param {Function|Object|string} [iteratee] The function invoked per iteration.
 * @param {*} [thisArg] The `this` binding of `iteratee`.
 * @returns {Array} Returns the new duplicate-value-free array.
 * @example
 *
 * _.uniq([2, 1, 2]);
 * // => [2, 1]
 *
 * // using `isSorted`
 * _.uniq([1, 1, 2], true);
 * // => [1, 2]
 *
 * // using an iteratee function
 * _.uniq([1, 2.5, 1.5, 2], function(n) {
 *   return this.floor(n);
 * }, Math);
 * // => [1, 2.5]
 *
 * // using the `_.property` callback shorthand
 * _.uniq([{ 'x': 1 }, { 'x': 2 }, { 'x': 1 }], 'x');
 * // => [{ 'x': 1 }, { 'x': 2 }]
 */
function uniq(array, isSorted, iteratee, thisArg) {
  var length = array ? array.length : 0;
  if (!length) {
    return [];
  }
  if (isSorted != null && typeof isSorted != 'boolean') {
    thisArg = iteratee;
    iteratee = isIterateeCall(array, isSorted, thisArg) ? null : isSorted;
    isSorted = false;
  }
  iteratee = iteratee == null ? iteratee : baseCallback(iteratee, thisArg, 3);
  return (isSorted)
    ? sortedUniq(array, iteratee)
    : baseUniq(array, iteratee);
}

module.exports = uniq;

},{"451":451,"468":468,"486":486,"492":492}],443:[function(_dereq_,module,exports){
module.exports = _dereq_(442);

},{"442":442}],444:[function(_dereq_,module,exports){
arguments[4][32][0].apply(exports,arguments)
},{"32":32,"447":447,"453":453,"476":476}],445:[function(_dereq_,module,exports){
arguments[4][66][0].apply(exports,arguments)
},{"66":66}],446:[function(_dereq_,module,exports){
(function (global){
var cachePush = _dereq_(471),
    getNative = _dereq_(482);

/** Native method references. */
var Set = getNative(global, 'Set');

/* Native method references for those with the same name as other `lodash` methods. */
var nativeCreate = getNative(Object, 'create');

/**
 *
 * Creates a cache object to store unique values.
 *
 * @private
 * @param {Array} [values] The values to cache.
 */
function SetCache(values) {
  var length = values ? values.length : 0;

  this.data = { 'hash': nativeCreate(null), 'set': new Set };
  while (length--) {
    this.push(values[length]);
  }
}

// Add functions to the `Set` cache.
SetCache.prototype.push = cachePush;

module.exports = SetCache;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"471":471,"482":482}],447:[function(_dereq_,module,exports){
arguments[4][33][0].apply(exports,arguments)
},{"33":33}],448:[function(_dereq_,module,exports){
arguments[4][109][0].apply(exports,arguments)
},{"109":109}],449:[function(_dereq_,module,exports){
arguments[4][67][0].apply(exports,arguments)
},{"503":503,"67":67}],450:[function(_dereq_,module,exports){
arguments[4][68][0].apply(exports,arguments)
},{"452":452,"503":503,"68":68}],451:[function(_dereq_,module,exports){
arguments[4][112][0].apply(exports,arguments)
},{"112":112,"462":462,"463":463,"469":469,"508":508,"509":509}],452:[function(_dereq_,module,exports){
arguments[4][69][0].apply(exports,arguments)
},{"69":69}],453:[function(_dereq_,module,exports){
arguments[4][34][0].apply(exports,arguments)
},{"34":34,"455":455,"473":473}],454:[function(_dereq_,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"35":35,"474":474}],455:[function(_dereq_,module,exports){
arguments[4][36][0].apply(exports,arguments)
},{"36":36,"454":454,"503":503}],456:[function(_dereq_,module,exports){
arguments[4][121][0].apply(exports,arguments)
},{"121":121,"493":493}],457:[function(_dereq_,module,exports){
arguments[4][343][0].apply(exports,arguments)
},{"343":343,"483":483}],458:[function(_dereq_,module,exports){
arguments[4][122][0].apply(exports,arguments)
},{"122":122,"459":459,"489":489,"500":500}],459:[function(_dereq_,module,exports){
arguments[4][123][0].apply(exports,arguments)
},{"123":123,"477":477,"478":478,"479":479,"496":496,"501":501}],460:[function(_dereq_,module,exports){
arguments[4][37][0].apply(exports,arguments)
},{"37":37}],461:[function(_dereq_,module,exports){
arguments[4][124][0].apply(exports,arguments)
},{"124":124,"458":458,"493":493}],462:[function(_dereq_,module,exports){
arguments[4][126][0].apply(exports,arguments)
},{"126":126,"461":461,"481":481,"493":493}],463:[function(_dereq_,module,exports){
arguments[4][127][0].apply(exports,arguments)
},{"127":127,"441":441,"456":456,"458":458,"466":466,"487":487,"490":490,"493":493,"494":494,"496":496}],464:[function(_dereq_,module,exports){
arguments[4][38][0].apply(exports,arguments)
},{"38":38}],465:[function(_dereq_,module,exports){
arguments[4][129][0].apply(exports,arguments)
},{"129":129,"456":456,"494":494}],466:[function(_dereq_,module,exports){
arguments[4][131][0].apply(exports,arguments)
},{"131":131}],467:[function(_dereq_,module,exports){
arguments[4][39][0].apply(exports,arguments)
},{"39":39}],468:[function(_dereq_,module,exports){
var baseIndexOf = _dereq_(457),
    cacheIndexOf = _dereq_(470),
    createCache = _dereq_(475);

/**
 * The base implementation of `_.uniq` without support for callback shorthands
 * and `this` binding.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {Function} [iteratee] The function invoked per iteration.
 * @returns {Array} Returns the new duplicate-value-free array.
 */
function baseUniq(array, iteratee) {
  var index = -1,
      indexOf = baseIndexOf,
      length = array.length,
      isCommon = true,
      isLarge = isCommon && length >= 200,
      seen = isLarge ? createCache() : null,
      result = [];

  if (seen) {
    indexOf = cacheIndexOf;
    isCommon = false;
  } else {
    isLarge = false;
    seen = iteratee ? [] : result;
  }
  outer:
  while (++index < length) {
    var value = array[index],
        computed = iteratee ? iteratee(value, index, array) : value;

    if (isCommon && value === value) {
      var seenIndex = seen.length;
      while (seenIndex--) {
        if (seen[seenIndex] === computed) {
          continue outer;
        }
      }
      if (iteratee) {
        seen.push(computed);
      }
      result.push(value);
    }
    else if (indexOf(seen, computed, 0) < 0) {
      if (iteratee || isLarge) {
        seen.push(computed);
      }
      result.push(value);
    }
  }
  return result;
}

module.exports = baseUniq;

},{"457":457,"470":470,"475":475}],469:[function(_dereq_,module,exports){
arguments[4][40][0].apply(exports,arguments)
},{"40":40,"508":508}],470:[function(_dereq_,module,exports){
arguments[4][356][0].apply(exports,arguments)
},{"356":356,"500":500}],471:[function(_dereq_,module,exports){
arguments[4][357][0].apply(exports,arguments)
},{"357":357,"500":500}],472:[function(_dereq_,module,exports){
arguments[4][74][0].apply(exports,arguments)
},{"445":445,"469":469,"486":486,"74":74}],473:[function(_dereq_,module,exports){
arguments[4][41][0].apply(exports,arguments)
},{"41":41,"480":480,"488":488,"493":493}],474:[function(_dereq_,module,exports){
arguments[4][42][0].apply(exports,arguments)
},{"42":42,"493":493}],475:[function(_dereq_,module,exports){
(function (global){
var SetCache = _dereq_(446),
    constant = _dereq_(507),
    getNative = _dereq_(482);

/** Native method references. */
var Set = getNative(global, 'Set');

/* Native method references for those with the same name as other `lodash` methods. */
var nativeCreate = getNative(Object, 'create');

/**
 * Creates a `Set` cache object to optimize linear searches of large arrays.
 *
 * @private
 * @param {Array} [values] The values to cache.
 * @returns {null|Object} Returns the new cache object if `Set` is supported, else `null`.
 */
var createCache = !(nativeCreate && Set) ? constant(null) : function(values) {
  return new SetCache(values);
};

module.exports = createCache;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"446":446,"482":482,"507":507}],476:[function(_dereq_,module,exports){
arguments[4][43][0].apply(exports,arguments)
},{"43":43,"469":469,"496":496}],477:[function(_dereq_,module,exports){
arguments[4][140][0].apply(exports,arguments)
},{"140":140,"448":448}],478:[function(_dereq_,module,exports){
arguments[4][141][0].apply(exports,arguments)
},{"141":141}],479:[function(_dereq_,module,exports){
arguments[4][142][0].apply(exports,arguments)
},{"142":142,"503":503}],480:[function(_dereq_,module,exports){
arguments[4][44][0].apply(exports,arguments)
},{"44":44,"464":464}],481:[function(_dereq_,module,exports){
arguments[4][144][0].apply(exports,arguments)
},{"144":144,"490":490,"505":505}],482:[function(_dereq_,module,exports){
arguments[4][45][0].apply(exports,arguments)
},{"45":45,"498":498}],483:[function(_dereq_,module,exports){
arguments[4][370][0].apply(exports,arguments)
},{"370":370}],484:[function(_dereq_,module,exports){
arguments[4][46][0].apply(exports,arguments)
},{"46":46,"480":480,"488":488}],485:[function(_dereq_,module,exports){
arguments[4][47][0].apply(exports,arguments)
},{"47":47}],486:[function(_dereq_,module,exports){
arguments[4][79][0].apply(exports,arguments)
},{"484":484,"485":485,"500":500,"79":79}],487:[function(_dereq_,module,exports){
arguments[4][149][0].apply(exports,arguments)
},{"149":149,"493":493,"496":496}],488:[function(_dereq_,module,exports){
arguments[4][48][0].apply(exports,arguments)
},{"48":48}],489:[function(_dereq_,module,exports){
arguments[4][49][0].apply(exports,arguments)
},{"49":49}],490:[function(_dereq_,module,exports){
arguments[4][152][0].apply(exports,arguments)
},{"152":152,"500":500}],491:[function(_dereq_,module,exports){
arguments[4][50][0].apply(exports,arguments)
},{"485":485,"488":488,"495":495,"496":496,"50":50,"504":504}],492:[function(_dereq_,module,exports){
/**
 * An implementation of `_.uniq` optimized for sorted arrays without support
 * for callback shorthands and `this` binding.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {Function} [iteratee] The function invoked per iteration.
 * @returns {Array} Returns the new duplicate-value-free array.
 */
function sortedUniq(array, iteratee) {
  var seen,
      index = -1,
      length = array.length,
      resIndex = -1,
      result = [];

  while (++index < length) {
    var value = array[index],
        computed = iteratee ? iteratee(value, index, array) : value;

    if (!index || seen !== computed) {
      seen = computed;
      result[++resIndex] = value;
    }
  }
  return result;
}

module.exports = sortedUniq;

},{}],493:[function(_dereq_,module,exports){
arguments[4][51][0].apply(exports,arguments)
},{"500":500,"51":51}],494:[function(_dereq_,module,exports){
arguments[4][155][0].apply(exports,arguments)
},{"155":155,"467":467,"496":496}],495:[function(_dereq_,module,exports){
arguments[4][52][0].apply(exports,arguments)
},{"484":484,"489":489,"52":52}],496:[function(_dereq_,module,exports){
arguments[4][53][0].apply(exports,arguments)
},{"482":482,"488":488,"489":489,"53":53}],497:[function(_dereq_,module,exports){
(function (global){
var baseIsFunction = _dereq_(460),
    getNative = _dereq_(482);

/** `Object#toString` result references. */
var funcTag = '[object Function]';

/** Used for native method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.prototype.tostring)
 * of values.
 */
var objToString = objectProto.toString;

/** Native method references. */
var Uint8Array = getNative(global, 'Uint8Array');

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
var isFunction = !(baseIsFunction(/x/) || (Uint8Array && !baseIsFunction(Uint8Array))) ? baseIsFunction : function(value) {
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in older versions of Chrome and Safari which return 'function' for regexes
  // and Safari 8 equivalents which return 'object' for typed array constructors.
  return objToString.call(value) == funcTag;
};

module.exports = isFunction;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"460":460,"482":482}],498:[function(_dereq_,module,exports){
arguments[4][55][0].apply(exports,arguments)
},{"489":489,"506":506,"55":55}],499:[function(_dereq_,module,exports){
arguments[4][56][0].apply(exports,arguments)
},{"489":489,"56":56}],500:[function(_dereq_,module,exports){
arguments[4][57][0].apply(exports,arguments)
},{"57":57}],501:[function(_dereq_,module,exports){
arguments[4][161][0].apply(exports,arguments)
},{"161":161,"488":488,"489":489}],502:[function(_dereq_,module,exports){
arguments[4][89][0].apply(exports,arguments)
},{"449":449,"450":450,"472":472,"89":89}],503:[function(_dereq_,module,exports){
arguments[4][58][0].apply(exports,arguments)
},{"482":482,"484":484,"491":491,"500":500,"58":58}],504:[function(_dereq_,module,exports){
arguments[4][59][0].apply(exports,arguments)
},{"485":485,"488":488,"495":495,"496":496,"500":500,"59":59}],505:[function(_dereq_,module,exports){
arguments[4][165][0].apply(exports,arguments)
},{"165":165,"493":493,"503":503}],506:[function(_dereq_,module,exports){
arguments[4][60][0].apply(exports,arguments)
},{"467":467,"60":60}],507:[function(_dereq_,module,exports){
arguments[4][396][0].apply(exports,arguments)
},{"396":396}],508:[function(_dereq_,module,exports){
arguments[4][61][0].apply(exports,arguments)
},{"61":61}],509:[function(_dereq_,module,exports){
arguments[4][168][0].apply(exports,arguments)
},{"168":168,"464":464,"465":465,"487":487}],510:[function(_dereq_,module,exports){

var isArray = function(obj) {
  return Object.prototype.toString.call(obj) === '[object Array]';
};

var annotate = function() {
  var args = Array.prototype.slice.call(arguments);
  
  if (args.length === 1 && isArray(args[0])) {
    args = args[0];
  }

  var fn = args.pop();

  fn.$inject = args;

  return fn;
};


// Current limitations:
// - can't put into "function arg" comments
// function /* (no parenthesis like this) */ (){}
// function abc( /* xx (no parenthesis like this) */ a, b) {}
//
// Just put the comment before function or inside:
// /* (((this is fine))) */ function(a, b) {}
// function abc(a) { /* (((this is fine))) */}

var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
var FN_ARG = /\/\*([^\*]*)\*\//m;

var parse = function(fn) {
  if (typeof fn !== 'function') {
    throw new Error('Cannot annotate "' + fn + '". Expected a function!');
  }

  var match = fn.toString().match(FN_ARGS);
  return match[1] && match[1].split(',').map(function(arg) {
    match = arg.match(FN_ARG);
    return match ? match[1].trim() : arg.trim();
  }) || [];
};


exports.annotate = annotate;
exports.parse = parse;
exports.isArray = isArray;

},{}],511:[function(_dereq_,module,exports){
module.exports = {
  annotate: _dereq_(510).annotate,
  Module: _dereq_(513),
  Injector: _dereq_(512)
};

},{"510":510,"512":512,"513":513}],512:[function(_dereq_,module,exports){
var Module = _dereq_(513);
var autoAnnotate = _dereq_(510).parse;
var annotate = _dereq_(510).annotate;
var isArray = _dereq_(510).isArray;


var Injector = function(modules, parent) {
  parent = parent || {
    get: function(name) {
      currentlyResolving.push(name);
      throw error('No provider for "' + name + '"!');
    }
  };

  var currentlyResolving = [];
  var providers = this._providers = Object.create(parent._providers || null);
  var instances = this._instances = Object.create(null);

  var self = instances.injector = this;

  var error = function(msg) {
    var stack = currentlyResolving.join(' -> ');
    currentlyResolving.length = 0;
    return new Error(stack ? msg + ' (Resolving: ' + stack + ')' : msg);
  };

  var get = function(name) {
    if (!providers[name] && name.indexOf('.') !== -1) {
      var parts = name.split('.');
      var pivot = get(parts.shift());

      while(parts.length) {
        pivot = pivot[parts.shift()];
      }

      return pivot;
    }

    if (Object.hasOwnProperty.call(instances, name)) {
      return instances[name];
    }

    if (Object.hasOwnProperty.call(providers, name)) {
      if (currentlyResolving.indexOf(name) !== -1) {
        currentlyResolving.push(name);
        throw error('Cannot resolve circular dependency!');
      }

      currentlyResolving.push(name);
      instances[name] = providers[name][0](providers[name][1]);
      currentlyResolving.pop();

      return instances[name];
    }

    return parent.get(name);
  };

  var instantiate = function(Type) {
    var instance = Object.create(Type.prototype);
    var returned = invoke(Type, instance);

    return typeof returned === 'object' ? returned : instance;
  };

  var invoke = function(fn, context) {
    if (typeof fn !== 'function') {
      if (isArray(fn)) {
        fn = annotate(fn.slice());
      } else {
        throw new Error('Cannot invoke "' + fn + '". Expected a function!');
      }
    }

    var inject = fn.$inject && fn.$inject || autoAnnotate(fn);
    var dependencies = inject.map(function(dep) {
      return get(dep);
    });

    // TODO(vojta): optimize without apply
    return fn.apply(context, dependencies);
  };


  var createPrivateInjectorFactory = function(privateChildInjector) {
    return annotate(function(key) {
      return privateChildInjector.get(key);
    });
  };

  var createChild = function(modules, forceNewInstances) {
    if (forceNewInstances && forceNewInstances.length) {
      var fromParentModule = Object.create(null);
      var matchedScopes = Object.create(null);

      var privateInjectorsCache = [];
      var privateChildInjectors = [];
      var privateChildFactories = [];

      var provider;
      var cacheIdx;
      var privateChildInjector;
      var privateChildInjectorFactory;
      for (var name in providers) {
        provider = providers[name];

        if (forceNewInstances.indexOf(name) !== -1) {
          if (provider[2] === 'private') {
            cacheIdx = privateInjectorsCache.indexOf(provider[3]);
            if (cacheIdx === -1) {
              privateChildInjector = provider[3].createChild([], forceNewInstances);
              privateChildInjectorFactory = createPrivateInjectorFactory(privateChildInjector);
              privateInjectorsCache.push(provider[3]);
              privateChildInjectors.push(privateChildInjector);
              privateChildFactories.push(privateChildInjectorFactory);
              fromParentModule[name] = [privateChildInjectorFactory, name, 'private', privateChildInjector];
            } else {
              fromParentModule[name] = [privateChildFactories[cacheIdx], name, 'private', privateChildInjectors[cacheIdx]];
            }
          } else {
            fromParentModule[name] = [provider[2], provider[1]];
          }
          matchedScopes[name] = true;
        }

        if ((provider[2] === 'factory' || provider[2] === 'type') && provider[1].$scope) {
          forceNewInstances.forEach(function(scope) {
            if (provider[1].$scope.indexOf(scope) !== -1) {
              fromParentModule[name] = [provider[2], provider[1]];
              matchedScopes[scope] = true;
            }
          });
        }
      }

      forceNewInstances.forEach(function(scope) {
        if (!matchedScopes[scope]) {
          throw new Error('No provider for "' + scope + '". Cannot use provider from the parent!');
        }
      });

      modules.unshift(fromParentModule);
    }

    return new Injector(modules, self);
  };

  var factoryMap = {
    factory: invoke,
    type: instantiate,
    value: function(value) {
      return value;
    }
  };

  modules.forEach(function(module) {

    function arrayUnwrap(type, value) {
      if (type !== 'value' && isArray(value)) {
        value = annotate(value.slice());
      }

      return value;
    }

    // TODO(vojta): handle wrong inputs (modules)
    if (module instanceof Module) {
      module.forEach(function(provider) {
        var name = provider[0];
        var type = provider[1];
        var value = provider[2];

        providers[name] = [factoryMap[type], arrayUnwrap(type, value), type];
      });
    } else if (typeof module === 'object') {
      if (module.__exports__) {
        var clonedModule = Object.keys(module).reduce(function(m, key) {
          if (key.substring(0, 2) !== '__') {
            m[key] = module[key];
          }
          return m;
        }, Object.create(null));

        var privateInjector = new Injector((module.__modules__ || []).concat([clonedModule]), self);
        var getFromPrivateInjector = annotate(function(key) {
          return privateInjector.get(key);
        });
        module.__exports__.forEach(function(key) {
          providers[key] = [getFromPrivateInjector, key, 'private', privateInjector];
        });
      } else {
        Object.keys(module).forEach(function(name) {
          if (module[name][2] === 'private') {
            providers[name] = module[name];
            return;
          }

          var type = module[name][0];
          var value = module[name][1];

          providers[name] = [factoryMap[type], arrayUnwrap(type, value), type];
        });
      }
    }
  });

  // public API
  this.get = get;
  this.invoke = invoke;
  this.instantiate = instantiate;
  this.createChild = createChild;
};

module.exports = Injector;

},{"510":510,"513":513}],513:[function(_dereq_,module,exports){
var Module = function() {
  var providers = [];

  this.factory = function(name, factory) {
    providers.push([name, 'factory', factory]);
    return this;
  };

  this.value = function(name, value) {
    providers.push([name, 'value', value]);
    return this;
  };

  this.type = function(name, type) {
    providers.push([name, 'type', type]);
    return this;
  };

  this.forEach = function(iterator) {
    providers.forEach(iterator);
  };
};

module.exports = Module;

},{}],514:[function(_dereq_,module,exports){
arguments[4][31][0].apply(exports,arguments)
},{"31":31}],515:[function(_dereq_,module,exports){
arguments[4][97][0].apply(exports,arguments)
},{"97":97}],516:[function(_dereq_,module,exports){
var arrayEvery = _dereq_(520),
    baseCallback = _dereq_(524),
    baseEvery = _dereq_(527),
    isArray = _dereq_(562),
    isIterateeCall = _dereq_(553);

/**
 * Checks if `predicate` returns truthy for **all** elements of `collection`.
 * The predicate is bound to `thisArg` and invoked with three arguments:
 * (value, index|key, collection).
 *
 * If a property name is provided for `predicate` the created `_.property`
 * style callback returns the property value of the given element.
 *
 * If a value is also provided for `thisArg` the created `_.matchesProperty`
 * style callback returns `true` for elements that have a matching property
 * value, else `false`.
 *
 * If an object is provided for `predicate` the created `_.matches` style
 * callback returns `true` for elements that have the properties of the given
 * object, else `false`.
 *
 * @static
 * @memberOf _
 * @alias all
 * @category Collection
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function|Object|string} [predicate=_.identity] The function invoked
 *  per iteration.
 * @param {*} [thisArg] The `this` binding of `predicate`.
 * @returns {boolean} Returns `true` if all elements pass the predicate check,
 *  else `false`.
 * @example
 *
 * _.every([true, 1, null, 'yes'], Boolean);
 * // => false
 *
 * var users = [
 *   { 'user': 'barney', 'active': false },
 *   { 'user': 'fred',   'active': false }
 * ];
 *
 * // using the `_.matches` callback shorthand
 * _.every(users, { 'user': 'barney', 'active': false });
 * // => false
 *
 * // using the `_.matchesProperty` callback shorthand
 * _.every(users, 'active', false);
 * // => true
 *
 * // using the `_.property` callback shorthand
 * _.every(users, 'active');
 * // => false
 */
function every(collection, predicate, thisArg) {
  var func = isArray(collection) ? arrayEvery : baseEvery;
  if (thisArg && isIterateeCall(collection, predicate, thisArg)) {
    predicate = null;
  }
  if (typeof predicate != 'function' || thisArg !== undefined) {
    predicate = baseCallback(predicate, thisArg, 3);
  }
  return func(collection, predicate);
}

module.exports = every;

},{"520":520,"524":524,"527":527,"553":553,"562":562}],517:[function(_dereq_,module,exports){
arguments[4][32][0].apply(exports,arguments)
},{"32":32,"519":519,"526":526,"544":544}],518:[function(_dereq_,module,exports){
arguments[4][66][0].apply(exports,arguments)
},{"66":66}],519:[function(_dereq_,module,exports){
arguments[4][33][0].apply(exports,arguments)
},{"33":33}],520:[function(_dereq_,module,exports){
/**
 * A specialized version of `_.every` for arrays without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array} array The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {boolean} Returns `true` if all elements pass the predicate check,
 *  else `false`.
 */
function arrayEvery(array, predicate) {
  var index = -1,
      length = array.length;

  while (++index < length) {
    if (!predicate(array[index], index, array)) {
      return false;
    }
  }
  return true;
}

module.exports = arrayEvery;

},{}],521:[function(_dereq_,module,exports){
arguments[4][109][0].apply(exports,arguments)
},{"109":109}],522:[function(_dereq_,module,exports){
arguments[4][67][0].apply(exports,arguments)
},{"568":568,"67":67}],523:[function(_dereq_,module,exports){
arguments[4][68][0].apply(exports,arguments)
},{"525":525,"568":568,"68":68}],524:[function(_dereq_,module,exports){
arguments[4][112][0].apply(exports,arguments)
},{"112":112,"534":534,"535":535,"540":540,"572":572,"573":573}],525:[function(_dereq_,module,exports){
arguments[4][69][0].apply(exports,arguments)
},{"69":69}],526:[function(_dereq_,module,exports){
arguments[4][34][0].apply(exports,arguments)
},{"34":34,"529":529,"542":542}],527:[function(_dereq_,module,exports){
var baseEach = _dereq_(526);

/**
 * The base implementation of `_.every` without support for callback
 * shorthands and `this` binding.
 *
 * @private
 * @param {Array|Object|string} collection The collection to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {boolean} Returns `true` if all elements pass the predicate check,
 *  else `false`
 */
function baseEvery(collection, predicate) {
  var result = true;
  baseEach(collection, function(value, index, collection) {
    result = !!predicate(value, index, collection);
    return result;
  });
  return result;
}

module.exports = baseEvery;

},{"526":526}],528:[function(_dereq_,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"35":35,"543":543}],529:[function(_dereq_,module,exports){
arguments[4][36][0].apply(exports,arguments)
},{"36":36,"528":528,"568":568}],530:[function(_dereq_,module,exports){
arguments[4][121][0].apply(exports,arguments)
},{"121":121,"559":559}],531:[function(_dereq_,module,exports){
arguments[4][122][0].apply(exports,arguments)
},{"122":122,"532":532,"556":556,"565":565}],532:[function(_dereq_,module,exports){
arguments[4][123][0].apply(exports,arguments)
},{"123":123,"545":545,"546":546,"547":547,"562":562,"566":566}],533:[function(_dereq_,module,exports){
arguments[4][124][0].apply(exports,arguments)
},{"124":124,"531":531,"559":559}],534:[function(_dereq_,module,exports){
arguments[4][126][0].apply(exports,arguments)
},{"126":126,"533":533,"549":549,"559":559}],535:[function(_dereq_,module,exports){
arguments[4][127][0].apply(exports,arguments)
},{"127":127,"515":515,"530":530,"531":531,"538":538,"554":554,"557":557,"559":559,"560":560,"562":562}],536:[function(_dereq_,module,exports){
arguments[4][38][0].apply(exports,arguments)
},{"38":38}],537:[function(_dereq_,module,exports){
arguments[4][129][0].apply(exports,arguments)
},{"129":129,"530":530,"560":560}],538:[function(_dereq_,module,exports){
arguments[4][131][0].apply(exports,arguments)
},{"131":131}],539:[function(_dereq_,module,exports){
arguments[4][39][0].apply(exports,arguments)
},{"39":39}],540:[function(_dereq_,module,exports){
arguments[4][40][0].apply(exports,arguments)
},{"40":40,"572":572}],541:[function(_dereq_,module,exports){
arguments[4][74][0].apply(exports,arguments)
},{"518":518,"540":540,"553":553,"74":74}],542:[function(_dereq_,module,exports){
arguments[4][41][0].apply(exports,arguments)
},{"41":41,"548":548,"555":555,"559":559}],543:[function(_dereq_,module,exports){
arguments[4][42][0].apply(exports,arguments)
},{"42":42,"559":559}],544:[function(_dereq_,module,exports){
arguments[4][43][0].apply(exports,arguments)
},{"43":43,"540":540,"562":562}],545:[function(_dereq_,module,exports){
arguments[4][140][0].apply(exports,arguments)
},{"140":140,"521":521}],546:[function(_dereq_,module,exports){
arguments[4][141][0].apply(exports,arguments)
},{"141":141}],547:[function(_dereq_,module,exports){
arguments[4][142][0].apply(exports,arguments)
},{"142":142,"568":568}],548:[function(_dereq_,module,exports){
arguments[4][44][0].apply(exports,arguments)
},{"44":44,"536":536}],549:[function(_dereq_,module,exports){
arguments[4][144][0].apply(exports,arguments)
},{"144":144,"557":557,"570":570}],550:[function(_dereq_,module,exports){
arguments[4][45][0].apply(exports,arguments)
},{"45":45,"563":563}],551:[function(_dereq_,module,exports){
arguments[4][46][0].apply(exports,arguments)
},{"46":46,"548":548,"555":555}],552:[function(_dereq_,module,exports){
arguments[4][47][0].apply(exports,arguments)
},{"47":47}],553:[function(_dereq_,module,exports){
arguments[4][79][0].apply(exports,arguments)
},{"551":551,"552":552,"565":565,"79":79}],554:[function(_dereq_,module,exports){
arguments[4][149][0].apply(exports,arguments)
},{"149":149,"559":559,"562":562}],555:[function(_dereq_,module,exports){
arguments[4][48][0].apply(exports,arguments)
},{"48":48}],556:[function(_dereq_,module,exports){
arguments[4][49][0].apply(exports,arguments)
},{"49":49}],557:[function(_dereq_,module,exports){
arguments[4][152][0].apply(exports,arguments)
},{"152":152,"565":565}],558:[function(_dereq_,module,exports){
arguments[4][50][0].apply(exports,arguments)
},{"50":50,"552":552,"555":555,"561":561,"562":562,"569":569}],559:[function(_dereq_,module,exports){
arguments[4][51][0].apply(exports,arguments)
},{"51":51,"565":565}],560:[function(_dereq_,module,exports){
arguments[4][155][0].apply(exports,arguments)
},{"155":155,"539":539,"562":562}],561:[function(_dereq_,module,exports){
arguments[4][52][0].apply(exports,arguments)
},{"52":52,"551":551,"556":556}],562:[function(_dereq_,module,exports){
arguments[4][53][0].apply(exports,arguments)
},{"53":53,"550":550,"555":555,"556":556}],563:[function(_dereq_,module,exports){
arguments[4][55][0].apply(exports,arguments)
},{"55":55,"556":556,"571":571}],564:[function(_dereq_,module,exports){
arguments[4][56][0].apply(exports,arguments)
},{"556":556,"56":56}],565:[function(_dereq_,module,exports){
arguments[4][57][0].apply(exports,arguments)
},{"57":57}],566:[function(_dereq_,module,exports){
arguments[4][161][0].apply(exports,arguments)
},{"161":161,"555":555,"556":556}],567:[function(_dereq_,module,exports){
arguments[4][89][0].apply(exports,arguments)
},{"522":522,"523":523,"541":541,"89":89}],568:[function(_dereq_,module,exports){
arguments[4][58][0].apply(exports,arguments)
},{"550":550,"551":551,"558":558,"565":565,"58":58}],569:[function(_dereq_,module,exports){
arguments[4][59][0].apply(exports,arguments)
},{"552":552,"555":555,"561":561,"562":562,"565":565,"59":59}],570:[function(_dereq_,module,exports){
arguments[4][165][0].apply(exports,arguments)
},{"165":165,"559":559,"568":568}],571:[function(_dereq_,module,exports){
arguments[4][60][0].apply(exports,arguments)
},{"539":539,"60":60}],572:[function(_dereq_,module,exports){
arguments[4][61][0].apply(exports,arguments)
},{"61":61}],573:[function(_dereq_,module,exports){
arguments[4][168][0].apply(exports,arguments)
},{"168":168,"536":536,"537":537,"554":554}],574:[function(_dereq_,module,exports){
arguments[4][399][0].apply(exports,arguments)
},{"399":399,"578":578}],575:[function(_dereq_,module,exports){
module.exports = _dereq_(581);
},{"581":581}],576:[function(_dereq_,module,exports){
arguments[4][401][0].apply(exports,arguments)
},{"401":401,"585":585}],577:[function(_dereq_,module,exports){
arguments[4][403][0].apply(exports,arguments)
},{"403":403}],578:[function(_dereq_,module,exports){
arguments[4][404][0].apply(exports,arguments)
},{"404":404,"579":579}],579:[function(_dereq_,module,exports){
arguments[4][405][0].apply(exports,arguments)
},{"405":405}],580:[function(_dereq_,module,exports){
var matches = _dereq_(583)

module.exports = function (element, selector, checkYoSelf, root) {
  element = checkYoSelf ? {parentNode: element} : element

  root = root || document

  // Make sure `element !== document` and `element != null`
  // otherwise we get an illegal invocation
  while ((element = element.parentNode) && element !== document) {
    if (matches(element, selector))
      return element
    // After `matches` on the edge case that
    // the selector matches the root
    // (when the root is not the document)
    if (element === root)
      return
  }
}

},{"583":583}],581:[function(_dereq_,module,exports){
/**
 * Module dependencies.
 */

var closest = _dereq_(580)
  , event = _dereq_(582);

/**
 * Delegate event `type` to `selector`
 * and invoke `fn(e)`. A callback function
 * is returned which may be passed to `.unbind()`.
 *
 * @param {Element} el
 * @param {String} selector
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.bind = function(el, selector, type, fn, capture){
  return event.bind(el, type, function(e){
    var target = e.target || e.srcElement;
    e.delegateTarget = closest(target, selector, true, el);
    if (e.delegateTarget) fn.call(el, e);
  }, capture);
};

/**
 * Unbind event `type`'s callback `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @api public
 */

exports.unbind = function(el, type, fn, capture){
  event.unbind(el, type, fn, capture);
};

},{"580":580,"582":582}],582:[function(_dereq_,module,exports){
var bind = window.addEventListener ? 'addEventListener' : 'attachEvent',
    unbind = window.removeEventListener ? 'removeEventListener' : 'detachEvent',
    prefix = bind !== 'addEventListener' ? 'on' : '';

/**
 * Bind `el` event `type` to `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.bind = function(el, type, fn, capture){
  el[bind](prefix + type, fn, capture || false);
  return fn;
};

/**
 * Unbind `el` event `type`'s callback `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.unbind = function(el, type, fn, capture){
  el[unbind](prefix + type, fn, capture || false);
  return fn;
};
},{}],583:[function(_dereq_,module,exports){
/**
 * Module dependencies.
 */

var query = _dereq_(584);

/**
 * Element prototype.
 */

var proto = Element.prototype;

/**
 * Vendor function.
 */

var vendor = proto.matches
  || proto.webkitMatchesSelector
  || proto.mozMatchesSelector
  || proto.msMatchesSelector
  || proto.oMatchesSelector;

/**
 * Expose `match()`.
 */

module.exports = match;

/**
 * Match `el` to `selector`.
 *
 * @param {Element} el
 * @param {String} selector
 * @return {Boolean}
 * @api public
 */

function match(el, selector) {
  if (!el || el.nodeType !== 1) return false;
  if (vendor) return vendor.call(el, selector);
  var nodes = query.all(selector, el.parentNode);
  for (var i = 0; i < nodes.length; ++i) {
    if (nodes[i] == el) return true;
  }
  return false;
}

},{"584":584}],584:[function(_dereq_,module,exports){
arguments[4][406][0].apply(exports,arguments)
},{"406":406}],585:[function(_dereq_,module,exports){
arguments[4][407][0].apply(exports,arguments)
},{"407":407}]},{},[1])(1)
});
//# sourceMappingURL=dmn-viewer.js.map