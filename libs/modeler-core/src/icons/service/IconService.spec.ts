import { createEmptyStory } from "@egon/modeler-types";
import { describe, expect, it } from "vitest";
import { IconType } from "../domain";
import { IconHostPorts, IconService, contains } from "./IconService";

function fixture(root = "file:///workspace") {
    const files = new Map<string, string>();
    const directories = new Map<string, Array<{ name: string; kind: "file" | "directory" }>>();
    const host: IconHostPorts = {
        workspaceFolders: { getWorkspaceFolder: () => root },
        files: {
            joinPath: (dir, name) => `${dir.replace(/\/$/, "")}/${name}`,
            parentPath: (id) => id.slice(0, id.lastIndexOf("/")) || "/",
            readDirectory: async (id) => directories.get(id) ?? [],
            readFile: async (id) => {
                if (!files.has(id)) throw Error(`missing ${id}`);
                return files.get(id)!;
            },
        },
    };
    function add(directory: string, name: string, svg: string, category = "actors") {
        const base = `${directory}/.egon/icons`;
        const path = `${base}/${category}`;
        directories.set(path, [...(directories.get(path) ?? []), { name, kind: "file" }]);
        files.set(`${path}/${name}`, svg);
    }
    return { host, files, directories, add, service: new IconService(host) };
}
function story(actors: Record<string, string> = {}) {
    const doc = createEmptyStory();
    doc.iconSet.actors = actors;
    return JSON.stringify(doc);
}

describe("IconService", () => {
    it("selects the nearest ancestor and stable first collision", async () => {
        const f = fixture();
        f.add("file:///workspace", "Customer.svg", "root");
        f.add("file:///workspace/team", "Customer.svg", "near");
        f.add("file:///workspace/team", "Customer.other.svg", "later");
        const icons = await f.service.discover("file:///workspace/team/story.egn");
        expect(icons).toEqual([{ type: IconType.Actor, name: "Customer", svg: "later", source: "file:///workspace/team/.egon/icons/actors/Customer.other.svg" }]);
    });

    it("excludes sibling prefixes, other authorities, and path-case changes", () => {
        expect(contains("file:///workspace/team", "file:///workspace/teammate")).toBe(false);
        expect(contains("memfs://one/C:/Team", "memfs://two/c:/Team/story.egn")).toBe(false);
        expect(contains("file:///C:/Team", "file:///c:/Team/story.egn")).toBe(true);
        expect(contains("file:///C:/Team", "file:///c:/team/story.egn")).toBe(false);
        expect(contains("file:///", "file:///story.egn")).toBe(true);
        expect(contains("memfs://host/C:/encoded%20name", "memfs://host/c:/encoded%20name/story.egn")).toBe(true);
    });

    it("recurses through category folders and stops at the nested workspace root", async () => {
        const f = fixture("memfs://host/workspace/team");
        const base = "memfs://host/workspace/team/.egon/icons/actors";
        f.directories.set(base, [{ name: "sub", kind: "directory" }]);
        f.directories.set(`${base}/sub`, [{ name: "Review.svg", kind: "file" }]);
        f.files.set(`${base}/sub/Review.svg`, "review");
        f.add("memfs://host/workspace", "Outside.svg", "outside");
        expect(await f.service.discover("memfs://host/workspace/team/story.egn")).toEqual([
            { type: IconType.Actor, name: "Review", svg: "review", source: `${base}/sub/Review.svg` },
        ]);
    });

    it("preserves embedded icons and exact no-ops, then removes only matching managed icons after deletion", async () => {
        const f = fixture();
        f.add("file:///workspace", "Customer.svg", "root");
        let icons = await f.service.discover("file:///workspace/story.egn");
        const id = "file:///workspace/story.egn";
        const first = f.service.reconcile(id, story({ Manual: "embedded" }), icons);
        expect(JSON.parse(first.text).iconSet.actors).toEqual({ Manual: "embedded", Customer: "root" });
        f.service.commit(id, first);
        expect(f.service.reconcile(id, first.text, icons).text).toBe(first.text);
        f.directories.clear();
        icons = await f.service.discover(id);
        const deleted = f.service.reconcile(id, first.text, icons, true);
        expect(JSON.parse(deleted.text).iconSet.actors).toEqual({ Manual: "embedded" });
        const edited = first.text.replace('"Customer": "root"', '"Customer": "manual edit"');
        expect(JSON.parse(f.service.reconcile(id, edited, icons, true).text).iconSet.actors.Customer).toBe("manual edit");
    });

    it("uses ancestor fallback before deleting a managed icon", async () => {
        const f = fixture();
        f.add("file:///workspace", "Customer.svg", "root");
        f.add("file:///workspace/team", "Customer.svg", "near");
        const id = "file:///workspace/team/story.egn";
        const first = f.service.reconcile(id, story(), await f.service.discover(id));
        f.service.commit(id, first);
        f.directories.delete("file:///workspace/team/.egon/icons/actors");
        const next = f.service.reconcile(id, first.text, await f.service.discover(id), true);
        expect(JSON.parse(next.text).iconSet.actors.Customer).toBe("root");
    });

    it("validates the envelope and preserves legacy fields", () => {
        const f = fixture();
        const icon = { type: IconType.Actor, name: "Customer", svg: "svg", source: "file:///workspace/.egon/icons/actors/Customer.svg" };
        expect(() => f.service.reconcile("file:///workspace/story.egn", "{}", [icon])).toThrow();
        const legacy = JSON.stringify({ domain: { name: "legacy", actors: {}, workObjects: {} }, dst: [], custom: 12 });
        const result = f.service.reconcile("file:///workspace/story.egn", legacy, [icon]);
        expect(JSON.parse(result.text)).toMatchObject({ domain: { actors: { Customer: "svg" } }, dst: [], custom: 12 });
    });

    it("preserves v4 story content and metadata while reconciling icons", () => {
        const f = fixture();
        const document = createEmptyStory();
        document.domainStory.title = "Retained title";
        document.domainStory.businessObjects = [{ id: "actor-1", type: "domainStory:actorPerson" }];
        document.iconSet.workObjects["Manual"] = "embedded";
        const original = { ...document, metadata: { owner: "team" } };
        const icon = { type: IconType.Actor, name: "Customer", svg: "svg", source: "file:///workspace/.egon/icons/actors/Customer.svg" };
        const result = JSON.parse(f.service.reconcile("file:///workspace/story.egn", JSON.stringify(original), [icon]).text);
        expect(result.domainStory).toEqual(original.domainStory);
        expect(result.metadata).toEqual(original.metadata);
        expect(result.iconSet.workObjects).toEqual(original.iconSet.workObjects);
        expect(result.iconSet.actors).toEqual({ ...original.iconSet.actors, Customer: "svg" });
    });

    it("skips empty SVGs and leaves ownership uncommitted after read failures", async () => {
        const f = fixture();
        f.add("file:///workspace", "Empty.svg", " \n");
        expect(await f.service.discover("file:///workspace/story.egn")).toEqual([]);
        f.add("file:///workspace", "Missing.svg", "data");
        f.files.delete("file:///workspace/.egon/icons/actors/Missing.svg");
        await expect(f.service.discover("file:///workspace/story.egn")).rejects.toThrow("missing");
    });
});
