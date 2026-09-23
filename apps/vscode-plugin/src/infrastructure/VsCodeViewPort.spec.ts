import { DisplayDomainStoryCommand } from "@egon/modeler-shared";
import type { WebviewPanel } from "vscode";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VsCodeViewPort } from "./VsCodeViewPort";

const { displayDomainStoryCommandMock } = vi.hoisted(() => ({
    displayDomainStoryCommandMock: vi.fn(function DisplayDomainStoryCommandMock(
        editorId: string,
        text: string,
    ) {
        return {
            TYPE: "DisplayDomainStoryCommand",
            editorId,
            text,
        };
    }),
}));

vi.mock("@egon/modeler-shared", () => ({
    DisplayDomainStoryCommand: displayDomainStoryCommandMock,
}));

const commandMock = vi.mocked(DisplayDomainStoryCommand);

describe("VsCodeViewPort", () => {
    let mockWebviewPanel: Partial<WebviewPanel>;
    let postMessageMock: ReturnType<typeof vi.fn>;
    let port: VsCodeViewPort;

    beforeEach(() => {
        postMessageMock = vi.fn().mockResolvedValue(true);
        mockWebviewPanel = {
            webview: {
                postMessage: postMessageMock,
            } as unknown as WebviewPanel["webview"],
        };

        port = new VsCodeViewPort(mockWebviewPanel as WebviewPanel);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe("display", () => {
        it("should post message to webview", async () => {
            await port.display("/path/to/file.egn:1", "content to display");

            expect(postMessageMock).toHaveBeenCalled();
        });

        it("should create DisplayDomainStoryCommand with correct parameters", async () => {
            await port.display("/path/to/file.egn:1", "content");

            expect(commandMock).toHaveBeenCalledWith("/path/to/file.egn:1", "content");
        });

        it("should post the command to webview", async () => {
            await port.display("/path/to/file.egn:1", "content");

            expect(postMessageMock).toHaveBeenCalledWith({
                TYPE: "DisplayDomainStoryCommand",
                editorId: "/path/to/file.egn:1",
                text: "content",
            });
        });

        it("should handle empty content", async () => {
            await port.display("/path/to/file.egn:1", "");

            expect(commandMock).toHaveBeenCalledWith("/path/to/file.egn:1", "");
        });

        it("should handle multiline content", async () => {
            const multiline = "line1\nline2\nline3";

            await port.display("/path/to/file.egn:1", multiline);

            expect(commandMock).toHaveBeenCalledWith("/path/to/file.egn:1", multiline);
        });

        it("should handle special characters", async () => {
            const special = "特殊文字\t\n🎉";

            await port.display("/path/to/file.egn:1", special);

            expect(commandMock).toHaveBeenCalledWith("/path/to/file.egn:1", special);
        });

        it("should handle different session IDs", async () => {
            await port.display("/path/to/file1.egn:1", "content1");
            await port.display("/path/to/file2.egn:1", "content2");

            expect(commandMock).toHaveBeenCalledWith("/path/to/file1.egn:1", "content1");
            expect(commandMock).toHaveBeenCalledWith("/path/to/file2.egn:1", "content2");
        });

        it("should resolve when postMessage succeeds", async () => {
            postMessageMock.mockResolvedValue(true);

            await expect(port.display("/path/to/file.egn:1", "content")).resolves.not.toThrow();
        });

        it("should handle postMessage failure", async () => {
            const error = new Error("Webview disposed");
            postMessageMock.mockRejectedValue(error);

            await expect(port.display("/path/to/file.egn:1", "content")).rejects.toThrow(
                "Webview disposed",
            );
        });
    });

    describe("multiple displays", () => {
        it("should handle rapid sequential displays", async () => {
            await port.display("/path/to/file.egn:1", "v1");
            await port.display("/path/to/file.egn:1", "v2");
            await port.display("/path/to/file.egn:1", "v3");

            expect(postMessageMock).toHaveBeenCalledTimes(3);
        });

        it("should maintain call order", async () => {
            const calls: string[] = [];
            postMessageMock.mockImplementation((command: { text: string }) => {
                calls.push(command.text);
                return Promise.resolve(true);
            });

            await port.display("/path/to/file.egn:1", "first");
            await port.display("/path/to/file.egn:1", "second");
            await port.display("/path/to/file.egn:1", "third");

            expect(calls).toEqual(["first", "second", "third"]);
        });
    });
});
