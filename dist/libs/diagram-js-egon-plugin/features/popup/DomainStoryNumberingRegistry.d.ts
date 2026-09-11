import { ActivityBusinessObject } from '../../domain/entities/activityBusinessObject';
import { default as CommandStack } from 'diagram-js/lib/command/CommandStack';
import { ActivityCanvasObject } from '../../domain/entities/activityCanvasObject';
import { ElementRegistryService } from '../../domain/service/ElementRegistryService';
import { Element } from 'diagram-js/lib/model/Types';
import { default as EventBus } from 'diagram-js/lib/core/EventBus';

export declare class DomainStoryNumberingRegistry {
    private readonly eventBus;
    private readonly commandStack;
    private readonly domainStoryElementRegistryService;
    static $inject: string[];
    /**
     * Specifies the position of the activity in the sequence.
     */
    private numberRegistry;
    /**
     * Specifies whether the index may occur multiple times.
     */
    private multipleNumberRegistry;
    constructor(eventBus: EventBus, commandStack: CommandStack, domainStoryElementRegistryService: ElementRegistryService);
    /**
     * @returns copy of registry
     */
    getNumberRegistry(): SVGElement[];
    getMultipleNumberRegistry(): boolean[];
    add(renderedNumber: SVGElement, number: number): void;
    setNumberIsMultiple(number: number, multi: boolean): void;
    updateMultipleNumberRegistry(activityBusinessObjects: ActivityBusinessObject[]): void;
    /**
     * Get the IDs of activities with their associated number, only returns activities that are originating from an actor
     */
    getNumbersAndIDs(): {
        id: string;
        number: number | undefined;
    }[];
    /**
     * Determine the next available number that is not yet used
     */
    generateAutomaticNumber(elementActivity: Element): number;
    /**
     * update the numbers at the activities when generating a new activity
     */
    updateExistingNumbersAtGeneration(activitiesFromActors: ActivityCanvasObject[], wantedNumber: number): void;
    /**
     * Update the numbers at the activities when editing an activity
     */
    updateExistingNumbersAtEditing(activitiesFromActors: ActivityCanvasObject[], wantedNumber: number): void;
    /**
     * Find all gaps in the sequence starting from 1.
     * @returns Array of missing numbers from 1 to max
     * @example [1, 4, 5, 7] -> [2, 3, 6]
     * @example [3, 5, 5, 8] -> [1, 2, 4, 6, 7]
     */
    private setNumberOfActivity;
}
