import { ElementLike } from 'diagram-js/lib/model/Types';
import { CommandContext } from 'diagram-js/lib/command/CommandStack';
import { default as CommandHandler } from 'diagram-js/lib/command/CommandHandler';
import { default as EventBus } from 'diagram-js/lib/core/EventBus';

export declare class ElementColorChangeHandler implements CommandHandler {
    private readonly eventBus;
    static $inject: string[];
    constructor(eventBus: EventBus);
    preExecute(context: CommandContext): void;
    execute(context: CommandContext): ElementLike[];
    revert(context: CommandContext): ElementLike[];
}
export declare class RemoveGroupWithoutChildrenHandler implements CommandHandler {
    private readonly eventBus;
    static $inject: string[];
    constructor(eventBus: EventBus);
    preExecute(context: CommandContext): void;
    execute(context: CommandContext): ElementLike[];
    revert(context: CommandContext): ElementLike[];
}
