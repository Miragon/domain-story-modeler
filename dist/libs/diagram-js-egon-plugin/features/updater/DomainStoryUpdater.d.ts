import { default as CroppingConnectionDocking } from 'diagram-js/lib/layout/CroppingConnectionDocking';
import { default as EventBus } from 'diagram-js/lib/core/EventBus';
import { default as CommandInterceptor } from 'diagram-js/lib/command/CommandInterceptor';
import { default as ElementRegistry } from 'diagram-js/lib/core/ElementRegistry';

export declare class DomainStoryUpdater extends CommandInterceptor {
    private readonly elementRegistry;
    private readonly connectionDocking;
    static $inject: string[];
    constructor(eventBus: EventBus, elementRegistry: ElementRegistry, connectionDocking: CroppingConnectionDocking);
    private updateElement;
    private updateConnection;
    private cropConnection;
    private copyWaypoints;
}
