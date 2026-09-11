import { ActivityBusinessObject } from './activityBusinessObject';
import { Waypoint } from './waypoint';
import { CanvasObject } from './canvasObject';

export interface ActivityCanvasObject extends CanvasObject {
    source: CanvasObject;
    target: CanvasObject;
    waypoints: Waypoint[];
    businessObject: ActivityBusinessObject;
}
export declare const testActivityCanvasObject: ActivityCanvasObject;
