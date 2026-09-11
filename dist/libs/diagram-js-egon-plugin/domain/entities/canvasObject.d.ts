import { ActivityCanvasObject } from './activityCanvasObject';
import { RootObject } from './rootObject';
import { BusinessObject } from './businessObject';

export interface CanvasObject {
    attachers: any;
    host: any;
    parent: CanvasObject | RootObject;
    businessObject: BusinessObject;
    incoming: ActivityCanvasObject[] | undefined;
    outgoing: ActivityCanvasObject[] | undefined;
    id: string;
    type: string;
    height: number;
    width: number;
    x: number;
    y: number;
    name: string;
    text: string | undefined;
    pickedColor: string | undefined;
}
export declare const testCanvasObject: CanvasObject;
