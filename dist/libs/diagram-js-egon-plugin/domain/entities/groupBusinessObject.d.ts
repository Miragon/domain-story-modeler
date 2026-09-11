import { BusinessObject } from './businessObject';

export interface GroupBusinessObject extends BusinessObject {
    children: string[];
}
export declare const testGroupBusinessObject: GroupBusinessObject;
