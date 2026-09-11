import { default as Canvas } from 'diagram-js/lib/core/Canvas';
import { default as EventBus } from 'diagram-js/lib/core/EventBus';

export declare class DomainStoryLabelEditingPreview {
    static $inject: string[];
    private defaultLayer;
    private path;
    private element;
    private absoluteElementBBox;
    private gfx;
    constructor(eventBus: EventBus, canvas: Canvas);
}
