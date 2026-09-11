import { IconCategory, IconSet, IconSetData } from '../domain/model/IconTypes';
import { IconPort } from '../application';
import { default as Diagram } from 'diagram-js';

/**
 * Infrastructure adapter that implements IconPort using diagram-js icon services.
 * This adapter isolates all diagram-js icon-related dependencies.
 */
export declare class DiagramJsIconAdapter implements IconPort {
    private readonly iconDictionaryService;
    private readonly iconSetImportExportService;
    private readonly eventBus;
    private readonly callbackRegistry;
    constructor(diagram: Diagram);
    loadIcons(icons: Partial<IconSetData>): void;
    addIcon(category: IconCategory, name: string, svg: string): void;
    removeIcon(category: IconCategory, name: string): void;
    getIcons(): IconSet;
    hasIcon(category: IconCategory, name: string): boolean;
    onIconsChanged(callback: (icons: IconSet) => void): void;
    offIconsChanged(callback: (icons: IconSet) => void): void;
    private toElementType;
    private addIconToCss;
    private fireIconsChangedEvent;
    private createDebouncedCallback;
}
