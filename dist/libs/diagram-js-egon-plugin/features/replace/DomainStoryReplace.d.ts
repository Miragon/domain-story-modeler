import { Shape } from 'diagram-js/lib/model/Types';
import { DomainStoryModeling } from '../modeling/DomainStoryModeling';

/**
 * service that allow replacing of elements.
 */
export declare class DomainStoryReplace {
    private readonly modeling;
    static $inject: string[];
    constructor(modeling: DomainStoryModeling);
    /**
     * @param oldShape - element to be replaced
     * @param newShapeData - containing information about the new Element, for example height, width, type.
     */
    replaceElement(oldShape: Shape, newShapeData: Partial<Shape>): Shape;
    private setCenterOfElement;
}
