import { expect, fixture, html } from '@open-wc/testing';
import { XMLEditor } from '@openscd/oscd-editor';
import { SldSubstationViewer } from '@omicronenergy/oscd-editor-sld/sld-substation-viewer.js';

import { createZeroLineLayoutEdits } from './autolayout.js';
import { itemFootprint, prepareLabelMeasurement } from './layout-geometry.js';
import { getSLDAttributes, iedReferences, resolveIed } from './layout-util.js';

import type { MeasureLabel } from './layout-geometry.js';

type Rect = { x: number; y: number; width: number; height: number };

function overlaps(a: Rect, b: Rect): boolean {
  const epsilon = 0.001;
  return a.x < b.x + b.width - epsilon && b.x < a.x + a.width - epsilon &&
    a.y < b.y + b.height - epsilon && b.y < a.y + a.height - epsilon;
}

function attribute(element: Element, name: string): number {
  const value = getSLDAttributes(element, name);
  expect(value, `${element.localName} ${name}`).not.to.equal(null);
  return Number(value);
}

function sample(): XMLDocument {
  const names = ['WWWWWWWW_LongProtectionRelay', 'ii', 'Medium_Relay'];
  const scope = (prefix: string) => names.map((name, index) =>
    `<LNode iedName="${prefix}_${name}" lnClass="LLN0" lnInst="${index + 1}"/>`).join('');
  const equipment = (prefix: string) => `
    <ConductingEquipment name="${prefix}_VeryLongEquipmentName" type="DIS"/>
    <ConductingEquipment name="${prefix}_Short" type="CBR"/>
    <PowerTransformer name="${prefix}_Transformer">
      ${Array.from({ length: prefix === 'S' ? 1 : prefix.includes('B1') ? 2 : 3 },
        (_, index) => `<TransformerWinding name="W${index + 1}"/>`).join('')}
    </PowerTransformer>`;
  const voltageLevel = (prefix: string) => `<VoltageLevel name="${prefix}_LongVoltageLevelName">
    ${scope(prefix)}${equipment(prefix)}
    <Bay name="${prefix}_B1_LongBayName">${scope(`${prefix}_B1`)}${equipment(`${prefix}_B1`)}</Bay>
    <Bay name="${prefix}_B2">${scope(`${prefix}_B2`)}${equipment(`${prefix}_B2`)}</Bay>
  </VoltageLevel>`;
  const prefixes = ['S', 'V1', 'V1_B1', 'V1_B2', 'V2', 'V2_B1', 'V2_B2'];
  return new DOMParser().parseFromString(`<SCL xmlns="http://www.iec.ch/61850/2003/SCL">
    <Substation name="Substation_LongName">${scope('S')}${equipment('S')}
      ${voltageLevel('V1')}${voltageLevel('V2')}
    </Substation>
    ${prefixes.flatMap(prefix => names.map(name => `<IED name="${prefix}_${name}"/>`)).join('')}
  </SCL>`, 'application/xml');
}

function checkReservations(doc: XMLDocument, measure: MeasureLabel) {
  const items = [
    ...iedReferences(doc),
    ...doc.querySelectorAll('ConductingEquipment, PowerTransformer'),
  ];
  const boxes = items.map((element) => {
    const target = resolveIed(element) ?? element;
    const size = itemFootprint(target, measure);
    const rect = {
      x: attribute(element, 'x') - size.offsetX,
      y: attribute(element, 'y') - size.offsetY,
      width: size.width,
      height: size.height,
    };
    const parent = element.localName === 'Reference' ? element.parentElement!.parentElement! : element.parentElement!;
    expect(rect.x).to.be.at.least(parent.localName === 'Substation' ? 0 : attribute(parent, 'x'));
    expect(rect.y).to.be.at.least(parent.localName === 'Substation' ? 0 : attribute(parent, 'y'));
    const parentX = parent.localName === 'Substation' ? 0 : attribute(parent, 'x');
    const parentY = parent.localName === 'Substation' ? 0 : attribute(parent, 'y');
    expect(rect.x + rect.width).to.be.at.most(parentX + attribute(parent, 'w'));
    expect(rect.y + rect.height).to.be.at.most(parentY + attribute(parent, 'h'));
    return rect;
  });
  boxes.forEach((box, index) => {
    for (let other = index + 1; other < boxes.length; other += 1) {
      expect(overlaps(box, boxes[other]), `items ${index} and ${other}`).to.equal(false);
    }
  });
}

