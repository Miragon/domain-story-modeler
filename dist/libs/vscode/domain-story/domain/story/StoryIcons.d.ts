import { DomainStoryDocument } from './DomainStoryDocument';
import { Icon, IconChange, IconName, IconType } from '../icons';

export declare class StoryIcons {
    private doc;
    constructor(doc: DomainStoryDocument);
    addOrUpdate(icon: Icon): void;
    delete(type: IconType, name: IconName): void;
    applyChange(change: IconChange): void;
    snapshot(): DomainStoryDocument;
    private getMap;
}
