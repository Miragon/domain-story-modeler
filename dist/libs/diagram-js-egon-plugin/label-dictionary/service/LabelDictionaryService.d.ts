import { ElementRegistryService } from '../../domain/service/ElementRegistryService';
import { IconDictionaryService } from '../../icon-set-config/service/IconDictionaryService';
import { WorkObjectLabelEntry } from '../domain/workObjectLabelEntry';
import { LabelEntry } from '../domain/labelEntry';

export declare class LabelDictionaryService {
    private readonly elementRegistryService;
    private readonly iconDictionaryService;
    static $inject: string[];
    activityLabels: LabelEntry[];
    workObjektLabels: WorkObjectLabelEntry[];
    constructor(elementRegistryService: ElementRegistryService, iconDictionaryService: IconDictionaryService);
    createLabelDictionaries(): void;
    getActivityLabels(): LabelEntry[];
    getWorkObjectLabels(): WorkObjectLabelEntry[];
    getUniqueWorkObjectNames(): string[];
}
