// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createEmptyStory } from "@egon/modeler-types";
import { WebviewState, WebviewToHostMessage } from "@egon/modeler-shared";
import { bootstrap } from "./lifecycle";
import { ModelerClient } from "./egonClient";
import { WebviewHost } from "./communication";

const story = createEmptyStory();

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => (resolve = done));
  return { promise, resolve };
}

function fakeClient() {
  const handlers = new Map<string, Set<(...args: never[]) => void>>();
  const client = {
    import: vi.fn(),
    export: vi.fn(() => story),
    getViewport: vi.fn(() => ({ x: 0, y: 0, width: 100, height: 100 })),
    setViewport: vi.fn(),
    on: vi.fn((event: string, callback: (...args: never[]) => void) => {
      const callbacks = handlers.get(event) ?? new Set();
      callbacks.add(callback);
      handlers.set(event, callbacks);
    }),
    off: vi.fn((event: string, callback: (...args: never[]) => void) =>
      handlers.get(event)?.delete(callback),
    ),
    destroy: vi.fn(),
  };
  return {
    client: client as unknown as ModelerClient,
    emit(event: string, value?: unknown) {
      handlers.get(event)?.forEach((callback) => callback(value as never));
    },
  };
}

function host() {
  let state: WebviewState | undefined;
  const posted: WebviewToHostMessage[] = [];
  const api: WebviewHost = {
    getState: () => {
      if (!state) throw new Error("missing");
      return state;
    },
    setState: (next) => {
      state = { ...next };
    },
    updateState: (patch) => {
      state = { ...(state ?? { editorId: "", viewbox: undefined }), ...patch };
    },
    postMessage: (message) => posted.push(message),
  };
  return { api, posted, state: () => state };
}

function display(text = JSON.stringify(story), revision = 0) {
  window.dispatchEvent(
    new MessageEvent("message", {
      data: {
        type: "DisplayDomainStoryCommand",
        sessionId: "session",
        text,
        documentRevision: revision,
      },
    }),
  );
}

async function settleDisplay(wait = 100): Promise<void> {
  await vi.advanceTimersByTimeAsync(wait);
  await Promise.resolve();
  await Promise.resolve();
}

beforeEach(() => {
  vi.useFakeTimers();
  document.body.innerHTML = '<div id="egon-io-container"></div>';
});

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = "";
});

