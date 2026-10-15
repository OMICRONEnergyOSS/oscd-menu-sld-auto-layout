import { expect } from '@open-wc/testing';

import { labelTextPosition, labelTypography } from './sld-editor-foundations.js';

describe('SLD editor label conventions', () => {
  it('converts stored label coordinates to the text origin, not the click target', () => {
    expect(labelTextPosition(4, 6)).to.deep.equal([4.1, 5.5]);
    expect(labelTypography.size).to.equal(0.6);
    expect(labelTypography.equipmentSize).to.equal(0.45);
  });
});
