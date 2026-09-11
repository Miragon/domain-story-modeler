declare const _default: {
    __depends__: (import('didi').ModuleDeclaration | {
        __depends__: (import('didi').ModuleDeclaration | {
            __init__: string[];
            domainStoryRules: (string | typeof import('./features/rules/DomainStoryRules').DomainStoryRules)[];
        })[];
        modeling: (string | typeof import('./features/modeling/DomainStoryModeling').DomainStoryModeling)[];
    } | {
        __depends__: {
            __init__: string[];
            domainStoryIdFactory: (string | typeof import('./features/id-factory/DomainStoryIdFactory').DomainStoryIdFactory)[];
        }[];
        elementFactory: (string | typeof import('./features/element-factory/DomainStoryElementFactory').DomainStoryElementFactory)[];
    } | {
        __depends__: ({
            __init__: string[];
            domainStoryTextRenderer: (string | typeof import('./features/text-renderer/DomainStoryTextRenderer').DomainStoryTextRenderer)[];
        } | {
            __init__: string[];
            domainStoryElementRegistryService: (string | typeof import('.').ElementRegistryService)[];
            domainStoryDirtyFlagService: (string | typeof import('.').DirtyFlagService)[];
        } | {
            __init__: string[];
            domainStoryIconDictionaryService: (string | typeof import('.').IconDictionaryService)[];
            domainStoryIconSetImportExportService: (string | typeof import('./icon-set-config/service/IconSetImportExportService').IconSetImportExportService)[];
        } | import('didi').ModuleDeclaration)[];
        __init__: string[];
        domainStoryRenderer: (string | typeof import('./features/renderer/DomainStoryRenderer').DomainStoryRenderer)[];
    } | {
        __init__: string[];
        domainStoryUpdater: (string | typeof import('./features/updater/DomainStoryUpdater').DomainStoryUpdater)[];
        connectionDocking: (string | typeof import('diagram-js/lib/layout/CroppingConnectionDocking').default)[];
    } | {
        __depends__: ({
            __init__: string[];
            domainStoryElementRegistryService: (string | typeof import('.').ElementRegistryService)[];
            domainStoryDirtyFlagService: (string | typeof import('.').DirtyFlagService)[];
        } | import('didi').ModuleDeclaration | {
            __depends__: (import('didi').ModuleDeclaration | {
                __init__: string[];
                domainStoryRules: (string | typeof import('./features/rules/DomainStoryRules').DomainStoryRules)[];
            })[];
            modeling: (string | typeof import('./features/modeling/DomainStoryModeling').DomainStoryModeling)[];
        })[];
        __init__: string[];
        domainStoryUpdateHandler: (string | typeof import('./features/update-handler/DomainStoryUpdateHandler').DomainStoryUpdateHandler)[];
    } | {
        __depends__: ({
            __init__: string[];
            domainStoryIconDictionaryService: (string | typeof import('.').IconDictionaryService)[];
            domainStoryIconSetImportExportService: (string | typeof import('./icon-set-config/service/IconSetImportExportService').IconSetImportExportService)[];
        } | import('didi').ModuleDeclaration)[];
        __init__: string[];
        domainStoryPaletteProvider: (string | typeof import('./features/palette/DomainStoryPalette').DomainStoryPaletteProvider)[];
    } | {
        __depends__: ({
            __init__: string[];
            domainStoryElementRegistryService: (string | typeof import('.').ElementRegistryService)[];
            domainStoryDirtyFlagService: (string | typeof import('.').DirtyFlagService)[];
        } | {
            __init__: string[];
            domainStoryIconDictionaryService: (string | typeof import('.').IconDictionaryService)[];
            domainStoryIconSetImportExportService: (string | typeof import('./icon-set-config/service/IconSetImportExportService').IconSetImportExportService)[];
        } | import('didi').ModuleDeclaration | {
            __depends__: (import('didi').ModuleDeclaration | {
                __init__: string[];
                domainStoryRules: (string | typeof import('./features/rules/DomainStoryRules').DomainStoryRules)[];
            })[];
            modeling: (string | typeof import('./features/modeling/DomainStoryModeling').DomainStoryModeling)[];
        } | {
            __depends__: {
                __init__: string[];
                domainStoryIdFactory: (string | typeof import('./features/id-factory/DomainStoryIdFactory').DomainStoryIdFactory)[];
            }[];
            elementFactory: (string | typeof import('./features/element-factory/DomainStoryElementFactory').DomainStoryElementFactory)[];
        } | {
            __depends__: ({
                __init__: string[];
                domainStoryIconDictionaryService: (string | typeof import('.').IconDictionaryService)[];
                domainStoryIconSetImportExportService: (string | typeof import('./icon-set-config/service/IconSetImportExportService').IconSetImportExportService)[];
            } | {
                __depends__: (import('didi').ModuleDeclaration | {
                    __init__: string[];
                    domainStoryRules: (string | typeof import('./features/rules/DomainStoryRules').DomainStoryRules)[];
                })[];
                modeling: (string | typeof import('./features/modeling/DomainStoryModeling').DomainStoryModeling)[];
            })[];
            __init__: string[];
            domainStoryReplace: (string | typeof import('./features/replace/DomainStoryReplace').DomainStoryReplace)[];
            domainStoryReplaceOption: (string | typeof import('./features/replace/DomainStoryReplaceOption').DomainStoryReplaceOption)[];
            domainStoryReplaceMenuProvider: (string | typeof import('./features/replace/DomainStoryReplaceMenuProvider').DomainStoryReplaceMenuProvider)[];
        } | typeof import('diagram-js/lib/features/scheduler').default)[];
        __init__: string[];
        contextPad: (string | typeof import('./features/context-pad/DomainStoryContextPad').DomainStoryContextPad)[];
        domainStoryContextPadProvider: (string | typeof import('./features/context-pad/DomainStoryContextPadProvider').DomainStoryContextPadProvider)[];
    } | {
        __depends__: any[];
        __init__: string[];
        domainStoryLabelEditingProvider: (string | typeof import('./features/labeling/DomainStoryLabelEditingProvider').DomainStoryLabelEditingProvider)[];
        domainStoryLabelEditingPreview: (string | typeof import('./features/labeling/DomainStoryLabelEditingPreview').DomainStoryLabelEditingPreview)[];
    } | {
        __depends__: import('didi').ModuleDeclaration[];
        __init__: string[];
        domainStoryCopyPaste: (string | typeof import('./features/copy-paste/DomainStoryCopyPaste').DomainStoryCopyPaste)[];
        domainStoryPropertyCopy: (string | typeof import('./features/copy-paste/DomainStoryPropertyCopy').DomainStoryPropertyCopy)[];
    } | {
        __depends__: (import('didi').ModuleDeclaration | {
            __depends__: import('didi').ModuleDeclaration[];
            __init__: string[];
            domainStoryEditorActions: (string | typeof import('./features/editor-actions/DomainStoryEditorActions').DomainStoryEditorActions)[];
        })[];
        __init__: string[];
        domainStoryKeyboardBindings: (string | typeof import('./features/keyboard/DomainStoryKeyboardBindings').DomainStoryKeyboardBindings)[];
    } | {
        __depends__: ({
            __init__: string[];
            domainStoryElementRegistryService: (string | typeof import('.').ElementRegistryService)[];
            domainStoryDirtyFlagService: (string | typeof import('.').DirtyFlagService)[];
        } | {
            __depends__: (import('didi').ModuleDeclaration | {
                __init__: string[];
                domainStoryRules: (string | typeof import('./features/rules/DomainStoryRules').DomainStoryRules)[];
            })[];
            modeling: (string | typeof import('./features/modeling/DomainStoryModeling').DomainStoryModeling)[];
        })[];
        __init__: string[];
        domainStoryNumberingRegistry: (string | typeof import('./features/popup/DomainStoryNumberingRegistry').DomainStoryNumberingRegistry)[];
        domainStoryNumberingUi: (string | typeof import('./features/popup/DomainStoryPopupService').DomainStoryPopupService)[];
    } | {
        __depends__: ({
            __init__: string[];
            domainStoryElementRegistryService: (string | typeof import('.').ElementRegistryService)[];
            domainStoryDirtyFlagService: (string | typeof import('.').DirtyFlagService)[];
        } | {
            __init__: string[];
            domainStoryIconDictionaryService: (string | typeof import('.').IconDictionaryService)[];
            domainStoryIconSetImportExportService: (string | typeof import('./icon-set-config/service/IconSetImportExportService').IconSetImportExportService)[];
        })[];
        __init__: string[];
        domainStoryExportService: (string | typeof import('.').DomainStoryExportService)[];
    } | {
        __init__: string[];
        domainStoryImportService: (string | typeof import('.').DomainStoryImportService)[];
    })[];
};
export default _default;
