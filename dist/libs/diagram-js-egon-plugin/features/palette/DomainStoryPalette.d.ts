import { default as EventBus } from 'diagram-js/lib/core/EventBus';
import { IconDictionaryService } from '../../icon-set-config/service/IconDictionaryService';
import { default as Palette } from 'diagram-js/lib/features/palette/Palette';
import { default as LassoTool } from 'diagram-js/lib/features/lasso-tool/LassoTool';
import { default as SpaceTool } from 'diagram-js/lib/features/space-tool/SpaceTool';
import { default as ElementFactory } from 'diagram-js/lib/core/ElementFactory';
import { default as Create } from 'diagram-js/lib/features/create/Create';
import { default as PaletteProvider, PaletteEntries, PaletteEntriesCallback } from 'diagram-js/lib/features/palette/PaletteProvider';

export declare class DomainStoryPaletteProvider implements PaletteProvider {
    private readonly create;
    private readonly elementFactory;
    private readonly spaceTool;
    private readonly lassoTool;
    private readonly iconDictionaryService;
    static $inject: string[];
    constructor(palette: Palette, eventBus: EventBus, create: Create, elementFactory: ElementFactory, spaceTool: SpaceTool, lassoTool: LassoTool, iconDictionaryService: IconDictionaryService);
    getPaletteEntries(): PaletteEntriesCallback | PaletteEntries;
    private initPalette;
    private addCanvasObjectTypes;
    private createAction;
}
