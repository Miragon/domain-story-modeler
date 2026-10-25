import { contains, DisposalScope, DomainStoryEditorService, IconService, LoggerPort, NotifierPort } from "@egon/modeler-core";
import { FilePermission, RelativePattern, TextDocument, workspace } from "vscode";
import { DocumentSaveFlushController } from "./DocumentSaveFlushController";
import { WebviewController } from "./WebviewController";

interface PendingRefresh {
    running?: Promise<void>;
    timer?: ReturnType<typeof setTimeout>;
    pending: boolean;
    deletion: boolean;
    retired: boolean;
}

/** Watches icon trees and reconciles only open editable EGN documents. */
export class IconWatcherController {
    private readonly documents = new Map<string, PendingRefresh>();
    private watcherScope = new DisposalScope();
    private disposed = false;

    constructor(
        private readonly icons: IconService,
        private readonly app: DomainStoryEditorService,
        private readonly flush: DocumentSaveFlushController,
        private readonly editor: WebviewController,
        private readonly logger: LoggerPort,
        private readonly notifier: NotifierPort,
    ) {}

    register(scope: DisposalScope): void {
        scope.add({ dispose: () => this.dispose() });
        for (const document of workspace.textDocuments) this.open(document);
        scope.add(workspace.onDidOpenTextDocument((document) => this.open(document)));
        scope.add(workspace.onDidCloseTextDocument((document) => this.close(document.uri.toString())));
        scope.add(workspace.onDidChangeWorkspaceFolders(() => {
            try { this.configureWatchers(); }
            catch (error) { this.report(error); }
            for (const id of this.documents.keys()) this.schedule(id, false);
        }));
        this.configureWatchers();
    }

    async refreshNow(id: string): Promise<void> {
        const document = workspace.textDocuments.find((candidate) => candidate.uri.toString() === id);
        if (document) this.open(document, false);
        const state = this.documents.get(id);
        if (!state || state.retired) return;
        if (state.timer) { clearTimeout(state.timer); state.timer = undefined; }
        state.pending = true;
        await this.run(id, state);
    }

    handle(resourceId: string, kind: "create" | "update" | "delete"): void {
        const marker = resourceId.lastIndexOf("/.egon");
        if (marker < 0 || !["/", "?", "#", ""].includes(resourceId[marker + 6] ?? "")) return;
        const rawBase = resourceId.slice(0, marker);
        const base = rawBase.endsWith("://") ? `${rawBase}/` : rawBase;
        for (const id of this.documents.keys()) {
            if (contains(base, id)) this.schedule(id, kind === "delete");
        }
    }

    private open(document: TextDocument, schedule = true): void {
        const id = document.uri.toString();
        if (!document.uri.path.toLowerCase().endsWith(".egn")) return;
        this.app.registerOpenDocument(id, document.getText(), document.version);
        if (!this.documents.has(id)) this.documents.set(id, { pending: false, deletion: false, retired: false });
        if (schedule) this.schedule(id, false);
    }

    private close(id: string): void {
        const state = this.documents.get(id);
        if (!state) return;
        state.retired = true;
        if (state.timer) clearTimeout(state.timer);
        this.documents.delete(id);
        this.app.closeDocument(id);
        this.icons.close(id);
    }

    private schedule(id: string, deletion: boolean): void {
        const state = this.documents.get(id);
        if (!state || state.retired) return;
        state.pending = true;
        state.deletion ||= deletion;
        if (state.running || state.timer) return;
        state.timer = setTimeout(() => {
            state.timer = undefined;
            void this.run(id, state).catch((error) => this.report(error));
        }, 30);
    }

    private async run(id: string, state: PendingRefresh): Promise<void> {
        if (state.running) return state.running;
        const work = async (): Promise<void> => {
            while (state.pending && !state.retired && !this.disposed) {
                state.pending = false;
                const deletion = state.deletion;
                state.deletion = false;
                try { await this.refresh(id, state, deletion); }
                catch (error) {
                    state.deletion ||= deletion;
                    if (!state.retired && !this.disposed) this.report(error);
                }
            }
        };
        state.running = work().finally(() => {
            state.running = undefined;
            if (state.pending && !state.retired && !this.disposed) this.schedule(id, state.deletion);
        });
        return state.running;
    }

    private async refresh(id: string, state: PendingRefresh, deletion: boolean): Promise<void> {
        const releaseStartup = this.editor.blockStartup(id);
        try {
            const document = workspace.textDocuments.find((candidate) => candidate.uri.toString() === id);
            if (!document || state.retired) return;
            if (workspace.fs.isWritableFileSystem(document.uri.scheme) !== true) return;
            const stat = await workspace.fs.stat(document.uri);
            if ((stat.permissions ?? 0) & FilePermission.Readonly || state.retired) return;
            const icons = await this.icons.discover(id, { get isRetired() { return state.retired; } });
            if (state.retired) return;
            const apply = async (expected?: { version: number; revision: number; sessions: readonly string[] }): Promise<boolean> => {
                let proposed: ReturnType<IconService["reconcile"]> | undefined;
                const result = await this.app.transformOpenDocument(id, (text) => {
                    proposed = this.icons.reconcile(id, text, icons, deletion);
                    return proposed.text;
                }, expected);
                if (result !== "stale" && proposed && !state.retired) this.icons.commit(id, proposed);
                return result !== "stale";
            };
            if (this.editor.readySessionIds(id).length) {
                const accepted = await this.flush.withConfirmedFlush(id, async (lease) => {
                    return apply({ version: lease.version, revision: lease.revision, sessions: lease.sessions });
                });
                if (!accepted) state.deletion ||= deletion;
            } else {
                if (!await apply()) state.deletion ||= deletion;
            }
        } finally { releaseStartup(); }
    }

    private configureWatchers(): void {
        const next = new DisposalScope((error) => this.logger.error("Failed to dispose icon watcher", error));
        try {
            for (const folder of workspace.workspaceFolders ?? []) {
                for (const glob of ["**/.egon", "**/.egon/**"]) {
                    const watcher = next.add(workspace.createFileSystemWatcher(new RelativePattern(folder.uri, glob)));
                    next.add(watcher.onDidCreate((uri) => this.handle(uri.toString(), "create")));
                    next.add(watcher.onDidChange((uri) => this.handle(uri.toString(), "update")));
                    next.add(watcher.onDidDelete((uri) => this.handle(uri.toString(), "delete")));
                }
            }
        } catch (error) {
            next.dispose();
            throw error;
        }
        this.watcherScope.dispose();
        this.watcherScope = next;
    }

    private report(error: unknown): void {
        this.logger.error("Failed to synchronize custom icons", error);
        this.notifier.warning("Custom icons could not be synchronized. See the Egon output for details.");
    }

    dispose(): void {
        if (this.disposed) return;
        this.disposed = true;
        this.watcherScope.dispose();
        for (const id of [...this.documents.keys()]) this.close(id);
    }
}
