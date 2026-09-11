import { DomainStoryDocument, IconCategory, IconSet, IconSetData, ViewportData } from '../domain';
import { IconPort, ModelerPort } from './ports';
import { EgonClientConfig } from './EgonClientConfig';
import { ModuleDeclaration } from 'didi';

/**
 * User-friendly event types exposed by EgonClient.
 */
export type EgonEventMap = {
    "story.changed": () => void;
    "viewport.changed": (viewport: ViewportData) => void;
    "icons.changed": (icons: IconSet) => void;
};
export type EgonEventName = keyof EgonEventMap;
/**
 * Optional port injection for testing purposes.
 * When provided, EgonClient will use these ports instead of creating adapters.
 */
export interface EgonClientPorts {
    modelerPort: ModelerPort;
    iconPort: IconPort;
}
/**
 * EgonClient - Application Service / Facade
 *
 * This is the main entry point for consumers of the diagram-js-egon-plugin.
 * It orchestrates use cases by coordinating between ports (abstractions)
 * and provides a clean, domain-focused API.
 *
 * Following DDD principles:
 * - Acts as an Application Service that coordinates workflows
 * - Depends on port interfaces, not concrete implementations
 * - Maps internal events to user-friendly event names
 * - Hides infrastructure complexity from consumers
 */
export declare class EgonClient {
    private readonly modelerPort;
    private readonly iconPort;
    private constructor();
    /**
     * Creates a new EgonClient instance.
     *
     * @param config - Configuration options for the client
     * @param additionalModules - Optional array of additional diagram-js modules
     * @param ports - Optional port injection for testing (bypasses adapter creation)
     */
    static create(config: EgonClientConfig, additionalModules?: ModuleDeclaration[], ports?: EgonClientPorts): Promise<EgonClient>;
    /**
     * Import a domain story document into the diagram.
     * Icons from the document's domain section are automatically loaded.
     */
    import(document: DomainStoryDocument): void;
    /**
     * Export the current diagram state as a domain story document.
     */
    export(): DomainStoryDocument;
    /**
     * Subscribe to an event.
     */
    on<E extends EgonEventName>(event: E, callback: EgonEventMap[E]): void;
    /**
     * Unsubscribe from an event.
     */
    off<E extends EgonEventName>(event: E, callback: EgonEventMap[E]): void;
    /**
     * Get the current viewport.
     */
    getViewport(): ViewportData;
    /**
     * Set the viewport.
     */
    setViewport(viewport: ViewportData): void;
    /**
     * Load a set of icons (actors and/or work objects).
     * Merges with existing icons; existing icons with the same name are overwritten.
     */
    loadIcons(icons: Partial<IconSetData>): void;
    /**
     * Add a single icon.
     */
    addIcon(category: IconCategory, name: string, svg: string): void;
    /**
     * Remove a single icon.
     */
    removeIcon(category: IconCategory, name: string): void;
    /**
     * Get all currently registered icons.
     */
    getIcons(): IconSet;
    /**
     * Check if a specific icon is registered.
     */
    hasIcon(category: IconCategory, name: string): boolean;
    /**
     * Destroy the client and clean up resources.
     */
    destroy(): void;
}
