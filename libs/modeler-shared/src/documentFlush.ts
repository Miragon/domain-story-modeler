import { DocumentFlushedResponse, FlushDocumentRequest, ReleaseDocumentFlushRequest } from "./messages";

export interface FlushSource {
  isReady(): boolean;
  hostUpdateVersion(): number;
  hasPendingHostUpdate(): boolean;
  beginDestructiveFlush(): void;
  endDestructiveFlush(): void;
  flush(generation: number, exportWhenClean: boolean): Promise<Omit<DocumentFlushedResponse, "type" | "token">>;
}

/** Serializes token ownership of an interaction lock while allowing replies to arrive late. */
export function createFlushResponder(source: FlushSource, post: (reply: DocumentFlushedResponse) => void) {
  let lockedToken: number | undefined;
  let newestToken = -1;
  const release = (token: number): void => {
    if (lockedToken !== token) return;
    lockedToken = undefined;
    source.endDestructiveFlush();
  };
  return async (query: FlushDocumentRequest | ReleaseDocumentFlushRequest): Promise<void> => {
    if (query.type === "ReleaseDocumentFlushQuery") {
      release(query.token);
      return;
    }
    if (query.token <= newestToken) return;
    newestToken = query.token;
    if (lockedToken !== undefined) release(lockedToken);
    if (!source.isReady()) {
      post({ type: "DocumentFlushedCommand", token: query.token, status: "unavailable" });
      return;
    }
    const generation = source.hostUpdateVersion();
    const hostUpdated = (): boolean => source.hasPendingHostUpdate() || source.hostUpdateVersion() !== generation;
    if (query.destructive) {
      lockedToken = query.token;
      source.beginDestructiveFlush();
    }
    let result: Omit<DocumentFlushedResponse, "type" | "token">;
    try {
      result = hostUpdated() ? { status: "host-updated" } : await source.flush(generation, query.exportWhenClean);
      if (hostUpdated()) result = { status: "host-updated" };
    } catch {
      result = hostUpdated() ? { status: "host-updated" } : { status: "unavailable" };
    }
    if (query.token !== newestToken) return;
    if (query.destructive && result.status === "unavailable") release(query.token);
    post({ type: "DocumentFlushedCommand", token: query.token, ...result } as DocumentFlushedResponse);
  };
}
