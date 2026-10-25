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
  DocumentFlushService,
  LoggerPort,
  NotifierPort,
  ViewPort,
  WebviewMessageRouter,
} from "@egon/modeler-core";
import {
  parseWebviewToHostMessage,
  ReportWebviewIssueCommand,
  ResolveWebviewIssueCommand,
  WebviewToHostMessage,
} from "@egon/modeler-shared";
import { domainStoryEditorUi } from "./helper";
import { WebviewInteractionPort } from "./infrastructure/VsCodeWebviewInteraction";

type EditorPhase = "loading" | "flushing" | "ready" | "retired";
interface EditorLifetime {
  readonly scope: DisposalScope;
  readonly sessionId: string;
  readonly documentId: string;
  phase: EditorPhase;
  initialized: boolean;
  startupScheduled: boolean;
  latestDocumentText: string;
  latestHostVersion: number;
  pendingMessages: WebviewToHostMessage[];
  activeIssue?: ReportWebviewIssueCommand;
  readonly promptingIssues: Set<string>;
  readonly postMessage: (
    message: ResolveWebviewIssueCommand,
  ) => Thenable<boolean>;
}

export interface WebviewControllerDependencies {
  extensionUri: Uri;
  extensionId: string;
  app: DomainStoryEditorService;
  logger: LoggerPort;
  notifier: NotifierPort;
  interaction: WebviewInteractionPort;
  createView(panel: WebviewPanel): ViewPort;
  renderUi?: typeof domainStoryEditorUi;
}

/** Translates VS Code editor events into host-independent application calls. */
export class WebviewController implements CustomTextEditorProvider {
  private readonly panels = new Map<WebviewPanel, EditorLifetime>();
  private readonly scope = new DisposalScope();
  private readonly messageRouter: WebviewMessageRouter<
    WebviewToHostMessage,
    string
  >;
  private readonly renderUi: typeof domainStoryEditorUi;
  private disposed = false;
  private refreshIcons?: (documentId: string) => Promise<void>;
  private readonly startupLocks = new Map<string, { count: number; promise: Promise<void>; release: () => void }>();
  readonly flushService: DocumentFlushService;

  constructor(private readonly dependencies: WebviewControllerDependencies) {
    this.flushService = new DocumentFlushService({
      isCurrent: (sessionId) => [...this.panels.values()].some((entry) => entry.sessionId === sessionId && !entry.scope.isRetired),
      post: async (sessionId, message) => {
        const panel = [...this.panels].find(([, entry]) => entry.sessionId === sessionId && !entry.scope.isRetired)?.[0];
        return panel ? panel.webview.postMessage(message) : false;
      },
    });
    this.renderUi = dependencies.renderUi ?? domainStoryEditorUi;
    this.scope.add(
      workspace.onDidChangeTextDocument((event) => {
        if (!event.contentChanges.length) return;
        const id = event.document.uri.toString();
        this.dependencies.app.onDocumentChanged(
          id,
          event.document.getText(),
          event.document.version,
        );
        for (const lifetime of this.panels.values()) {
          if (lifetime.documentId === id) {
            lifetime.latestDocumentText = event.document.getText();
            lifetime.latestHostVersion = event.document.version;
          }
        }
      }),
    );
    this.messageRouter = new WebviewMessageRouter<
      WebviewToHostMessage,
      string
    >()
      .on("InitializeWebviewCommand", async (_message, sessionId) => {
        await this.dependencies.app.initialize(sessionId);
        const lifetime = [...this.panels.values()].find((entry) => entry.sessionId === sessionId);
        if (lifetime && !lifetime.scope.isRetired) lifetime.initialized = true;
      })
      .on("SyncDocumentCommand", async (message, sessionId) => {
        if (message.sessionId !== sessionId)
          throw new Error(
            `Editor ID mismatch (${message.sessionId} != ${sessionId})`,
          );
        const status = await this.dependencies.app.syncFromWebview(
          sessionId,
          message.text,
          message.documentRevision,
          message.requestId,
        );
        if (
          status === "stale" &&
          [...this.panels.values()].some(
            (panel) => panel.sessionId === sessionId && !panel.scope.isRetired,
          )
        ) {
          this.dependencies.notifier.warning(
            "The story changed in another editor. The latest document was reloaded.",
          );
          await this.dependencies.app.initialize(sessionId);
        }
      })
      .on("ReportWebviewIssueCommand", async (message, sessionId) => {
        if (message.sessionId !== sessionId)
          throw new Error(
            `Editor ID mismatch (${message.sessionId} != ${sessionId})`,
          );
        const lifetime = [...this.panels.values()].find(
          (candidate) => candidate.sessionId === sessionId,
        );
        if (!lifetime || lifetime.scope.isRetired) return;
        lifetime.activeIssue = message;
        await this.presentIssue(lifetime, message);
      })
      .on("LogDebugCommand", (message) =>
        this.dependencies.logger.debug(
          message.stack === undefined
            ? message.message
            : `${message.message}\n${message.stack}`,
        ),
      )
      .on("LogErrorCommand", (message) =>
        this.dependencies.logger.error(message.message, message.stack),
      );
  }

