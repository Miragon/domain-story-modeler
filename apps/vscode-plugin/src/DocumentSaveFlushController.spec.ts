import { describe, expect, it, vi } from "vitest";
import { workspace } from "vscode";
import { DisposalScope, DocumentFlushResult, DomainStoryEditorService, LoggerPort } from "@egon/modeler-core";
import { DocumentSaveFlushController } from "./DocumentSaveFlushController";
import { WebviewController } from "./WebviewController";

function setup(sessions = ["a", "b"]) {
  const app = {
    sessionIds: vi.fn(() => sessions),
    isCurrentSession: vi.fn(() => true),
    verifyFlush: vi.fn(async () => true),
  } as unknown as DomainStoryEditorService;
  const requestFlush = vi.fn(async (): Promise<DocumentFlushResult> => ({ status: "clean" }));
  const releaseFlush = vi.fn();
  const editor = { flushService: { requestFlush, releaseFlush } } as unknown as WebviewController;
  const logger: LoggerPort = { debug: vi.fn(), error: vi.fn() };
  return { controller: new DocumentSaveFlushController(app, editor, logger), app, requestFlush, releaseFlush };
}

describe("DocumentSaveFlushController", () => {
  it("joins every panel and verifies the document queue", async () => {
    const { controller, app, requestFlush } = setup();
    const result = await controller.flush("file:///story.egn");
    expect(result.status).toBe("confirmed");
    expect(requestFlush).toHaveBeenCalledTimes(2);
    expect(app.verifyFlush).toHaveBeenCalledWith("file:///story.egn", ["a", "b"], undefined);
  });

  it("registers synchronous waitUntil for autosave and leaves unrelated documents alone", async () => {
    const { controller, app } = setup(["a"]);
    let listener!: (event: { document: { uri: { toString(): string } }; waitUntil(promise: Promise<unknown>): void }) => void;
    vi.mocked(workspace.onWillSaveTextDocument).mockImplementationOnce((callback) => {
      listener = callback as typeof listener;
      return { dispose: vi.fn() };
    });
    const scope = new DisposalScope();
    controller.register(scope);
    const waitUntil = vi.fn();
    listener({ document: { uri: { toString: () => "file:///story.egn" } }, waitUntil });
    expect(waitUntil).toHaveBeenCalledOnce();
    await expect(waitUntil.mock.calls[0][0]).resolves.toEqual([]);
    vi.mocked(app.sessionIds).mockReturnValueOnce([]);
    listener({ document: { uri: { toString: () => "file:///other.egn" } }, waitUntil });
    expect(waitUntil).toHaveBeenCalledOnce();
    scope.dispose();
  });

  it("skips transformations on unavailable flushes and releases confirmed locks in finally", async () => {
    const { controller, requestFlush, releaseFlush } = setup(["a"]);
    requestFlush.mockResolvedValueOnce({ status: "unavailable" });
    const transform = vi.fn(async () => "done");
    await expect(controller.withConfirmedFlush("file:///story.egn", transform)).resolves.toBeUndefined();
    expect(transform).not.toHaveBeenCalled();
    await expect(controller.withConfirmedFlush("file:///story.egn", async () => { throw new Error("transform"); }))
      .rejects.toThrow("transform");
    expect(releaseFlush).toHaveBeenCalled();
  });

  it("uses one 500 ms deadline for several slow panels", async () => {
    vi.useFakeTimers();
    try {
      const { controller, requestFlush } = setup();
      requestFlush.mockImplementation(() => new Promise(() => undefined));
      const pending = controller.flush("file:///story.egn");
      await vi.advanceTimersByTimeAsync(499);
      let finished = false;
      void pending.then(() => { finished = true; });
      await Promise.resolve();
      expect(finished).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      await expect(pending).resolves.toEqual({ status: "unavailable" });
      expect(requestFlush).toHaveBeenCalledTimes(2);
    } finally { vi.useRealTimers(); }
  });
});
