import { UsedIconList } from '../entities/UsedIconList';
import { GroupCanvasObject } from '../entities/groupCanvasObject';
import { ActivityCanvasObject } from '../entities/activityCanvasObject';
import { CanvasObject } from '../entities/canvasObject';
import { default as ElementRegistry } from 'diagram-js/lib/core/ElementRegistry';

export declare class ElementRegistryService {
    private readonly registry;
    static $inject: string[];
    private fullyInitialized;
    constructor(registry: ElementRegistry);
    /**
     * Initially, the registry has only the root-Element.
     * Once the canvas has bees initialized, we adjust the reference to point to the elements on the canvas for convenience
     */
    correctInitialize(): void;
    clear(): void;
    createObjectListForDSTDownload(): CanvasObject[];
    getAllActivities(): ActivityCanvasObject[];
    getAllCanvasObjects(): CanvasObject[];
    getAllGroups(): GroupCanvasObject[];
    getActivitiesFromActors(): ActivityCanvasObject[];
    getActivityFromActorById(id: string): ActivityCanvasObject | undefined;
    getUsedIcons(): UsedIconList;
    getAllWorkobjects(): CanvasObject[];
    private fillListOfCanvasObjects;
    private checkChildForGroup;
    private getAllActors;
}
