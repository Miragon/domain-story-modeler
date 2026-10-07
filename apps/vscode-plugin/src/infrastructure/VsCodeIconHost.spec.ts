import { FilePermission, Uri, workspace } from "vscode";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { VsCodeIconHost } from "./VsCodeIconHost";

const host = new VsCodeIconHost();

beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(workspace.fs.isWritableFileSystem).mockReturnValue(true);
    vi.mocked(workspace.fs.stat).mockResolvedValue({ permissions: 0 } as never);
    vi.mocked(workspace.fs.writeFile).mockResolvedValue(undefined);
});

describe("VsCodeIconHost", () => {
    it("preserves complete custom URIs when persisting icons", async () => {
        const id = "memfs://authority/C:/encoded%20name.egn?q=1#frag";
        await host.writeFile(id, "content");
        expect(Uri.parse).toHaveBeenCalledWith(id);
        expect(workspace.fs.writeFile).toHaveBeenCalledWith(expect.objectContaining({ path: id }), new TextEncoder().encode("content"));
    });

    it("uses filesystem URIs for Windows paths with literal colons", async () => {
        await host.writeFile("C:\\work\\a:b.egn", "content");
        expect(Uri.file).toHaveBeenCalledWith("C:\\work\\a:b.egn");
    });

    it("refuses unknown or read-only filesystems and explicit read-only files", async () => {
        vi.mocked(workspace.fs.isWritableFileSystem).mockReturnValue(undefined);
        await expect(host.writeFile("file:///story.egn", "text")).rejects.toThrow("not writable");
        vi.mocked(workspace.fs.isWritableFileSystem).mockReturnValue(false);
        await expect(host.writeFile("file:///story.egn", "text")).rejects.toThrow("not writable");
        vi.mocked(workspace.fs.isWritableFileSystem).mockReturnValue(true);
        vi.mocked(workspace.fs.stat).mockResolvedValue({ permissions: FilePermission.Readonly } as never);
        await expect(host.writeFile("file:///story.egn", "text")).rejects.toThrow("read-only");
        expect(workspace.fs.writeFile).not.toHaveBeenCalled();
    });
});
