import { fixture, expect } from '@open-wc/testing';
import { html } from 'lit';

import { XMLEditor } from '@openscd/oscd-editor';
import type { EditEventV2 } from '@openscd/oscd-api';

import OscdMenuSldAutoLayout from './oscd-menu-sld-auto-layout.js';
import { getSLDAttributes, iedReferences, resolveIed, sldNs } from './foundation/layout-util.js';

const zeroLineDocString = `<?xml version="1.0" encoding="UTF-8"?>
<SCL xmlns="http://www.iec.ch/61850/2003/SCL" version="2007" revision="B">
  <Substation name="S1">
    <VoltageLevel name="V1">
      <Bay name="B1">
        <ConductingEquipment name="C1" type="DIS">
          <LNode iedName="IED-C" lnClass="XCBR" lnInst="1"/>
        </ConductingEquipment>
        <ConductingEquipment name="C2" type="CBR">
          <LNode iedName="IED-B" lnClass="XCBR" lnInst="1"/>
        </ConductingEquipment>
        <ConductingEquipment name="C3" type="CTR">
          <LNode iedName="IED-A" lnClass="TCTR" lnInst="1"/>
        </ConductingEquipment>
      </Bay>
      <Bay name="B2">
        <ConductingEquipment name="C4" type="DIS">
          <LNode iedName="IED-B" lnClass="XSWI" lnInst="1"/>
        </ConductingEquipment>
      </Bay>
    </VoltageLevel>
    <VoltageLevel name="V2">
      <Bay name="B3">
        <ConductingEquipment name="C5" type="DIS">
          <LNode iedName="IED-A" lnClass="XSWI" lnInst="1"/>
        </ConductingEquipment>
      </Bay>
    </VoltageLevel>
  </Substation>
  <IED name="IED-A"/>
  <IED name="IED-B"/>
  <IED name="IED-C"/>
</SCL>`;

const priorArtDocString = `<?xml version="1.0" encoding="UTF-8"?>
<SCL xmlns="http://www.iec.ch/61850/2003/SCL" version="2007" revision="B">
  <Substation name="S1">
    <LNode iedName="IED-SUB" lnClass="LLN0" lnInst="1"/>
    <PowerTransformer name="PTR-SUB" type="PTR">
      <TransformerWinding name="W1" type="PTW">
        <LNode iedName="IED-SUBPTR" lnClass="TCTR" lnInst="1"/>
      </TransformerWinding>
    </PowerTransformer>
    <VoltageLevel name="V1">
      <LNode iedName="IED-VL" lnClass="LLN0" lnInst="1"/>
      <PowerTransformer name="PTR-VL" type="PTR">
        <TransformerWinding name="W1" type="PTW">
          <LNode iedName="IED-VLPTR" lnClass="TCTR" lnInst="1"/>
        </TransformerWinding>
      </PowerTransformer>
      <Bay name="B1">
        <ConductingEquipment name="QB1" type="DIS">
          <LNode iedName="IED-BAY" lnClass="XSWI" lnInst="1"/>
          <LNode iedName="IED-CROSS" lnClass="XSWI" lnInst="2"/>
        </ConductingEquipment>
      </Bay>
      <Bay name="B2">
        <ConductingEquipment name="QB2" type="DIS">
          <LNode iedName="IED-VL" lnClass="XSWI" lnInst="1"/>
        </ConductingEquipment>
      </Bay>
    </VoltageLevel>
    <VoltageLevel name="V2">
      <Bay name="B3">
        <ConductingEquipment name="QB3" type="DIS">
          <LNode iedName="IED-SUB" lnClass="XSWI" lnInst="1"/>
        </ConductingEquipment>
      </Bay>
    </VoltageLevel>
  </Substation>
  <Substation name="S2">
    <LNode iedName="IED-CROSS" lnClass="LLN0" lnInst="1"/>
  </Substation>
  <IED name="IED-BAY"/>
  <IED name="IED-VL"/>
  <IED name="IED-SUB"/>
  <IED name="IED-VLPTR"/>
  <IED name="IED-SUBPTR"/>
  <IED name="IED-CROSS"/>
</SCL>`;

