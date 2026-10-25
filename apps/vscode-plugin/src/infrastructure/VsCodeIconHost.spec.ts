import { FileType, Uri, workspace } from "vscode";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { VsCodeIconHost } from "./VsCodeIconHost";

const host = new VsCodeIconHost();
beforeEach(() => vi.clearAllMocks());

describe("VsCodeIconHost", () => {
    it("reads SVGs from the filesystem without opening a text document", async () => {
        vi.mocked(workspace.fs.readFile).mockResolvedValue(new TextEncoder().encode("svg"));
        expect(await host.readFile("memfs://authority/C:/icon%20one.svg")).toBe("svg");
        expect(Uri.parse).toHaveBeenCalledWith("memfs://authority/C:/icon%20one.svg");
        expect(workspace.openTextDocument).not.toHaveBeenCalled();
    });

    it("enumerates directories and ignores missing directories", async () => {
        vi.mocked(workspace.fs.readDirectory).mockResolvedValueOnce([["actors", FileType.Directory], ["icon.svg", FileType.File]]);
        expect(await host.readDirectory("file:///workspace/.egon/icons")).toEqual([
            { name: "actors", kind: "directory" }, { name: "icon.svg", kind: "file" },
        ]);
        vi.mocked(workspace.fs.readDirectory).mockRejectedValueOnce(Object.assign(new Error("gone"), { name: "FileNotFound" }));
        expect(await host.readDirectory("file:///missing")).toEqual([]);
        vi.mocked(workspace.fs.readDirectory).mockRejectedValueOnce(new Error("permission denied"));
        await expect(host.readDirectory("file:///denied")).rejects.toThrow("permission denied");
    });

    it("uses file URIs for Windows paths", () => {
        host.parentPath("C:\\work\\story.egn");
        expect(Uri.file).toHaveBeenCalledWith("C:\\work\\story.egn");
    });

    it("drops a document query and fragment before walking its directories", () => {
        expect(host.parentPath("memfs://host/C:/story%20one.egn?revision=2#view")).toBe("memfs://host/C:");
        expect(Uri.parse).toHaveBeenCalledWith("memfs://host/C:/story%20one.egn?revision=2#view");
    });
});