  readySessionIds(documentId: string): string[] {
    return [...this.panels.values()].filter((entry) => entry.documentId === documentId &&
      (entry.phase === "ready" || entry.phase === "flushing") && entry.initialized && !entry.scope.isRetired)
      .map((entry) => entry.sessionId);
  }

  setIconRefresh(refresh: (documentId: string) => Promise<void>): void { this.refreshIcons = refresh; }

  blockStartup(documentId: string): () => void {
    const existing = this.startupLocks.get(documentId);
    if (existing) { existing.count++; return existing.release; }
    let done!: () => void;
    const promise = new Promise<void>((resolve) => { done = resolve; });
    const lock = { count: 1, promise, release: () => {
      lock.count--;
      if (lock.count === 0) { this.startupLocks.delete(documentId); done(); }
    } };
    this.startupLocks.set(documentId, lock);
    return lock.release;
  }

  async resolveCustomTextEditor(
    document: TextDocument,
    panel: WebviewPanel,
  ): Promise<void> {
    if (this.disposed) return;
    const prior = this.panels.get(panel);
    if (prior) this.retire(panel, prior);
    const documentId = document.uri.toString();
    const lifetime: EditorLifetime = {
      scope: new DisposalScope((error) =>
        this.dependencies.logger.error(
          "Failed to dispose an editor resource",
          error,
        ),
      ),
      sessionId: this.dependencies.app.registerSession(
        documentId,
        document.getText(),
        document.version,
        this.dependencies.createView(panel),
      ),
      documentId,
      phase: "loading",
      initialized: false,
      startupScheduled: false,
      latestDocumentText: document.getText(),
      latestHostVersion: document.version,
      pendingMessages: [],
      promptingIssues: new Set(),
      postMessage: (message) => panel.webview.postMessage(message),
    };
    this.panels.set(panel, lifetime);
    lifetime.scope.add({
      dispose: () => this.dependencies.app.dispose(lifetime.sessionId),
    });
    try {
      panel.webview.options = { enableScripts: true };
      lifetime.scope.add(
        panel.webview.onDidReceiveMessage((input: unknown) =>
          this.receiveMessage(lifetime, input),
        ),
      );
      lifetime.scope.add(
        panel.onDidDispose(() => this.retire(panel, lifetime)),
      );
      panel.webview.html = this.renderUi(
        panel.webview,
        this.dependencies.extensionUri,
      );
      await this.refreshIcons?.(documentId);
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
      this.retire(panel, lifetime);
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const [panel, lifetime] of [...this.panels])
      this.retire(panel, lifetime);
    this.scope.dispose();
  }

