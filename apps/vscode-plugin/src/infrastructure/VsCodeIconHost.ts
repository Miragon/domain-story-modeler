import { FilePermission, RelativePattern, Uri, workspace } from "vscode";
import {
    FileDiscoveryPort,
    FileReadPort,
    FileWritePort,
    TextDocumentReadPort,
    WorkspaceFolderPort,
} from "@egon/modeler-core";

/** VS Code adapters used by the host-independent icon service. */
export class VsCodeIconHost
    implements
        WorkspaceFolderPort,
        FileDiscoveryPort,
        FileReadPort,
        FileWritePort,
        TextDocumentReadPort
{
    getWorkspaceFolder(resourceId: string): string | undefined {
        return workspace.getWorkspaceFolder(toUri(resourceId))?.uri.toString();
    }

    async findFiles(workspaceFolderId: string, pattern: string): Promise<string[]> {
        const files = await workspace.findFiles(
            new RelativePattern(toUri(workspaceFolderId), pattern),
        );
        return files.map((uri) => uri.toString());
    }

    async readFile(resourceId: string): Promise<string> {
        const data = await workspace.fs.readFile(toUri(resourceId));
        return new TextDecoder().decode(data);
    }

    async readTextDocument(resourceId: string): Promise<string> {
        const document = await workspace.openTextDocument(toUri(resourceId));
        return document.getText();
    }

    async writeFile(resourceId: string, text: string): Promise<void> {
        const uri = toUri(resourceId);
        if (workspace.fs.isWritableFileSystem(uri.scheme) !== true) throw new Error(`Document is not writable: ${resourceId}`);
        const stat = await workspace.fs.stat(uri);
        if ((stat.permissions ?? 0) & FilePermission.Readonly) throw new Error(`Document is read-only: ${resourceId}`);
        await workspace.fs.writeFile(uri, new TextEncoder().encode(text));
    }
}

function toUri(resourceId: string): Uri {
    return /^[a-z][a-z\d+.-]*:/i.test(resourceId) && !/^[a-z]:[\\/]/i.test(resourceId)
        ? Uri.parse(resourceId)
        : Uri.file(resourceId);
}
