import {
    DomainStoryDocument,
    IconMap,
    isV4DomainStoryDocument,
} from "@egon/modeler-types";
import { Icon, IconChange, IconName, IconType } from "../../icons/domain";

export class StoryIcons {
    constructor(private doc: DomainStoryDocument) {}

    addOrUpdate(icon: Icon): void {
        const map = this.getMap(icon.type);
        map[icon.name.value] = icon.svg;
    }

    delete(type: IconType, name: IconName): void {
        const map = this.getMap(type);
        delete map[name.value];
    }

    applyChange(change: IconChange): void {
        switch (change.kind) {
            case "create":
            case "update":
                if (!change.svg) return;
                this.addOrUpdate({
                    type: change.type,
                    name: change.name,
                    svg: change.svg,
                });
                break;
            case "delete":
                this.delete(change.type, change.name);
                break;
        }
    }

    snapshot(): DomainStoryDocument {
        return this.doc;
    }

    private getMap(type: IconType): IconMap {
        const iconSet = isV4DomainStoryDocument(this.doc)
            ? this.doc.iconSet
            : this.doc.domain;
        return type === IconType.Actor
            ? iconSet.actors
            : iconSet.workObjects;
    }
}
