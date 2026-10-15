import { labelTextPosition, labelTypography } from './sld-editor-foundations.js';

export const layoutClearance = 0.4;

export type LabelSize = { readonly width: number; readonly height: number };

export type MeasureLabel = (text: string, fontSize: number) => LabelSize;

export type Footprint = {
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
  labelX: number;
  labelY: number;
};

export async function prepareLabelMeasurement(): Promise<MeasureLabel> {
  await document.fonts.load(
    `${labelTypography.weight} ${labelTypography.size}px ${labelTypography.family}`,
  );
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('style', 'position: fixed; width: 0; height: 0; visibility: hidden; pointer-events: none');
  const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  textElement.setAttribute('font-family', labelTypography.family);
  textElement.setAttribute('font-weight', String(labelTypography.weight));
  textElement.setAttribute('alignment-baseline', 'central');
  svg.append(textElement);
  const sizes = new Map<string, LabelSize>();
  return (text, fontSize) => {
    const key = `${fontSize}:${text}`;
    let size = sizes.get(key);
    if (size === undefined) {
      // Native SVG bounds include glyph rounding and central-baseline overhang
      // that scaled canvas metrics miss at the editor's small diagram-unit fonts.
      textElement.setAttribute('font-size', `${fontSize}px`);
      textElement.textContent = text;
      document.body.append(svg);
      try {
        const bounds = textElement.getBBox();
        size = {
          width: Math.max(0, bounds.x + bounds.width) + Math.max(0, -bounds.x),
          height: 2 * Math.max(Math.abs(bounds.y), Math.abs(bounds.y + bounds.height)),
        };
      } finally {
        svg.remove();
      }
      sizes.set(key, size);
    }
    return size;
  };
}

function labelSize(element: Element, measure: MeasureLabel): LabelSize {
  return measure(element.getAttribute('name') ?? '', element.localName === 'ConductingEquipment'
    ? labelTypography.equipmentSize : labelTypography.size);
}

export function labelWidth(element: Element, measure: MeasureLabel): number {
  return labelSize(element, measure).width;
}

export function layoutLabelOffset(element: Element): [number, number] {
  if (element.localName === 'IED') {
    return [0, 2];
  }
  return element.localName === 'PowerTransformer' ? [1.5, -0.5] : [1, 1];
}

export function itemFootprint(element: Element, measure: MeasureLabel): Footprint {
  const transformer = element.localName === 'PowerTransformer';
  const label = labelSize(element, measure);
  const [labelX, labelY] = layoutLabelOffset(element);
  const [textX, textY] = labelTextPosition(labelX, labelY);
  // Conservative default transformer envelope includes winding/port overhang.
  const left = transformer ? -1 : 0;
  const top = Math.floor(Math.min(transformer ? -1 : 0, textY - label.height / 2));
  const right = Math.max(transformer ? 2 : 1, textX + label.width);
  const bottom = Math.max(transformer ? 3 : 1, textY + label.height / 2);
  return {
    width: Math.ceil(right - left + layoutClearance),
    height: Math.ceil(bottom - top + layoutClearance),
    offsetX: -left,
    offsetY: -top,
    labelX,
    labelY,
  };
}
