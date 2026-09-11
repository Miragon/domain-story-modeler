import { DomainStoryReplaceOption } from './DomainStoryReplaceOption';
import { DomainStoryReplace } from './DomainStoryReplace';
import { DomainStoryReplaceMenuProvider } from './DomainStoryReplaceMenuProvider';

declare const _default: {
    __depends__: ({
        __init__: string[];
        domainStoryIconDictionaryService: (string | typeof import('../..').IconDictionaryService)[];
        domainStoryIconSetImportExportService: (string | typeof import('../../icon-set-config/service/IconSetImportExportService').IconSetImportExportService)[];
    } | {
        __depends__: (import('didi').ModuleDeclaration | {
            __init__: string[];
            domainStoryRules: (string | typeof import('../rules/DomainStoryRules').DomainStoryRules)[];
        })[];
        modeling: (string | typeof import('../modeling/DomainStoryModeling').DomainStoryModeling)[];
    })[];
    __init__: string[];
    domainStoryReplace: (string | typeof DomainStoryReplace)[];
    domainStoryReplaceOption: (string | typeof DomainStoryReplaceOption)[];
    domainStoryReplaceMenuProvider: (string | typeof DomainStoryReplaceMenuProvider)[];
};
export default _default;
