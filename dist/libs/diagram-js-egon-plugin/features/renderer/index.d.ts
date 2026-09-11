import { DomainStoryRenderer } from './DomainStoryRenderer';

declare const _default: {
    __depends__: ({
        __init__: string[];
        domainStoryTextRenderer: (string | typeof import('../text-renderer/DomainStoryTextRenderer').DomainStoryTextRenderer)[];
    } | {
        __init__: string[];
        domainStoryElementRegistryService: (string | typeof import('../..').ElementRegistryService)[];
        domainStoryDirtyFlagService: (string | typeof import('../..').DirtyFlagService)[];
    } | {
        __init__: string[];
        domainStoryIconDictionaryService: (string | typeof import('../..').IconDictionaryService)[];
        domainStoryIconSetImportExportService: (string | typeof import('../../icon-set-config/service/IconSetImportExportService').IconSetImportExportService)[];
    } | import('didi').ModuleDeclaration)[];
    __init__: string[];
    domainStoryRenderer: (string | typeof DomainStoryRenderer)[];
};
export default _default;
