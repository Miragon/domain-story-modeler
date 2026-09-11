import { DomainStoryNumberingRegistry } from '../../popup/DomainStoryNumberingRegistry';
import { DomainStoryModeling } from '../../modeling/DomainStoryModeling';
import { ElementRegistryService } from '../../../domain/service/ElementRegistryService';
import { ElementLike } from 'diagram-js/lib/model/Types';
import { default as CommandHandler } from 'diagram-js/lib/command/CommandHandler';
import { default as EventBus } from 'diagram-js/lib/core/EventBus';
import { CommandContext } from 'diagram-js/lib/command/CommandStack';

export declare class ActivityChangedHandler implements CommandHandler {
    private readonly modeling;
    private readonly elementRegistryService;
    private readonly eventBus;
    private readonly numberingRegistry;
    static $inject: string[];
    constructor(modeling: DomainStoryModeling, elementRegistryService: ElementRegistryService, eventBus: EventBus, numberingRegistry: DomainStoryNumberingRegistry);
    preExecute(context: CommandContext): void;
    execute(context: CommandContext): ElementLike[];
    revert(context: CommandContext): ElementLike[];
}
export declare class ActivityDirectionChangedHandler implements CommandHandler {
    private readonly modeling;
    private readonly eventBus;
    static $inject: string[];
    constructor(modeling: DomainStoryModeling, eventBus: EventBus);
    preExecute(context: CommandContext): void;
    execute(context: CommandContext): ElementLike[];
    revert(context: CommandContext): ElementLike[];
}
