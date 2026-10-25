import { createEmptyStory } from "@egon/modeler-types";
import { DisposalScope, DomainStoryEditorService, IconService, LoggerPort, NotifierPort } from "@egon/modeler-core";
import { TextDocument, workspace } from "vscode";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { IconWatcherController } from "./IconWatcherController";
import { DocumentSaveFlushController } from "./DocumentSaveFlushController";
import { WebviewController } from "./WebviewController";

const id = "file:///workspace/story.egn";
const source = "file:///workspace/.egon/icons/actors/Customer.svg";
function fixture() {
    let content = JSON.stringify(createEmptyStory());
    let version = 1;
    const writes: string[] = [];
    const document = {
        uri: { scheme: "file", path: "/workspace/story.egn", toString: () => id },
        get version() { return version; },
        getText: () => content,
    } as TextDocument;
    vi.mocked(workspace.textDocuments).splice(0, Infinity, document);
    const app = new DomainStoryEditorService({
        read: async () => ({ text: content, version }),
        write: async (_id, text, expected, current) => {
            if (!current() || version !== expected) return { status: "stale", snapshot: { text: content, version } };
            content = text;
            version++;
            writes.push(text);
            return { status: "applied", snapshot: { text, version } };
        },
    });
    let svg = "one";
    let present = true;
    let fail = false;
    const icons = new IconService({
        workspaceFolders: { getWorkspaceFolder: () => "file:///workspace" },
        files: {
            parentPath: (uri) => uri.slice(0, uri.lastIndexOf("/")),
            joinPath: (uri, name) => `${uri}/${name}`,
            readDirectory: async (uri) => {
                if (fail) throw new Error("denied");
                return present && uri === "file:///workspace/.egon/icons/actors" ? [{ name: "Customer.svg", kind: "file" as const }] : [];
            },
            readFile: async () => svg,
        },
    });
    const logger: LoggerPort = { debug: vi.fn(), error: vi.fn() };
    const notifier: NotifierPort = { warning: vi.fn(), error: vi.fn() };
    const editor = { readySessionIds: () => [], blockStartup: () => vi.fn() } as unknown as WebviewController;
    const flush = { withConfirmedFlush: vi.fn() } as unknown as DocumentSaveFlushController;
    const controller = new IconWatcherController(icons, app, flush, editor, logger, notifier);
    const scope = new DisposalScope();
    controller.register(scope);
    return { controller, scope, app, icons, writes, document, logger, get content() { return content; }, setSvg(value: string) { svg = value; }, remove() { present = false; }, fail(value: boolean) { fail = value; } };
}

beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(workspace.textDocuments).splice(0);
    vi.mocked(workspace.workspaceFolders).splice(0);
    vi.mocked(workspace.fs.stat).mockResolvedValue({ permissions: 0 } as never);
    vi.mocked(workspace.fs.isWritableFileSystem).mockReturnValue(true);
});

describe("IconWatcherController", () => {
    it("reconfigures per-root directory watchers and disposes their subscriptions", () => {
        const disposals: Array<ReturnType<typeof vi.fn>> = [];
        vi.mocked(workspace.workspaceFolders).push({ uri: { toString: () => "file:///workspace" } } as never);
        vi.mocked(workspace.createFileSystemWatcher).mockImplementation(() => {
            const own = Array.from({ length: 4 }, () => vi.fn());
            disposals.push(...own);
            return {
                dispose: own[0],
                onDidCreate: () => ({ dispose: own[1] }),
                onDidChange: () => ({ dispose: own[2] }),
                onDidDelete: () => ({ dispose: own[3] }),
            } as never;
        });
        const f = fixture();
        expect(workspace.createFileSystemWatcher).toHaveBeenCalledTimes(2);
        vi.mocked(workspace.onDidChangeWorkspaceFolders).mock.calls[0][0]({} as never);
        expect(workspace.createFileSystemWatcher).toHaveBeenCalledTimes(4);
        for (const dispose of disposals.slice(0, 8)) expect(dispose).toHaveBeenCalledOnce();
        f.scope.dispose();
        for (const dispose of disposals) expect(dispose).toHaveBeenCalledOnce();
    });

    it("edits an open dirty buffer, then deletes only its synchronized icon", async () => {
        const f = fixture();
        await f.controller.refreshNow(id);
        expect(f.writes).toHaveLength(1);
        expect(JSON.parse(f.content).iconSet.actors.Customer).toBe("one");
        f.setSvg("two");
        await f.controller.refreshNow(id);
        expect(JSON.parse(f.content).iconSet.actors.Customer).toBe("two");
        f.remove();
        f.controller.handle(source, "delete");
        await vi.waitFor(() => expect(JSON.parse(f.content).iconSet.actors.Customer).toBeUndefined());
        f.scope.dispose();
    });

    it("keeps a closed story unchanged and does not open it", async () => {
        const f = fixture();
        await f.controller.refreshNow(id);
        const before = f.content;
        vi.mocked(workspace.textDocuments).splice(0);
        vi.mocked(workspace.onDidCloseTextDocument).mock.calls[0][0](f.document);
        f.setSvg("changed");
        f.controller.handle(source, "update");
        await new Promise((resolve) => setTimeout(resolve, 50));
        expect(f.content).toBe(before);
        expect(workspace.openTextDocument).not.toHaveBeenCalled();
        f.scope.dispose();
    });

    it("ignores icon events outside the story's ancestor tree", async () => {
        const f = fixture();
        await f.controller.refreshNow(id);
        f.setSvg("changed");
        f.controller.handle("file:///workspace-other/.egon/icons/actors/Customer.svg", "update");
        await new Promise((resolve) => setTimeout(resolve, 50));
        expect(f.writes).toHaveLength(1);
        f.scope.dispose();
    });

    it("retains deletion evidence after a failed directory scan until another event", async () => {
        const f = fixture();
        await f.controller.refreshNow(id);
        f.remove();
        f.fail(true);
        f.controller.handle(source, "delete");
        await vi.waitFor(() => expect(f.logger.error).toHaveBeenCalled());
        expect(JSON.parse(f.content).iconSet.actors.Customer).toBe("one");
        f.fail(false);
        f.controller.handle(source, "update");
        await vi.waitFor(() => expect(JSON.parse(f.content).iconSet.actors.Customer).toBeUndefined());
        f.scope.dispose();
    });
});