  private receiveMessage(lifetime: EditorLifetime, input: unknown): void {
    if (lifetime.scope.isRetired) return;
    let message: WebviewToHostMessage;
    try {
      message = parseWebviewToHostMessage(input);
    } catch (error) {
      this.dependencies.logger.error("Rejected invalid webview message", error);
      return;
    }
    if (lifetime.phase !== "ready") {
      if (message.type === "DocumentFlushedCommand") {
        this.flushService.handleReply(lifetime.sessionId, message);
        return;
      }
      lifetime.pendingMessages.push(message);
      return;
    }
    const lock = this.startupLocks.get(lifetime.documentId);
    if (lock && !lifetime.initialized && message.type !== "DocumentFlushedCommand") {
      lifetime.pendingMessages.push(message);
      if (!lifetime.startupScheduled) {
        lifetime.startupScheduled = true;
        void lock.promise.then(async () => {
          lifetime.startupScheduled = false;
          if (!lifetime.scope.isRetired) await this.flushPendingMessages(lifetime);
        }).catch((error) => this.reportAsyncFailure("Failed to resume the editor", error));
      }
      return;
    }
    if (message.type === "DocumentFlushedCommand") {
      this.flushService.handleReply(lifetime.sessionId, message);
      return;
    }
    void this.dispatch(lifetime, message).catch((error) => {
      if (!lifetime.scope.isRetired)
        this.reportAsyncFailure("Failed to process a webview message", error);
    });
  }

  private async flushPendingMessages(lifetime: EditorLifetime): Promise<void> {
    lifetime.phase = "flushing";
    while (!lifetime.scope.isRetired && lifetime.pendingMessages.length) {
      await this.startupLocks.get(lifetime.documentId)?.promise;
      const message = lifetime.pendingMessages.shift();
      if (!message) continue;
      try {
        await this.dispatch(lifetime, message);
      } catch (error) {
        if (!lifetime.scope.isRetired)
          this.reportAsyncFailure("Failed to process a webview message", error);
      }
    }
    await this.startupLocks.get(lifetime.documentId)?.promise;
    if (!lifetime.scope.isRetired) lifetime.phase = "ready";
  }

  private async dispatch(
    lifetime: EditorLifetime,
    message: WebviewToHostMessage,
  ): Promise<void> {
    if (lifetime.scope.isRetired) return;
    this.dependencies.logger.debug(`Message received -> ${message.type}`);
    await this.messageRouter.dispatch(message, lifetime.sessionId);
    this.dependencies.logger.debug(`Message processed -> ${message.type}`);
  }

  private retire(panel: WebviewPanel, lifetime: EditorLifetime): void {
    lifetime.phase = "retired";
    this.flushService.retire(lifetime.sessionId);
    lifetime.scope.dispose();
    if (this.panels.get(panel) === lifetime) this.panels.delete(panel);
  }

  private async presentIssue(
    lifetime: EditorLifetime,
    issue: ReportWebviewIssueCommand,
  ): Promise<void> {
    if (lifetime.promptingIssues.has(issue.issueToken)) return;
    lifetime.promptingIssues.add(issue.issueToken);
    try {
      const decision = await this.dependencies.interaction.chooseAction(issue);
      if (
        decision === undefined ||
        lifetime.scope.isRetired ||
        lifetime.activeIssue?.issueToken !== issue.issueToken
      ) {
        return;
      }
      if (decision === "openAsText") {
        await this.dependencies.interaction.openAsText(lifetime.documentId);
      }
      if (
        lifetime.scope.isRetired ||
        lifetime.activeIssue?.issueToken !== issue.issueToken
      ) {
        return;
      }
      await lifetime.postMessage({
        type: "ResolveWebviewIssueCommand",
        sessionId: lifetime.sessionId,
        documentRevision: issue.documentRevision,
        issueToken: issue.issueToken,
        decision,
      });
    } finally {
      lifetime.promptingIssues.delete(issue.issueToken);
    }
  }

  private reportAsyncFailure(message: string, error: unknown): void {
    this.dependencies.logger.error(message, error);
    this.dependencies.notifier.error(
      `${message}. See the Egon output for details.`,
    );
  }
}
