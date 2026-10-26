import {
  DisplayDomainStoryMessage,
  createFlushResponder,
  HostToWebviewMessage,
  ReportWebviewIssueCommand,
  ResolveWebviewIssueCommand,
  validateDomainStoryText,
} from "@egon/modeler-shared";
import {
  asyncDebounce,
  createEmptyStory,
  serializeAsync,
} from "@egon/modeler-types";
import { DomainStoryDocument, ImportRepairData } from "egon-core";
import {
  errorDiagnostic,
  listenForHostMessages,
  WebviewHost,
} from "./communication";
import { ModelerClient, ModelerClientFactory } from "./egonClient";
import { DocumentSynchronizer, SyncSnapshot } from "./synchronization";
import { normalizeWebviewState, ViewportStateManager } from "./viewportState";

interface DisplaySnapshot extends DisplayDomainStoryMessage {
  readonly generation: number;
}

interface ActiveIssue extends ReportWebviewIssueCommand {
  readonly generation: number;
  readonly retryOperation: "display" | "export" | "repair";
}

export interface WebviewLifecycleHandle {
  dispose(): void;
}

export interface BootstrapOptions {
  readonly window?: Window;
  readonly document?: Document;
  readonly debounceMs?: number;
}

class StatusUi {
  private readonly overlay: HTMLDivElement;
  private readonly spinner: HTMLDivElement;
  private readonly message: HTMLParagraphElement;
  private readonly action: HTMLButtonElement;
  private interactionLocked = false;

  constructor(
    private readonly container: HTMLElement,
    page: Document,
    private readonly invokeAction: () => void,
  ) {
    this.overlay = page.createElement("div");
    this.overlay.className = "egon-status";
    this.overlay.hidden = true;
    this.overlay.setAttribute("aria-live", "polite");

    this.spinner = page.createElement("div");
    this.spinner.className = "egon-spinner";
    this.spinner.setAttribute("role", "status");
    this.spinner.setAttribute("aria-label", "Loading domain story");

    this.message = page.createElement("p");
    this.action = page.createElement("button");
    this.action.type = "button";
    this.action.addEventListener("click", this.invokeAction);
    this.overlay.append(this.spinner, this.message, this.action);
    container.insertAdjacentElement("afterend", this.overlay);
  }

  loading(message = "Loading domain story…"): void {
    this.container.inert = true;
    this.container.classList.add("egon-canvas-paused");
    this.overlay.hidden = false;
    this.spinner.hidden = false;
    this.message.textContent = message;
    this.action.hidden = true;
  }

  paused(message: string, action: string): void {
    this.container.inert = true;
    this.container.classList.add("egon-canvas-paused");
    this.overlay.hidden = false;
    this.spinner.hidden = true;
    this.message.textContent = message;
    this.action.textContent = action;
    this.action.hidden = false;
  }

  ready(): void {
    this.container.inert = this.interactionLocked;
    this.container.classList.toggle("egon-canvas-paused", this.interactionLocked);
    this.overlay.hidden = true;
    this.spinner.hidden = true;
    this.action.hidden = true;
  }

  setInteractionLocked(locked: boolean): void {
    this.interactionLocked = locked;
    if (locked) {
      this.container.inert = true;
      this.container.classList.add("egon-canvas-paused");
    } else if (this.overlay.hidden) {
      this.container.inert = false;
      this.container.classList.remove("egon-canvas-paused");
    }
  }

  dispose(): void {
    this.action.removeEventListener("click", this.invokeAction);
    this.overlay.remove();
  }
}

