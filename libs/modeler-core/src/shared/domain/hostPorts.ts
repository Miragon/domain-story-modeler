/** Host capability for reading and replacing model documents. */
export interface DocumentPort {
    read(documentId: string): Promise<string>;
    write(documentId: string, text: string): Promise<void>;
}

/** Host capability for displaying a model snapshot in an editor view. */
export interface ViewPort {
    display(sessionId: string, text: string): Promise<void>;
}
