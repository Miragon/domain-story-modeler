import type { TextDocument } from "vscode";
import { Range, Uri, workspace, WorkspaceEdit } from "vscode";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VsCodeDocumentPort } from "./VsCodeDocumentPort";

const openTextDocumentMock = vi.mocked(workspace.openTextDocument);
const applyEditMock = vi.mocked(workspace.applyEdit);
const workspaceEditMock = vi.mocked(WorkspaceEdit);

describe("VsCodeDocumentPort", () => {
    let port: VsCodeDocumentPort;
    let mockTextDocument: Partial<TextDocument>;
    let mockWorkspaceEdit: { replace: ReturnType<typeof vi.fn> };

    beforeEach(() => {
        port = new VsCodeDocumentPort();

        mockTextDocument = {
            getText: vi.fn().mockReturnValue("document content"),
        };

        mockWorkspaceEdit = {
            replace: vi.fn(),
        };

        openTextDocumentMock.mockResolvedValue(mockTextDocument as TextDocument);
        applyEditMock.mockResolvedValue(true);
        workspaceEditMock.mockImplementation(function WorkspaceEditMock() {
            return mockWorkspaceEdit as unknown as WorkspaceEdit;
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe("read", () => {
        it("should read content from document", async () => {
            const content = await port.read("/path/to/file.txt");

            expect(Uri.file).toHaveBeenCalledWith("/path/to/file.txt");
            expect(workspace.openTextDocument).toHaveBeenCalled();
            expect(content).toBe("document content");
        });

        it("should handle different file paths", async () => {
            await port.read("/different/path.egn");

            expect(Uri.file).toHaveBeenCalledWith("/different/path.egn");
        });

        it("should call getText on the document", async () => {
            await port.read("/path/to/file.txt");

            expect(mockTextDocument.getText).toHaveBeenCalled();
        });
    });

    describe("write", () => {
        it("should write content to document", async () => {
            await port.write("/path/to/file.txt", "new content");

            expect(Uri.file).toHaveBeenCalledWith("/path/to/file.txt");
            expect(WorkspaceEdit).toHaveBeenCalled();
            expect(mockWorkspaceEdit.replace).toHaveBeenCalled();
            expect(workspace.applyEdit).toHaveBeenCalledWith(mockWorkspaceEdit);
        });

        it("preserves the known fixed 9,999-line replacement range until #13", async () => {
            await port.write("/path/to/file.txt", "new content");

            // Regression baseline only: #13 owns replacing this incomplete range.
            expect(Range).toHaveBeenCalledWith(0, 0, 9999, 0);
            expect(mockWorkspaceEdit.replace).toHaveBeenCalledWith(
                expect.objectContaining({ path: "/path/to/file.txt" }),
                expect.anything(),
                "new content",
            );
        });

        it("should handle empty content", async () => {
            await port.write("/path/to/file.txt", "");

            expect(mockWorkspaceEdit.replace).toHaveBeenCalledWith(
                expect.anything(),
                expect.anything(),
                "",
            );
        });

        it("should handle multiline content", async () => {
            const multiline = "line1\nline2\nline3";

            await port.write("/path/to/file.txt", multiline);

            expect(mockWorkspaceEdit.replace).toHaveBeenCalledWith(
                expect.anything(),
                expect.anything(),
                multiline,
            );
        });

        it("should handle special characters", async () => {
            const special = "特殊文字\t\n🎉";

            await port.write("/path/to/file.txt", special);

            expect(mockWorkspaceEdit.replace).toHaveBeenCalledWith(
                expect.anything(),
                expect.anything(),
                special,
            );
        });
    });

    describe("error handling", () => {
        it("should propagate read errors", async () => {
            const error = new Error("Cannot open document");
            openTextDocumentMock.mockRejectedValue(error);

            await expect(port.read("/path/to/file.txt")).rejects.toThrow(
                "Cannot open document",
            );
        });

        it("should propagate write errors", async () => {
            const error = new Error("Cannot apply edit");
            applyEditMock.mockRejectedValue(error);

            await expect(port.write("/path/to/file.txt", "content")).rejects.toThrow(
                "Cannot apply edit",
            );
        });
    });
});
