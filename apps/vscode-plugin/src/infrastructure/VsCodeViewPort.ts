import { WebviewPanel } from "vscode";
import { ViewPort } from "@egon/modeler-core";
import { DisplayDomainStoryMessage, SyncDocumentResultMessage } from "@egon/modeler-shared";

/**
 * VS Code implementation of the ViewPort interface.
 *
 * This adapter sends content to the webview using VS Code's `postMessage` API.
 * It wraps the content in a typed display message for the webview to process.
 *
 * @example
 * ```typescript
 * // Create for a webview panel
 * const view = new VsCodeViewPort(webviewPanel);
 *
 * // Register with service
 * service.registerSession(editorId, initialText, view);
 *
 * // The service will call display() when needed
 * await view.display(editorId, 'content to display');
 * ```
 */
export class VsCodeViewPort implements ViewPort {
    /**
     * Creates a new VS Code view port.
     *
     * @param panel - The webview panel to send messages to
     */
    constructor(private panel: WebviewPanel) {}

    /**
     * Displays content in the webview by posting a message.
     *
     * Creates a display message and sends it to the webview via `postMessage`.
     * The webview is expected to handle this message and update
     * its display accordingly.
     *
     * @param sessionId - Unique identifier for the editor session
     * @param text - Content to display in the webview
     * @returns Promise that resolves when the message is posted
     * @throws Error if the webview is disposed or the message cannot be sent
     */
    async display(sessionId: string, text: string, documentRevision: number): Promise<void> {
        const message: DisplayDomainStoryMessage = {
            type: "DisplayDomainStoryCommand",
            sessionId,
            text,
            documentRevision,
        };
        if (!await this.panel.webview.postMessage(message)) throw new Error("Webview did not accept the display message");
    }

    async syncResult(sessionId: string, requestId: number, documentRevision: number, status: SyncDocumentResultMessage["status"]): Promise<void> {
        const message: SyncDocumentResultMessage = { type: "SyncDocumentResultCommand", sessionId, requestId, documentRevision, status };
        if (!await this.panel.webview.postMessage(message)) throw new Error("Webview did not accept the synchronization result");
    }
}
