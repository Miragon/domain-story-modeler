import { LabelDictionaryService } from '../../label-dictionary/service/LabelDictionaryService';
import { DomainStoryTextRenderer } from '../text-renderer/DomainStoryTextRenderer';
import { DomainStoryModeling } from '../modeling/DomainStoryModeling';
import { default as CommandStack } from 'diagram-js/lib/command/CommandStack';
import { default as ResizeHandles } from 'diagram-js/lib/features/resize/ResizeHandles';
import { DirectEditing } from 'diagram-js-direct-editing';
import { default as EventBus } from 'diagram-js/lib/core/EventBus';
import { default as Canvas } from 'diagram-js/lib/core/Canvas';
import { Rect } from 'diagram-js/lib/util/Types';
import { Shape } from 'diagram-js/lib/model/Types';

export declare function getNumberStash(): {
    use: boolean;
    number: number;
};
export declare function toggleStashUse(use: boolean): void;
export declare function focusElement(element: HTMLDivElement): void;
export declare class DomainStoryLabelEditingProvider {
    private readonly modeling;
    private readonly domainStoryTextRenderer;
    private readonly labelDictionaryService;
    private readonly eventBus;
    private readonly canvas;
    private readonly directEditing;
    static $inject: string[];
    constructor(modeling: DomainStoryModeling, domainStoryTextRenderer: DomainStoryTextRenderer, labelDictionaryService: LabelDictionaryService, eventBus: EventBus, canvas: Canvas, directEditing: DirectEditing, resizeHandles: ResizeHandles, commandStack: CommandStack);
    /**
     * activate direct editing for activities and text annotations.
     * @return an object with properties bounds (position and size), text and options
     */
    activate(element: Shape): any;
    /**
     * get the editing bounding box based on the element's size and position
     * @return an object containing information about position
     *         and size (fixed or minimum and/or maximum)
     */
    getEditingBBox(element: Shape): {
        bounds: {
            x: number;
            y: number;
        };
        style: {
            fontFamily: string | undefined;
            fontWeight: string | undefined;
        };
    };
    update(element: Shape, newLabel: string, bounds: Rect): void;
    private activateDirectEdit;
    private createAutocomplete;
}
