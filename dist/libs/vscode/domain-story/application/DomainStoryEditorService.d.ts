import { DocumentPort, ViewPort } from './ports';

/**
 * Application service that orchestrates domain story editor sessions.
 *
 * This service manages the lifecycle of editor sessions and coordinates
 * bidirectional synchronization between VS Code documents and webviews.
 * It implements echo prevention using per-session guards to avoid infinite
 * update loops.
 *
 * **Key Responsibilities:**
 * - Register and manage editor sessions
 * - Coordinate document ↔ webview synchronization
 * - Prevent echo loops between document and webview updates
 * - Maintain per-session state isolation
 *
 * @example
 * ```typescript
 * // In your DI container setup
 * container.register(DomainStoryEditorService, {
 *     useFactory: (c) => {
 *         const docs = c.resolve<DocumentPort>("DocumentPort");
 *         return new DomainStoryEditorService(docs);
 *     }
 * });
 *
 * // In your WebviewController
 * class WebviewController {
 *     constructor(private app: DomainStoryEditorService) {}
 *
 *     async resolveCustomTextEditor(document: TextDocument, panel: WebviewPanel) {
 *         const documentId = document.uri.path;
 *         const view = new VsCodeViewPort(panel);
 *
 *         // Register the session
 *         const sessionId = this.app.registerSession(documentId, document.getText(), view);
 *
 *         // Handle initialization
 *         panel.webview.onDidReceiveMessage(async (cmd) => {
 *             if (cmd.TYPE === 'InitializeWebview') {
 *                 await this.app.initialize(sessionId);
 *             } else if (cmd.TYPE === 'SyncDocument') {
 *                 await this.app.syncFromWebview(sessionId, cmd.text);
 *             }
 *         });
 *
 *         // Handle document changes
 *         workspace.onDidChangeTextDocument(async (event) => {
 *             if (event.document.uri.path === document.uri.path) {
 *                 await this.app.onDocumentChanged(sessionId, event.document.getText());
 *             }
 *         });
 *
 *         // Cleanup
 *         panel.onDidDispose(() => this.app.dispose(sessionId));
 *     }
 * }
 * ```
 */
export declare class DomainStoryEditorService {
    private docs;
    private sessions;
    /**
     * Creates a new domain story editor service.
     *
     * @param docs - Port for document I/O operations
     */
    constructor(docs: DocumentPort);
    /**
     * Registers a new editor session.
     *
     * This should be called when a new editor is opened. If a session with the
     * same ID already exists, a new session is generated to avoid conflicts
     * with existing sessions.
     *
     * @param documentId - Unique identifier for the document (typically file path)
     * @param initialText - Initial content of the editor
     * @param view - View port for displaying content to the webview
     * @returns Unique identifier for the registered editor session
     *
     * @example
     * ```typescript
     * const documentId = document.uri.path;
     * const view = new VsCodeViewPort(webviewPanel);
     * const sessionId = service.registerSession(documentId, document.getText(), view);
     * ```
     */
    registerSession(documentId: string, initialText: string, view: ViewPort): string;
    /**
     * Initializes the webview with the current editor content.
     *
     * This is typically called when the webview sends an initialization message
     * indicating it's ready to receive content.
     *
     * @param sessionId - Unique identifier for the editor session
     *
     * @example
     * ```typescript
     * webview.onDidReceiveMessage(async (cmd) => {
     *     if (cmd.TYPE === 'InitializeWebview') {
     *         await service.initialize(sessionId);
     *     }
     * });
     * ```
     */
    initialize(sessionId: string): Promise<void>;
    /**
     * Syncs content from the webview to the document.
     *
     * This is called when the webview sends updated content back to VS Code.
     * The method uses a guard mechanism to prevent echo loops - while this sync
     * is in progress, any document change events will be ignored.
     *
     * **Echo Prevention Flow:**
     * 1. Guard counter increments
     * 2. Document is updated (triggers onDidChangeTextDocument)
     * 3. onDocumentChanged sees guard > 0 and skips update
     * 4. Guard counter decrements
     *
     * @param sessionId - Unique identifier for the editor session
     * @param text - Updated content from the webview
     *
     * @example
     * ```typescript
     * webview.onDidReceiveMessage(async (cmd) => {
     *     if (cmd.TYPE === 'SyncDocument') {
     *         await service.syncFromWebview(cmd.sessionId, cmd.text);
     *     }
     * });
     * ```
     */
    syncFromWebview(sessionId: string, text: string): Promise<void>;
    /**
     * Handles document content changes from the text editor.
     *
     * This is called when the user edits the text document directly in VS Code.
     * If the guard is active (indicating a sync operation is in progress), this
     * method does nothing to prevent echo loops.
     *
     * **Echo Prevention:**
     * - If guard > 0: Change came from syncFromWebview, ignore it
     * - If guard = 0: Change came from user, update the webview
     *
     * @param sessionId - Unique identifier for the editor session
     * @param text - Updated content from the text editor
     *
     * @example
     * ```typescript
     * workspace.onDidChangeTextDocument(async (event) => {
     *     if (event.document.uri.path === document.uri.path && event.contentChanges.length > 0) {
     *         await service.onDocumentChanged(sessionId, event.document.getText());
     *     }
     * });
     * ```
     */
    onDocumentChanged(sessionId: string, text: string): Promise<void>;
    /**
     * Disposes of an editor session and cleans up resources.
     *
     * This should be called when the editor/webview is closed to prevent memory leaks.
     *
     * @param sessionId - Unique identifier for the editor session to dispose
     *
     * @example
     * ```typescript
     * webviewPanel.onDidDispose(() => {
     *     service.dispose(sessionId);
     * });
     * ```
     */
    dispose(sessionId: string): void;
    /**
     * Retrieves session state for a given id.
     * @param sessionId - Editor session identifier
     * @returns Session state if registered, undefined otherwise
     * @internal
     */
    private get;
    private getDocumentIdFromSessionId;
}
