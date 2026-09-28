import type { TextDocument, WebviewPanel } from "vscode";
import { workspace } from "vscode";
import {
    DomainStoryEditorService,
    IconInitializationError,
    IconService,
    LoggerPort,
    NotifierPort,
} from "@egon/modeler-core";
import { InitializeWebviewCommand } from "@egon/modeler-shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WebviewController } from "./WebviewController";

interface FakePanel {
    panel: WebviewPanel;
    messages: Array<(message: InitializeWebviewCommand) => void>;
    disposals: Array<() => void>;
    postMessage: ReturnType<typeof vi.fn>;
}

function fakePanel(onHtml?: () => void): FakePanel {
    const messages: Array<(message: InitializeWebviewCommand) => void> = [];
    const disposals: Array<() => void> = [];
    const postMessage = vi.fn().mockResolvedValue(true);
    let html = "";
    const webview = {
        options: {},
        onDidReceiveMessage: vi.fn((callback) => {
            messages.push(callback);
            return { dispose: vi.fn() };
        }),
        postMessage,
        asWebviewUri: vi.fn((uri) => uri),
        get html() {
            return html;
        },
        set html(value: string) {
            html = value;
            onHtml?.();
        },
    };
    return {
        panel: {
            webview,
            onDidDispose: vi.fn((callback) => {
                disposals.push(callback);
                return { dispose: vi.fn() };
            }),
        } as unknown as WebviewPanel,
        messages,
        disposals,
        postMessage,
    };
}

function document(path = "/workspace/story.egn", text = "embedded"): TextDocument {
    return {
        uri: { path, toString: () => path },
        getText: vi.fn(() => text),
    } as unknown as TextDocument;
}

function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((done) => {
        resolve = done;
    });
    return { promise, resolve };
}

