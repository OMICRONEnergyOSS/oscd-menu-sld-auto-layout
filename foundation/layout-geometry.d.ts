export declare const layoutClearance = 0.4;
export type LabelSize = {
    readonly width: number;
    readonly height: number;
};
export type MeasureLabel = (text: string, fontSize: number) => LabelSize;
export type Footprint = {
    width: number;
    height: number;
    offsetX: number;
    offsetY: number;
    labelX: number;
    labelY: number;
};
export declare function prepareLabelMeasurement(): Promise<MeasureLabel>;
export declare function labelWidth(element: Element, measure: MeasureLabel): number;
export declare function layoutLabelOffset(element: Element): [number, number];
export declare function itemFootprint(element: Element, measure: MeasureLabel): Footprint;
