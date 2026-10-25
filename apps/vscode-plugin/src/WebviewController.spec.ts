import type { TextDocument, WebviewPanel } from "vscode";
import { workspace } from "vscode";
import {
  DomainStoryEditorService,
  LoggerPort,
  NotifierPort,
  ViewPort,
} from "@egon/modeler-core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WebviewController } from "./WebviewController";
import { WebviewInteractionPort } from "./infrastructure/VsCodeWebviewInteraction";

const story = JSON.stringify({
  iconSet: { name: "default", actors: {}, workObjects: {} },
  domainStory: {
    businessObjects: [],
    title: "",
    description: "",
    version: "4.0.0",
  },
});
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
function panel() {
  const messages: Array<(input: unknown) => void> = [];
  const disposals: Array<() => void> = [];
  const postMessage = vi.fn().mockResolvedValue(true);
  const webview = {
    options: {},
    html: "",
    postMessage,
    onDidReceiveMessage: vi.fn((fn) => {
      messages.push(fn);
      return { dispose: vi.fn() };
    }),
  };
  return {
    panel: {
      webview,
      onDidDispose: vi.fn((fn) => {
        disposals.push(fn);
        return { dispose: vi.fn() };
      }),
    } as unknown as WebviewPanel,
    messages,
    disposals,
    postMessage,
  };
}
function document(id = "file:///story.egn", content = story): TextDocument {
  return {
    uri: { scheme: "file", path: "/story.egn", toString: () => id },
    version: 1,
    getText: () => content,
  } as unknown as TextDocument;
}

