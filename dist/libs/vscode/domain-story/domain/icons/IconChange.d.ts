import { IconType } from './IconType';
import { IconName } from './IconName';

export type IconChangeKind = "create" | "update" | "delete";
export interface IconChange {
    type: IconType;
    name: IconName;
    kind: IconChangeKind;
    svg?: string;
}
