import { DomainStoryContextPad } from './DomainStoryContextPad';
import { DomainStoryContextPadProvider } from './DomainStoryContextPadProvider';
import { default as SchedulerModule } from 'diagram-js/lib/features/scheduler';

declare const _default: {
    __depends__: ({
        __init__: string[];
        domainStoryElementRegistryService: (string | typeof import('../..').ElementRegistryService)[];
        domainStoryDirtyFlagService: (string | typeof import('../..').DirtyFlagService)[];
    } | {
        __init__: string[];
        domainStoryIconDictionaryService: (string | typeof import('../..').IconDictionaryService)[];
        domainStoryIconSetImportExportService: (string | typeof import('../../icon-set-config/service/IconSetImportExportService').IconSetImportExportService)[];
    } | import('didi').ModuleDeclaration | {
        __depends__: (import('didi').ModuleDeclaration | {
            __init__: string[];
            domainStoryRules: (string | typeof import('../rules/DomainStoryRules').DomainStoryRules)[];
        })[];
        modeling: (string | typeof import('../modeling/DomainStoryModeling').DomainStoryModeling)[];
    } | {
        __depends__: {
            __init__: string[];
            domainStoryIdFactory: (string | typeof import('../id-factory/DomainStoryIdFactory').DomainStoryIdFactory)[];
        }[];
        elementFactory: (string | typeof import('../element-factory/DomainStoryElementFactory').DomainStoryElementFactory)[];
    } | {
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
        domainStoryReplace: (string | typeof import('../replace/DomainStoryReplace').DomainStoryReplace)[];
        domainStoryReplaceOption: (string | typeof import('../replace/DomainStoryReplaceOption').DomainStoryReplaceOption)[];
        domainStoryReplaceMenuProvider: (string | typeof import('../replace/DomainStoryReplaceMenuProvider').DomainStoryReplaceMenuProvider)[];
    } | typeof SchedulerModule)[];
    __init__: string[];
    contextPad: (string | typeof DomainStoryContextPad)[];
    domainStoryContextPadProvider: (string | typeof DomainStoryContextPadProvider)[];
};
export default _default;
