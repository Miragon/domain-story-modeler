import { describe, expect, it, vi } from "vitest";
import { DocumentPort, ViewPort } from "../domain/hostPorts";
import { DomainStoryEditorService } from "./DomainStoryEditorService";

function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((done) => { resolve = done; });
    return { promise, resolve };
}

function fixture() {
    const texts = new Map<string, { text: string; version: number }>();
    const displays: Array<[string, string, number]> = [];
    const results: Array<[string, number, number, string]> = [];
    const view: ViewPort = {
        display: vi.fn(async (id, text, revision) => { displays.push([id, text, revision]); }),
        syncResult: vi.fn(async (id, request, revision, status) => { results.push([id, request, revision, status]); }),
    };
    const docs: DocumentPort = {
        read: vi.fn(async (id) => texts.get(id)!),
        write: vi.fn(async (id, text, version, current) => {
            const old = texts.get(id)!;
            if (!current() || old.version !== version) return { status: "stale" as const, snapshot: old };
            const snapshot = { text, version: version + 1 };
            texts.set(id, snapshot);
            return { status: "applied" as const, snapshot };
        }),
    };
    const service = new DomainStoryEditorService(docs);
    const open = (id = "file:///story.egn", text = "old") => {
        if (!texts.has(id)) texts.set(id, { text, version: 1 });
        return service.registerSession(id, text, 1, view);
    };
    return { texts, displays, results, view, docs, service, open };
}