if (!customElements.get('oscd-menu-sld-auto-layout')) {
  customElements.define('oscd-menu-sld-auto-layout', OscdMenuSldAutoLayout);
}

describe('Menu SLD auto layout', () => {
  let element: OscdMenuSldAutoLayout;
  let xmlEditor: XMLEditor;

  beforeEach(async () => {
    const doc = new DOMParser().parseFromString(
      zeroLineDocString,
      'application/xml'
    );

    xmlEditor = new XMLEditor();
    element = await fixture(
      html`<oscd-menu-sld-auto-layout
        .doc=${doc}
        @oscd-edit-v2=${(event: EditEventV2) => {
          xmlEditor.commit(event.detail.edit);
        }}
      ></oscd-menu-sld-auto-layout>`
    );
  });

  it('creates a zero-line layout for bays, equipment and shared IEDs', async () => {
    await element.run();

    expect(element.doc.documentElement.getAttribute('xmlns:eosld')).to.equal(sldNs);

    const substation = element.doc.querySelector('Substation[name="S1"]')!;
    const v1 = element.doc.querySelector('VoltageLevel[name="V1"]')!;
    const v2 = element.doc.querySelector('VoltageLevel[name="V2"]')!;
    const b1 = element.doc.querySelector('Bay[name="B1"]')!;
    const b2 = element.doc.querySelector('Bay[name="B2"]')!;
    const c1 = element.doc.querySelector('ConductingEquipment[name="C1"]')!;
    const c2 = element.doc.querySelector('ConductingEquipment[name="C2"]')!;
    const c3 = element.doc.querySelector('ConductingEquipment[name="C3"]')!;

    expect(getSLDAttributes(substation, 'w')).to.not.equal(null);
    expect(getSLDAttributes(substation, 'h')).to.not.equal(null);

    expect(getSLDAttributes(v1, 'x')).to.equal('1');
    expect(getSLDAttributes(v2, 'x')).to.equal('1');
    expect(Number(getSLDAttributes(v2, 'y'))).to.be.greaterThan(
      Number(getSLDAttributes(v1, 'y'))
    );

    expect(getSLDAttributes(b1, 'y')).to.equal(getSLDAttributes(b2, 'y'));
    expect(Number(getSLDAttributes(b2, 'x'))).to.be.greaterThan(
      Number(getSLDAttributes(b1, 'x'))
    );

    const bayX = Number(getSLDAttributes(b1, 'x'));
    const bayY = Number(getSLDAttributes(b1, 'y'));

    expect(Number(getSLDAttributes(c1, 'x'))).to.be.at.least(bayX + 3);
    expect(Number(getSLDAttributes(c1, 'y'))).to.be.at.least(bayY + 2);
    expect(Number(getSLDAttributes(c2, 'x'))).to.be.at.least(
      Number(getSLDAttributes(c1, 'x')) + 2
    );
    expect(getSLDAttributes(c2, 'y')).to.equal(getSLDAttributes(c1, 'y'));
    expect(getSLDAttributes(c3, 'x')).to.equal(getSLDAttributes(c1, 'x'));
    expect(Number(getSLDAttributes(c3, 'y'))).to.be.at.least(bayY + 4);

    const references = iedReferences(element.doc);
    expect(references).to.have.lengthOf(3);

    const refFor = (name: string) =>
      references.find(reference => resolveIed(reference)?.getAttribute('name') === name)!;

    const iedA = refFor('IED-A');
    const iedB = refFor('IED-B');
    const iedC = refFor('IED-C');

    expect(iedA.parentElement?.parentElement).to.equal(substation);
    expect(getSLDAttributes(iedA, 'x')).to.equal('1');
    expect(getSLDAttributes(iedA, 'y')).to.equal('2');

    expect(iedB.parentElement?.parentElement).to.equal(v1);
    expect(getSLDAttributes(iedB, 'x')).to.equal('2');
    expect(getSLDAttributes(iedB, 'y')).to.equal(
      String(Number(getSLDAttributes(v1, 'y')) + 2)
    );

    expect(iedC.parentElement?.parentElement).to.equal(b1);
    expect(getSLDAttributes(iedC, 'x')).to.equal(String(bayX + 1));
    expect(getSLDAttributes(iedC, 'y')).to.equal(String(bayY + 2));
  });

  it('matches old zeroline scope allocation and places direct non-bay primary equipment', async () => {
    const doc = new DOMParser().parseFromString(
      priorArtDocString,
      'application/xml'
    );

    element = await fixture(
      html`<oscd-menu-sld-auto-layout
        .doc=${doc}
        @oscd-edit-v2=${(event: EditEventV2) => {
          xmlEditor.commit(event.detail.edit);
        }}
      ></oscd-menu-sld-auto-layout>`
    );

    await element.run();

    const s1 = element.doc.querySelector('Substation[name="S1"]')!;
    const v1 = element.doc.querySelector('VoltageLevel[name="V1"]')!;
    const b1 = element.doc.querySelector('Bay[name="B1"]')!;
    const ptrSub = element.doc.querySelector('PowerTransformer[name="PTR-SUB"]')!;
    const ptrVl = element.doc.querySelector(
      'VoltageLevel[name="V1"] > PowerTransformer[name="PTR-VL"]'
    )!;

    expect(getSLDAttributes(ptrSub, 'x')).to.not.equal(null);
    expect(getSLDAttributes(ptrSub, 'y')).to.not.equal(null);
    expect(getSLDAttributes(ptrVl, 'x')).to.not.equal(null);
    expect(getSLDAttributes(ptrVl, 'y')).to.not.equal(null);

    const references = iedReferences(element.doc);
    const refFor = (name: string) =>
      references.find(reference => resolveIed(reference)?.getAttribute('name') === name);

    expect(refFor('IED-BAY')?.parentElement?.parentElement).to.equal(b1);
    expect(refFor('IED-VL')?.parentElement?.parentElement).to.equal(v1);
    expect(refFor('IED-SUB')?.parentElement?.parentElement).to.equal(s1);
    expect(refFor('IED-VLPTR')?.parentElement?.parentElement).to.equal(v1);
    expect(refFor('IED-SUBPTR')?.parentElement?.parentElement).to.equal(s1);
    expect(refFor('IED-CROSS')).to.equal(undefined);
  });

  it('dispatches one undoable transaction with IED labels below their symbols', async () => {
    const before = element.doc.documentElement.cloneNode(true);
    let events = 0;
    element.addEventListener('oscd-edit-v2', () => {
      events += 1;
    });
    await element.run();
    expect(events).to.equal(1);
    for (const reference of iedReferences(element.doc)) {
      expect(getSLDAttributes(reference, 'lx')).to.equal(getSLDAttributes(reference, 'x'));
      expect(Number(getSLDAttributes(reference, 'ly'))).to.equal(
        Number(getSLDAttributes(reference, 'y')) + 2
      );
    }
    xmlEditor.undo();
    expect(element.doc.documentElement.isEqualNode(before)).to.equal(true);
    xmlEditor.redo();
    expect(iedReferences(element.doc)).to.have.lengthOf(3);
  });

  it('rejects a document switch during font preparation without dispatching edits', async () => {
    const oldDoc = element.doc;
    const before = oldDoc.documentElement.cloneNode(true);
    let events = 0;
    element.addEventListener('oscd-edit-v2', () => {
      events += 1;
    });
    const pending = element.run();
    element.doc = new DOMParser().parseFromString(zeroLineDocString, 'application/xml');
    let error: unknown;
    try {
      await pending;
    } catch (caught) {
      error = caught;
    }
    expect(error).to.be.instanceOf(Error);
    expect(events).to.equal(0);
    expect(oldDoc.documentElement.isEqualNode(before)).to.equal(true);
    expect(element.doc.documentElement.isEqualNode(before)).to.equal(true);
  });
});