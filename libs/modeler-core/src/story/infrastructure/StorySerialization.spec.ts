import { describe, expect, it } from "vitest";
import {
    createEmptyStory,
    LegacyDomainStoryDocument,
    V4DomainStoryDocument,
} from "@egon/modeler-types";
import { parseStoryOrEmpty, serializeStory } from "./StorySerialization";

describe("story serialization", () => {
    it("uses the shared canonical story for empty production input", () => {
        expect(parseStoryOrEmpty("  ")).toEqual(createEmptyStory());
    });

    it("preserves legacy documents and extension fields", () => {
        const legacy: LegacyDomainStoryDocument = {
            domain: {
                name: "legacy",
                actors: { Person: "person-svg" },
                workObjects: {},
                source: "workspace",
            },
            dst: [{ id: "shape_1" }],
            metadata: { owner: "team" },
        };

        expect(parseStoryOrEmpty(serializeStory(legacy))).toEqual(legacy);
    });

    it("preserves EGN v4 documents and extension fields", () => {
        const v4: V4DomainStoryDocument = {
            iconSet: {
                name: "custom",
                actors: {},
                workObjects: { Document: "document-svg" },
            },
            domainStory: {
                businessObjects: [{ id: "shape_1" }],
                title: "Story",
                description: "Description",
                version: "4.0.0",
                scope: { pointInTime: "as-is" },
            },
            metadata: { owner: "team" },
        };

        expect(parseStoryOrEmpty(serializeStory(v4))).toEqual(v4);
    });
});
