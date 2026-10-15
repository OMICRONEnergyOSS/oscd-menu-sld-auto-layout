import { newEditEventV2 } from '@openscd/oscd-api/utils.js';

import { createZeroLineLayoutEdits } from './foundation/autolayout.js';
import { prepareLabelMeasurement } from './foundation/layout-geometry.js';

export default class OscdMenuSldAutoLayout extends HTMLElement {
  doc!: XMLDocument;

  async run(): Promise<void> {
    if (!this.doc) {
      return;
    }

    const doc = this.doc;
    const measure = await prepareLabelMeasurement();
    if (this.doc !== doc) {
      throw new Error('The document changed while preparing auto layout. Run the action again.');
    }
    const edits = createZeroLineLayoutEdits(doc, measure);
    if (!edits.length) {
      return;
    }

    this.dispatchEvent(
      newEditEventV2(edits, {
        title: 'Auto layout SLD',
        squash: false,
      })
    );
  }
}