/** Host capability for reading and replacing model documents. */
export interface DocumentPort {
    read(documentId: string): Promise<DocumentSnapshot>;
    write(documentId: string, text: string, expectedVersion: number, isCurrent: () => boolean): Promise<DocumentWriteResult>;
}

export interface DocumentSnapshot {
    readonly text: string;
    readonly version: number;
}

export type DocumentWriteResult =
    | { readonly status: "applied" | "unchanged"; readonly snapshot: DocumentSnapshot }
    | { readonly status: "stale"; readonly snapshot: DocumentSnapshot };

/** Host capability for displaying a model snapshot in an editor view. */
export interface ViewPort {
    display(sessionId: string, text: string, documentRevision: number): Promise<void>;
    syncResult(sessionId: string, requestId: number, documentRevision: number, status: "applied" | "unchanged" | "stale" | "failed"): Promise<void>;
}

/** A resource with an explicit, synchronous lifetime. */
export interface DisposablePort {
    dispose(): void;
}

/** Host capability for locating the workspace containing a URI-string resource. */
export interface WorkspaceFolderPort {
    getWorkspaceFolder(resourceId: string): string | undefined;
}

/** Host capability for discovering files without exposing host URI types. */
export interface FileDiscoveryPort {
    findFiles(workspaceFolderId: string, pattern: string): Promise<string[]>;
}

/** Host capability for reading a file directly from the filesystem. */
export interface FileReadPort {
    readFile(resourceId: string): Promise<string>;
}

/** Host capability for reading through the host's text-document abstraction. */
export interface TextDocumentReadPort {
    readTextDocument(resourceId: string): Promise<string>;
}

/** Host capability for writing a file directly to the filesystem. */
export interface FileWritePort {
    writeFile(resourceId: string, text: string): Promise<void>;
}

/** Diagnostic output used by controllers and registration functions. */
export interface LoggerPort {
    debug(message: string): void;
    error(message: string, error?: unknown): void;
}

/** User-facing messages used at the host boundary. */
export interface NotifierPort {
    warning(message: string): void;
    error(message: string): void;
}

/** Read-only cancellation signal for asynchronous application services. */
export interface LifetimePort {
    readonly isRetired: boolean;
}
