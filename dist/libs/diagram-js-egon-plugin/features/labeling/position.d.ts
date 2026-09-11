import { Point } from 'diagram-js/lib/util/Types';

export declare function countLines(str: string): number;
export declare function labelPosition(waypoints: Point[], lines?: number): {
    x: number;
    y: number;
    selected: number;
};
export declare function labelPositionX(startPoint: Point, endPoint: Point): number;
export declare function labelPositionY(startPoint: Point, endPoint: Point, lines?: number): number;
