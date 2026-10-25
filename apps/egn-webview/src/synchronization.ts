import {
  SyncDocumentResultMessage,
  WebviewToHostMessage,
} from "@egon/modeler-shared";

export interface SyncSnapshot {
  readonly sessionId: string;
  readonly generation: number;
  readonly documentRevision: number;
}

interface PendingWrite extends SyncSnapshot {
  readonly text: string;
  readonly issueToken?: string;
}

interface OutstandingWrite extends PendingWrite {
  readonly requestId: number;
}

export interface SynchronizationCallbacks {
  post(message: WebviewToHostMessage): void;
  isCurrent(snapshot: SyncSnapshot): boolean;
  accepted(write: PendingWrite, result: SyncDocumentResultMessage): void;
  stale(write: PendingWrite): void;
  failed(write: PendingWrite): void;
}

/** Holds exactly one host write and only the newest generation-scoped edit. */
export class DocumentSynchronizer {
  private nextRequestId = 0;
  private outstanding: OutstandingWrite | undefined;
  private pending: PendingWrite | undefined;
  private disposed = false;
  private failureEpoch = 0;
  private readonly waiters = new Set<() => void>();

  constructor(private readonly callbacks: SynchronizationCallbacks) {}

  submit(write: PendingWrite): void {
    if (this.disposed || !this.callbacks.isCurrent(write)) return;
    if (this.outstanding) {
      this.pending = write;
      return;
    }
    this.publish(write);
  }

  invalidate(generation: number): void {
    if (this.pending?.generation !== generation) this.pending = undefined;
    this.notifyWaiters();
  }

  /** Waits for all writes known at the time of the flush to be acknowledged. */
  async drain(signal?: AbortSignal): Promise<boolean> {
    if (this.disposed || signal?.aborted) return false;
    const epoch = this.failureEpoch;
    while (this.outstanding || this.pending) {
      await new Promise<void>((resolve) => {
        const done = (): void => {
          this.waiters.delete(done);
          signal?.removeEventListener("abort", done);
          resolve();
        };
        this.waiters.add(done);
        signal?.addEventListener("abort", done, { once: true });
        if (this.disposed || signal?.aborted || (!this.outstanding && !this.pending)) done();
      });
      if (this.disposed || signal?.aborted || epoch !== this.failureEpoch) return false;
    }
    return true;
  }

  receive(result: SyncDocumentResultMessage): void {
    const current = this.outstanding;
    if (
      !current ||
      current.sessionId !== result.sessionId ||
      current.requestId !== result.requestId
    ) {
      return;
    }

    this.outstanding = undefined;
    if (result.status === "stale") {
      this.failureEpoch++;
      const pending = this.pending;
      this.pending = undefined;
      if (this.callbacks.isCurrent(current)) {
        this.callbacks.stale(current);
      } else if (pending && this.callbacks.isCurrent(pending)) {
        this.publish(pending);
      }
      this.notifyWaiters();
      return;
    }
    if (result.status === "failed") {
      this.failureEpoch++;
      const pending = this.pending;
      this.pending = undefined;
      this.callbacks.failed(current);
      if (pending && this.callbacks.isCurrent(pending)) {
        this.publish(pending);
      }
      this.notifyWaiters();
      return;
    }

    this.callbacks.accepted(current, result);
    const pending = this.pending;
    this.pending = undefined;
    if (
      pending &&
      pending.text !== current.text &&
      this.callbacks.isCurrent(pending)
    ) {
      this.publish({
        ...pending,
        documentRevision: Math.max(
          pending.documentRevision,
          result.documentRevision,
        ),
      });
    }
    this.notifyWaiters();
  }

  dispose(): void {
    this.disposed = true;
    this.outstanding = undefined;
    this.pending = undefined;
    this.notifyWaiters();
  }

  private notifyWaiters(): void {
    for (const waiter of [...this.waiters]) waiter();
  }

  private publish(write: PendingWrite): void {
    const requestId = ++this.nextRequestId;
    this.outstanding = { ...write, requestId };
    this.callbacks.post({
      type: "SyncDocumentCommand",
      sessionId: write.sessionId,
      text: write.text,
      documentRevision: write.documentRevision,
      requestId,
    });
  }
}
