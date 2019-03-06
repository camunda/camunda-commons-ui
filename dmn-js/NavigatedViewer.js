import Manager from 'dmn-js/node_modules/dmn-js-shared/lib/base/Manager';

import DrdViewer from 'dmn-js/node_modules/dmn-js-drd/lib/NavigatedViewer';
import DecisionTableViewer from 'dmn-js/node_modules/dmn-js-decision-table/lib/Viewer';
import LiteralExpressionViewer from 'dmn-js/node_modules/dmn-js-literal-expression/lib/Viewer';

import { is } from 'dmn-js/node_modules/dmn-js-shared/lib/util/ModelUtil';
import { containsDi } from 'dmn-js/node_modules/dmn-js-shared/lib/util/DiUtil';


/**
 * The dmn viewer.
 */
export default class Viewer extends Manager {

  constructor(options = {}) {
    super(options);
    this.options = options;
  }

  _getViewProviders() {
    let providers = [
      {
        id: 'literalExpression',
        constructor: LiteralExpressionViewer,
        opens(element) {
          return is(element, 'dmn:Decision') && element.literalExpression;
        }
      },
      {
        id: 'decisionTable',
        constructor: DecisionTableViewer,
        opens(element) {
          return is(element, 'dmn:Decision') && element.decisionTable;
        }
      }
    ];

    const { tableViewOnly } = this.options;
    if(!tableViewOnly) {
      providers.push({
        id: 'drd',
        constructor: DrdViewer,
        opens(element) {
          return is(element, 'dmn:Definitions') && containsDi(element);
        }
      });
    }

    return providers;

  }

}
