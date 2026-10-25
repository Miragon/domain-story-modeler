import { FilePermission, Position, Range, Uri, workspace, WorkspaceEdit } from "vscode";
import { DocumentPort, DocumentSnapshot, DocumentWriteResult, sameContent } from "@egon/modeler-core";

/** Full-URI, version-checked VS Code text-document boundary. */
export class VsCodeDocumentPort implements DocumentPort {
    async read(documentId: string): Promise<DocumentSnapshot> {
        const doc = this.openDocument(documentId);
        return { text: doc.getText(), version: doc.version };
    }

    async write(documentId: string, text: string, expectedVersion: number, isCurrent: () => boolean): Promise<DocumentWriteResult> {
        const uri = Uri.parse(documentId);
        const doc = this.openDocument(documentId);
        let snapshot = { text: doc.getText(), version: doc.version };
        if (!isCurrent() || doc.version !== expectedVersion) return { status: "stale", snapshot };
        if (sameContent(snapshot.text, text)) return { status: "unchanged", snapshot };
        if (workspace.fs.isWritableFileSystem(uri.scheme) !== true) throw new Error(`Document is not writable: ${documentId}`);
        const stat = await workspace.fs.stat(uri);
        if ((stat.permissions ?? 0) & FilePermission.Readonly) throw new Error(`Document is read-only: ${documentId}`);
        snapshot = { text: doc.getText(), version: doc.version };
        if (!isCurrent() || doc.version !== expectedVersion) return { status: "stale", snapshot };
        const edit = new WorkspaceEdit();
        edit.replace(uri, new Range(new Position(0, 0), doc.positionAt(snapshot.text.length)), text);
        if (!isCurrent() || doc.version !== expectedVersion) return { status: "stale", snapshot: { text: doc.getText(), version: doc.version } };
        if (!await workspace.applyEdit(edit)) throw new Error(`VS Code rejected the document edit: ${documentId}`);
        const actual = this.openDocument(documentId);
        snapshot = { text: actual.getText(), version: actual.version };
        if (!sameContent(snapshot.text, text)) throw new Error(`Document edit was incomplete: ${documentId}`);
        return { status: "applied", snapshot };
    }

    private openDocument(documentId: string) {
        const doc = workspace.textDocuments.find((candidate) => candidate.uri.toString() === documentId);
        if (!doc) throw new Error(`Document is no longer open: ${documentId}`);
        return doc;
    }
}
