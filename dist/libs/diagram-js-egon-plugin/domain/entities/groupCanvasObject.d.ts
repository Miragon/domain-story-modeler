import { GroupBusinessObject } from './groupBusinessObject';
import { CanvasObject } from './canvasObject';

export interface GroupCanvasObject extends CanvasObject {
    businessObject: GroupBusinessObject;
    children: CanvasObject[] | undefined;
}
export declare const testGroupCanvasObject: GroupCanvasObject;
