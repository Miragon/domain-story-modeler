export interface Command {
    /**
     * After parsing the command, TypeScript can't identify the type of the object
     * with **instanceof**.
     * Therefore, we use this as a workaround.
     */
    TYPE: string;
    /**
     * Unique identifier for the session in which the command is being executed.
     */
    sessionId: string;
}
/**
 * Command to initialize the webview.
 * Used when the webview sends an ` InitializeWebviewCommand ` to the extension.
 *
 * @param sessionId - Unique identifier for the session in which the command is being executed.
 */
export declare class InitializeWebviewCommand implements Command {
    readonly sessionId: string;
    readonly TYPE: string;
    constructor(sessionId: string);
}
/**
 * Command to display domain story content in the webview.
 * Used when the extension sends a `DisplayDomainStoryCommand` to the webview.
 *
 * @param sessionId - Unique identifier for the session in which the command is being executed.
 * @param text - Content to display in the webview
 */
export declare class DisplayDomainStoryCommand implements Command {
    readonly sessionId: string;
    readonly text: string;
    readonly TYPE: string;
    constructor(sessionId: string, text: string);
}
/**
 * Command to sync document content with the webview.
 * Used when the webview sends a `SyncDocumentCommand` to the extension.
 *
 * @param sessionId - Unique identifier for the session in which the command is being executed.
 * @param text - New content to sync to the webview
 */
export declare class SyncDocumentCommand implements Command {
    readonly sessionId: string;
    readonly text: string;
    readonly TYPE: string;
    constructor(sessionId: string, text: string);
}
export declare class GetDomainStoryAsSvgCommand implements Command {
    readonly sessionId: string;
    readonly svg?: string | undefined;
    readonly TYPE: string;
    constructor(sessionId: string, svg?: string | undefined);
}
