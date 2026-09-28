import { describe, expect, it } from "vitest";
import * as modelerTypes from "./index";

describe("@egon/modeler-types entrypoint", () => {
    it("exports the canonical EGN v4 empty story", () => {
        const story = modelerTypes.createEmptyStory();

        expect(story).toMatchObject({
            iconSet: { name: "default" },
            domainStory: {
                businessObjects: [],
                title: "",
                description: "",
                version: "4.0.0",
            },
        });
        expect(modelerTypes.isV4DomainStoryDocument(story)).toBe(true);
    });

    it("returns detached icon maps for every caller", () => {
        const first = modelerTypes.createEmptyStory();
        const second = modelerTypes.createEmptyStory();

        first.iconSet.actors.Custom = "<svg />";

        expect(second.iconSet.actors).not.toHaveProperty("Custom");
        expect(first.iconSet.actors).not.toBe(second.iconSet.actors);
        expect(first.iconSet.workObjects).not.toBe(second.iconSet.workObjects);
    });

    it("recognizes the minimal legacy compatibility shape", () => {
        const legacy: modelerTypes.LegacyDomainStoryDocument = {
            domain: {
                name: "legacy",
                actors: {},
                workObjects: {},
            },
            dst: [],
        };

        expect(modelerTypes.isV4DomainStoryDocument(legacy)).toBe(false);
    });
});
