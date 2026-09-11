import { default as EventBus } from 'diagram-js/lib/core/EventBus';

type CopiedProperty = boolean | Record<string, any>;
export declare class DomainStoryPropertyCopy {
    private readonly eventBus;
    static $inject: string[];
    constructor(eventBus: EventBus);
    copyElement(sourceElement: Record<string, any>, targetElement: Record<string, any>, propertyNames?: string[]): Record<string, any>;
    copyProperty(property: Record<string, any>, parent: Record<string, any>, propertyName: string): CopiedProperty | undefined;
}
export {};
