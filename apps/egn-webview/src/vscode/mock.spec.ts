// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { VsCodeMock } from "./mock";

describe("preview host", () => {
    it("emits display for initialization and consumes synchronization without echo", () => {
        const host = new VsCodeMock();
        host.setState({
            editorId: "",
            viewbox: { x: 1, y: 2, width: 3, height: 4 },
        });
        const receive = vi.fn();
        window.addEventListener("message", receive);

        host.postMessage({ type: "InitializeWebviewCommand" });
        expect(receive).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    type: "DisplayDomainStoryCommand",
                    sessionId: "preview",
                }),
            }),
        );

        receive.mockClear();
        host.postMessage({
            type: "SyncDocumentCommand",
            sessionId: "preview",
            text: "story",
        });
        expect(receive).not.toHaveBeenCalled();

        host.updateState({ editorId: "preview" });
        expect(host.getState()).toEqual({
            editorId: "preview",
            viewbox: { x: 1, y: 2, width: 3, height: 4 },
        });
    });
});
