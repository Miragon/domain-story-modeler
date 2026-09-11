import { IconSet } from '../../domain/entities/iconSet';
import { IconDictionaryService } from '../../index.ts';

export interface FileConfiguration {
    actors: {
        [p: string]: any;
    };
    workObjects: {
        [p: string]: any;
    };
}
export interface IconSetConfigurationForExport {
    actors: any;
    workObjects: any;
}
export declare class IconSetImportExportService {
    private readonly iconDictionaryService;
    static $inject: string[];
    constructor(iconDictionaryService: IconDictionaryService);
    createIconSetConfiguration(fileConfiguration: FileConfiguration): IconSet;
    loadConfiguration(customConfig: IconSet): void;
    getCurrentConfigurationForExport(): IconSetConfigurationForExport | undefined;
    private getCurrentConfiguration;
    private createConfigFromDictionaries;
}
