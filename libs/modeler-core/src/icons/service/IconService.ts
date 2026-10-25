import { validateDomainStoryText } from "@egon/modeler-shared";
import { DomainStoryDocument, isV4DomainStoryDocument } from "@egon/modeler-types";
import { FileReadPort, LifetimePort, WorkspaceFolderPort } from "../../shared/domain/hostPorts";
import { IconType } from "../domain";
import { tryParseIconPath } from "../domain/IconPathParser";

export interface IconDirectoryEntry { readonly name: string; readonly kind: "file" | "directory" }
export interface IconDirectoryPort {
    readDirectory(directoryId: string): Promise<readonly IconDirectoryEntry[]>;
    joinPath(directoryId: string, name: string): string;
    parentPath(resourceId: string): string;
}
export interface IconHostPorts {
    workspaceFolders: WorkspaceFolderPort;
    files: FileReadPort & IconDirectoryPort;
}
export interface DiscoveredIcon {
    readonly type: IconType;
    readonly name: string;
    readonly svg: string;
    readonly source: string;
}
export interface ManagedIcon { readonly source: string; readonly svg: string }
export interface IconReconciliation {
    readonly text: string;
    readonly ownership: ReadonlyMap<string, ManagedIcon>;
}

/** Discovers visible SVGs and reconciles only an already-open story buffer. */
export class IconService {
    private readonly ownership = new Map<string, ReadonlyMap<string, ManagedIcon>>();
    constructor(private readonly host: IconHostPorts) {}

    async discover(documentId: string, lifetime?: LifetimePort): Promise<DiscoveredIcon[]> {
        const root = this.host.workspaceFolders.getWorkspaceFolder(documentId);
        if (!root) return [];
        const ancestors: string[] = [];
        let directory = this.host.files.parentPath(documentId);
        while (contains(root, directory)) {
            ancestors.push(directory);
            if (sameLocation(root, directory)) break;
            const parent = this.host.files.parentPath(directory);
            if (sameLocation(parent, directory)) break;
            directory = parent;
        }
        const selected = new Map<string, DiscoveredIcon>();
        for (const ancestor of ancestors) {
            for (const [folder, type] of [["actors", IconType.Actor], ["work-objects", IconType.WorkObject]] as const) {
                const base = this.host.files.joinPath(ancestor, ".egon/icons");
                const category = this.host.files.joinPath(base, folder);
                const candidates = await this.walk(category, lifetime);
                candidates.sort();
                for (const source of candidates) {
                    if (lifetime?.isRetired) return [];
                    const metadata = tryParseIconPath(source);
                    if (!metadata || metadata.type !== type) continue;
                    const key = iconKey(type, metadata.name.value);
                    if (selected.has(key)) continue;
                    const svg = await this.host.files.readFile(source);
                    if (!svg.trim()) continue;
                    selected.set(key, { type, name: metadata.name.value, svg, source });
                }
            }
        }
        return [...selected.values()];
    }

    reconcile(documentId: string, currentText: string, icons: readonly DiscoveredIcon[], deletionObserved = false): IconReconciliation {
        validateDomainStoryText(currentText);
        const doc = JSON.parse(currentText) as DomainStoryDocument;
        const set = isV4DomainStoryDocument(doc) ? doc.iconSet : doc.domain;
        const previous = this.ownership.get(documentId) ?? new Map<string, ManagedIcon>();
        const next = new Map<string, ManagedIcon>();
        let changed = false;
        for (const icon of icons) {
            const map = icon.type === IconType.Actor ? set.actors : set.workObjects;
            const key = iconKey(icon.type, icon.name);
            if (map[icon.name] !== icon.svg) {
                map[icon.name] = icon.svg;
                changed = true;
            }
            next.set(key, { source: icon.source, svg: icon.svg });
        }
        for (const [key, managed] of previous) {
            if (next.has(key)) continue;
            const [type, name] = splitKey(key);
            const map = type === IconType.Actor ? set.actors : set.workObjects;
            if (deletionObserved && map[name] === managed.svg) {
                delete map[name];
                changed = true;
            } else if (!deletionObserved && map[name] !== undefined) {
                next.set(key, managed);
            }
        }
        return { text: changed ? JSON.stringify(doc, null, 2) : currentText, ownership: next };
    }

    commit(documentId: string, result: IconReconciliation): void {
        this.ownership.set(documentId, result.ownership);
    }

    close(documentId: string): void { this.ownership.delete(documentId); }

    private async walk(directory: string, lifetime?: LifetimePort): Promise<string[]> {
        if (lifetime?.isRetired) return [];
        const entries = await this.host.files.readDirectory(directory);
        const files: string[] = [];
        for (const entry of entries) {
            if (lifetime?.isRetired) return [];
            const child = this.host.files.joinPath(directory, entry.name);
            if (entry.kind === "directory") files.push(...await this.walk(child, lifetime));
            else if (entry.name.toLowerCase().endsWith(".svg")) files.push(child);
        }
        return files;
    }
}

function iconKey(type: IconType, name: string): string { return `${type}\0${name}`; }
function splitKey(key: string): [IconType, string] {
    const index = key.indexOf("\0");
    return [key.slice(0, index) as IconType, key.slice(index + 1)];
}

function location(id: string): { origin: string; path: string } {
    const normalized = id.replace(/\\/g, "/");
    const match = normalized.match(/^([a-z][a-z\d+.-]*:\/\/[^/]*)(\/[^?#]*)/i);
    const origin = match ? match[1].toLowerCase() : "";
    let path = match ? match[2] : normalized;
    path = path.replace(/^\/([a-z]):(?=\/)/i, (_match, drive: string) => `/${drive.toLowerCase()}:`)
        .replace(/^([a-z]):(?=\/)/i, (_match, drive: string) => `${drive.toLowerCase()}:`)
        .replace(/\/$/, "") || "/";
    return { origin, path };
}
export function sameLocation(a: string, b: string): boolean {
    const left = location(a); const right = location(b);
    return left.origin === right.origin && left.path === right.path;
}
export function contains(parent: string, child: string): boolean {
    const root = location(parent); const target = location(child);
    return root.origin === target.origin && (root.path === target.path || target.path.startsWith(root.path === "/" ? "/" : `${root.path}/`));
}
export function isIconVisibleToDocument(iconId: string, workspaceFolderId: string, documentDirectory: string): boolean {
    const parts = location(iconId).path.split("/");
    const index = parts.lastIndexOf(".egon");
    if (index < 0 || parts[index + 1] !== "icons") return false;
    const base = parts.slice(0, index).join("/") || "/";
    const origin = location(iconId).origin;
    return contains(workspaceFolderId, `${origin}${base}`) && contains(`${origin}${base}`, documentDirectory);
}
