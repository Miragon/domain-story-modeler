import { DomainStoryDocument, ViewportData } from '../domain';
import { ModelerPort } from '../application';
import { ModuleDeclaration } from 'didi';
import { default as Diagram } from 'diagram-js';

/**
 * Infrastructure adapter that implements ModelerPort using diagram-js.
 * This adapter isolates all diagram-js framework dependencies.
 */
export declare class DiagramJsModelerAdapter implements ModelerPort {
    private readonly diagram;
    private readonly eventBus;
    private readonly canvas;
    private readonly callbackRegistry;
    constructor(container: HTMLElement, width: string, height: string, additionalModules?: ModuleDeclaration[]);
    import(document: DomainStoryDocument): void;
    export(): DomainStoryDocument;
    getViewport(): ViewportData;
    setViewport(viewport: ViewportData): void;
    onStoryChanged(callback: () => void): void;
    onViewportChanged(callback: (viewport: ViewportData) => void): void;
    offStoryChanged(callback: () => void): void;
    offViewportChanged(callback: (viewport: ViewportData) => void): void;
    destroy(): void;
    /** Expose diagram instance for IconAdapter to access services */
    getDiagram(): Diagram;
    private initializeContainer;
    private initializeRootElement;
    private createDebouncedCallback;
}
