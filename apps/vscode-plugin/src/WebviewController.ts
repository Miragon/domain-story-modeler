import {
    CustomTextEditorProvider,
    TextDocument,
    Uri,
    WebviewPanel,
    workspace,
} from "vscode";
import {
    DisposalScope,
    DomainStoryEditorService,
    IconInitializationError,
    IconService,
    LoggerPort,
    NotifierPort,
    ViewPort,
    WebviewMessageRouter,
} from "@egon/modeler-core";
import {
    parseWebviewToHostMessage,
    WebviewToHostMessage,
} from "@egon/modeler-shared";
import { domainStoryEditorUi } from "./helper";

type EditorPhase = "loading" | "flushing" | "ready" | "retired";

interface EditorLifetime {
    readonly scope: DisposalScope;
    phase: EditorPhase;
    latestDocumentText: string;
    documentRevision: number;
    pendingMessages: WebviewToHostMessage[];
    sessionId?: string;
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
    private readonly messageRouter: WebviewMessageRouter<
        WebviewToHostMessage,
        string
    >;
    private readonly renderUi: typeof domainStoryEditorUi;
    private disposed = false;

    constructor(private readonly dependencies: WebviewControllerDependencies) {
        this.renderUi = dependencies.renderUi ?? domainStoryEditorUi;
        this.messageRouter = new WebviewMessageRouter<
            WebviewToHostMessage,
            string
        >()
            .on("InitializeWebviewCommand", async (_message, sessionId) => {
                await this.dependencies.app.initialize(sessionId);
            })
            .on("SyncDocumentCommand", async (message, sessionId) => {
                if (message.sessionId !== sessionId) {
                    throw new Error(
                        `Editor ID mismatch (${message.sessionId} != ${sessionId})`,
                    );
                }
                await this.dependencies.app.syncFromWebview(
                    sessionId,
                    message.text,
                );
            })
            .on("LogDebugCommand", (message) => {
                this.dependencies.logger.debug(
                    message.stack === undefined
                        ? message.message
                        : `${message.message}\n${message.stack}`,
                );
            })
            .on("LogErrorCommand", (message) => {
                this.dependencies.logger.error(message.message, message.stack);
            });
    }

    async resolveCustomTextEditor(
        document: TextDocument,
        webviewPanel: WebviewPanel,
    ): Promise<void> {
        if (this.disposed) return;

        this.panels.get(webviewPanel)?.scope.dispose();

        const lifetime: EditorLifetime = {
            scope: new DisposalScope((error) =>
                this.dependencies.logger.error(
                    "Failed to dispose an editor resource",
                    error,
                ),
            ),
            phase: "loading",
            latestDocumentText: document.getText(),
            documentRevision: 0,
            pendingMessages: [],
        };
        this.panels.set(webviewPanel, lifetime);

        try {
            webviewPanel.webview.options = { enableScripts: true };

            lifetime.scope.add(
                webviewPanel.webview.onDidReceiveMessage((input: unknown) => {
                    this.receiveMessage(lifetime, input);
                }),
            );

            lifetime.scope.add(
                workspace.onDidChangeTextDocument((event) => {
                    if (
                        event.contentChanges.length === 0 ||
                        document.uri.path.split(".").pop() !==
                            this.dependencies.extensionId ||
                        document.uri.path !== event.document.uri.path
                    ) {
                        return;
                    }

                    lifetime.latestDocumentText = event.document.getText();
                    lifetime.documentRevision++;
                    if (lifetime.phase === "ready" && lifetime.sessionId) {
                        void this.dependencies.app
                            .onDocumentChanged(
                                lifetime.sessionId,
                                lifetime.latestDocumentText,
                            )
                            .catch((error) => {
                                if (!lifetime.scope.isRetired)
                                    this.reportAsyncFailure(
                                        "Failed to process a document change",
                                        error,
                                    );
                            });
                    }
                }),
            );

            lifetime.scope.add(
                webviewPanel.onDidDispose(() =>
                    this.retire(webviewPanel, lifetime),
                ),
            );

            webviewPanel.webview.html = this.renderUi(
                webviewPanel.webview,
                this.dependencies.extensionUri,
            );

            const initialText = await this.initializeIcons(document, lifetime);
            if (lifetime.scope.isRetired || initialText === undefined) return;

            const sessionId = this.dependencies.app.registerSession(
                document.uri.path,
                initialText,
                this.dependencies.createView(webviewPanel),
            );
            lifetime.sessionId = sessionId;
            lifetime.scope.add({
                dispose: () => this.dependencies.app.dispose(sessionId),
            });
            if (lifetime.scope.isRetired) return;

            await this.flushPendingMessages(lifetime);
        } catch (error) {
            this.dependencies.logger.error(
                "Failed to set up the domain story editor",
                error,
            );
            this.dependencies.notifier.error(
                "The Domain Story Modeler could not be opened. See the Egon output for details.",
            );
            this.retire(webviewPanel, lifetime);
        }
    }

