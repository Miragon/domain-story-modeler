import { DomainStoryPropertyCopy } from './DomainStoryPropertyCopy';
import { default as EventBus } from 'diagram-js/lib/core/EventBus';

export declare class DomainStoryCopyPaste {
    private readonly domainStoryPropertyCopy;
    static $inject: string[];
    private references;
    constructor(domainStoryPropertyCopy: DomainStoryPropertyCopy, eventBus: EventBus);
    private resolveReferences;
}
