import { IconType } from './IconType';
import { IconName } from './IconName';

export declare const ICON_BASE_PATH = ".egon/icons";
export declare const ACTOR_ICON_PATH = ".egon/icons/actors";
export declare const WORK_OBJECT_ICON_PATH = ".egon/icons/work-objects";
export interface IconPathMetadata {
    type: IconType;
    name: IconName;
}
export declare function tryParseIconPath(path: string): IconPathMetadata | null;
