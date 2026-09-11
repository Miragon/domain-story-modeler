export { EgonClient, type EgonEventMap, type EgonEventName, type EgonClientPorts, } from './client/application/EgonClient';
export type { EgonClientConfig } from './client/application/EgonClientConfig';
export type { ModelerPort } from './client/application/ports/ModelerPort';
export type { IconPort } from './client/application/ports/IconPort';
export type { DomainStoryDocument, DomainConfiguration, DomainStoryElement, } from './client/domain/model/DomainStoryDocument';
export type { ViewportData } from './client/domain/model/Viewport';
export type { IconSet, IconSetData, IconCategory, IconMap } from './client/domain/model/IconTypes';
export { default as EgonPlugin } from './plugin';
/** @deprecated Use EgonClient.import() instead */
export { DomainStoryImportService } from './import/service/DomainStoryImportService';
/** @deprecated Use EgonClient.export() instead */
export { DomainStoryExportService } from './export/service/DomainStoryExportService';
export { ElementRegistryService } from './domain/service/ElementRegistryService';
export { DirtyFlagService } from './domain/service/DirtyFlagService';
export { IconDictionaryService } from './icon-set-config/service/IconDictionaryService';
export { LabelDictionaryService } from './label-dictionary/service/LabelDictionaryService';