    dispose(): void {
        if (this.disposed) return;
        this.disposed = true;
        for (const [panel, lifetime] of [...this.panels]) {
            this.retire(panel, lifetime);
        }
    }

    private async initializeIcons(
        document: TextDocument,
        lifetime: EditorLifetime,
    ): Promise<string | undefined> {
        let sourceRevision = lifetime.documentRevision;
        try {
            const initialized =
                await this.dependencies.icons.initializeDocument(
                    document.uri.toString(),
                    () => {
                        sourceRevision = lifetime.documentRevision;
                        return lifetime.latestDocumentText;
                    },
                    lifetime.scope,
                );
            if (
                initialized !== undefined &&
                lifetime.documentRevision === sourceRevision
            ) {
                lifetime.latestDocumentText = initialized;
            }
            return initialized === undefined
                ? undefined
                : lifetime.latestDocumentText;
        } catch (error) {
            if (lifetime.scope.isRetired) return undefined;

            this.dependencies.logger.error(
                "Failed to initialize custom icons",
                error,
            );
            if (
                error instanceof IconInitializationError &&
                error.stage === "write"
            ) {
                this.dependencies.notifier.error(
                    "Custom icons could not be saved. The editor opened with the current document icons.",
                );
            } else {
                this.dependencies.notifier.warning(
                    "Custom icons could not be loaded. The editor opened with the icons embedded in the document.",
                );
            }
            return lifetime.latestDocumentText;
        }
    }

    private receiveMessage(lifetime: EditorLifetime, input: unknown): void {
        if (lifetime.scope.isRetired) return;

        let message: WebviewToHostMessage;
        try {
            message = parseWebviewToHostMessage(input);
        } catch (error) {
            this.dependencies.logger.error(
                "Rejected invalid webview message",
                error,
            );
            return;
        }

        if (lifetime.phase !== "ready") {
            lifetime.pendingMessages.push(message);
            return;
        }

        void this.dispatch(lifetime, message).catch((error) => {
            if (!lifetime.scope.isRetired) {
                this.reportAsyncFailure(
                    "Failed to process a webview message",
                    error,
                );
            }
        });
    }

    private async flushPendingMessages(
        lifetime: EditorLifetime,
    ): Promise<void> {
        lifetime.phase = "flushing";
        while (
            !lifetime.scope.isRetired &&
            lifetime.pendingMessages.length > 0
        ) {
            const message = lifetime.pendingMessages.shift();
            if (!message) continue;
            try {
                await this.dispatch(lifetime, message);
            } catch (error) {
                if (!lifetime.scope.isRetired) {
                    this.reportAsyncFailure(
                        "Failed to process a webview message",
                        error,
                    );
                }
            }
        }
        if (!lifetime.scope.isRetired) lifetime.phase = "ready";
    }

    private async dispatch(
        lifetime: EditorLifetime,
        message: WebviewToHostMessage,
    ): Promise<void> {
        if (lifetime.scope.isRetired || !lifetime.sessionId) return;

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
        this.dependencies.notifier.error(
            `${message}. See the Egon output for details.`,
        );
    }
}
