import { DisposalScope, DocumentFlushResult, DomainStoryEditorService, LoggerPort } from "@egon/modeler-core";
import { workspace } from "vscode";
import { WebviewController } from "./WebviewController";

export interface ConfirmedFlushLease {
  readonly documentId: string;
  readonly sessions: readonly string[];
  release(): void;
}

export type SaveFlushResult =
  | { readonly status: "confirmed"; readonly lease: ConfirmedFlushLease }
  | { readonly status: "unavailable" | "closed" };

/** Participates in VS Code saves and confirms every live panel against one URI queue. */
export class DocumentSaveFlushController {
  constructor(
    private readonly app: DomainStoryEditorService,
    private readonly editor: WebviewController,
    private readonly logger: LoggerPort,
  ) {}

  register(scope: DisposalScope): void {
    scope.add(workspace.onWillSaveTextDocument((event) => {
      const documentId = event.document.uri.toString();
      if (!this.app.sessionIds(documentId).length) return;
      // VS Code requires waitUntil during the synchronous event callback.
      event.waitUntil(this.flush(documentId).then(() => []));
    }));
  }

  async flush(documentId: string, destructive = false): Promise<SaveFlushResult> {
    const sessions = this.app.sessionIds(documentId);
    if (!sessions.length) return { status: "closed" };
    const release = (): void => { for (const id of sessions) this.editor.flushService.releaseFlush(id); };
    const deadline = Date.now() + 500;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<SaveFlushResult>((resolve) => {
      timer = setTimeout(() => resolve({ status: "unavailable" }), 500);
    });
    const work = async (): Promise<SaveFlushResult> => {
      try {
        const results = await Promise.all(sessions.map((id) =>
          this.editor.flushService.requestFlush(id, {
            destructive,
            timeoutMs: Math.max(1, deadline - Date.now()),
          }),
        ));
        if (results.some((result) => result.status === "unavailable")) return { status: "unavailable" };
        if (destructive && results.some((result) => result.status === "host-updated")) return { status: "unavailable" };
        if (sessions.some((id) => !this.app.isCurrentSession(documentId, id)) ||
          this.app.sessionIds(documentId).length !== sessions.length) return { status: "closed" };
        const flushed = results.filter((result): result is Extract<DocumentFlushResult, { status: "flushed" }> => result.status === "flushed");
        for (const result of flushed.length ? flushed : [undefined]) {
          if (!await this.app.verifyFlush(documentId, sessions, result)) return { status: "unavailable" };
        }
        return { status: "confirmed", lease: { documentId, sessions, release } };
      } catch (error) {
        this.logger.error("Failed to flush the domain story before save", error);
        return { status: "unavailable" };
      }
    };
    const running = work();
    const result = await Promise.race([running, timeout]);
    if (timer) clearTimeout(timer);
    if (destructive && result.status !== "confirmed") {
      release();
      if (result.status === "unavailable") void running.then(release);
    }
    return result;
  }

  /** #16 may supply a transformation, which runs only while a confirmed lease is held. */
  async withConfirmedFlush<T>(documentId: string, transform: (lease: ConfirmedFlushLease) => Promise<T>): Promise<T | undefined> {
    const result = await this.flush(documentId, true);
    if (result.status !== "confirmed") return undefined;
    try { return await transform(result.lease); }
    finally { result.lease.release(); }
  }
}
