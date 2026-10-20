import { describe, expect, it, vi } from "vitest";
import { DocumentSynchronizer, SyncSnapshot } from "./synchronization";

function write(text: string, generation = 1, documentRevision = 2) {
  return {
    sessionId: "session",
    generation,
    documentRevision,
    text,
  };
}

function setup(current = { generation: 1 }) {
  const post = vi.fn();
  const accepted = vi.fn();
  const stale = vi.fn();
  const failed = vi.fn();
  const isCurrent = (snapshot: SyncSnapshot) =>
    snapshot.generation === current.generation;
  const synchronizer = new DocumentSynchronizer({
    post,
    accepted,
    stale,
    failed,
    isCurrent,
  });
  return { synchronizer, post, accepted, stale, failed };
}

describe("DocumentSynchronizer", () => {
  it("holds one request and publishes only the newest pending edit", () => {
    const subject = setup();
    subject.synchronizer.submit(write("first"));
    subject.synchronizer.submit(write("second"));
    subject.synchronizer.submit(write("newest"));
    expect(subject.post).toHaveBeenCalledOnce();

    subject.synchronizer.receive({
      type: "SyncDocumentResultCommand",
      sessionId: "session",
      requestId: 1,
      documentRevision: 3,
      status: "applied",
    });
    expect(subject.post).toHaveBeenLastCalledWith(
      expect.objectContaining({
        text: "newest",
        documentRevision: 3,
        requestId: 2,
      }),
    );
  });

  it("does not release an edit belonging to a replaced display", () => {
    const current = { generation: 1 };
    const subject = setup(current);
    subject.synchronizer.submit(write("first", 1));
    subject.synchronizer.submit(write("old pending", 1));
    current.generation = 2;
    subject.synchronizer.invalidate(2);
    subject.synchronizer.receive({
      type: "SyncDocumentResultCommand",
      sessionId: "session",
      requestId: 1,
      documentRevision: 3,
      status: "unchanged",
    });
    expect(subject.post).toHaveBeenCalledOnce();
  });

  it("releases a current edit after a stale acknowledgment for a replaced display", () => {
    const current = { generation: 1 };
    const subject = setup(current);
    subject.synchronizer.submit(write("old", 1));
    current.generation = 2;
    subject.synchronizer.submit(write("current", 2, 4));

    subject.synchronizer.receive({
      type: "SyncDocumentResultCommand",
      sessionId: "session",
      requestId: 1,
      documentRevision: 3,
      status: "stale",
    });

    expect(subject.stale).not.toHaveBeenCalled();
    expect(subject.post).toHaveBeenLastCalledWith(
      expect.objectContaining({
        text: "current",
        documentRevision: 4,
        requestId: 2,
      }),
    );
  });

  it("ignores unrelated acknowledgments and discards pending work on stale", () => {
    const subject = setup();
    subject.synchronizer.submit(write("first"));
    subject.synchronizer.submit(write("pending"));
    subject.synchronizer.receive({
      type: "SyncDocumentResultCommand",
      sessionId: "other",
      requestId: 1,
      documentRevision: 3,
      status: "applied",
    });
    expect(subject.accepted).not.toHaveBeenCalled();

    subject.synchronizer.receive({
      type: "SyncDocumentResultCommand",
      sessionId: "session",
      requestId: 1,
      documentRevision: 3,
      status: "stale",
    });
    expect(subject.stale).toHaveBeenCalledOnce();
    expect(subject.post).toHaveBeenCalledOnce();
  });

  it("continues with a current pending edit after a failed older write", () => {
    const current = { generation: 1 };
    const subject = setup(current);
    subject.synchronizer.submit(write("old", 1));
    current.generation = 2;
    subject.synchronizer.submit(write("current", 2, 4));
    subject.synchronizer.receive({
      type: "SyncDocumentResultCommand",
      sessionId: "session",
      requestId: 1,
      documentRevision: 3,
      status: "failed",
    });
    expect(subject.failed).toHaveBeenCalledOnce();
    expect(subject.post).toHaveBeenLastCalledWith(
      expect.objectContaining({ text: "current", requestId: 2 }),
    );
  });
});
