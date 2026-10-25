import { DocumentFlushedResponse, FlushDocumentRequest, ReleaseDocumentFlushRequest } from "@egon/modeler-shared";

export type DocumentFlushResult =
    | { readonly status: "clean" | "host-updated" | "unavailable" }
    | { readonly status: "flushed"; readonly content: string; readonly documentRevision: number };

export interface DocumentFlushTransport {
    isCurrent(sessionId: string): boolean;
    post(sessionId: string, message: FlushDocumentRequest | ReleaseDocumentFlushRequest): Promise<boolean>;
}

type Pending = {
    readonly token: number;
    readonly destructive: boolean;
    readonly promise: Promise<DocumentFlushResult>;
    settle(result: DocumentFlushResult): void;
};

/** Correlates flush replies with exact panel sessions and manages destructive locks. */
export class DocumentFlushService {
    private nextToken = 1;
    private readonly pending = new Map<string, Pending>();
    private readonly locks = new Map<string, number>();

    constructor(private readonly transport: DocumentFlushTransport) {}

    requestFlush(sessionId: string, options: { timeoutMs?: number; destructive?: boolean; exportWhenClean?: boolean } = {}): Promise<DocumentFlushResult> {
        if (!this.transport.isCurrent(sessionId)) return Promise.resolve({ status: "unavailable" });
        const destructive = options.destructive ?? false;
        const existing = this.pending.get(sessionId);
        if (existing && (existing.destructive || !destructive)) return existing.promise;
        existing?.settle({ status: "unavailable" });
        if (destructive) this.releaseFlush(sessionId);

        const token = this.nextToken++;
        let resolve!: (result: DocumentFlushResult) => void;
        const promise = new Promise<DocumentFlushResult>((done) => { resolve = done; });
        let settled = false;
        const settle = (result: DocumentFlushResult): void => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            if (this.pending.get(sessionId)?.token === token) this.pending.delete(sessionId);
            if (destructive && result.status === "unavailable") this.postRelease(sessionId, token);
            resolve(result);
        };
        this.pending.set(sessionId, { token, destructive, promise, settle });
        const timer = setTimeout(() => settle({ status: "unavailable" }), options.timeoutMs ?? 500);
        try {
            void this.transport.post(sessionId, {
                type: "FlushDocumentQuery", token, destructive,
                exportWhenClean: options.exportWhenClean ?? false,
            }).then((delivered) => { if (!delivered) settle({ status: "unavailable" }); }, () => settle({ status: "unavailable" }));
        } catch {
            settle({ status: "unavailable" });
        }
        return promise;
    }

    handleReply(sessionId: string, reply: DocumentFlushedResponse): void {
        const pending = this.pending.get(sessionId);
        if (!pending || pending.token !== reply.token || !this.transport.isCurrent(sessionId)) return;
        if (pending.destructive && reply.status !== "unavailable") this.locks.set(sessionId, reply.token);
        pending.settle(reply.status === "flushed"
            ? { status: "flushed", content: reply.content, documentRevision: reply.documentRevision }
            : { status: reply.status });
    }

    releaseFlush(sessionId: string): void {
        const token = this.locks.get(sessionId);
        if (token === undefined) return;
        this.locks.delete(sessionId);
        this.postRelease(sessionId, token);
    }

    retire(sessionId: string): void {
        this.pending.get(sessionId)?.settle({ status: "unavailable" });
        this.releaseFlush(sessionId);
    }

    private postRelease(sessionId: string, token: number): void {
        if (!this.transport.isCurrent(sessionId)) return;
        try {
            void this.transport.post(sessionId, { type: "ReleaseDocumentFlushQuery", token }).catch(() => undefined);
        } catch { /* A disposed panel has no lock to release. */ }
    }
}
