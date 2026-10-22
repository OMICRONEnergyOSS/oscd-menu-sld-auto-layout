import { expect, fixture, html } from '@open-wc/testing';
import { OscdCheckbox } from '@omicronenergy/oscd-ui/checkbox/OscdCheckbox.js';
import { OscdFilledButton } from '@omicronenergy/oscd-ui/button/OscdFilledButton.js';
import { OscdTextButton } from '@omicronenergy/oscd-ui/button/OscdTextButton.js';
import { OscdDialog } from '@omicronenergy/oscd-ui/dialog/OscdDialog.js';
import { XMLEditor } from '@openscd/oscd-editor';

import OscdMenuCopySldv1Sldpriv from './oscd-menu-copy-sldv1-sldpriv.js';
import { sldV1Ns } from './foundation/coordinate-systems.js';
import { privType, sldNs } from './foundation/layout-util.js';

import type { EditEventV2 } from '@openscd/oscd-api';

customElements.define('test-copy-sld', OscdMenuCopySldv1Sldpriv);

function documentWithConflicts(): XMLDocument {
  return new DOMParser().parseFromString(
    `<SCL xmlns="http://www.iec.ch/61850/2003/SCL" xmlns:old="${sldV1Ns}" xmlns:n="${sldNs}">
      <Substation name="S" old:x="1"><Private type="${privType}"><n:SLDAttributes n:x="9"/></Private>
        <VoltageLevel name="V" old:x="2"><Private type="${privType}"><n:SLDAttributes n:x="8"/></Private>
          <Bay name="B" old:x="0"/>
        </VoltageLevel>
      </Substation>
    </SCL>`, 'application/xml',
  );
}

describe('Copy SLDv1 menu', () => {
  let element: OscdMenuCopySldv1Sldpriv;
  let editor: XMLEditor;
  let events: EditEventV2[];

  beforeEach(async () => {
    editor = new XMLEditor();
    events = [];
    element = await fixture(html`<test-copy-sld .doc=${documentWithConflicts()}
      @oscd-edit-v2=${(event: EditEventV2) => {
        events.push(event);
        editor.commit(event.detail.edit);
      }}></test-copy-sld>`);
    const dialog = element.shadowRoot?.querySelector('oscd-dialog');
    if (!(dialog instanceof OscdDialog)) {
      throw new Error('Dialog did not upgrade');
    }
    dialog.quick = true;
    await element.run();
    expect(dialog.open).to.equal(true);
  });

  afterEach(async () => {
    const dialog = element.shadowRoot?.querySelector('oscd-dialog');
    if (dialog instanceof OscdDialog) {
      await dialog.close();
    }
  });

  for (const overwrite of [false, true]) {
    it(`${overwrite ? 'overwrites' : 'skips'} all conflicts through one checkbox and one transaction`, async () => {
      const boxes = element.shadowRoot?.querySelectorAll('oscd-checkbox');
      expect(boxes).to.have.lengthOf(1);
      const checkbox = boxes?.[0];
      expect(checkbox instanceof OscdCheckbox).to.equal(true);
      if (!(checkbox instanceof OscdCheckbox)) {
        throw new Error('Checkbox did not upgrade');
      }
      expect(checkbox.checked).to.equal(false);
      if (overwrite) {
        checkbox.click();
        await element.updateComplete;
        expect(checkbox.checked).to.equal(true);
      }
      const button = element.shadowRoot?.querySelector('oscd-filled-button');
      if (!(button instanceof OscdFilledButton)) {
        throw new Error('Copy button did not upgrade');
      }
      expect(button.disabled).to.equal(false);
      button.click();
      await element.updateComplete;
      expect(events).to.have.lengthOf(1);
      expect(editor.past).to.have.lengthOf(1);
      const records = element.doc?.getElementsByTagNameNS(sldNs, 'SLDAttributes');
      expect(records?.[0].getAttributeNS(sldNs, 'x')).to.equal(overwrite ? '1' : '9');
      expect(records?.[1].getAttributeNS(sldNs, 'x')).to.equal(overwrite ? '2' : '8');
      expect(records?.[2].getAttributeNS(sldNs, 'x')).to.equal('0');
      expect(element.doc?.querySelector('Substation')?.getAttributeNS(sldV1Ns, 'x')).to.equal('1');
      expect(element.shadowRoot?.querySelector('[role="status"]')?.textContent).to.contain('retained');
    });
  }

  it('cancels without edits', async () => {
    const button = element.shadowRoot?.querySelector('oscd-text-button');
    if (!(button instanceof OscdTextButton)) {
      throw new Error('Cancel button did not upgrade');
    }
    button.click();
    await element.updateComplete;
    expect(events).to.have.lengthOf(0);
    expect(element.doc?.getElementsByTagNameNS(sldNs, 'SLDAttributes')).to.have.lengthOf(2);
  });

  it('blocks a stale version and a replacement document', async () => {
    for (const changeDoc of [false, true]) {
      await element.run();
      if (changeDoc) {
        element.doc = documentWithConflicts();
      } else {
        element.docVersion += 1;
      }
      await element.updateComplete;
      const button = element.shadowRoot?.querySelector('oscd-filled-button');
      expect(button instanceof OscdFilledButton).to.equal(true);
      if (button instanceof OscdFilledButton) {
        expect(button.disabled).to.equal(true);
        button.click();
      }
      expect(element.shadowRoot?.textContent).to.contain('document changed');
      expect(events).to.have.lengthOf(0);
    }
  });

  it('resets overwrite permission on reopening', async () => {
    const checkbox = element.shadowRoot?.querySelector('oscd-checkbox');
    if (checkbox instanceof OscdCheckbox) {
      checkbox.click();
    }
    await element.updateComplete;
    await element.run();
    const reset = element.shadowRoot?.querySelector('oscd-checkbox');
    expect(reset instanceof OscdCheckbox && reset.checked).to.equal(false);
  });

  it('reports ambiguity and prevents partial copies', async () => {
    element.doc?.querySelector('Substation')?.setAttributeNS(sldV1Ns, 'old:unknown', '1');
    await element.run();
    const button = element.shadowRoot?.querySelector('oscd-filled-button');
    expect(button instanceof OscdFilledButton && button.disabled).to.equal(true);
    expect(element.shadowRoot?.textContent).to.contain('Unsupported');
    expect(events).to.have.lengthOf(0);
  });

  it('reports missing documents and missing source coordinates', async () => {
    element.doc = new DOMParser().parseFromString(
      '<SCL xmlns="http://www.iec.ch/61850/2003/SCL"><Substation name="S"/></SCL>',
      'application/xml',
    );
    await element.run();
    expect(element.shadowRoot?.textContent).to.contain('No supported SLDv1 coordinates found');
    element.doc = undefined;
    await element.run();
    expect(element.shadowRoot?.textContent).to.contain('Open a document first');
    expect(events.length).to.equal(0);
  });
});
