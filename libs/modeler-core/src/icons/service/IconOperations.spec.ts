import { describe, expect, it } from "vitest";
import {
    DomainStoryDocument,
    LegacyDomainStoryDocument,
    V4DomainStoryDocument,
    createEmptyStory,
    isV4DomainStoryDocument,
} from "@egon/modeler-types";
import { IconName, IconType } from "../domain";
import { ApplyIconChange } from "./ApplyIconChange";
import { SyncIconsFromSet } from "./SyncIconsFromSet";

const legacyDocument: LegacyDomainStoryDocument = {
    domain: {
        name: "legacy icons",
        actors: { ExistingActor: "old actor" },
        workObjects: { ExistingObject: "old object" },
        source: "workspace",
    },
    dst: [{ id: "shape_1", type: "domainStory:actorPerson" }],
    metadata: { owner: "legacy team" },
};

const v4Document: V4DomainStoryDocument = {
    iconSet: {
        name: "v4 icons",
        actors: { ExistingActor: "old actor" },
        workObjects: { ExistingObject: "old object" },
        source: "workspace",
    },
    domainStory: {
        businessObjects: [{ id: "shape_1", type: "domainStory:actorPerson" }],
        title: "A retained title",
        description: "A retained description",
        version: "4.0.0",
        scope: { pointInTime: "as-is" },
    },
    metadata: { owner: "v4 team" },
};

const formats = [
    ["legacy", legacyDocument],
    ["v4", v4Document],
] as const;

function clone(document: DomainStoryDocument): DomainStoryDocument {
    return JSON.parse(JSON.stringify(document)) as DomainStoryDocument;
}

function getIconSet(document: DomainStoryDocument) {
    return isV4DomainStoryDocument(document) ? document.iconSet : document.domain;
}

function apply(
    document: DomainStoryDocument,
    kind: "create" | "update" | "delete",
    type: IconType,
    name: string,
    svg?: string,
): DomainStoryDocument {
    const iconName = IconName.fromString(name);
    if (!iconName) {
        throw new Error("Test icon name must be valid");
    }

    return JSON.parse(
        new ApplyIconChange().execute(JSON.stringify(document), {
            kind,
            type,
            name: iconName,
            svg,
        }),
    ) as DomainStoryDocument;
}

describe.each(formats)("%s icon operations", (_format, fixture) => {
    it("creates an icon without changing story content or metadata", () => {
        const input = clone(fixture);
        const result = apply(input, "create", IconType.Actor, "NewActor", "new actor");

        expect(result).toEqual({
            ...input,
            ...(isV4DomainStoryDocument(input)
                ? {
                      iconSet: {
                          ...input.iconSet,
                          actors: { ...input.iconSet.actors, NewActor: "new actor" },
                      },
                  }
                : {
                      domain: {
                          ...input.domain,
                          actors: { ...input.domain.actors, NewActor: "new actor" },
                      },
                  }),
        });
    });

    it("updates an icon without changing the input format", () => {
        const input = clone(fixture);
        const result = apply(
            input,
            "update",
            IconType.WorkObject,
            "ExistingObject",
            "updated object",
        );

        expect(getIconSet(result).workObjects["ExistingObject"]).toBe("updated object");
        expect(isV4DomainStoryDocument(result)).toBe(isV4DomainStoryDocument(input));
        expect(
            isV4DomainStoryDocument(result)
                ? result.domainStory
                : result.dst,
        ).toEqual(isV4DomainStoryDocument(input) ? input.domainStory : input.dst);
        expect(result["metadata"]).toEqual(input["metadata"]);
    });

    it("deletes an icon without changing the input format", () => {
        const input = clone(fixture);
        const result = apply(input, "delete", IconType.Actor, "ExistingActor");

        expect(getIconSet(result).actors["ExistingActor"]).toBeUndefined();
        expect(getIconSet(result).workObjects).toEqual(
            getIconSet(input).workObjects,
        );
        expect(isV4DomainStoryDocument(result)).toBe(isV4DomainStoryDocument(input));
        expect(result["metadata"]).toEqual(input["metadata"]);
    });

    it("synchronizes icons without changing story content, metadata, or format", () => {
        const input = clone(fixture);
        const actorName = IconName.fromString("SyncedActor");
        const objectName = IconName.fromString("SyncedObject");
        if (!actorName || !objectName) {
            throw new Error("Test icon names must be valid");
        }

        const result = JSON.parse(
            new SyncIconsFromSet().execute(JSON.stringify(input), [
                { type: IconType.Actor, name: actorName, svg: "synced actor" },
                { type: IconType.WorkObject, name: objectName, svg: "synced object" },
            ]),
        ) as DomainStoryDocument;

        expect(getIconSet(result).actors["SyncedActor"]).toBe("synced actor");
        expect(getIconSet(result).workObjects["SyncedObject"]).toBe("synced object");
        expect(isV4DomainStoryDocument(result)).toBe(isV4DomainStoryDocument(input));
        expect(
            isV4DomainStoryDocument(result)
                ? result.domainStory
                : result.dst,
        ).toEqual(isV4DomainStoryDocument(input) ? input.domainStory : input.dst);
        expect(result["metadata"]).toEqual(input["metadata"]);
    });
});

describe("createEmptyStory", () => {
    it("creates EGN v4 documents", () => {
        const document = createEmptyStory();

        expect(isV4DomainStoryDocument(document)).toBe(true);
        if (isV4DomainStoryDocument(document)) {
            expect(document.domainStory).toMatchObject({
                businessObjects: [],
                title: "",
                description: "",
                version: "4.0.0",
            });
        }
    });
});
