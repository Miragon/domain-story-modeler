import { Waypoint } from './waypoint';
import { BusinessObject } from './businessObject';

export interface ActivityBusinessObject extends BusinessObject {
    number: number | undefined;
    multipleNumberAllowed: boolean;
    waypoints: Waypoint[];
    source: string;
    target: string;
}
export declare const testActivityBusinessObject: ActivityBusinessObject;
