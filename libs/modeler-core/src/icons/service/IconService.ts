import {
    FileDiscoveryPort,
    FileReadPort,
    FileWritePort,
    LifetimePort,
    TextDocumentReadPort,
    WorkspaceFolderPort,
} from "../../shared/domain/hostPorts";
import { Icon, IconChangeKind } from "../domain";
import { ICON_BASE_PATH, tryParseIconPath } from "../domain/IconPathParser";
import { ApplyIconChange } from "./ApplyIconChange";
import { SyncIconsFromSet } from "./SyncIconsFromSet";

const ACTIVE_LIFETIME: LifetimePort = { isRetired: false };

export type IconInitializationFailureStage = "load" | "merge" | "write";

export class IconInitializationError extends Error {
    constructor(
        readonly stage: IconInitializationFailureStage,
        readonly reason: unknown,
    ) {
        super(`Icon initialization failed during ${stage}`);
        this.name = "IconInitializationError";
    }
}

export interface IconHostPorts {
    workspaceFolders: WorkspaceFolderPort;
    files: FileDiscoveryPort & FileReadPort & FileWritePort;
    textDocuments: TextDocumentReadPort;
}

/** Host-independent orchestration for custom icon loading and propagation. */
export class IconService {
    private readonly syncIcons = new SyncIconsFromSet();
    private readonly applyIconChange = new ApplyIconChange();

    constructor(private readonly host: IconHostPorts) {}

    /**
     * Loads all icons visible to a story, merges them into the latest snapshot,
     * and persists the result. An undefined result means the lifetime retired.
     */
    async initializeDocument(
        documentId: string,
        currentText: () => string,
        lifetime: LifetimePort = ACTIVE_LIFETIME,
    ): Promise<string | undefined> {
        const workspaceFolderId = this.host.workspaceFolders.getWorkspaceFolder(documentId);
        if (!workspaceFolderId) return currentText();

        let icons: Icon[];
        try {
            icons = await this.loadVisibleIcons(workspaceFolderId, documentId, lifetime);
        } catch (error) {
            throw new IconInitializationError("load", error);
        }
        if (lifetime.isRetired) return undefined;

        let merged: string;
        try {
            merged = this.syncIcons.execute(currentText(), icons);
        } catch (error) {
            throw new IconInitializationError("merge", error);
        }
        if (lifetime.isRetired) return undefined;

        try {
            await this.host.files.writeFile(documentId, merged);
        } catch (error) {
            throw new IconInitializationError("write", error);
        }
        if (lifetime.isRetired) return undefined;

        return merged;
    }

    /** Applies a created, updated, or deleted SVG to every affected story. */
    async applyChange(
        iconId: string,
        kind: IconChangeKind,
        lifetime: LifetimePort = ACTIVE_LIFETIME,
    ): Promise<void> {
        const metadata = tryParseIconPath(iconId);
        if (!metadata) return;

        const workspaceFolderId = this.host.workspaceFolders.getWorkspaceFolder(iconId);
        if (!workspaceFolderId || lifetime.isRetired) return;

        const iconBaseDirectory = getIconBaseDirectory(iconId);
        if (!iconBaseDirectory) return;

        const documentIds = await this.host.files.findFiles(workspaceFolderId, "**/*.egn");
        if (lifetime.isRetired) return;

        let svg: string | undefined;
        if (kind !== "delete") {
            svg = await this.host.textDocuments.readTextDocument(iconId);
            if (lifetime.isRetired || !svg.trim()) return;
        }

        for (const documentId of documentIds) {
            if (lifetime.isRetired || !isDocumentAffectedByIcon(documentId, iconBaseDirectory)) {
                continue;
            }

            const text = await this.host.files.readFile(documentId);
            if (lifetime.isRetired) return;

            const updated = this.applyIconChange.execute(text, {
                type: metadata.type,
                name: metadata.name,
                kind,
                svg,
            });
            if (lifetime.isRetired) return;

            await this.host.files.writeFile(documentId, updated);
            if (lifetime.isRetired) return;
        }
    }

    private async loadVisibleIcons(
        workspaceFolderId: string,
        documentId: string,
        lifetime: LifetimePort,
    ): Promise<Icon[]> {
        const iconIds = await this.host.files.findFiles(
            workspaceFolderId,
            `**/${ICON_BASE_PATH}/**/*.svg`,
        );
        if (lifetime.isRetired) return [];

        const documentDirectory = directoryName(documentId);
        const icons: Icon[] = [];
        for (const iconId of iconIds) {
            if (
                lifetime.isRetired ||
                !isIconVisibleToDocument(iconId, workspaceFolderId, documentDirectory)
            ) {
                continue;
            }

            const metadata = tryParseIconPath(iconId);
            if (!metadata) continue;

            const svg = await this.host.files.readFile(iconId);
            if (lifetime.isRetired) return [];

            icons.push({ ...metadata, svg });
        }
        return icons;
    }
}

export function getIconBaseDirectory(iconId: string): string | undefined {
    const normalized = normalizePath(iconId);
    const match = normalized.match(/(.*)\/\.egon\/icons\//);
    return match?.[1];
}

export function isIconVisibleToDocument(
    iconId: string,
    workspaceFolderId: string,
    documentDirectory: string,
): boolean {
    const iconBaseDirectory = getIconBaseDirectory(iconId);
    if (!iconBaseDirectory) return false;

    return (
        iconBaseDirectory.startsWith(normalizePath(workspaceFolderId)) &&
        normalizePath(documentDirectory).startsWith(iconBaseDirectory)
    );
}

export function isDocumentAffectedByIcon(documentId: string, iconBaseDirectory: string): boolean {
    return directoryName(documentId).startsWith(normalizePath(iconBaseDirectory));
}

function directoryName(resourceId: string): string {
    const normalized = normalizePath(resourceId);
    return normalized.substring(0, normalized.lastIndexOf("/"));
}

function normalizePath(path: string): string {
    return path.replace(/\\/g, "/");
}
