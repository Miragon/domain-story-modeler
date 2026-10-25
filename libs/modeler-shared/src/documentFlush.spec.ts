import { describe, expect, it, vi } from "vitest";
import { createFlushResponder, FlushSource } from "./documentFlush";
import { DocumentFlushedResponse } from "./messages";

function source() {
  let generation = 0;
  let pendingHost = false;
  const beginDestructiveFlush = vi.fn();
  const endDestructiveFlush = vi.fn();
  const flush = vi.fn(async () => ({ status: "clean" as const }));
  const port: FlushSource = {
    isReady: () => true,
    hostUpdateVersion: () => generation,
    hasPendingHostUpdate: () => pendingHost,
    beginDestructiveFlush, endDestructiveFlush, flush,
  };
  return { port, flush, beginDestructiveFlush, endDestructiveFlush,
    updateHost: () => { generation++; pendingHost = true; } };
}

describe("flush responder", () => {
  it("refuses an export after intervening host content", async () => {
    const s = source();
    let finish!: (result: { status: "clean" }) => void;
    s.flush.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
    const replies: DocumentFlushedResponse[] = [];
    const respond = createFlushResponder(s.port, (reply) => replies.push(reply));
    const pending = respond({ type: "FlushDocumentQuery", token: 1, destructive: false, exportWhenClean: false });
    s.updateHost();
    finish({ status: "clean" });
    await pending;
    expect(replies).toEqual([{ type: "DocumentFlushedCommand", token: 1, status: "host-updated" }]);
  });

  it("release during asynchronous work stays released and stale tokens are ignored", async () => {
    const s = source();
    let finish!: (result: { status: "clean" }) => void;
    s.flush.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
    const replies: DocumentFlushedResponse[] = [];
    const respond = createFlushResponder(s.port, (reply) => replies.push(reply));
    const pending = respond({ type: "FlushDocumentQuery", token: 5, destructive: true, exportWhenClean: false });
    expect(s.beginDestructiveFlush).toHaveBeenCalledOnce();
    await respond({ type: "ReleaseDocumentFlushQuery", token: 4 });
    expect(s.endDestructiveFlush).not.toHaveBeenCalled();
    await respond({ type: "ReleaseDocumentFlushQuery", token: 5 });
    finish({ status: "clean" });
    await pending;
    expect(s.endDestructiveFlush).toHaveBeenCalledOnce();
    await respond({ type: "FlushDocumentQuery", token: 5, destructive: true, exportWhenClean: false });
    expect(s.beginDestructiveFlush).toHaveBeenCalledOnce();
    expect(replies).toHaveLength(1);
  });
});