describe("WebviewController", () => {
    const logger: LoggerPort = { debug: vi.fn(), error: vi.fn() };
    const notifier: NotifierPort = { warning: vi.fn(), error: vi.fn() };
    let app: DomainStoryEditorService;
    let icons: IconService;
    let initializeDocument: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.clearAllMocks();
        app = new DomainStoryEditorService({ read: vi.fn(), write: vi.fn() });
        initializeDocument = vi.fn(async (_id, currentText) => currentText());
        icons = { initializeDocument } as unknown as IconService;
        vi.mocked(workspace.onDidChangeTextDocument).mockImplementation(() => ({
            dispose: vi.fn(),
        }));
    });

    function controller(): WebviewController {
        return new WebviewController({
            extensionUri: { path: "/extension" } as never,
            extensionId: "egn",
            app,
            icons,
            logger,
            notifier,
            createView: (panel) => ({
                display: async (sessionId, text) => {
                    await panel.webview.postMessage({ sessionId, text });
                },
            }),
            renderUi: () => "<html></html>",
        });
    }

    it("has an inactive constructor and attaches handlers before HTML", async () => {
        const instance = controller();
        expect(workspace.onDidChangeTextDocument).not.toHaveBeenCalled();
        const panel = fakePanel(() => {
            expect(panel.messages).toHaveLength(1);
            expect(panel.disposals).toHaveLength(1);
            expect(workspace.onDidChangeTextDocument).toHaveBeenCalledOnce();
        });

        await instance.resolveCustomTextEditor(document(), panel.panel);
    });

    it("retains an early handshake until icon initialization completes", async () => {
        const loading = deferred<string>();
        initializeDocument.mockReturnValueOnce(loading.promise);
        const initialize = vi.spyOn(app, "initialize");
        const panel = fakePanel();

        const resolving = controller().resolveCustomTextEditor(document(), panel.panel);
        panel.messages[0](new InitializeWebviewCommand("early"));
        expect(initialize).not.toHaveBeenCalled();

        loading.resolve("with-icons");
        await resolving;

        expect(initialize).toHaveBeenCalledWith("/workspace/story.egn:1");
        expect(panel.postMessage).toHaveBeenCalledWith({
            sessionId: "/workspace/story.egn:1",
            text: "with-icons",
        });
    });

    it("does not revive a session closed during delayed initialization", async () => {
        const loading = deferred<string>();
        initializeDocument.mockReturnValueOnce(loading.promise);
        const register = vi.spyOn(app, "registerSession");
        const panel = fakePanel();

        const resolving = controller().resolveCustomTextEditor(document(), panel.panel);
        panel.disposals[0]();
        loading.resolve("late");
        await resolving;

        expect(register).not.toHaveBeenCalled();
    });

    it("retains the latest document text when it changes during icon writing", async () => {
        const writing = deferred<void>();
        initializeDocument.mockImplementationOnce(async (_id, currentText) => {
            const source = currentText();
            await writing.promise;
            return `icons:${source}`;
        });
        const register = vi.spyOn(app, "registerSession");
        const panel = fakePanel();
        const resolving = controller().resolveCustomTextEditor(document(), panel.panel);
        const documentListener = vi.mocked(workspace.onDidChangeTextDocument).mock.calls[0][0];

        documentListener({
            contentChanges: [{}],
            document: document("/workspace/story.egn", "latest"),
        } as never);
        writing.resolve();
        await resolving;

        expect(register).toHaveBeenCalledWith("/workspace/story.egn", "latest", expect.anything());
    });

    it("retires an earlier resolution without disposing its replacement", async () => {
        const first = deferred<string>();
        initializeDocument.mockReturnValueOnce(first.promise).mockResolvedValueOnce("replacement");
        const register = vi.spyOn(app, "registerSession");
        const dispose = vi.spyOn(app, "dispose");
        const panel = fakePanel();
        const instance = controller();

        const oldResolution = instance.resolveCustomTextEditor(document(), panel.panel);
        const replacement = instance.resolveCustomTextEditor(document(), panel.panel);
        await replacement;
        first.resolve("late-old-value");
        await oldResolution;

        expect(register).toHaveBeenCalledOnce();
        expect(dispose).not.toHaveBeenCalled();
        panel.disposals[1]();
        expect(dispose).toHaveBeenCalledOnce();
    });

    it("keeps separate panels for the same document independent", async () => {
        const dispose = vi.spyOn(app, "dispose");
        const first = fakePanel();
        const second = fakePanel();
        const instance = controller();

        await Promise.all([
            instance.resolveCustomTextEditor(document(), first.panel),
            instance.resolveCustomTextEditor(document(), second.panel),
        ]);
        first.disposals[0]();

        expect(dispose).toHaveBeenCalledWith("/workspace/story.egn:1");
        expect(dispose).not.toHaveBeenCalledWith("/workspace/story.egn:2");
        second.messages[0](new InitializeWebviewCommand("ready"));
        await vi.waitFor(() => expect(second.postMessage).toHaveBeenCalled());
    });

    it("reports a rejected message dispatch without an unhandled rejection", async () => {
        const error = new Error("handler failed");
        vi.spyOn(app, "initialize").mockRejectedValueOnce(error);
        const panel = fakePanel();

        await controller().resolveCustomTextEditor(document(), panel.panel);
        expect(() => panel.messages[0](new InitializeWebviewCommand("ready"))).not.toThrow();

        await vi.waitFor(() =>
            expect(logger.error).toHaveBeenCalledWith("Failed to process a webview message", error),
        );
        expect(notifier.error).toHaveBeenCalledOnce();
    });

    it("opens with embedded icons and one warning when icon loading fails", async () => {
        initializeDocument.mockRejectedValueOnce(
            new IconInitializationError("load", new Error("read failed")),
        );
        const register = vi.spyOn(app, "registerSession");

        await controller().resolveCustomTextEditor(document(), fakePanel().panel);

        expect(register).toHaveBeenCalledWith(
            "/workspace/story.egn",
            "embedded",
            expect.anything(),
        );
        expect(notifier.warning).toHaveBeenCalledOnce();
        expect(notifier.error).not.toHaveBeenCalled();
    });
});
