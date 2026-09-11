import { DomainStoryUpdateHandler } from './DomainStoryUpdateHandler';

declare const _default: {
    __depends__: ({
        __init__: string[];
        domainStoryElementRegistryService: (string | typeof import('../..').ElementRegistryService)[];
        domainStoryDirtyFlagService: (string | typeof import('../..').DirtyFlagService)[];
    } | import('didi').ModuleDeclaration | {
        __depends__: (import('didi').ModuleDeclaration | {
            __init__: string[];
            domainStoryRules: (string | typeof import('../rules/DomainStoryRules').DomainStoryRules)[];
        })[];
        modeling: (string | typeof import('../modeling/DomainStoryModeling').DomainStoryModeling)[];
    })[];
    __init__: string[];
    domainStoryUpdateHandler: (string | typeof DomainStoryUpdateHandler)[];
};
export default _default;
