import { Connection } from 'diagram-js/lib/model/Types';

export interface Box {
    x: number;
    y: number;
    width: number;
    height: number;
    textAlign: string;
}
export declare function numberBoxDefinitions(element: Connection): Box;
