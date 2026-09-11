import { default as EventBus } from 'diagram-js/lib/core/EventBus';
import { default as ElementRegistry } from 'diagram-js/lib/core/ElementRegistry';
import { default as Canvas } from 'diagram-js/lib/core/Canvas';
import { default as ContextPad } from 'diagram-js/lib/features/context-pad/ContextPad';

/**
 * Custom ContextPad that uses element model bounds instead of SVG graphics bounds
 * for positioning. This ensures the context pad is positioned correctly relative
 * to the element's logical position rather than its rendered SVG bounds.
 */
export declare class DomainStoryContextPad extends ContextPad {
    static $inject: string[];
    constructor(canvas: Canvas, elementRegistry: ElementRegistry, eventBus: EventBus, scheduler: any);
    /**
     * Calculate target bounds from element model coordinates instead of SVG graphics bounds.
     * This fixes positioning issues where the SVG bounding box differs from the element's
     * logical bounds (e.g., due to labels, invisible elements, or viewBox differences).
     */
    private getTargetBoundsFromModel;
}
