import { newEditEventV2 } from '@openscd/oscd-api/utils.js';
import { createZeroLineLayoutEdits } from './foundation/autolayout.js';
export default class OscdMenuSldAutoLayout extends HTMLElement {
    async run() {
        if (!this.doc) {
            return;
        }
        const edits = createZeroLineLayoutEdits(this.doc);
        if (!edits.length) {
            return;
        }
        this.dispatchEvent(newEditEventV2(edits, {
            title: 'Auto layout SLD',
            squash: false,
        }));
    }
}
//# sourceMappingURL=oscd-menu-sld-auto-layout.js.map