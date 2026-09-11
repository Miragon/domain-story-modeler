import { Rect } from 'diagram-js/lib/util/Types';
import { Element, Shape } from 'diagram-js/lib/model/Types';
import { default as CommandStack } from 'diagram-js/lib/command/CommandStack';
import { default as ElementFactory } from 'diagram-js/lib/core/ElementFactory';
import { default as EventBus } from 'diagram-js/lib/core/EventBus';
import { default as Modeling, ModelingHints } from 'diagram-js/lib/features/modeling/Modeling';

export declare class DomainStoryModeling extends Modeling {
    private readonly commandStack;
    static $inject: string[];
    constructor(eventBus: EventBus, elementFactory: ElementFactory, commandStack: CommandStack);
    replaceShape(oldShape: Shape, newData: Partial<Shape>, hints: ModelingHints): Shape;
    updateLabel(element: Element, newLabel: string, newBounds?: Rect): void;
    updateNumber(element: Element, newNumber: number, newBounds?: Rect): void;
    removeGroup(element: Element): void;
}
