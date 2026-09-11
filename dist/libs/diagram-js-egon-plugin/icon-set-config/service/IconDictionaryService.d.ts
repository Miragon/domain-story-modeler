import { DomainStoryBusinessObject } from '../../domain/entities/domainStoryBusinessObject';
import { ElementTypes } from '../../domain/entities/elementTypes';
import { IconSet } from '../../domain/entities/iconSet';
import { Dictionary } from '../../domain/entities/dictionary';

export declare const ICON_CSS_CLASS_PREFIX = "icon-domain-story-";
/**
 * The dictionaries hold icons (as SVG) and icon names as key-value pairs:
 */
export declare class IconDictionaryService {
    static $inject: string[];
    private selectedActorsDictionary;
    private selectedWorkObjectsDictionary;
    constructor();
    /** Load Icons from Configuration **/
    addIconsFromIconSetConfiguration(dictionaryType: ElementTypes, iconTypes: string[]): void;
    addIconsToTypeDictionary(actorIcons: DomainStoryBusinessObject[], workObjectIcons: DomainStoryBusinessObject[]): void;
    registerIconForType(type: ElementTypes, name: string, src: string): void;
    unregisterIconForType(type: ElementTypes, name: string): void;
    updateIconRegistries(actors: DomainStoryBusinessObject[], workObjects: DomainStoryBusinessObject[], config: IconSet): void;
    addIMGToIconDictionary(input: string, name: string): void;
    addIconsToCss(customIcons: Dictionary): void;
    /** Getter & Setter **/
    getFullDictionary(): Dictionary;
    getIconsAssignedAs(type: ElementTypes): Dictionary;
    getTypeIconSRC(type: ElementTypes, name: string): string;
    getCSSClassOfIcon(name: string): string;
    getIconSource(name: string): string;
    getActorsDictionary(): Dictionary;
    getWorkObjectsDictionary(): Dictionary;
    setIconSet(iconSet: IconSet): void;
    private allInTypeDictionary;
    private extractCustomIconsFromDictionary;
}
