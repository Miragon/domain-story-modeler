import type { TextDocument, WebviewPanel } from "vscode";
import { workspace } from "vscode";
import { DomainStoryEditorService, IconService, LoggerPort, NotifierPort, ViewPort } from "@egon/modeler-core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WebviewController } from "./WebviewController";

const story = JSON.stringify({ iconSet: { name: "default", actors: {}, workObjects: {} }, domainStory: { businessObjects: [], title: "", description: "", version: "4.0.0" } });
function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((done) => { resolve = done; });
    return { promise, resolve };
}
function panel() {
    const messages: Array<(input: unknown) => void> = [];
    const disposals: Array<() => void> = [];
    const postMessage = vi.fn().mockResolvedValue(true);
    const webview = { options: {}, html: "", postMessage, onDidReceiveMessage: vi.fn((fn) => { messages.push(fn); return { dispose: vi.fn() }; }) };
    return { panel: { webview, onDidDispose: vi.fn((fn) => { disposals.push(fn); return { dispose: vi.fn() }; }) } as unknown as WebviewPanel, messages, disposals, postMessage };
}
function document(id = "file:///story.egn", content = story): TextDocument {
    return { uri: { scheme: "file", path: "/story.egn", toString: () => id }, version: 1, getText: () => content } as unknown as TextDocument;
}

describe("WebviewController", () => {
    let hostChange: (event: { contentChanges: unknown[]; document: TextDocument }) => void;
    let app: DomainStoryEditorService;
    let logger: LoggerPort;
    let notifier: NotifierPort;
    let icons: IconService;
    let displays: ReturnType<typeof vi.fn>;
    let results: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(workspace.onDidChangeTextDocument).mockImplementation((fn) => { hostChange = fn as unknown as typeof hostChange; return { dispose: vi.fn() }; });
        vi.mocked(workspace.fs.stat).mockResolvedValue({ permissions: 0 } as never);
        vi.mocked(workspace.fs.isWritableFileSystem).mockReturnValue(true);
        app = new DomainStoryEditorService({ read: vi.fn(), write: vi.fn() });
        logger = { debug: vi.fn(), error: vi.fn() };
        notifier = { warning: vi.fn(), error: vi.fn() };
        icons = { initializeDocument: vi.fn(async (_id, current: () => string) => current()) } as unknown as IconService;
        displays = vi.fn(async () => undefined);
        results = vi.fn(async () => undefined);
    });

    function controller() {
        return new WebviewController({ extensionUri: { path: "/extension" } as never, extensionId: "egn", app, icons, logger, notifier, createView: () => ({ display: displays, syncResult: results }) as ViewPort, renderUi: () => "<html></html>" });
    }

    it("tracks host changes during asynchronous icon initialization and delivers the latest snapshot", async () => {
        const hold = deferred<string>();
        vi.mocked(icons.initializeDocument).mockReturnValueOnce(hold.promise);
        const c = controller();
        const p = panel();
        const opening = c.resolveCustomTextEditor(document(), p.panel);
        hostChange({ contentChanges: [{}], document: { ...document(), version: 2, getText: () => "latest" } as TextDocument });
        p.messages[0]({ type: "InitializeWebviewCommand" });
        hold.resolve(story);
        await opening;
        expect(displays).toHaveBeenCalledWith("session-1", "latest", 1);
        c.dispose();
    });

    it("processes each event once across panels and retires them independently", async () => {
        const c = controller();
        const a = panel();
        const b = panel();
        await c.resolveCustomTextEditor(document(), a.panel);
        await c.resolveCustomTextEditor(document(), b.panel);
        hostChange({ contentChanges: [{}], document: { ...document(), version: 2, getText: () => "changed" } as TextDocument });
        expect(displays.mock.calls.filter((call) => call[2] === 1)).toHaveLength(2);
        a.disposals[0]();
        b.messages[0]({ type: "InitializeWebviewCommand" });
        await vi.waitFor(() => expect(displays).toHaveBeenCalledWith("session-2", "changed", 1));
        c.dispose();
    });

    it("rejects spoofed sessions before writing", async () => {
        const c = controller();
        const p = panel();
        await c.resolveCustomTextEditor(document(), p.panel);
        p.messages[0]({ type: "SyncDocumentCommand", sessionId: "other", text: story, documentRevision: 0, requestId: 1 });
        await vi.waitFor(() => expect(logger.error).toHaveBeenCalledWith("Failed to process a webview message", expect.objectContaining({ message: expect.stringContaining("mismatch") })));
        c.dispose();
    });

    it("skips icon initialization for read-only documents", async () => {
        vi.mocked(workspace.fs.isWritableFileSystem).mockReturnValue(false);
        const c = controller();
        await c.resolveCustomTextEditor(document(), panel().panel);
        expect(icons.initializeDocument).not.toHaveBeenCalled();
        c.dispose();
    });

    it("warns and reloads the current document after a conflicting panel submission", async () => {
        const c = controller();
        const p = panel();
        await c.resolveCustomTextEditor(document(), p.panel);
        const updated = story.replace('"title":""', '"title":"Host"');
        hostChange({ contentChanges: [{}], document: { ...document(), version: 2, getText: () => updated } as TextDocument });
        p.messages[0]({ type: "SyncDocumentCommand", sessionId: "session-1", text: story, documentRevision: 0, requestId: 3 });
        await vi.waitFor(() => expect(results).toHaveBeenCalledWith("session-1", 3, 1, "stale"));
        expect(notifier.warning).toHaveBeenCalledOnce();
        expect(displays).toHaveBeenCalledWith("session-1", updated, 1);
        c.dispose();
    });
});
