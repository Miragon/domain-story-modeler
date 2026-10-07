import { CustomTextEditorProvider, FilePermission, TextDocument, Uri, WebviewPanel, workspace } from "vscode";
import { DisposalScope, DomainStoryEditorService, IconInitializationError, IconService, LoggerPort, NotifierPort, ViewPort, WebviewMessageRouter } from "@egon/modeler-core";
import { parseWebviewToHostMessage, WebviewToHostMessage } from "@egon/modeler-shared";
import { domainStoryEditorUi } from "./helper";

type EditorPhase = "loading" | "flushing" | "ready" | "retired";
interface EditorLifetime {
    readonly scope: DisposalScope;
    readonly sessionId: string;
    readonly documentId: string;
    phase: EditorPhase;
    latestDocumentText: string;
    latestHostVersion: number;
    pendingMessages: WebviewToHostMessage[];
}

export interface WebviewControllerDependencies {
    extensionUri: Uri;
    extensionId: string;
    app: DomainStoryEditorService;
    icons: IconService;
    logger: LoggerPort;
    notifier: NotifierPort;
    createView(panel: WebviewPanel): ViewPort;
    renderUi?: typeof domainStoryEditorUi;
}

/** Translates VS Code editor events into host-independent application calls. */
export class WebviewController implements CustomTextEditorProvider {
    private readonly panels = new Map<WebviewPanel, EditorLifetime>();
    private readonly scope = new DisposalScope();
    private readonly messageRouter: WebviewMessageRouter<WebviewToHostMessage, string>;
    private readonly renderUi: typeof domainStoryEditorUi;
    private disposed = false;

    constructor(private readonly dependencies: WebviewControllerDependencies) {
        this.renderUi = dependencies.renderUi ?? domainStoryEditorUi;
        this.scope.add(workspace.onDidChangeTextDocument((event) => {
            if (!event.contentChanges.length) return;
            const id = event.document.uri.toString();
            this.dependencies.app.onDocumentChanged(id, event.document.getText(), event.document.version);
            for (const lifetime of this.panels.values()) {
                if (lifetime.documentId === id) {
                    lifetime.latestDocumentText = event.document.getText();
                    lifetime.latestHostVersion = event.document.version;
                }
            }
        }));
        this.messageRouter = new WebviewMessageRouter<WebviewToHostMessage, string>()
            .on("InitializeWebviewCommand", async (_message, sessionId) => {
                await this.dependencies.app.initialize(sessionId);
            })
            .on("SyncDocumentCommand", async (message, sessionId) => {
                if (message.sessionId !== sessionId) throw new Error(`Editor ID mismatch (${message.sessionId} != ${sessionId})`);
                const status = await this.dependencies.app.syncFromWebview(sessionId, message.text, message.documentRevision, message.requestId);
                if (status === "stale" && [...this.panels.values()].some((panel) => panel.sessionId === sessionId && !panel.scope.isRetired)) {
                    this.dependencies.notifier.warning("The story changed in another editor. The latest document was reloaded.");
                    await this.dependencies.app.initialize(sessionId);
                }
            })
            .on("LogDebugCommand", (message) => this.dependencies.logger.debug(message.stack === undefined ? message.message : `${message.message}\n${message.stack}`))
            .on("LogErrorCommand", (message) => this.dependencies.logger.error(message.message, message.stack));
    }

    async resolveCustomTextEditor(document: TextDocument, panel: WebviewPanel): Promise<void> {
        if (this.disposed) return;
        const prior = this.panels.get(panel);
        if (prior) this.retire(panel, prior);
        const documentId = document.uri.toString();
        const lifetime: EditorLifetime = {
            scope: new DisposalScope((error) => this.dependencies.logger.error("Failed to dispose an editor resource", error)),
            sessionId: this.dependencies.app.registerSession(documentId, document.getText(), document.version, this.dependencies.createView(panel)),
            documentId,
            phase: "loading",
            latestDocumentText: document.getText(),
            latestHostVersion: document.version,
            pendingMessages: [],
        };
        this.panels.set(panel, lifetime);
        lifetime.scope.add({ dispose: () => this.dependencies.app.dispose(lifetime.sessionId) });
        try {
            panel.webview.options = { enableScripts: true };
            lifetime.scope.add(panel.webview.onDidReceiveMessage((input: unknown) => this.receiveMessage(lifetime, input)));
            lifetime.scope.add(panel.onDidDispose(() => this.retire(panel, lifetime)));
            panel.webview.html = this.renderUi(panel.webview, this.dependencies.extensionUri);
            await this.initializeIcons(document, lifetime);
            if (lifetime.scope.isRetired) return;
            await this.flushPendingMessages(lifetime);
        } catch (error) {
            this.dependencies.logger.error("Failed to set up the domain story editor", error);
            this.dependencies.notifier.error("The Domain Story Modeler could not be opened. See the Egon output for details.");
            this.retire(panel, lifetime);
        }
    }

