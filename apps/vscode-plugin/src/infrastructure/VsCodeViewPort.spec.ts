import type { WebviewPanel } from "vscode";
import { describe, expect, it, vi } from "vitest";
import { VsCodeViewPort } from "./VsCodeViewPort";

describe("VsCodeViewPort", () => {
    it("posts revisioned displays and correlated synchronization results", async () => {
        const postMessage = vi.fn().mockResolvedValue(true);
        const port = new VsCodeViewPort({ webview: { postMessage } } as unknown as WebviewPanel);
        await port.display("session-1", "story", 3);
        await port.syncResult("session-1", 7, 4, "applied");
        expect(postMessage.mock.calls.map(([message]) => message)).toEqual([
            { type: "DisplayDomainStoryCommand", sessionId: "session-1", text: "story", documentRevision: 3 },
            { type: "SyncDocumentResultCommand", sessionId: "session-1", requestId: 7, documentRevision: 4, status: "applied" },
        ]);
    });

    it("surfaces posting failures", async () => {
        const postMessage = vi.fn().mockResolvedValue(false);
        const port = new VsCodeViewPort({ webview: { postMessage } } as unknown as WebviewPanel);
        await expect(port.display("s", "", 0)).rejects.toThrow("accept");
    });
});
