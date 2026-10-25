import { FileType, Uri, workspace } from "vscode";
import { IconDirectoryPort, FileReadPort, WorkspaceFolderPort } from "@egon/modeler-core";

/** Filesystem discovery for open-buffer icon synchronization. */
export class VsCodeIconHost implements WorkspaceFolderPort, IconDirectoryPort, FileReadPort {
    getWorkspaceFolder(resourceId: string): string | undefined {
        return workspace.getWorkspaceFolder(toUri(resourceId))?.uri.toString();
    }

    async readDirectory(directoryId: string): Promise<readonly { name: string; kind: "file" | "directory" }[]> {
        try {
            const entries = await workspace.fs.readDirectory(toUri(directoryId));
            return entries.filter(([, type]) => !!(type & (FileType.File | FileType.Directory)))
                .map(([name, type]) => ({ name, kind: type & FileType.Directory ? "directory" as const : "file" as const }));
        } catch (error) {
            if (error instanceof Error && /FileNotFound|EntryNotFound|ENOENT/.test(`${error.name} ${error.message}`)) return [];
            throw error;
        }
    }

    joinPath(directoryId: string, name: string): string {
        return Uri.joinPath(toUri(directoryId), ...name.split("/")).toString();
    }

    parentPath(resourceId: string): string {
        return Uri.joinPath(toUri(resourceId).with({ query: "", fragment: "" }), "..").toString();
    }

    async readFile(resourceId: string): Promise<string> {
        return new TextDecoder().decode(await workspace.fs.readFile(toUri(resourceId)));
    }
}

function toUri(resourceId: string): Uri {
    return /^[a-z][a-z\d+.-]*:/i.test(resourceId) && !/^[a-z]:[\\/]/i.test(resourceId)
        ? Uri.parse(resourceId)
        : Uri.file(resourceId);
}