    dispose(): void {
        if (this.disposed) return;
        this.disposed = true;
        for (const [panel, lifetime] of [...this.panels]) this.retire(panel, lifetime);
        this.scope.dispose();
    }

    private async initializeIcons(document: TextDocument, lifetime: EditorLifetime): Promise<void> {
        try {
            if (workspace.fs.isWritableFileSystem(document.uri.scheme) !== true) return;
            const stat = await workspace.fs.stat(document.uri);
            if (stat && ((stat.permissions ?? 0) & FilePermission.Readonly)) return;
            const sourceVersion = lifetime.latestHostVersion;
            const initialized = await this.dependencies.icons.initializeDocument(document.uri.toString(), () => lifetime.latestDocumentText, lifetime.scope);
            if (initialized !== undefined && !lifetime.scope.isRetired && lifetime.latestHostVersion === sourceVersion && initialized !== lifetime.latestDocumentText) {
                lifetime.latestDocumentText = initialized;
                this.dependencies.app.onInitializedContent(lifetime.documentId, initialized);
            }
        } catch (error) {
            if (lifetime.scope.isRetired) return;
            this.dependencies.logger.error("Failed to initialize custom icons", error);
            if (error instanceof IconInitializationError && error.stage === "write") {
                this.dependencies.notifier.error("Custom icons could not be saved. The editor opened with the current document icons.");
            } else {
                this.dependencies.notifier.warning("Custom icons could not be loaded. The editor opened with the icons embedded in the document.");
            }
        }
    }

    private receiveMessage(lifetime: EditorLifetime, input: unknown): void {
        if (lifetime.scope.isRetired) return;
        let message: WebviewToHostMessage;
        try { message = parseWebviewToHostMessage(input); }
        catch (error) { this.dependencies.logger.error("Rejected invalid webview message", error); return; }
        if (lifetime.phase !== "ready") { lifetime.pendingMessages.push(message); return; }
        void this.dispatch(lifetime, message).catch((error) => {
            if (!lifetime.scope.isRetired) this.reportAsyncFailure("Failed to process a webview message", error);
        });
    }

    private async flushPendingMessages(lifetime: EditorLifetime): Promise<void> {
        lifetime.phase = "flushing";
        while (!lifetime.scope.isRetired && lifetime.pendingMessages.length) {
            const message = lifetime.pendingMessages.shift();
            if (!message) continue;
            try { await this.dispatch(lifetime, message); }
            catch (error) { if (!lifetime.scope.isRetired) this.reportAsyncFailure("Failed to process a webview message", error); }
        }
        if (!lifetime.scope.isRetired) lifetime.phase = "ready";
    }

    private async dispatch(lifetime: EditorLifetime, message: WebviewToHostMessage): Promise<void> {
        if (lifetime.scope.isRetired) return;
        this.dependencies.logger.debug(`Message received -> ${message.type}`);
        await this.messageRouter.dispatch(message, lifetime.sessionId);
        this.dependencies.logger.debug(`Message processed -> ${message.type}`);
    }

    private retire(panel: WebviewPanel, lifetime: EditorLifetime): void {
        lifetime.phase = "retired";
        lifetime.scope.dispose();
        if (this.panels.get(panel) === lifetime) this.panels.delete(panel);
    }

    private reportAsyncFailure(message: string, error: unknown): void {
        this.dependencies.logger.error(message, error);
        this.dependencies.notifier.error(`${message}. See the Egon output for details.`);
    }
}