describe("DomainStoryEditorService", () => {
    it("queues host transforms after panel writes and publishes to every panel", async () => {
        const f = fixture();
        const a = f.open();
        const b = f.open();
        const writing = f.service.syncFromWebview(a, "panel", 0, 1);
        const transforming = f.service.transformOpenDocument("file:///story.egn", (text) => `${text}+icon`);
        expect(await writing).toBe("applied");
        expect(await transforming).toBe("applied");
        expect(f.texts.get("file:///story.egn")?.text).toBe("panel+icon");
        expect(f.displays).toContainEqual([a, "panel+icon", 2]);
        expect(f.displays).toContainEqual([b, "panel+icon", 2]);
    });

    it("drops a transform when its flush version becomes stale", async () => {
        const f = fixture();
        const a = f.open();
        const state = f.service.documentState("file:///story.egn")!;
        f.service.onDocumentChanged("file:///story.egn", "source", 2);
        f.texts.set("file:///story.egn", { text: "source", version: 2 });
        expect(await f.service.transformOpenDocument("file:///story.egn", () => "icon", { ...state, sessions: [a] })).toBe("stale");
        expect(f.docs.write).not.toHaveBeenCalled();
    });

    it("accepts its own host echo while retaining a confirmed flush lease", async () => {
        const f = fixture();
        const a = f.open();
        const expected = { ...f.service.documentState("file:///story.egn")!, sessions: [a] };
        vi.mocked(f.docs.write).mockImplementationOnce(async (id, text, version) => {
            const snapshot = { text, version: version + 1 };
            f.texts.set(id, snapshot);
            f.service.onDocumentChanged(id, text, snapshot.version);
            return { status: "applied", snapshot };
        });
        expect(await f.service.transformOpenDocument("file:///story.egn", () => "icon", expected)).toBe("applied");
        expect(f.displays).toContainEqual([a, "icon", 1]);
    });

    it("does not reuse a transform across close and reopen of the same URI", async () => {
        const f = fixture();
        const a = f.open();
        const hold = deferred<void>();
        vi.mocked(f.docs.read).mockImplementationOnce(async (id) => {
            await hold.promise;
            return f.texts.get(id)!;
        });
        const pending = f.service.transformOpenDocument("file:///story.egn", () => "old icon");
        await Promise.resolve();
        f.service.closeDocument("file:///story.egn");
        f.service.dispose(a);
        f.service.registerOpenDocument("file:///story.egn", "new", 2);
        f.texts.set("file:///story.egn", { text: "new", version: 2 });
        hold.resolve();
        expect(await pending).toBe("stale");
        expect(f.docs.write).not.toHaveBeenCalled();
    });
    it("drains a posted write before confirming a clean flush", async () => {
        const f = fixture();
        const session = f.open();
        const hold = deferred<void>();
        vi.mocked(f.docs.write).mockImplementationOnce(async (id, text, version) => {
            await hold.promise;
            const snapshot = { text, version: version + 1 };
            f.texts.set(id, snapshot);
            return { status: "applied", snapshot };
        });
        const writing = f.service.syncFromWebview(session, "committed", 0, 1);
        const verified = f.service.verifyFlush("file:///story.egn", [session]);
        let settled = false;
        void verified.then(() => { settled = true; });
        await Promise.resolve();
        expect(settled).toBe(false);
        hold.resolve();
        await writing;
        await expect(verified).resolves.toBe(true);
        await expect(f.service.verifyFlush("file:///story.egn", [session], {
            content: "committed", documentRevision: 1,
        })).resolves.toBe(true);
    });

    it("rejects a flush snapshot after newer source content arrives", async () => {
        const f = fixture();
        const session = f.open();
        f.texts.set("file:///story.egn", { text: "newer source", version: 2 });
        await expect(f.service.verifyFlush("file:///story.egn", [session], {
            content: "old", documentRevision: 0,
        })).resolves.toBe(false);
        await f.service.initialize(session);
        expect(f.displays.at(-1)).toEqual([session, "newer source", 1]);
    });

    it("uses opaque, never-reused sessions and one document snapshot across panels", async () => {
        const f = fixture();
        const a = f.open("file:///a:1.egn");
        const b = f.open("file:///a:1.egn", "wrong");
        expect(a).not.toContain("file:");
        expect(a).not.toBe(b);
        await f.service.initialize(b);
        expect(f.displays.at(-1)).toEqual([b, "old", 0]);
        f.service.dispose(a);
        const c = f.open("file:///a:1.egn");
        expect(c).not.toBe(a);
    });

    it("advances once for a successful echo and updates siblings", async () => {
        const f = fixture();
        const a = f.open();
        const b = f.open();
        vi.mocked(f.docs.write).mockImplementationOnce(async (id, text, version) => {
            const snapshot = { text: text.replace(/\n/g, "\r\n"), version: version + 1 };
            f.texts.set(id, snapshot);
            f.service.onDocumentChanged(id, snapshot.text, snapshot.version);
            return { status: "applied", snapshot };
        });
        expect(await f.service.syncFromWebview(a, "new\ntext", 0, 7)).toBe("applied");
        expect(f.results).toContainEqual([a, 7, 1, "applied"]);
        expect(f.displays).toContainEqual([b, "new\r\ntext", 1]);
        await f.service.initialize(a);
        expect(f.displays.at(-1)?.[2]).toBe(1);
    });

    it("rejects conflicting panels and duplicate host notifications", async () => {
        const f = fixture();
        const a = f.open();
        const b = f.open();
        f.service.onDocumentChanged("file:///story.egn", "host", 2);
        f.service.onDocumentChanged("file:///story.egn", "host", 2);
        expect(await f.service.syncFromWebview(a, "mine", 0, 1)).toBe("stale");
        expect(f.docs.write).not.toHaveBeenCalled();
        expect(f.displays).toEqual([[a, "host", 1], [b, "host", 1]]);
    });

    it("keeps queues independent and recovers after failure", async () => {
        const f = fixture();
        const a = f.open("file:///a.egn");
        const b = f.open("file:///b.egn");
        const hold = deferred<void>();
        vi.mocked(f.docs.write).mockImplementationOnce(async () => { await hold.promise; throw new Error("disk"); });
        const failed = f.service.syncFromWebview(a, "first", 0, 1);
        await Promise.resolve();
        expect(await f.service.syncFromWebview(b, "other", 0, 1)).toBe("applied");
        hold.resolve();
        await expect(failed).rejects.toThrow("disk");
        expect(await f.service.syncFromWebview(a, "second", 0, 2)).toBe("applied");
        expect(f.results).toContainEqual([a, 1, 0, "failed"]);
    });

    it("discards queued work from a retired session but retains its document queue for reopen", async () => {
        const f = fixture();
        const a = f.open();
        const hold = deferred<void>();
        vi.mocked(f.docs.write).mockImplementationOnce(async (id, text, version) => {
            await hold.promise;
            const snapshot = { text, version: version + 1 };
            f.texts.set(id, snapshot);
            return { status: "applied", snapshot };
        });
        const first = f.service.syncFromWebview(a, "old write", 0, 1);
        await Promise.resolve();
        const queued = f.service.syncFromWebview(a, "queued", 0, 2);
        f.service.dispose(a);
        const b = f.open();
        hold.resolve();
        expect(await first).toBe("stale");
        expect(await queued).toBe("stale");
        await f.service.initialize(b);
        expect(f.displays.at(-1)).toEqual([b, "old write", 1]);
    });

    it("does not revise unchanged content and does not confuse complete URIs", async () => {
        const f = fixture();
        const a = f.open("file://one/path.egn?q=1");
        const b = f.open("file://two/path.egn?q=1");
        expect(await f.service.syncFromWebview(a, "old", 0, 1)).toBe("unchanged");
        f.service.onDocumentChanged("file://one/path.egn?q=1", "change", 2);
        await f.service.initialize(b);
        expect(f.displays.at(-1)).toEqual([b, "old", 0]);
    });

    it("advances an unrelated host edit during a write and rejects that write", async () => {
        const f = fixture();
        const a = f.open();
        const hold = deferred<void>();
        vi.mocked(f.docs.write).mockImplementationOnce(async (id, text, version) => {
            f.service.onDocumentChanged(id, "host edit", version + 1);
            await hold.promise;
            return { status: "stale", snapshot: { text: "host edit", version: version + 1 } };
        });
        const writing = f.service.syncFromWebview(a, "mine", 0, 1);
        await vi.waitFor(() => expect(f.displays).toContainEqual([a, "host edit", 1]));
        hold.resolve();
        expect(await writing).toBe("stale");
        expect(f.results).toContainEqual([a, 1, 1, "stale"]);
    });

    it("drops a queued snapshot after an earlier write advances the revision", async () => {
        const f = fixture();
        const a = f.open();
        const first = f.service.syncFromWebview(a, "first", 0, 1);
        const second = f.service.syncFromWebview(a, "second", 0, 2);
        expect(await first).toBe("applied");
        expect(await second).toBe("stale");
        expect(f.docs.write).toHaveBeenCalledTimes(1);
    });

    it("continues publishing to healthy siblings when one display fails", async () => {
        const f = fixture();
        const a = f.open();
        const b = f.open();
        const c = f.open();
        vi.mocked(f.view.display).mockImplementationOnce(async () => { throw new Error("hidden"); });
        f.service.onDocumentChanged("file:///story.egn", "host", 2);
        await f.service.initialize(c);
        expect(f.displays).toContainEqual([b, "host", 1]);
        expect(f.displays).toContainEqual([c, "host", 1]);
        expect(a).not.toBe(b);
    });

    it("publishes text-editor edits and undo/redo snapshots to both panels", async () => {
        const f = fixture();
        const a = f.open();
        const b = f.open();
        f.service.onDocumentChanged("file:///story.egn", "edited", 2);
        f.service.onDocumentChanged("file:///story.egn", "old", 3);
        f.service.onDocumentChanged("file:///story.egn", "edited", 4);
        for (const id of [a, b]) {
            expect(f.displays.filter(([session]) => session === id)).toEqual([
                [id, "edited", 1], [id, "old", 2], [id, "edited", 3],
            ]);
        }
    });
});
