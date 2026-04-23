import { newEditEventV2 } from '@openscd/oscd-api/utils.js';

import { createZeroLineLayoutEdits } from './autolayout.js';

export default class OscdMenuSldAutoLayout extends HTMLElement {
  doc!: XMLDocument;

  async run(): Promise<void> {
    if (!this.doc) return;

    const edits = createZeroLineLayoutEdits(this.doc);
    if (!edits.length) return;

    this.dispatchEvent(
      newEditEventV2(edits, {
        title: 'Auto layout SLD',
        squash: false,
      })
    );
  }
}