/** Starts one independently disposable editor session. */
export function bootstrap(
  host: WebviewHost,
  createClient: ModelerClientFactory,
  options: BootstrapOptions = {},
): WebviewLifecycleHandle {
  const pageWindow = options.window ?? window;
  const page = options.document ?? document;
  const element = page.getElementById("egon-io-container");
  if (!element) throw new Error("Container for Egon.io modeler not found!");
  const container: HTMLElement = element;

  const state = normalizeWebviewState(readHostState(host));
  host.setState(state);

  let disposed = false;
  let displayGeneration = 0;
  let newestRevision = -1;
  let documentRevision = -1;
  let latest: DisplaySnapshot | undefined;
  let activeSessionId: string | undefined;
  let client: ModelerClient | undefined;
  let creating: Promise<ModelerClient> | undefined;
  let importedGeneration = -1;
  let importInProgress = false;
  let baseline: string | undefined;
  let activeIssue: ActiveIssue | undefined;
  let issueSequence = 0;
  let repairCapture: ImportRepairData[] | undefined;
  let retrying: Promise<void> | undefined;
  let viewportState: ViewportStateManager | undefined;
  let stopViewportPersistence: (() => void) | undefined;

  const runOperation = serializeAsync(
    async (operation: () => Promise<void>): Promise<void> => operation(),
  );

  const ui = new StatusUi(container, page, () => {
    if (activeIssue?.kind === "repair") {
      postIssue(activeIssue);
    } else {
      void retryIssue(activeIssue);
    }
  });

  const synchronizer = new DocumentSynchronizer({
    post: (message) => host.postMessage(message),
    isCurrent,
    accepted: (write, result) => {
      if (!isCurrent(write)) return;
      documentRevision = Math.max(documentRevision, result.documentRevision);
      baseline = write.text;
      if (
        write.issueToken !== undefined &&
        activeIssue?.issueToken === write.issueToken
      ) {
        activeIssue = undefined;
        ui.ready();
      }
    },
    stale: (write) => {
      if (!isCurrent(write)) return;
      importedGeneration = -1;
      ui.loading("Reloading the latest domain story…");
    },
    failed: (write) => {
      if (!isCurrent(write)) return;
      host.postMessage(errorDiagnostic("Failed to save domain story changes"));
      if (write.issueToken && activeIssue?.issueToken === write.issueToken) {
        ui.paused(
          activeIssue.kind === "repair"
            ? "The repaired story could not be accepted."
            : "The domain story changes could not be synchronized.",
          activeIssue.kind === "repair" ? "Review Repairs" : "Retry",
        );
      }
    },
  });

  const flushResponder = createFlushResponder({
    isReady: () => !disposed && client !== undefined && activeIssue === undefined,
    hostUpdateVersion: () => displayGeneration,
    hasPendingHostUpdate: () => importedGeneration !== latest?.generation || importInProgress,
    beginDestructiveFlush: () => ui.setInteractionLocked(true),
    endDestructiveFlush: () => ui.setInteractionLocked(false),
    flush: flushSnapshot,
  }, (reply) => host.postMessage(reply));

  async function flushSnapshot(generation: number, exportWhenClean: boolean) {
    if (!await synchronizer.drain() || !canExport(generation)) return { status: "unavailable" as const };
    for (let attempt = 0; attempt < 3; attempt++) {
      let exported: string | undefined;
      await runOperation(async () => {
        if (canExport(generation)) exported = exportAndValidate();
      });
      if (!exported || !canExport(generation)) return { status: "unavailable" as const };
      if (exported === baseline) {
        return exportWhenClean
          ? { status: "flushed" as const, content: exported, documentRevision }
          : { status: "clean" as const };
      }
      synchronizer.submit(currentWrite(exported, generation));
      if (!await synchronizer.drain() || !canExport(generation)) return { status: "unavailable" as const };
      let current: string | undefined;
      await runOperation(async () => {
        if (canExport(generation)) current = exportAndValidate();
      });
      if (!current || !canExport(generation)) return { status: "unavailable" as const };
      if (current === exported && baseline === exported) {
        return { status: "flushed" as const, content: exported, documentRevision };
      }
    }
    return { status: "unavailable" as const };
  }

  const onStoryChanged = (): void => {
    if (
      disposed ||
      importInProgress ||
      activeIssue !== undefined ||
      importedGeneration !== latest?.generation
    ) {
      return;
    }
    const generation = importedGeneration;
    if (!canExport(generation)) return;
    try {
      // Publish in the modeler's change callback so an immediate Save observes
      // the dirty buffer instead of racing a queued export microtask.
      const text = exportAndValidate();
      if (text !== baseline) synchronizer.submit(currentWrite(text, generation));
    } catch (error) {
      reportFailure(
        "import",
        "Failed to export the domain story",
        error,
        "export",
      );
    }
  };
  const onRepair = (repair: ImportRepairData): void => {
    repairCapture?.push(repair);
  };

  async function ensureClient(): Promise<ModelerClient> {
    if (client) return client;
    creating ??= (async () => {
      let candidate: ModelerClient | undefined;
      try {
        candidate = await createClient(container);
        if (disposed) {
          safeDestroy(candidate);
          candidate = undefined;
          throw new Error("The webview was disposed during initialization");
        }
        candidate.on("story.changed", onStoryChanged);
        candidate.on("import.repaired", onRepair);
        client = candidate;
        viewportState = new ViewportStateManager(
          host,
          candidate,
          container,
          page,
        );
        return candidate;
      } catch (error) {
        if (candidate && client !== candidate) safeDestroy(candidate);
        throw error;
      }
    })().finally(() => {
      creating = undefined;
    });
    return creating;
  }

  async function processDisplay(snapshot: DisplaySnapshot): Promise<void> {
    if (!isLatest(snapshot)) return;
    ui.loading();
    let modeler: ModelerClient;
    try {
      modeler = await ensureClient();
    } catch (error) {
      if (isLatest(snapshot)) {
        reportFailure(
          "initialization",
          "Failed to initialize the Domain Story Modeler",
          error,
        );
      }
      return;
    }
    if (!isLatest(snapshot)) return;

    const preservedViewport =
      importedGeneration >= 0 ? viewportState?.capture() : undefined;
    repairCapture = [];
    importInProgress = true;
    try {
      const story = parseStory(snapshot.text);
      modeler.import(story);
      if (!isLatest(snapshot)) return;

      const exported = exportAndValidate();
      if (preservedViewport) modeler.setViewport(preservedViewport);
      if (importedGeneration < 0) {
        viewportState?.restoreAfterFirstImport();
        stopViewportPersistence ??= viewportState?.start();
      }

      importedGeneration = snapshot.generation;
      documentRevision = snapshot.documentRevision;
      baseline = exported;
      const repairs = repairCapture.flatMap(
        (repair) => repair.removedConnectionIds,
      );
      if (repairs.length > 0) {
        reportRepairs(snapshot, repairs);
      } else {
        activeIssue = undefined;
        ui.ready();
      }
    } catch (error) {
      if (isLatest(snapshot)) {
        reportFailure("import", "Failed to display the domain story", error);
      }
    } finally {
      importInProgress = false;
      repairCapture = undefined;
    }
  }

  const debouncedDisplay = asyncDebounce(
    async (snapshot: DisplaySnapshot) =>
      runOperation(() => processDisplay(snapshot)),
    options.debounceMs ?? 100,
  );

  async function receive(message: HostToWebviewMessage): Promise<void> {
    if (disposed) return;
    switch (message.type) {
      case "DisplayDomainStoryCommand":
        await receiveDisplay(message);
        return;
      case "SyncDocumentResultCommand":
        synchronizer.receive(message);
        return;
      case "ResolveWebviewIssueCommand":
        receiveIssueDecision(message);
        return;
      case "FlushDocumentQuery":
      case "ReleaseDocumentFlushQuery":
        await flushResponder(message);
        return;
    }
  }

  async function receiveDisplay(
    message: DisplayDomainStoryMessage,
  ): Promise<void> {
    if (
      activeSessionId !== undefined &&
      activeSessionId !== message.sessionId
    ) {
      host.postMessage(
        errorDiagnostic(
          `Editor ID mismatch (${message.sessionId} != ${activeSessionId})`,
        ),
      );
      return;
    }
    if (message.documentRevision < newestRevision) return;
    if (activeSessionId === undefined) {
      activeSessionId = message.sessionId;
      host.setState({
        ...normalizeWebviewState(readHostState(host)),
        editorId: message.sessionId,
      });
    }

    newestRevision = Math.max(newestRevision, message.documentRevision);
    const snapshot: DisplaySnapshot = {
      ...message,
      generation: ++displayGeneration,
    };
    latest = snapshot;
    activeIssue = undefined;
    baseline = undefined;
    synchronizer.invalidate(snapshot.generation);
    debouncedDisplay.cancel();
    await debouncedDisplay(snapshot);
  }

  function receiveIssueDecision(message: ResolveWebviewIssueCommand): void {
    const issue = activeIssue;
    if (
      !issue ||
      issue.sessionId !== message.sessionId ||
      issue.documentRevision !== message.documentRevision ||
      issue.issueToken !== message.issueToken ||
      issue.generation !== latest?.generation
    ) {
      return;
    }
    if (message.decision === "retry" && issue.kind !== "repair") {
      void retryIssue(issue);
    } else if (
      message.decision === "acceptRepairs" &&
      issue.kind === "repair"
    ) {
      void acceptRepairs(issue);
    }
  }

  function retryLatest(): Promise<void> {
    const snapshot = latest;
    if (!snapshot || disposed) return Promise.resolve();
    retrying ??= runOperation(() => processDisplay(snapshot)).finally(() => {
      retrying = undefined;
    });
    return retrying;
  }

  function retryIssue(issue: ActiveIssue | undefined): Promise<void> {
    if (!issue || issue.retryOperation === "display") return retryLatest();
    if (issue.retryOperation === "export") return retryExport(issue);
    return Promise.resolve();
  }

  function retryExport(issue: ActiveIssue): Promise<void> {
    return runOperation(async () => {
      if (activeIssue !== issue || !isLatestGeneration(issue.generation)) {
        return;
      }
      ui.loading("Retrying domain story synchronization…");
      try {
        const text = exportAndValidate();
        if (text === baseline) {
          activeIssue = undefined;
          ui.ready();
          return;
        }
        synchronizer.submit({
          ...currentWrite(text, issue.generation),
          issueToken: issue.issueToken,
        });
        ui.paused(
          "Waiting for the domain story changes to be synchronized…",
          "Retry",
        );
      } catch (error) {
        host.postMessage(
          errorDiagnostic("Failed to export the domain story", error),
        );
        ui.paused("Failed to export the domain story.", "Retry");
      }
    });
  }

  function acceptRepairs(issue: ActiveIssue): Promise<void> {
    return runOperation(async () => {
      if (activeIssue !== issue || !isLatestGeneration(issue.generation)) {
        return;
      }
      ui.loading("Accepting repairs…");
      try {
        const text = exportAndValidate();
        synchronizer.submit({
          ...currentWrite(text, issue.generation),
          issueToken: issue.issueToken,
        });
        ui.paused(
          "Waiting for the repaired story to be accepted…",
          "Review Repairs",
        );
      } catch (error) {
        host.postMessage(
          errorDiagnostic(
            "Failed to export the repaired domain story",
            error,
          ),
        );
        ui.paused(
          "The repaired story could not be exported.",
          "Review Repairs",
        );
        postIssue(issue);
      }
    });
  }

  function reportRepairs(
    snapshot: DisplaySnapshot,
    removedConnectionIds: readonly string[],
  ): void {
    const issue: ActiveIssue = {
      type: "ReportWebviewIssueCommand",
      sessionId: snapshot.sessionId,
      documentRevision: snapshot.documentRevision,
      issueToken: issueToken(snapshot),
      kind: "repair",
      message: `The story was repaired by removing ${removedConnectionIds.length} invalid connection${removedConnectionIds.length === 1 ? "" : "s"}: ${removedConnectionIds.join(", ")}`,
      removedConnectionIds: [...removedConnectionIds],
      generation: snapshot.generation,
      retryOperation: "repair",
    };
    activeIssue = issue;
    ui.paused(
      "This story contains repairs that must be reviewed before editing.",
      "Review Repairs",
    );
    postIssue(issue);
  }

  function reportFailure(
    kind: "initialization" | "import",
    message: string,
    error?: unknown,
    retryOperation: ActiveIssue["retryOperation"] = "display",
  ): void {
    const snapshot = latest;
    if (!snapshot || !isLatest(snapshot)) return;
    const detail = error instanceof Error ? error : undefined;
    const issue: ActiveIssue = {
      type: "ReportWebviewIssueCommand",
      sessionId: snapshot.sessionId,
      documentRevision: snapshot.documentRevision,
      issueToken: issueToken(snapshot),
      kind,
      message: detail?.message ? `${message}: ${detail.message}` : message,
      ...(detail?.stack === undefined ? {} : { stack: detail.stack }),
      generation: snapshot.generation,
      retryOperation,
    };
    activeIssue = issue;
    ui.paused(message, "Retry");
    host.postMessage(errorDiagnostic(message, error));
    postIssue(issue);
  }

  function postIssue(issue: ActiveIssue): void {
    host.postMessage({
      type: issue.type,
      sessionId: issue.sessionId,
      documentRevision: issue.documentRevision,
      issueToken: issue.issueToken,
      kind: issue.kind,
      message: issue.message,
      ...(issue.stack === undefined ? {} : { stack: issue.stack }),
      ...(issue.removedConnectionIds === undefined
        ? {}
        : { removedConnectionIds: issue.removedConnectionIds }),
    });
  }

  function exportAndValidate(): string {
    if (!client) throw new Error("EgonClient is not initialized");
    const text = JSON.stringify(client.export());
    validateDomainStoryText(text);
    return text;
  }

  function currentWrite(text: string, generation: number) {
    if (!activeSessionId) throw new Error("No display session is active");
    return {
      sessionId: activeSessionId,
      generation,
      documentRevision,
      text,
    };
  }

  function isCurrent(snapshot: SyncSnapshot): boolean {
    return (
      !disposed &&
      snapshot.sessionId === activeSessionId &&
      snapshot.generation === importedGeneration &&
      snapshot.generation === latest?.generation
    );
  }

  function canExport(generation: number): boolean {
    return (
      client !== undefined &&
      activeIssue === undefined &&
      generation === importedGeneration &&
      generation === latest?.generation
    );
  }

  function isLatest(snapshot: DisplaySnapshot): boolean {
    return !disposed && latest === snapshot;
  }

  function isLatestGeneration(generation: number): boolean {
    return !disposed && latest?.generation === generation;
  }

  function issueToken(snapshot: DisplaySnapshot): string {
    return `${snapshot.sessionId}:${snapshot.documentRevision}:${++issueSequence}`;
  }

  const stopMessages = listenForHostMessages(host, pageWindow, receive);
  host.postMessage({ type: "InitializeWebviewCommand" });

  return {
    dispose(): void {
      if (disposed) return;
      disposed = true;
      debouncedDisplay.cancel();
      synchronizer.dispose();
      safeRun(stopMessages);
      safeRun(stopViewportPersistence);
      safeRun(() => viewportState?.dispose());
      safeRun(() => ui.dispose());
      if (client) {
        safeRun(() => client?.off("story.changed", onStoryChanged));
        safeRun(() => client?.off("import.repaired", onRepair));
        safeDestroy(client);
        client = undefined;
      }
    },
  };
}

function parseStory(text: string): DomainStoryDocument {
  if (text.trim() === "") return createEmptyStory();
  return JSON.parse(text) as DomainStoryDocument;
}

function readHostState(host: WebviewHost): unknown {
  try {
    return host.getState();
  } catch {
    return undefined;
  }
}

function safeDestroy(client: ModelerClient): void {
  try {
    client.destroy();
  } catch {
    // Teardown must not hide the failure or prevent the remaining cleanup.
  }
}

function safeRun(operation: (() => void) | undefined): void {
  try {
    operation?.();
  } catch {
    // Continue teardown so one faulty disposer cannot strand later resources.
  }
}
