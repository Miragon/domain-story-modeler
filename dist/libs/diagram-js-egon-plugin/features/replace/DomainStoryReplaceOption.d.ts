import { Shape } from 'diagram-js/lib/model/Types';
import { IconDictionaryService } from '../../icon-set-config/service/IconDictionaryService';

export type ReplaceOption = {
    label: string;
    actionName: string;
    className: string;
    target: Partial<Shape>;
};
export declare class DomainStoryReplaceOption {
    private readonly iconDictionaryService;
    static $inject: string[];
    constructor(iconDictionaryService: IconDictionaryService);
    actorReplaceOptions(name: string): ReplaceOption[];
    workObjectReplaceOptions(name: string): ReplaceOption[];
}
