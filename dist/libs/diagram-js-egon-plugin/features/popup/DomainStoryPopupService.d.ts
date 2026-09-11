import { default as Canvas } from 'diagram-js/lib/core/Canvas';
import { ElementRegistryService } from '../../domain/service/ElementRegistryService';
import { default as CommandStack } from 'diagram-js/lib/command/CommandStack';
import { ActivityCanvasObject } from '../../domain/entities/activityCanvasObject';
import { DomainStoryNumberingRegistry } from './DomainStoryNumberingRegistry';
import { default as EventBus } from 'diagram-js/lib/core/EventBus';

export declare class DomainStoryPopupService {
    private readonly canvas;
    private readonly eventBus;
    private readonly commandStack;
    private readonly elementRegistryService;
    private readonly domainStoryNumberingRegistry;
    static $inject: string[];
    private popupElement;
    private currentUpdateCallback;
    constructor(canvas: Canvas, eventBus: EventBus, commandStack: CommandStack, elementRegistryService: ElementRegistryService, domainStoryNumberingRegistry: DomainStoryNumberingRegistry);
    open(element: ActivityCanvasObject): void;
    private close;
    private handleUpdate;
    private handleOutsideClick;
    private calculatePosition;
}