describe("webview lifecycle", () => {
  it("flushes a committed export before story.changed and waits for its acknowledgment", async () => {
    const h = host();
    const modeler = fakeClient();
    const session = bootstrap(h.api, async () => modeler.client);
    display();
    await settleDisplay();
    const changed = { ...story, domainStory: { ...story.domainStory, title: "immediate save" } };
    vi.mocked(modeler.client.export).mockReturnValue(changed);
    window.dispatchEvent(new MessageEvent("message", { data: {
      type: "FlushDocumentQuery", token: 1, destructive: false, exportWhenClean: false,
    } }));
    await settleDisplay(0);
    const write = h.posted.find((message) => message.type === "SyncDocumentCommand");
    expect(write).toMatchObject({ text: JSON.stringify(changed) });
    expect(h.posted.find((message) => message.type === "DocumentFlushedCommand")).toBeUndefined();
    if (write?.type !== "SyncDocumentCommand") throw new Error("missing write");
    window.dispatchEvent(new MessageEvent("message", { data: {
      type: "SyncDocumentResultCommand", sessionId: "session", requestId: write.requestId,
      documentRevision: 1, status: "applied",
    } }));
    await settleDisplay(0);
    expect(h.posted).toContainEqual({
      type: "DocumentFlushedCommand", token: 1, status: "flushed",
      content: JSON.stringify(changed), documentRevision: 1,
    });
    session.dispose();
  });

  it("keeps a destructive lock until its token is released", async () => {
    const h = host();
    const modeler = fakeClient();
    const session = bootstrap(h.api, async () => modeler.client);
    display();
    await settleDisplay();
    window.dispatchEvent(new MessageEvent("message", { data: {
      type: "FlushDocumentQuery", token: 4, destructive: true, exportWhenClean: false,
    } }));
    await settleDisplay(0);
    expect(document.getElementById("egon-io-container")?.inert).toBe(true);
    window.dispatchEvent(new MessageEvent("message", { data: {
      type: "ReleaseDocumentFlushQuery", token: 3,
    } }));
    await settleDisplay(0);
    expect(document.getElementById("egon-io-container")?.inert).toBe(true);
    window.dispatchEvent(new MessageEvent("message", { data: {
      type: "ReleaseDocumentFlushQuery", token: 4,
    } }));
    await settleDisplay(0);
    expect(document.getElementById("egon-io-container")?.inert).toBe(false);
    session.dispose();
  });

  it("returns unavailable after a failed acknowledgment without advancing the baseline", async () => {
    const h = host();
    const modeler = fakeClient();
    const session = bootstrap(h.api, async () => modeler.client);
    display();
    await settleDisplay();
    const changed = { ...story, domainStory: { ...story.domainStory, title: "not acknowledged" } };
    vi.mocked(modeler.client.export).mockReturnValue(changed);
    window.dispatchEvent(new MessageEvent("message", { data: {
      type: "FlushDocumentQuery", token: 2, destructive: false, exportWhenClean: false,
    } }));
    await settleDisplay(0);
    const write = h.posted.find((message) => message.type === "SyncDocumentCommand");
    if (write?.type !== "SyncDocumentCommand") throw new Error("missing write");
    window.dispatchEvent(new MessageEvent("message", { data: {
      type: "SyncDocumentResultCommand", sessionId: "session", requestId: write.requestId,
      documentRevision: 0, status: "failed",
    } }));
    await settleDisplay(0);
    expect(h.posted).toContainEqual({ type: "DocumentFlushedCommand", token: 2, status: "unavailable" });
    session.dispose();
  });

  it("reports a pending host display and treats normalized imports as clean", async () => {
    const h = host();
    const modeler = fakeClient();
    const session = bootstrap(h.api, async () => modeler.client);
    display(JSON.stringify(story, null, 2));
    await settleDisplay();
    window.dispatchEvent(new MessageEvent("message", { data: {
      type: "FlushDocumentQuery", token: 3, destructive: false, exportWhenClean: false,
    } }));
    await settleDisplay(0);
    expect(h.posted).toContainEqual({ type: "DocumentFlushedCommand", token: 3, status: "clean" });

    display(JSON.stringify(story), 1);
    window.dispatchEvent(new MessageEvent("message", { data: {
      type: "FlushDocumentQuery", token: 4, destructive: false, exportWhenClean: false,
    } }));
    await settleDisplay(0);
    expect(h.posted).toContainEqual({ type: "DocumentFlushedCommand", token: 4, status: "host-updated" });
    session.dispose();
  });

  it("listens before initialization and imports an immediate response", async () => {
    const h = host();
    const modeler = fakeClient();
    h.api.postMessage = vi.fn((message: WebviewToHostMessage) => {
      h.posted.push(message);
      if (message.type === "InitializeWebviewCommand") display();
    });

    const session = bootstrap(
      h.api,
      vi.fn(async () => modeler.client),
    );
    await settleDisplay();

    expect(modeler.client.import).toHaveBeenCalledWith(story);
    expect(h.state()?.editorId).toBe("session");
    session.dispose();
    session.dispose();
    expect(modeler.client.destroy).toHaveBeenCalledOnce();
  });

  it("shares delayed creation and converges on only the newest display", async () => {
    const h = host();
    const modeler = fakeClient();
    const gate = deferred<ModelerClient>();
    const factory = vi.fn(() => gate.promise);
    const session = bootstrap(h.api, factory);

    display(JSON.stringify(story), 1);
    await settleDisplay();
    const newer = {
      ...story,
      domainStory: { ...story.domainStory, title: "newest" },
    };
    display(JSON.stringify(newer), 2);
    gate.resolve(modeler.client);
    await settleDisplay();

    expect(factory).toHaveBeenCalledOnce();
    expect(modeler.client.import).toHaveBeenCalledOnce();
    expect(modeler.client.import).toHaveBeenCalledWith(newer);
    session.dispose();
  });

  it("destroys a client that resolves after disposal", async () => {
    const h = host();
    const modeler = fakeClient();
    const gate = deferred<ModelerClient>();
    const session = bootstrap(h.api, () => gate.promise);
    display();
    await settleDisplay();
    session.dispose();
    gate.resolve(modeler.client);
    await Promise.resolve();
    await Promise.resolve();
    expect(modeler.client.destroy).toHaveBeenCalledOnce();
  });

  it("retries failed creation and shares repeated retry clicks", async () => {
    const h = host();
    const modeler = fakeClient();
    const factory = vi
      .fn<() => Promise<ModelerClient>>()
      .mockRejectedValueOnce(new Error("creation failed"))
      .mockResolvedValue(modeler.client);
    const session = bootstrap(h.api, factory);
    display();
    await settleDisplay();
    const issue = h.posted.find(
      (message) => message.type === "ReportWebviewIssueCommand",
    );
    expect(issue).toMatchObject({ kind: "initialization" });

    const retry = {
      type: "ResolveWebviewIssueCommand",
      sessionId: "session",
      documentRevision: 0,
      issueToken:
        issue?.type === "ReportWebviewIssueCommand" ? issue.issueToken : "",
      decision: "retry",
    };
    window.dispatchEvent(new MessageEvent("message", { data: retry }));
    window.dispatchEvent(new MessageEvent("message", { data: retry }));
    await settleDisplay(0);
    await settleDisplay(0);

    expect(factory).toHaveBeenCalledTimes(2);
    expect(modeler.client.import).toHaveBeenCalledOnce();
    session.dispose();
  });

  it("blocks exports after malformed newer content and recovers at the same revision", async () => {
    const h = host();
    const modeler = fakeClient();
    vi.mocked(modeler.client.import).mockImplementation((document) => {
      if (!document || !("domainStory" in document)) {
        throw new Error("malformed");
      }
    });
    const session = bootstrap(h.api, async () => modeler.client);
    display(JSON.stringify(story), 1);
    await settleDisplay();

    display("not json", 2);
    await settleDisplay();
    modeler.emit("story.changed");
    await Promise.resolve();
    expect(
      h.posted.filter((message) => message.type === "SyncDocumentCommand"),
    ).toHaveLength(0);

    display(JSON.stringify(story), 2);
    await settleDisplay();
    const changed = {
      ...story,
      domainStory: { ...story.domainStory, title: "changed" },
    };
    vi.mocked(modeler.client.export).mockReturnValue(changed);
    modeler.emit("story.changed");
    await Promise.resolve();
    await Promise.resolve();
    expect(h.posted).toContainEqual(
      expect.objectContaining({
        type: "SyncDocumentCommand",
        documentRevision: 2,
      }),
    );
    session.dispose();
  });

  it("keeps repaired imports inert until a correlated acceptance succeeds", async () => {
    const h = host();
    const modeler = fakeClient();
    vi.mocked(modeler.client.import).mockImplementation(() =>
      modeler.emit("import.repaired", {
        removedConnectionIds: ["connection-1"],
      }),
    );
    const session = bootstrap(h.api, async () => modeler.client);
    display(JSON.stringify(story), 3);
    await settleDisplay();
    const issue = h.posted.find(
      (message) => message.type === "ReportWebviewIssueCommand",
    );
    expect(issue).toMatchObject({
      kind: "repair",
      removedConnectionIds: ["connection-1"],
    });
    expect(document.getElementById("egon-io-container")?.inert).toBe(true);

    if (issue?.type !== "ReportWebviewIssueCommand")
      throw new Error("missing issue");
    window.dispatchEvent(
      new MessageEvent("message", {
        data: {
          type: "ResolveWebviewIssueCommand",
          sessionId: "session",
          documentRevision: 3,
          issueToken: issue.issueToken,
          decision: "acceptRepairs",
        },
      }),
    );
    await Promise.resolve();
    await Promise.resolve();
    const write = h.posted.find(
      (message) => message.type === "SyncDocumentCommand",
    );
    if (write?.type !== "SyncDocumentCommand") throw new Error("missing write");
    window.dispatchEvent(
      new MessageEvent("message", {
        data: {
          type: "SyncDocumentResultCommand",
          sessionId: "session",
          requestId: write.requestId,
          documentRevision: 4,
          status: "applied",
        },
      }),
    );
    await Promise.resolve();
    expect(document.getElementById("egon-io-container")?.inert).toBe(false);
    session.dispose();
  });

  it("retries an export without reimporting or overwriting the live canvas", async () => {
    const h = host();
    const modeler = fakeClient();
    const session = bootstrap(h.api, async () => modeler.client);
    display(JSON.stringify(story), 5);
    await settleDisplay();
    const importCount = vi.mocked(modeler.client.import).mock.calls.length;

    vi.mocked(modeler.client.export).mockImplementationOnce(() => {
      throw new Error("export failed");
    });
    modeler.emit("story.changed");
    await settleDisplay(0);
    const issue = h.posted.find(
      (message) =>
        message.type === "ReportWebviewIssueCommand" &&
        message.message.includes("export failed"),
    );
    if (issue?.type !== "ReportWebviewIssueCommand") {
      throw new Error("missing export issue");
    }

    const changed = {
      ...story,
      domainStory: { ...story.domainStory, title: "still live" },
    };
    vi.mocked(modeler.client.export).mockReturnValue(changed);
    window.dispatchEvent(
      new MessageEvent("message", {
        data: {
          type: "ResolveWebviewIssueCommand",
          sessionId: "session",
          documentRevision: 5,
          issueToken: issue.issueToken,
          decision: "retry",
        },
      }),
    );
    await settleDisplay(0);

    expect(modeler.client.import).toHaveBeenCalledTimes(importCount);
    expect(h.posted).toContainEqual(
      expect.objectContaining({
        type: "SyncDocumentCommand",
        text: JSON.stringify(changed),
      }),
    );
    session.dispose();
  });
});
