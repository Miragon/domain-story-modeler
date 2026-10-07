import type { TextDocument } from "vscode";
import { FilePermission, Range, Uri, workspace, WorkspaceEdit } from "vscode";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { VsCodeDocumentPort } from "./VsCodeDocumentPort";

const port = new VsCodeDocumentPort();
const id = "vscode-remote://authority/C:/my%20file.egn?rev=2#frag";
let text: string;
let version: number;
let edit: { replace: ReturnType<typeof vi.fn> };

beforeEach(() => {
    vi.clearAllMocks();
    text = "old\ncontent";
    version = 4;
    const doc = {
        get version() { return version; },
        getText: () => text,
        positionAt: (offset: number) => {
            const before = text.slice(0, offset).split("\n");
            return { line: before.length - 1, character: before.at(-1)!.length };
        },
    } as TextDocument;
    vi.mocked(workspace.openTextDocument).mockResolvedValue(doc);
    vi.mocked(workspace.fs.isWritableFileSystem).mockReturnValue(true);
    vi.mocked(workspace.fs.stat).mockResolvedValue({ permissions: 0 } as never);
    edit = { replace: vi.fn() };
    vi.mocked(WorkspaceEdit).mockImplementation(function () { return edit as unknown as WorkspaceEdit; });
    vi.mocked(workspace.applyEdit).mockImplementation(async () => {
        text = edit.replace.mock.calls[0][2];
        version++;
        return true;
    });
});

describe("VsCodeDocumentPort", () => {
    it("reads using the complete URI and returns host version", async () => {
        expect(await port.read(id)).toEqual({ text, version });
        expect(Uri.parse).toHaveBeenCalledWith(id);
        expect(workspace.openTextDocument).toHaveBeenCalledWith(expect.objectContaining({ path: id }));
    });

    it("replaces the full range, including content beyond 10,000 lines", async () => {
        text = `${"line\n".repeat(10001)}end`;
        expect((await port.write(id, "new", 4, () => true)).status).toBe("applied");
        expect(Range).toHaveBeenCalledWith(expect.objectContaining({ line: 0, character: 0 }), expect.objectContaining({ line: 10001, character: 3 }));
        expect(edit.replace).toHaveBeenCalledWith(expect.objectContaining({ path: id }), expect.anything(), "new");
    });

    it("handles empty and CRLF-equivalent documents without unnecessary edit", async () => {
        text = "";
        expect((await port.write(id, "", 4, () => true)).status).toBe("unchanged");
        text = "a\r\nb";
        expect((await port.write(id, "a\nb", 4, () => true)).status).toBe("unchanged");
        expect(workspace.applyEdit).not.toHaveBeenCalled();
    });

    it("replaces an empty document from its start", async () => {
        text = "";
        expect((await port.write(id, "new", 4, () => true)).status).toBe("applied");
        expect(Range).toHaveBeenCalledWith(expect.objectContaining({ line: 0, character: 0 }), expect.objectContaining({ line: 0, character: 0 }));
    });

    it("rejects stale version and retired session after async open", async () => {
        expect((await port.write(id, "new", 3, () => true)).status).toBe("stale");
        expect((await port.write(id, "new", 4, () => false)).status).toBe("stale");
        expect(workspace.applyEdit).not.toHaveBeenCalled();
    });

    it("rechecks currency after asynchronous permission lookup", async () => {
        let release!: (value: { permissions: number }) => void;
        vi.mocked(workspace.fs.stat).mockReturnValueOnce(new Promise((resolve) => { release = resolve; }) as never);
        let current = true;
        const writing = port.write(id, "new", 4, () => current);
        await vi.waitFor(() => expect(workspace.fs.stat).toHaveBeenCalled());
        current = false;
        release({ permissions: 0 });
        expect((await writing).status).toBe("stale");
        expect(workspace.applyEdit).not.toHaveBeenCalled();
    });

    it("refuses unknown and read-only providers and files", async () => {
        vi.mocked(workspace.fs.isWritableFileSystem).mockReturnValue(undefined);
        await expect(port.write(id, "new", 4, () => true)).rejects.toThrow("not writable");
        vi.mocked(workspace.fs.isWritableFileSystem).mockReturnValue(true);
        vi.mocked(workspace.fs.stat).mockResolvedValue({ permissions: FilePermission.Readonly } as never);
        await expect(port.write(id, "new", 4, () => true)).rejects.toThrow("read-only");
    });

    it("treats rejected and incomplete applications as failures", async () => {
        vi.mocked(workspace.applyEdit).mockResolvedValueOnce(false);
        await expect(port.write(id, "new", 4, () => true)).rejects.toThrow("rejected");
        vi.mocked(workspace.applyEdit).mockImplementationOnce(async () => true);
        await expect(port.write(id, "new", 4, () => true)).rejects.toThrow("incomplete");
    });
});
