import { describe, expect, it, vi } from "vitest";
import { DocumentFlushService, DocumentFlushTransport } from "./DocumentFlushService";
import { FlushDocumentRequest, ReleaseDocumentFlushRequest } from "@egon/modeler-shared";

function setup() {
  let current = true;
  const post = vi.fn(async (sessionId: string, message: FlushDocumentRequest | ReleaseDocumentFlushRequest) => {
    void sessionId;
    void message;
    return true;
  });
  const transport: DocumentFlushTransport = { isCurrent: () => current, post };
  return { service: new DocumentFlushService(transport), post, retire: () => { current = false; } };
}

describe("DocumentFlushService", () => {
  it("coalesces requests and ignores stale tokens", async () => {
    const { service, post } = setup();
    const first = service.requestFlush("panel");
    expect(service.requestFlush("panel")).toBe(first);
    expect(post).toHaveBeenCalledTimes(1);
    service.handleReply("panel", { type: "DocumentFlushedCommand", token: 9, status: "clean" });
    service.handleReply("panel", { type: "DocumentFlushedCommand", token: 1, status: "clean" });
    await expect(first).resolves.toEqual({ status: "clean" });
  });

  it("supersedes a normal request for a destructive lock and releases exactly its token", async () => {
    const { service, post } = setup();
    const normal = service.requestFlush("panel");
    const destructive = service.requestFlush("panel", { destructive: true });
    await expect(normal).resolves.toEqual({ status: "unavailable" });
    service.handleReply("panel", { type: "DocumentFlushedCommand", token: 1, status: "clean" });
    service.handleReply("panel", { type: "DocumentFlushedCommand", token: 2, status: "clean" });
    await expect(destructive).resolves.toEqual({ status: "clean" });
    service.releaseFlush("panel");
    service.releaseFlush("panel");
    expect(post).toHaveBeenCalledWith("panel", { type: "ReleaseDocumentFlushQuery", token: 2 });
    expect(post.mock.calls.filter(([, message]) => message.type === "ReleaseDocumentFlushQuery")).toHaveLength(1);
  });

  it("settles failures, timeouts, and retired sessions", async () => {
    vi.useFakeTimers();
    try {
      const { service, retire } = setup();
      const timed = service.requestFlush("panel", { timeoutMs: 10 });
      await vi.advanceTimersByTimeAsync(10);
      await expect(timed).resolves.toEqual({ status: "unavailable" });
      const pending = service.requestFlush("panel");
      retire();
      service.retire("panel");
      await expect(pending).resolves.toEqual({ status: "unavailable" });
    } finally { vi.useRealTimers(); }
  });
});
