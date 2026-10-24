/** Stable wire identifiers. These values are protocol data, not constructor names. */
export const messageTypes = {
  initializeWebview: "InitializeWebviewCommand",
  displayDomainStory: "DisplayDomainStoryCommand",
  syncDocument: "SyncDocumentCommand",
  syncResult: "SyncDocumentResultCommand",
  reportWebviewIssue: "ReportWebviewIssueCommand",
  resolveWebviewIssue: "ResolveWebviewIssueCommand",
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
  readonly documentRevision: number;
}

/** Webview -> host. The session is checked against the receiving panel. */
export interface SyncDocumentMessage {
  readonly type: "SyncDocumentCommand";
  readonly sessionId: string;
  readonly text: string;
  readonly documentRevision: number;
  readonly requestId: number;
}

export interface SyncDocumentResultMessage {
  readonly type: "SyncDocumentResultCommand";
  readonly sessionId: string;
  readonly requestId: number;
  readonly documentRevision: number;
  readonly status: "applied" | "unchanged" | "stale" | "failed";
}

export type WebviewIssueKind = "initialization" | "import" | "repair";
export type WebviewIssueDecision = "retry" | "openAsText" | "acceptRepairs";

/** Webview -> host. Reports an actionable, revision-scoped editor issue. */
export interface ReportWebviewIssueCommand {
  readonly type: "ReportWebviewIssueCommand";
  readonly sessionId: string;
  readonly documentRevision: number;
  readonly issueToken: string;
  readonly kind: WebviewIssueKind;
  readonly message: string;
  readonly stack?: string;
  readonly removedConnectionIds?: readonly string[];
}

/** Host -> webview. Correlated response to an actionable issue report. */
export interface ResolveWebviewIssueCommand {
  readonly type: "ResolveWebviewIssueCommand";
  readonly sessionId: string;
  readonly documentRevision: number;
  readonly issueToken: string;
  readonly decision: WebviewIssueDecision;
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
  | ReportWebviewIssueCommand
  | DebugDiagnosticMessage
  | ErrorDiagnosticMessage
  | DocumentFlushedResponse;

export type HostToWebviewMessage =
  | DisplayDomainStoryMessage
  | SyncDocumentResultMessage
  | ResolveWebviewIssueCommand
  | FlushDocumentRequest
  | ReleaseDocumentFlushRequest;

export type ProtocolMessage = WebviewToHostMessage | HostToWebviewMessage;
