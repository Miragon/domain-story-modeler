import { DocumentPort, DocumentSnapshot, ViewPort } from "../domain/hostPorts";

interface SessionRecord {
    readonly id: string;
    readonly document: DocumentRecord;
    readonly view: ViewPort;
    retired: boolean;
}

interface DocumentRecord {
    readonly id: string;
    text: string;
    version: number;
    revision: number;
    readonly sessions: Set<SessionRecord>;
    readonly guards: Map<string, number>;
    queue: Promise<void>;
    pending: number;
}

export type SyncStatus = "applied" | "unchanged" | "stale" | "failed";

/** Coordinates a complete document URI independently of its panels. */
export class DomainStoryEditorService {
    private readonly documents = new Map<string, DocumentRecord>();
    private readonly sessions = new Map<string, SessionRecord>();
    private nextSession = 0;

    constructor(private readonly docs: DocumentPort) {}

    registerSession(id: string, text: string, version: number, view: ViewPort): string {
        let document = this.documents.get(id);
        if (!document) {
            document = { id, text, version, revision: 0, sessions: new Set(), guards: new Map(), queue: Promise.resolve(), pending: 0 };
            this.documents.set(id, document);
        } else if (version > document.version) {
            this.onDocumentChanged(id, text, version);
        }
        const sessionId = `session-${++this.nextSession}`;
        const session: SessionRecord = { id: sessionId, document, view, retired: false };
        document.sessions.add(session);
        this.sessions.set(sessionId, session);
        return sessionId;
    }

    async initialize(sessionId: string): Promise<void> {
        const session = this.sessions.get(sessionId);
        if (session) await session.view.display(session.id, session.document.text, session.document.revision);
    }

    /** Called once per host event, regardless of the number of panels. */
    onDocumentChanged(id: string, text: string, version: number): void {
        const doc = this.documents.get(id);
        if (!doc || version <= doc.version) return;
        doc.version = version;
        if (this.consumeGuard(doc, text)) {
            return;
        }
        if (sameContent(doc.text, text)) {
            doc.text = text;
            return;
        }
        doc.text = text;
        doc.revision++;
        this.publish(doc);
    }

    /** Records an icon initialization write when the host has not emitted a text-document event yet. */
    onInitializedContent(id: string, text: string): void {
        const doc = this.documents.get(id);
        if (!doc || sameContent(doc.text, text)) return;
        doc.text = text;
        doc.revision++;
        this.publish(doc);
    }

    async syncFromWebview(sessionId: string, text: string, expectedRevision: number, requestId: number): Promise<SyncStatus> {
        const session = this.sessions.get(sessionId);
        if (!session) return "stale";
        const doc = session.document;
        doc.pending++;
        const run = async (): Promise<SyncStatus> => {
            if (!this.current(session, expectedRevision)) return this.finish(session, requestId, "stale");
            if (sameContent(doc.text, text)) return this.finish(session, requestId, "unchanged");
            const expectedVersion = doc.version;
            this.addGuard(doc, text);
            try {
                if (!this.current(session, expectedRevision)) return this.finish(session, requestId, "stale");
                const result = await this.docs.write(doc.id, text, expectedVersion, () => this.current(session, expectedRevision));
                if (!this.sessions.has(sessionId) || session.retired || doc.revision !== expectedRevision) {
                    await this.reconcile(doc);
                    return this.finish(session, requestId, "stale");
                }
                if (result.status === "stale") {
                    this.acceptSnapshot(doc, result.snapshot);
                    return this.finish(session, requestId, "stale");
                }
                doc.version = Math.max(doc.version, result.snapshot.version);
                if (!sameContent(doc.text, result.snapshot.text)) {
                    doc.text = result.snapshot.text;
                    doc.revision++;
                    this.publish(doc, session);
                }
                return this.finish(session, requestId, result.status);
            } catch (error) {
                await this.reconcile(doc).catch(() => undefined);
                await this.finish(session, requestId, "failed");
                throw error;
            } finally {
                this.releaseGuard(doc, text);
            }
        };
        const result = doc.queue.then(run);
        doc.queue = result.then(() => undefined, () => undefined).finally(() => {
            doc.pending--;
            this.collect(doc);
        });
        return result;
    }

    dispose(sessionId: string): void {
        const session = this.sessions.get(sessionId);
        if (!session) return;
        session.retired = true;
        this.sessions.delete(sessionId);
        session.document.sessions.delete(session);
        this.collect(session.document);
    }

    private current(session: SessionRecord, revision: number): boolean {
        return !session.retired && this.sessions.get(session.id) === session && session.document.revision === revision;
    }

    private async finish(session: SessionRecord, requestId: number, status: SyncStatus): Promise<SyncStatus> {
        if (!session.retired) await session.view.syncResult(session.id, requestId, session.document.revision, status);
        return status;
    }

    private publish(doc: DocumentRecord, except?: SessionRecord): void {
        for (const session of doc.sessions) {
            if (session === except || session.retired) continue;
            void session.view.display(session.id, doc.text, doc.revision).catch(() => undefined);
        }
    }

    private acceptSnapshot(doc: DocumentRecord, snapshot: DocumentSnapshot): void {
        if (snapshot.version < doc.version) return;
        doc.version = snapshot.version;
        if (sameContent(doc.text, snapshot.text)) return;
        doc.text = snapshot.text;
        doc.revision++;
        this.publish(doc);
    }

    private async reconcile(doc: DocumentRecord): Promise<void> {
        this.acceptSnapshot(doc, await this.docs.read(doc.id));
    }

    private addGuard(doc: DocumentRecord, text: string): void {
        const key = normalize(text);
        doc.guards.set(key, (doc.guards.get(key) ?? 0) + 1);
    }

    private consumeGuard(doc: DocumentRecord, text: string): boolean {
        const key = normalize(text);
        const count = doc.guards.get(key) ?? 0;
        if (!count) return false;
        this.releaseGuard(doc, text);
        return true;
    }

    private releaseGuard(doc: DocumentRecord, text: string): void {
        const key = normalize(text);
        const count = doc.guards.get(key) ?? 0;
        if (count <= 1) doc.guards.delete(key);
        else doc.guards.set(key, count - 1);
    }

    private collect(doc: DocumentRecord): void {
        if (!doc.sessions.size && !doc.pending && this.documents.get(doc.id) === doc) this.documents.delete(doc.id);
    }
}

export function normalize(text: string): string {
    return text.replace(/\r\n?/g, "\n");
}

export function sameContent(left: string, right: string): boolean {
    return normalize(left) === normalize(right);
}
