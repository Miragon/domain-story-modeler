import { IconDictionaryService } from '../../icon-set-config/service/IconDictionaryService';
import { IconSetImportExportService } from '../../icon-set-config/service/IconSetImportExportService';
import { DomainStoryElementFactory } from '../../features/element-factory/DomainStoryElementFactory';
import { default as ElementRegistry } from 'diagram-js/lib/core/ElementRegistry';
import { default as EventBus } from 'diagram-js/lib/core/EventBus';
import { default as Canvas } from 'diagram-js/lib/core/Canvas';

export declare class DomainStoryImportService {
    private readonly eventBus;
    private readonly canvas;
    private readonly elementRegistry;
    private readonly elementFactory;
    private readonly iconDictionaryService;
    private readonly iconSetImportExportService;
    static $inject: string[];
    private readonly elements;
    private readonly groupElements;
    private readonly importRepairService;
    constructor(eventBus: EventBus, canvas: Canvas, elementRegistry: ElementRegistry, elementFactory: DomainStoryElementFactory, iconDictionaryService: IconDictionaryService, iconSetImportExportService: IconSetImportExportService);
    /**
     * @throws Error if import fails
     * @param story
     */
    import(story: string): void;
    private createElementFromBusinessObject;
    private addConnection;
    private handleVersionNumber;
}
