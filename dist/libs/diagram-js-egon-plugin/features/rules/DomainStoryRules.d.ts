import { default as RuleProvider } from 'diagram-js/lib/features/rules/RuleProvider';
import { default as EventBus } from 'diagram-js/lib/core/EventBus';
import { Element, Label } from 'diagram-js/lib/model/Types';

export declare function isGroup(element: Element): boolean;
export declare function isBackground(element: Element): boolean;
export declare function isLabel(element: Element): element is Label;
export declare class DomainStoryRules extends RuleProvider {
    static $inject: string[];
    constructor(eventBus: EventBus);
    init(): void;
    /**
     * can a shape be created on target?
     */
    private canCreate;
}
