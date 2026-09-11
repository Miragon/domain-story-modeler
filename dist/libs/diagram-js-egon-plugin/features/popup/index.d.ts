import { DomainStoryPopupService } from './DomainStoryPopupService';
import { DomainStoryNumberingRegistry } from './DomainStoryNumberingRegistry';

declare const _default: {
    __depends__: ({
        __init__: string[];
        domainStoryElementRegistryService: (string | typeof import('../..').ElementRegistryService)[];
        domainStoryDirtyFlagService: (string | typeof import('../..').DirtyFlagService)[];
    } | {
        __depends__: (import('didi').ModuleDeclaration | {
            __init__: string[];
            domainStoryRules: (string | typeof import('../rules/DomainStoryRules').DomainStoryRules)[];
        })[];
        modeling: (string | typeof import('../modeling/DomainStoryModeling').DomainStoryModeling)[];
    })[];
    __init__: string[];
    domainStoryNumberingRegistry: (string | typeof DomainStoryNumberingRegistry)[];
    domainStoryNumberingUi: (string | typeof DomainStoryPopupService)[];
};
export default _default;
