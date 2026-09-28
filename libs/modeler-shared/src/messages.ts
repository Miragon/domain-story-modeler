/** Stable wire identifiers. These values are protocol data, not constructor names. */
export const messageTypes = {
    initializeWebview: "InitializeWebviewCommand",
    displayDomainStory: "DisplayDomainStoryCommand",
    syncDocument: "SyncDocumentCommand",
    logDebug: "LogDebugCommand",
    logError: "LogErrorCommand",
    flushDocument: "FlushDocumentQuery",
    releaseDocumentFlush: "ReleaseDocumentFlushQuery",
    documentFlushed: "DocumentFlushedCommand",
} as const;

/** Webview -> host. The host derives the session from the receiving panel. */
export interface InitializeWebviewMessage {
    readonly type: "InitializeWebviewCommand";
}

/** Host -> webview. */
export interface DisplayDomainStoryMessage {
    readonly type: "DisplayDomainStoryCommand";
    readonly sessionId: string;
    readonly text: string;
}

/** Webview -> host. The session is checked against the receiving panel. */
export interface SyncDocumentMessage {
    readonly type: "SyncDocumentCommand";
    readonly sessionId: string;
    readonly text: string;
}

export interface DebugDiagnosticMessage {
    readonly type: "LogDebugCommand";
    readonly message: string;
    readonly stack?: string;
}

export interface ErrorDiagnosticMessage {
    readonly type: "LogErrorCommand";
    readonly message: string;
    /** Serialized because Error objects do not survive postMessage. */
    readonly stack?: string;
}

/** Reserved for the save-time flush implementation in issue #15. */
export interface FlushDocumentRequest {
    readonly type: "FlushDocumentQuery";
    readonly token: number;
    readonly destructive: boolean;
    readonly exportWhenClean: boolean;
}

/** Reserved for the save-time flush implementation in issue #15. */
export interface ReleaseDocumentFlushRequest {
    readonly type: "ReleaseDocumentFlushQuery";
    readonly token: number;
}

export type DocumentFlushStatus =
    | "clean"
    | "flushed"
    | "host-updated"
    | "unavailable";

/** Reserved webview -> host response for issue #15. */
export interface DocumentFlushedResponse {
    readonly type: "DocumentFlushedCommand";
    readonly token: number;
    readonly status: DocumentFlushStatus;
    readonly content?: string;
    readonly documentRevision?: number;
}

export type WebviewToHostMessage =
    | InitializeWebviewMessage
    | SyncDocumentMessage
    | DebugDiagnosticMessage
    | ErrorDiagnosticMessage
    | DocumentFlushedResponse;

export type HostToWebviewMessage =
    | DisplayDomainStoryMessage
    | FlushDocumentRequest
    | ReleaseDocumentFlushRequest;

export type ProtocolMessage = WebviewToHostMessage | HostToWebviewMessage;
