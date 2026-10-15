// Compatibility snapshot of oscd-editor-sld 1.0.0 drawing/artifacts/label.ts.
// Replace with public editor geometry exports when available.
export const labelTypography = {
  family: 'Roboto, sans-serif',
  weight: 400,
  size: 0.6,
  equipmentSize: 0.45,
};

export function labelTextPosition(lx: number, ly: number): [number, number] {
  return [lx + 0.1, ly - 0.5];
}
