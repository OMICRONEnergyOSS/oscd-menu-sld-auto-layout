import { expect } from '@open-wc/testing';

import { itemFootprint, prepareLabelMeasurement } from './layout-geometry.js';
import { labelTypography } from './sld-editor-foundations.js';

function item(tag: string, name: string): Element {
  return new DOMParser().parseFromString(`<${tag} name="${name}"/>`, 'application/xml').documentElement;
}

describe('Layout geometry', () => {
  it('measures proportional names in diagram units, independently of display zoom', async () => {
    const measure = await prepareLabelMeasurement();
    expect(measure('WWWWWW', 0.6).width).to.be.greaterThan(measure('iiiiii', 0.6).width);
    expect(measure('Protection', 0.45).width).to.be.lessThan(measure('Protection', 0.6).width);
    expect(measure('', 0.6).width).to.equal(0);
    expect(measure('Protection', 0.6)).to.equal(measure('Protection', 0.6));

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.textContent = 'Wide WWW protection relay';
    text.setAttribute('font-family', labelTypography.family);
    text.setAttribute('font-weight', String(labelTypography.weight));
    text.setAttribute('font-size', '0.6');
    text.setAttribute('alignment-baseline', 'central');
    svg.append(text);
    document.body.append(svg);
    try {
      const svgCount = document.querySelectorAll('svg').length;
      const measured = measure(text.textContent, 0.6);
      expect(document.querySelectorAll('svg')).to.have.lengthOf(svgCount);
      expect(measured.width).to.be.closeTo(text.getBBox().width, 0.08);
      expect(measured.height).to.be.at.least(text.getBBox().height);
      svg.setAttribute('style', 'width: 960px; height: 960px');
      expect(measured.width).to.be.closeTo(text.getBBox().width, 0.08);
    } finally {
      svg.remove();
    }
  });

  it('rounds reservations outward and places IED labels below the symbol', () => {
    const size = itemFootprint(item('IED', 'IED'), () => ({ width: 5.2, height: 1 }));
    expect(size.width).to.equal(6);
    expect(size.height).to.equal(3);
    expect(size.labelX).to.equal(0);
    expect(size.labelY).to.equal(2);
  });

  it('uses the smaller equipment font and reserves transformer overhang', () => {
    const fonts: number[] = [];
    const measure = (_text: string, font: number) => {
      fonts.push(font);
      return { width: 4, height: 1 };
    };
    const equipment = itemFootprint(item('ConductingEquipment', 'C'), measure);
    const transformer = itemFootprint(item('PowerTransformer', 'T'), measure);
    expect(fonts).to.deep.equal([0.45, 0.6]);
    expect(equipment.width).to.equal(6);
    expect(transformer.offsetX).to.equal(1);
    expect(transformer.offsetY).to.equal(2);
    expect(transformer.width).to.be.at.least(7);
    expect(transformer.height).to.be.at.least(6);
  });
});