describe("WebviewController", () => {
  let hostChange: (event: {
    contentChanges: unknown[];
    document: TextDocument;
  }) => void;
  let app: DomainStoryEditorService;
  let logger: LoggerPort;
  let notifier: NotifierPort;
  let displays: ReturnType<typeof vi.fn>;
  let results: ReturnType<typeof vi.fn>;
  let interaction: WebviewInteractionPort;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(workspace.onDidChangeTextDocument).mockImplementation((fn) => {
      hostChange = fn as unknown as typeof hostChange;
      return { dispose: vi.fn() };
    });
    vi.mocked(workspace.fs.stat).mockResolvedValue({ permissions: 0 } as never);
    vi.mocked(workspace.fs.isWritableFileSystem).mockReturnValue(true);
    app = new DomainStoryEditorService({ read: vi.fn(), write: vi.fn() });
    logger = { debug: vi.fn(), error: vi.fn() };
    notifier = { warning: vi.fn(), error: vi.fn() };
    displays = vi.fn(async () => undefined);
    results = vi.fn(async () => undefined);
    interaction = {
      chooseAction: vi.fn(async () => undefined),
      openAsText: vi.fn(async () => undefined),
    };
  });

  function controller() {
    return new WebviewController({
      extensionUri: { path: "/extension" } as never,
      extensionId: "egn",
      app,
      logger,
      notifier,
      interaction,
      createView: () =>
        ({ display: displays, syncResult: results }) as ViewPort,
      renderUi: () => "<html></html>",
    });
  }

  it("tracks host changes during asynchronous icon refresh and delivers the latest snapshot", async () => {
    const hold = deferred<void>();
    const c = controller();
    c.setIconRefresh(() => hold.promise);
    const p = panel();
    const opening = c.resolveCustomTextEditor(document(), p.panel);
    hostChange({
      contentChanges: [{}],
      document: {
        ...document(),
        version: 2,
        getText: () => "latest",
      } as TextDocument,
    });
    p.messages[0]({ type: "InitializeWebviewCommand" });
    hold.resolve();
    await opening;
    expect(displays).toHaveBeenCalledWith("session-1", "latest", 1);
    c.dispose();
  });

  it("routes flush replies immediately while startup messages are buffered", async () => {
    const hold = deferred<void>();
    const c = controller();
    c.setIconRefresh(() => hold.promise);
    const p = panel();
    const opening = c.resolveCustomTextEditor(document(), p.panel);
    const pending = c.flushService.requestFlush("session-1");
    expect(p.postMessage).toHaveBeenCalledWith(expect.objectContaining({ type: "FlushDocumentQuery", token: 1 }));
    p.messages[0]({ type: "DocumentFlushedCommand", token: 1, status: "clean" });
    await expect(pending).resolves.toEqual({ status: "clean" });
    hold.resolve();
    await opening;
    c.dispose();
  });

  it("processes each event once across panels and retires them independently", async () => {
    const c = controller();
    const a = panel();
    const b = panel();
    await c.resolveCustomTextEditor(document(), a.panel);
    await c.resolveCustomTextEditor(document(), b.panel);
    hostChange({
      contentChanges: [{}],
      document: {
        ...document(),
        version: 2,
        getText: () => "changed",
      } as TextDocument,
    });
    expect(displays.mock.calls.filter((call) => call[2] === 1)).toHaveLength(2);
    a.disposals[0]();
    b.messages[0]({ type: "InitializeWebviewCommand" });
    await vi.waitFor(() =>
      expect(displays).toHaveBeenCalledWith("session-2", "changed", 1),
    );
    c.dispose();
  });

  it("rejects spoofed sessions before writing", async () => {
    const c = controller();
    const p = panel();
    await c.resolveCustomTextEditor(document(), p.panel);
    p.messages[0]({
      type: "SyncDocumentCommand",
      sessionId: "other",
      text: story,
      documentRevision: 0,
      requestId: 1,
    });
    await vi.waitFor(() =>
      expect(logger.error).toHaveBeenCalledWith(
        "Failed to process a webview message",
        expect.objectContaining({
          message: expect.stringContaining("mismatch"),
        }),
      ),
    );
    c.dispose();
  });

  it("holds an uninitialized panel while an icon transform is in progress", async () => {
    const c = controller();
    const p = panel();
    await c.resolveCustomTextEditor(document(), p.panel);
    const release = c.blockStartup("file:///story.egn");
    p.messages[0]({ type: "InitializeWebviewCommand" });
    expect(c.readySessionIds("file:///story.egn")).toEqual([]);
    expect(displays).not.toHaveBeenCalled();
    release();
    await vi.waitFor(() => expect(displays).toHaveBeenCalled());
    expect(c.readySessionIds("file:///story.egn")).toEqual(["session-1"]);
    c.dispose();
  });

  it("warns and reloads the current document after a conflicting panel submission", async () => {
    const c = controller();
    const p = panel();
    await c.resolveCustomTextEditor(document(), p.panel);
    const updated = story.replace('"title":""', '"title":"Host"');
    hostChange({
      contentChanges: [{}],
      document: {
        ...document(),
        version: 2,
        getText: () => updated,
      } as TextDocument,
    });
    p.messages[0]({
      type: "SyncDocumentCommand",
      sessionId: "session-1",
      text: story,
      documentRevision: 0,
      requestId: 3,
    });
    await vi.waitFor(() =>
      expect(results).toHaveBeenCalledWith("session-1", 3, 1, "stale"),
    );
    expect(notifier.warning).toHaveBeenCalledOnce();
    expect(displays).toHaveBeenCalledWith("session-1", updated, 1);
    c.dispose();
  });

  it("correlates actionable repair decisions and opens the current document as text", async () => {
    vi.mocked(interaction.chooseAction).mockResolvedValueOnce("openAsText");
    const c = controller();
    const p = panel();
    await c.resolveCustomTextEditor(document(), p.panel);
    p.messages[0]({
      type: "ReportWebviewIssueCommand",
      sessionId: "session-1",
      documentRevision: 2,
      issueToken: "repair-1",
      kind: "repair",
      message: "Removed a dangling connection",
      removedConnectionIds: ["connection-1"],
    });

    await vi.waitFor(() =>
      expect(interaction.openAsText).toHaveBeenCalledWith("file:///story.egn"),
    );
    expect(p.postMessage).toHaveBeenCalledWith({
      type: "ResolveWebviewIssueCommand",
      sessionId: "session-1",
      documentRevision: 2,
      issueToken: "repair-1",
      decision: "openAsText",
    });
    c.dispose();
  });

  it("reopens dismissed repair decisions and ignores obsolete prompt results", async () => {
    let resolveFirst!: (action: "acceptRepairs") => void;
    vi.mocked(interaction.chooseAction)
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveFirst = resolve;
        }),
      )
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce("acceptRepairs");
    const c = controller();
    const p = panel();
    await c.resolveCustomTextEditor(document(), p.panel);
    const first = {
      type: "ReportWebviewIssueCommand",
      sessionId: "session-1",
      documentRevision: 1,
      issueToken: "obsolete",
      kind: "repair",
      message: "Old repair",
      removedConnectionIds: ["old"],
    } as const;
    const current = {
      ...first,
      documentRevision: 2,
      issueToken: "current",
      message: "Current repair",
      removedConnectionIds: ["current"],
    };
    p.messages[0](first);
    p.messages[0](current);
    await vi.waitFor(() =>
      expect(interaction.chooseAction).toHaveBeenCalledTimes(2),
    );
    resolveFirst("acceptRepairs");
    await Promise.resolve();
    expect(p.postMessage).not.toHaveBeenCalledWith(
      expect.objectContaining({ issueToken: "obsolete" }),
    );

    p.messages[0](current);
    await vi.waitFor(() =>
      expect(p.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "ResolveWebviewIssueCommand",
          issueToken: "current",
          decision: "acceptRepairs",
        }),
      ),
    );
    c.dispose();
  });
});
