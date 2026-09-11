import { CanvasObject } from './canvasObject';

export interface RootObject {
    children: CanvasObject[];
    id: string;
}
export declare const testRoot: RootObject;
