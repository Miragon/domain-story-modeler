import { createEmptyStory, DomainStoryDocument } from "@egon/modeler-types";
import { describe, expect, it, vi } from "vitest";
import { IconHostPorts, IconInitializationError, IconService, isIconVisibleToDocument } from "./IconService";

interface FakeHost extends IconHostPorts {
    contents: Map<string, string>;
    writes: Array<[string, string]>;
    discovered: string[];
}

function fakeHost(): FakeHost {
    const contents = new Map<string, string>();
    const writes: Array<[string, string]> = [];
    const host: FakeHost = {
        contents,
        writes,
        discovered: [],
        workspaceFolders: {
            getWorkspaceFolder: () => "/workspace",
        },
        files: {
            findFiles: async (_folder, pattern) =>
                pattern.endsWith(".svg")
                    ? host.discovered.filter((path) => path.endsWith(".svg"))
                    : host.discovered.filter((path) => path.endsWith(".egn")),
            readFile: async (id) => {
                const value = contents.get(id);
                if (value === undefined) throw new Error(`Missing ${id}`);
                return value;
            },
            writeFile: async (id, text) => {
                writes.push([id, text]);
                contents.set(id, text);
            },
        },
        textDocuments: {
            readTextDocument: async (id) => {
                const value = contents.get(id);
                if (value === undefined) throw new Error(`Missing ${id}`);
                return value;
            },
        },
    };
    return host;
}

function story(text: string): DomainStoryDocument {
    return JSON.parse(text) as DomainStoryDocument;
}

describe("IconService", () => {
    it("compares Windows drive letters only when matching icon paths", () => {
        expect(isIconVisibleToDocument("file:///C:/work/.egon/icons/actors/Person.svg", "file:///c:/work", "file:///c:/work/story")).toBe(true);
    });
    it("loads visible icons in discovery order and writes an EGN v4 story", async () => {
        const host = fakeHost();
        host.discovered = [
            "/workspace/.egon/icons/actors/Root.svg",
            "/workspace/team/.egon/icons/work-objects/Document.svg",
            "/workspace/other/.egon/icons/actors/Hidden.svg",
        ];
        host.contents.set(host.discovered[0], "root-svg");
        host.contents.set(host.discovered[1], "document-svg");
        host.contents.set(host.discovered[2], "hidden-svg");
        const input = JSON.stringify(createEmptyStory());

        const output = await new IconService(host).initializeDocument(
            "/workspace/team/story.egn",
            () => input,
        );

        expect(output).toBeDefined();
        expect(story(output!).iconSet).toMatchObject({
            actors: { Root: "root-svg" },
            workObjects: { Document: "document-svg" },
        });
        expect(story(output!).iconSet.actors).not.toHaveProperty("Hidden");
        expect(host.writes).toEqual([["/workspace/team/story.egn", output]]);
    });

    it("preserves legacy story shape during initialization", async () => {
        const host = fakeHost();
        const icon = "/workspace/.egon/icons/actors/Customer.svg";
        host.discovered = [icon];
        host.contents.set(icon, "customer-svg");
        const input = JSON.stringify({
            domain: { name: "legacy", actors: {}, workObjects: {} },
            dst: [{ id: "shape" }],
            metadata: { owner: "team" },
        });

        const output = await new IconService(host).initializeDocument(
            "/workspace/story.egn",
            () => input,
        );

        expect(story(output!)).toMatchObject({
            domain: { actors: { Customer: "customer-svg" } },
            dst: [{ id: "shape" }],
            metadata: { owner: "team" },
        });
        expect(story(output!)).not.toHaveProperty("iconSet");
    });

    it("does not write when discovery or reading fails", async () => {
        const host = fakeHost();
        host.discovered = ["/workspace/.egon/icons/actors/Missing.svg"];

        await expect(
            new IconService(host).initializeDocument("/workspace/story.egn", () =>
                JSON.stringify(createEmptyStory()),
            ),
        ).rejects.toMatchObject<Partial<IconInitializationError>>({
            stage: "load",
        });
        expect(host.writes).toEqual([]);
    });

    it("reports a write failure without retrying it", async () => {
        const host = fakeHost();
        const write = vi.fn().mockRejectedValue(new Error("filesystem unavailable"));
        host.files.writeFile = write;

        await expect(
            new IconService(host).initializeDocument("/workspace/story.egn", () =>
                JSON.stringify(createEmptyStory()),
            ),
        ).rejects.toMatchObject<Partial<IconInitializationError>>({
            stage: "write",
        });
        expect(write).toHaveBeenCalledOnce();
    });

    it("stops after delayed discovery when its lifetime retires", async () => {
        const host = fakeHost();
        let finishDiscovery: ((ids: string[]) => void) | undefined;
        host.files.findFiles = vi.fn(
            () =>
                new Promise<string[]>((resolve) => {
                    finishDiscovery = resolve;
                }),
        );
        const lifetime = { isRetired: false };
        const initializing = new IconService(host).initializeDocument(
            "/workspace/story.egn",
            () => JSON.stringify(createEmptyStory()),
            lifetime,
        );

        lifetime.isRetired = true;
        finishDiscovery?.([]);

        await expect(initializing).resolves.toBeUndefined();
        expect(host.writes).toEqual([]);
    });

    it.each(["create", "update", "delete"] as const)(
        "applies an icon %s to affected closed documents",
        async (kind) => {
            const host = fakeHost();
            const icon = "/workspace/team/.egon/icons/actors/Customer.svg";
            const affected = "/workspace/team/story.egn";
            const unaffected = "/workspace/other/story.egn";
            host.discovered = [affected, unaffected];
            host.contents.set(icon, "new-svg");
            const initial = createEmptyStory();
            initial.iconSet.actors.Customer = "old-svg";
            host.contents.set(affected, JSON.stringify(initial));
            host.contents.set(unaffected, JSON.stringify(createEmptyStory()));

            await new IconService(host).applyChange(icon, kind);

            expect(host.writes).toHaveLength(1);
            expect(host.writes[0][0]).toBe(affected);
            const actors = story(host.writes[0][1]).iconSet.actors;
            expect(actors.Customer).toBe(kind === "delete" ? undefined : "new-svg");
        },
    );

    it("ignores an empty created or updated SVG", async () => {
        const host = fakeHost();
        const icon = "/workspace/.egon/icons/actors/Empty.svg";
        host.discovered = ["/workspace/story.egn"];
        host.contents.set(icon, " \n");

        await new IconService(host).applyChange(icon, "update");

        expect(host.writes).toEqual([]);
    });
});
