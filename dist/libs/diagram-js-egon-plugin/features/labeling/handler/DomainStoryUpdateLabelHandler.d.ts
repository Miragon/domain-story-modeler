import { DomainStoryModeling } from '../../modeling/DomainStoryModeling';
import { DomainStoryTextRenderer } from '../../text-renderer/DomainStoryTextRenderer';
import { ElementLike } from 'diagram-js/lib/model/Types';
import { default as CommandHandler } from 'diagram-js/lib/command/CommandHandler';
import { CommandContext } from 'diagram-js/lib/command/CommandStack';

export declare class DomainStoryUpdateLabelHandler implements CommandHandler {
    private readonly modeling;
    private readonly domainStoryTextRenderer;
    static $inject: string[];
    constructor(modeling: DomainStoryModeling, domainStoryTextRenderer: DomainStoryTextRenderer);
    execute(context: CommandContext): ElementLike[];
    revert(context: CommandContext): ElementLike[];
    postExecute(context: CommandContext): void;
    private setText;
}
