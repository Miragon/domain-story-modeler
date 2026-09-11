import { BusinessObject } from '../../domain/entities/businessObject';

export declare class ImportRepairService {
    checkForUnreferencedElementsInActivitiesAndRepair(elements: BusinessObject[]): boolean;
    /**
     * Ensure backwards compatibility.
     * Previously Document had no special name and was just addressed as workObject
     * Bubble was renamed to Conversation
     */
    updateCustomElementsPreviousV050(elements: BusinessObject[]): BusinessObject[];
    removeWhitespacesFromIcons(elements: BusinessObject[]): void;
    removeUnnecessaryBpmnProperties(elements: BusinessObject[]): void;
}
