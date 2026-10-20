// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { VsCodeMock } from "./mock";

describe("preview host", () => {
  it("emits display and correlated synchronization results", () => {
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
      documentRevision: 0,
      requestId: 1,
    });
    expect(receive).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "SyncDocumentResultCommand",
          requestId: 1,
          documentRevision: 1,
        }),
      }),
    );

    host.updateState({ editorId: "preview" });
    expect(host.getState()).toEqual({
      editorId: "preview",
      viewbox: { x: 1, y: 2, width: 3, height: 4 },
    });
  });

  it("persists reload state and emits correlated repair decisions", () => {
    sessionStorage.clear();
    const first = new VsCodeMock();
    first.setState({
      editorId: "preview",
      viewbox: { x: 10, y: 20, width: 300, height: 200 },
    });
    expect(new VsCodeMock().getState()).toEqual(first.getState());

    vi.spyOn(window, "prompt").mockReturnValueOnce("accept");
    const receive = vi.fn();
    window.addEventListener("message", receive, { once: true });
    first.postMessage({
      type: "ReportWebviewIssueCommand",
      sessionId: "preview",
      documentRevision: 2,
      issueToken: "repair-2",
      kind: "repair",
      message: "Story repaired",
      removedConnectionIds: ["connection-1"],
    });
    expect(receive).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          type: "ResolveWebviewIssueCommand",
          sessionId: "preview",
          documentRevision: 2,
          issueToken: "repair-2",
          decision: "acceptRepairs",
        },
      }),
    );
  });
});
