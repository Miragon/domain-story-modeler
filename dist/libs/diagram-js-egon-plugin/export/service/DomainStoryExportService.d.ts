import { IconSetImportExportService } from '../../icon-set-config/service/IconSetImportExportService';
import { ElementRegistryService } from '../../domain/service/ElementRegistryService';

export declare class DomainStoryExportService {
    private readonly elementRegistryService;
    private readonly iconSetImportExportService;
    static $inject: string[];
    constructor(elementRegistryService: ElementRegistryService, iconSetImportExportService: IconSetImportExportService);
    export(): string;
    private getStory;
    private createConfigAndDST;
}
