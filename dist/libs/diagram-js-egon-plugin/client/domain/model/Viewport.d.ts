/**
 * Value Object representing the visible area of the canvas.
 * Immutable - create a new instance for changes.
 */
export declare class Viewport {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
    constructor(x: number, y: number, width: number, height: number);
    equals(other: Viewport): boolean;
    toPlainObject(): ViewportData;
    static fromPlainObject(data: ViewportData): Viewport;
}
export interface ViewportData {
    x: number;
    y: number;
    width: number;
    height: number;
}
