import { expect } from '@open-wc/testing';
import { XMLEditor } from '@openscd/oscd-editor';

import {
  cleanCoordinatePlan, copySldV1Plan, detectCoordinateSystems, sldV1Ns, sxyNs,
} from './coordinate-systems.js';
import { privType, sldNs, xmlnsNs } from './layout-util.js';

const sclNs = 'http://www.iec.ch/61850/2003/SCL';
const vendorNs = 'http://www.abb.com/61850/2006/SCL_SLD';

function parse(body: string): XMLDocument {
  return new DOMParser().parseFromString(
    `<SCL xmlns="${sclNs}" xmlns:old="${sldV1Ns}" xmlns:new="${sldNs}"
      xmlns:xy="${sxyNs}" xmlns:vendor="${vendorNs}" version="2007" revision="B">
      ${body}</SCL>`, 'application/xml',
  );
}

function serialize(doc: XMLDocument): string {
  return new XMLSerializer().serializeToString(doc);
}

function layout(doc: XMLDocument): Element[] {
  return Array.from(doc.getElementsByTagNameNS(sldNs, 'SLDAttributes'));
}

describe('Coordinate systems', () => {
  it('detects namespace content, not declarations or prefix names', () => {
    expect(detectCoordinateSystems(parse('<Substation name="S"/>')))
      .to.deep.equal({ sldv1: 0, sldpriv: 0, sxy: 0 });
    const doc = parse(`<Substation name="S" old:x="0" xy:y="-2" vendor:x="9">
      <Private type="${privType}"><new:SLDAttributes new:x="1"/></Private>
      </Substation>`);
    const found = detectCoordinateSystems(doc);
    expect(found.sldv1).to.equal(1);
    expect(found.sxy).to.equal(1);
    expect(found.sldpriv).to.equal(2);
  });

  it('copies zero/negative values with namespace decoys and leaves the source intact', () => {
    const doc = parse(`<Substation name="S" x="99" old:x="0" old:y="-2" old:uuid="a">
      <VoltageLevel name="V"><Voltage unit="V" multiplier="k">110</Voltage></VoltageLevel>
      </Substation>`);
    const before = serialize(doc);
    const plan = copySldV1Plan(doc);
    expect(plan.issues).to.deep.equal([]);
    expect(plan.copied).to.equal(1);
    expect(serialize(doc)).to.equal(before);
    const editor = new XMLEditor();
    editor.commit(plan.edits);
    expect(layout(doc)[0].getAttributeNS(sldNs, 'x')).to.equal('0');
    expect(layout(doc)[0].getAttributeNS(sldNs, 'y')).to.equal('-2');
    expect(layout(doc)[0].getAttributeNS(sldNs, 'uuid')).to.equal('a');
    expect(doc.querySelector('Substation')?.getAttribute('x')).to.equal('99');
    expect(doc.querySelector('Substation')?.getAttributeNS(sldV1Ns, 'x')).to.equal('0');
    const after = serialize(doc);
    editor.undo();
    expect(doc.documentElement.isEqualNode(
      new DOMParser().parseFromString(before, 'application/xml').documentElement,
    )).to.equal(true);
    editor.redo();
    expect(serialize(doc)).to.equal(after);
    expect(copySldV1Plan(doc).edits).to.deep.equal([]);
    expect(copySldV1Plan(doc, true).edits).to.deep.equal([]);
  });

  it('uses valid Private ordering for prefixed SCL and avoids nested prefix collisions', () => {
    const doc = new DOMParser().parseFromString(
      `<s:SCL xmlns:s="${sclNs}" xmlns:o="${sldV1Ns}" xmlns:eosld="urn:vendor">
      <s:Substation name="S" o:x="1" xmlns:eosld1="urn:other">
        <s:Text>Text</s:Text><s:VoltageLevel name="V"/>
      </s:Substation></s:SCL>`, 'application/xml',
    );
    const plan = copySldV1Plan(doc);
    expect(plan.issues).to.deep.equal([]);
    new XMLEditor().commit(plan.edits);
    const children = Array.from(doc.getElementsByTagNameNS(sclNs, 'Substation')[0].children);
    expect(children.map(child => child.localName)).to.deep.equal(['Text', 'Private', 'VoltageLevel']);
    expect(children[1].namespaceURI).to.equal(sclNs);
    expect(doc.documentElement.getAttributeNS(xmlnsNs, 'eosld')).to.equal('urn:vendor');
    expect(layout(doc)[0].getAttributeNS(sldNs, 'x')).to.equal('1');
    const roundTrip = new DOMParser().parseFromString(serialize(doc), 'application/xml');
    expect(roundTrip.querySelector('parsererror')).to.equal(null);
    expect(layout(roundTrip)[0].getAttributeNS(sldNs, 'x')).to.equal('1');
  });

  for (const overwrite of [false, true]) {
    it(`${overwrite ? 'overwrites' : 'skips'} ALL conflicts and still copies absent destinations`, () => {
      const doc = parse(`<Substation name="S" old:x="1" old:y="2">
        <Private type="${privType}"><new:SLDAttributes new:x="8" new:rot="3"/></Private>
        <VoltageLevel name="V" old:x="4">
          <Private type="${privType}"><new:SLDAttributes new:x="7"/></Private>
          <Bay name="B" old:x="0"/>
        </VoltageLevel></Substation>`);
      const before = serialize(doc);
      const plan = copySldV1Plan(doc, overwrite);
      expect(plan.conflicts).to.equal(2);
      expect(plan.issues).to.deep.equal([]);
      expect(serialize(doc)).to.equal(before);
      new XMLEditor().commit(plan.edits);
      const records = layout(doc);
      expect(records[0].getAttributeNS(sldNs, 'x')).to.equal(overwrite ? '1' : '8');
      expect(records[0].getAttributeNS(sldNs, 'y')).to.equal(overwrite ? '2' : null);
      expect(records[0].getAttributeNS(sldNs, 'rot')).to.equal('3');
      expect(records[1].getAttributeNS(sldNs, 'x')).to.equal(overwrite ? '4' : '7');
      expect(records[2].getAttributeNS(sldNs, 'x')).to.equal('0');
      expect(doc.querySelector('Bay')?.getAttributeNS(sldV1Ns, 'x')).to.equal('0');
    });
  }

  it('counts already-identical destination records as conflicts', () => {
    const doc = parse(`<Substation name="S" old:x="1"><Private type="${privType}">
      <new:SLDAttributes new:x="1"/></Private></Substation>`);
    expect(copySldV1Plan(doc).conflicts).to.equal(1);
    expect(copySldV1Plan(doc).edits).to.deep.equal([]);
  });

  it('copies connectivity sections, bus flags, vertices and UUIDs without removing the old Private', () => {
    const doc = parse(`<Substation name="S"><VoltageLevel name="V"><Bay name="B">
      <ConnectivityNode name="N" pathName="S/V/B/N" old:x="0">
        <Private type="Transpower-SLD-Vertices">
          <old:Section bus="true"><old:Vertex old:x="0" old:y="-1" old:uuid="v1"/></old:Section>
        </Private>
      </ConnectivityNode></Bay></VoltageLevel></Substation>`);
    const plan = copySldV1Plan(doc);
    expect(plan.issues).to.deep.equal([]);
    new XMLEditor().commit(plan.edits);
    expect(doc.querySelector('Private[type="Transpower-SLD-Vertices"]')).to.not.equal(null);
    const section = doc.getElementsByTagNameNS(sldNs, 'Section')[0];
    expect(section.getAttributeNS(sldNs, 'bus')).to.equal('true');
    expect(section.firstElementChild?.getAttributeNS(sldNs, 'x')).to.equal('0');
    expect(section.firstElementChild?.getAttributeNS(sldNs, 'uuid')).to.equal('v1');
    expect(doc.querySelectorAll(`Private[type="${privType}"]`)).to.have.lengthOf(1);
    expect(copySldV1Plan(doc).edits).to.deep.equal([]);
    expect(copySldV1Plan(doc).conflicts).to.equal(2);
    expect(copySldV1Plan(doc, true).edits.length).to.equal(0);
  });

  it('skips/overwrites connectivity paths as a whole without duplicating the destination', () => {
    for (const overwrite of [false, true]) {
      const doc = parse(`<Substation name="S"><VoltageLevel name="V"><Bay name="B">
        <ConnectivityNode name="N" pathName="S/V/B/N">
          <Private type="Transpower-SLD-Vertices"><old:Section bus="false">
            <old:Vertex old:x="1"/></old:Section></Private>
          <Private type="${privType}"><new:Section new:bus="true">
            <new:Vertex new:x="9"/></new:Section></Private>
        </ConnectivityNode></Bay></VoltageLevel></Substation>`);
      const plan = copySldV1Plan(doc, overwrite);
      expect(plan.conflicts).to.equal(1);
      if (plan.edits.length > 0) {
        new XMLEditor().commit(plan.edits);
      }
      const sections = doc.getElementsByTagNameNS(sldNs, 'Section');
      expect(sections).to.have.lengthOf(1);
      expect(sections[0].getAttributeNS(sldNs, 'bus')).to.equal(overwrite ? 'false' : 'true');
    }
  });

  it('copies both linked and direct legacy IED placement without altering the IED or source', () => {
    const doc = parse(`<Substation name="S"><VoltageLevel name="V"><Bay name="B">
      <Private type="OpenSCD-Linked-IEDs"><IEDName old:name="A" old:x="0" old:y="-3"/></Private>
      </Bay></VoltageLevel></Substation><IED name="A"/><IED name="B" old:x="2" old:ly="4"/>`);
    const plan = copySldV1Plan(doc);
    expect(plan.issues).to.deep.equal([]);
    new XMLEditor().commit(plan.edits);
    const refs = Array.from(doc.getElementsByTagNameNS(sldNs, 'Reference'));
    expect(refs).to.have.lengthOf(2);
    const a = refs.find(reference => reference.getAttributeNS(sldNs, 'id') === 'A');
    const b = refs.find(reference => reference.getAttributeNS(sldNs, 'id') === 'B');
    expect(a?.parentElement?.parentElement?.localName).to.equal('Bay');
    expect(b?.parentElement?.parentElement?.localName).to.equal('Substation');
    expect(doc.querySelector('IED[name="B"]')?.getAttributeNS(sldV1Ns, 'x')).to.equal('2');
    expect(doc.querySelector('Private[type="OpenSCD-Linked-IEDs"]')).to.not.equal(null);
  });

  it('reconciles IED conflicts without duplicating references', () => {
    for (const overwrite of [false, true]) {
      const doc = parse(`<Substation name="S">
        <Private type="OpenSCD-Linked-IEDs"><IEDName old:name="A" old:x="1"/></Private>
        <Private type="${privType}"><new:Reference new:id="A" new:type="IED">
          <new:SLDAttributes new:x="9"/></new:Reference></Private>
        </Substation><IED name="A"/>`);
      const plan = copySldV1Plan(doc, overwrite);
      expect(plan.conflicts).to.equal(1);
      if (plan.edits.length > 0) {
        new XMLEditor().commit(plan.edits);
      }
      expect(doc.getElementsByTagNameNS(sldNs, 'Reference')).to.have.lengthOf(1);
      expect(layout(doc)[0].getAttributeNS(sldNs, 'x')).to.equal(overwrite ? '1' : '9');
    }
  });

  it('copies prefixed IEDs with the same identity as unprefixed IEDs', () => {
    const doc = new DOMParser().parseFromString(
      `<s:SCL xmlns:s="${sclNs}" xmlns:o="${sldV1Ns}">
        <s:Substation name="S"/><s:IED name="A" o:x="0"/>
      </s:SCL>`, 'application/xml',
    );
    const plan = copySldV1Plan(doc);
    expect(plan.issues.length).to.equal(0);
    new XMLEditor().commit(plan.edits);
    expect(doc.getElementsByTagNameNS(sldNs, 'Reference')[0].getAttributeNS(sldNs, 'id')).to.equal('A');
  });

  it('does not create empty references for linked IEDs without coordinates', () => {
    const doc = parse(`<Substation name="S" old:x="0">
      <Private type="OpenSCD-Linked-IEDs"><IEDName old:name="A"/></Private>
      </Substation><IED name="A"/>`);
    new XMLEditor().commit(copySldV1Plan(doc).edits);
    expect(doc.getElementsByTagNameNS(sldNs, 'Reference').length).to.equal(0);
  });

  it('blocks overwriting connectivity sections containing vendor content', () => {
    const doc = parse(`<Substation name="S"><VoltageLevel name="V"><Bay name="B">
      <ConnectivityNode name="N" pathName="S/V/B/N">
        <Private type="Transpower-SLD-Vertices"><old:Section><old:Vertex old:x="1"/></old:Section></Private>
        <Private type="${privType}"><new:Section><vendor:Data/></new:Section></Private>
      </ConnectivityNode></Bay></VoltageLevel></Substation>`);
    expect(copySldV1Plan(doc, true).issues.length).to.equal(1);
    expect(copySldV1Plan(doc, true).edits.length).to.equal(0);
    expect(copySldV1Plan(doc).issues.length).to.equal(0);
  });

  for (const body of [
    '<Substation name="S"/><Substation name="T"/><IED name="A" old:x="1"/>',
    '<Substation name="S"><Private type="OpenSCD-Linked-IEDs"><IEDName old:name="Missing" old:x="1"/></Private></Substation>',
    '<Substation name="S" old:unknown="1"/>',
    `<Substation name="S" old:x="1"><Private type="${privType}"/><Private type="${privType}"/></Substation>`,
    `<Substation name="S" old:x="1"><Private type="${privType}"><new:SLDAttributes/><new:SLDAttributes/></Private></Substation>`,
    '<Substation name="S"><Private type="OpenSCD-Linked-IEDs"><IEDName old:name="A" old:x="1"/><IEDName old:name="A" old:x="2"/></Private></Substation><IED name="A"/>',
    '<Substation name="S"><Private type="OpenSCD-Linked-IEDs"><IEDName old:name="A" old:x="1"/></Private></Substation><IED name="A" old:x="2"/>',
    '<Substation name="S"/><vendor:Bay old:x="1"/>',
  ]) {
    it(`blocks ambiguous/unsupported input without partial edits: ${body.slice(0, 70)}`, () => {
      const doc = parse(body);
      const before = serialize(doc);
      const plan = copySldV1Plan(doc, true);
      expect(plan.issues.length).to.be.greaterThan(0);
      expect(plan.edits).to.deep.equal([]);
      expect(serialize(doc)).to.equal(before);
    });
  }

  it('removes selected systems completely, preserving vendor and unselected data, with undo/redo', () => {
    const doc = parse(`<Substation name="S" old:x="0" xy:y="-1" vendor:x="9">
      <Private type="${privType}"><new:SLDAttributes new:x="2"/></Private>
      <Private type="OpenSCD-Linked-IEDs"><IEDName old:name="A" old:x="1"/></Private>
      <Private type="vendor"><vendor:Data vendor:x="3"/></Private>
      </Substation><IED name="A" old:y="0"/>`);
    const before = serialize(doc);
    const editor = new XMLEditor();
    const plan = cleanCoordinatePlan(doc, ['sldv1', 'sxy']);
    expect(plan.issues).to.deep.equal([]);
    expect(serialize(doc)).to.equal(before);
    editor.commit(plan.edits);
    expect(detectCoordinateSystems(doc).sldv1).to.equal(0);
    expect(detectCoordinateSystems(doc).sxy).to.equal(0);
    expect(layout(doc)).to.have.lengthOf(1);
    expect(doc.querySelector('Substation')?.getAttributeNS(vendorNs, 'x')).to.equal('9');
    expect(doc.querySelector('Private[type="vendor"]')).to.not.equal(null);
    const after = serialize(doc);
    editor.undo();
    expect(doc.documentElement.isEqualNode(
      new DOMParser().parseFromString(before, 'application/xml').documentElement,
    )).to.equal(true);
    editor.redo();
    expect(serialize(doc)).to.equal(after);
    editor.commit(cleanCoordinatePlan(doc, ['sldpriv']).edits);
    expect(detectCoordinateSystems(doc)).to.deep.equal({ sldv1: 0, sldpriv: 0, sxy: 0 });
    expect(doc.querySelector('Private[type="vendor"]')).to.not.equal(null);
  });

  it('recognizes and removes orphan namespaced layout elements', () => {
    const doc = parse('<Substation name="S"><old:Section><old:Vertex old:x="1"/></old:Section></Substation>');
    new XMLEditor().commit(cleanCoordinatePlan(doc, ['sldv1']).edits);
    expect(detectCoordinateSystems(doc).sldv1).to.equal(0);
  });

  it('blocks removing orphan layout elements containing vendor children', () => {
    const doc = parse('<Substation name="S"><old:Section><vendor:Data/></old:Section></Substation>');
    const plan = cleanCoordinatePlan(doc, ['sldv1']);
    expect(plan.issues.length).to.equal(1);
    expect(plan.edits.length).to.equal(0);
  });

  it('removes unused selected namespace declarations but retains vendor and unselected declarations', () => {
    const doc = parse('<Substation name="S" old:x="0" xy:x="1"/>');
    new XMLEditor().commit(cleanCoordinatePlan(doc, ['sldv1']).edits);
    expect(doc.documentElement.getAttributeNS(xmlnsNs, 'old')).to.equal(null);
    expect(doc.documentElement.getAttributeNS(xmlnsNs, 'xy')).to.equal(sxyNs);
    expect(doc.documentElement.getAttributeNS(xmlnsNs, 'vendor')).to.equal(vendorNs);
  });

  it('retains a selected namespace declaration still referenced by QName metadata', () => {
    const doc = parse('<Substation name="S" old:x="1"><Private type="vendor"><vendor:Data type="old:Metadata"/></Private></Substation>');
    new XMLEditor().commit(cleanCoordinatePlan(doc, ['sldv1']).edits);
    expect(doc.documentElement.getAttributeNS(xmlnsNs, 'old')).to.equal(sldV1Ns);
    expect(detectCoordinateSystems(doc).sldv1).to.equal(0);
  });

  it('blocks cleanup rather than deleting unrelated data mixed inside a layout Private', () => {
    const doc = parse(`<Substation name="S" old:x="1"><Private type="${privType}">
      <new:SLDAttributes new:x="2"/><vendor:Data/></Private></Substation>`);
    const before = serialize(doc);
    const plan = cleanCoordinatePlan(doc, ['sldv1', 'sldpriv']);
    expect(plan.edits).to.deep.equal([]);
    expect(plan.issues).to.have.lengthOf(1);
    expect(serialize(doc)).to.equal(before);
  });
});