// getBBox is local to the SVG element; transform it into the root's diagram units.
function diagramBounds(element: SVGGraphicsElement, root: SVGSVGElement): Rect {
  const box = element.getBBox();
  const transform = root.getScreenCTM()!.inverse().multiply(element.getScreenCTM()!);
  const start = new DOMPoint(box.x, box.y).matrixTransform(transform);
  const end = new DOMPoint(box.x + box.width, box.y + box.height).matrixTransform(transform);
  return { x: start.x, y: start.y, width: end.x - start.x, height: end.y - start.y };
}

customElements.define('layout-test-viewer', SldSubstationViewer);

describe('Label-aware auto layout', () => {
  it('plans without mutation and keeps mixed item reservations separated and contained at every scope', () => {
    const doc = sample();
    const before = doc.documentElement.cloneNode(true);
    const measure: MeasureLabel = (text, size) => ({ width: text.length * size, height: 1 });
    const edits = createZeroLineLayoutEdits(doc, measure);
    expect(doc.documentElement.isEqualNode(before)).to.equal(true);
    const editor = new XMLEditor();
    editor.commit(edits);
    expect(iedReferences(doc)).to.have.lengthOf(21);
    checkReservations(doc, measure);
    editor.undo();
    expect(doc.documentElement.isEqualNode(before)).to.equal(true);
  });

  it('expands columns for long names instead of changing scope or overlapping the next item', () => {
    const short = sample();
    const long = sample();
    const editor = new XMLEditor();
    editor.commit(createZeroLineLayoutEdits(short, () => ({ width: 1, height: 1 })));
    editor.commit(createZeroLineLayoutEdits(long, () => ({ width: 30, height: 1 })));
    expect(attribute(long.querySelector('Substation')!, 'w')).to.be.greaterThan(
      attribute(short.querySelector('Substation')!, 'w')
    );
    checkReservations(long, () => ({ width: 30, height: 1 }));
  });

  it('accounts for vertical label overhang when positioning the item inside its reservation', () => {
    const doc = sample();
    const measure: MeasureLabel = () => ({ width: 4, height: 4 });
    new XMLEditor().commit(createZeroLineLayoutEdits(doc, measure));
    checkReservations(doc, measure);
  });

  for (const equipment of ['all', 'conducting', 'none']) {
    it(`keeps rendered bounds separated and zoom-independent (${equipment} equipment)`, async () => {
      const doc = sample();
      if (equipment !== 'all') {
        doc.querySelectorAll('PowerTransformer').forEach(transformer => transformer.remove());
      }
      if (equipment === 'none') {
        doc.querySelectorAll('ConductingEquipment').forEach(element => element.remove());
      }
      const measure = await prepareLabelMeasurement();
      new XMLEditor().commit(createZeroLineLayoutEdits(doc, measure));
      const substation = doc.querySelector('Substation')!;
      const viewer = await fixture<SldSubstationViewer>(html`<layout-test-viewer
        .doc=${doc} .substation=${substation} .showLabels=${true} .showIeds=${true}
        .disabled=${true}
      ></layout-test-viewer>`);
      await viewer.updateComplete;

      for (const gridSize of [16, 48]) {
        viewer.gridSize = gridSize;
        await viewer.updateComplete;
        const svg = viewer.shadowRoot!.querySelector<SVGSVGElement>('svg#sld')!;
        const artifacts = Array.from(svg.querySelectorAll<SVGGraphicsElement>(
          'g.ied, g.equipment, g.transformer, g.label text'
        ));
        expect(svg.querySelectorAll('g.ied')).to.have.lengthOf(21);
        expect(svg.querySelectorAll('g.equipment')).to.have.lengthOf(equipment === 'none' ? 0 : 12);
        expect(svg.querySelectorAll('g.transformer')).to.have.lengthOf(equipment === 'all' ? 7 : 0);
        const labelCount = equipment === 'all' ? 48 : equipment === 'conducting' ? 41 : 27;
        expect(svg.querySelectorAll('g.label text')).to.have.lengthOf(labelCount);
        const boxes = artifacts.map(artifact => diagramBounds(artifact, svg));
        boxes.forEach((box, index) => {
          expect(box.width).to.be.greaterThan(0);
          expect(box.x).to.be.at.least(0);
          expect(box.y).to.be.at.least(0);
          expect(box.x + box.width).to.be.at.most(attribute(substation, 'w'));
          expect(box.y + box.height).to.be.at.most(attribute(substation, 'h'));
          for (let other = index + 1; other < boxes.length; other += 1) {
            expect(overlaps(box, boxes[other]),
              `${artifacts[index].outerHTML} overlaps ${artifacts[other].outerHTML}`
            ).to.equal(false);
          }
        });
      }
    });
  }
});
