// @vitest-environment jsdom
import { beforeAll, describe, expect, it, vi } from "vitest";

const validStory = {
    iconSet: { name: "default", actors: {}, workObjects: {} },
    domainStory: {
        businessObjects: [],
        title: "",
        description: "",
        version: "4.0.0",
    },
};

const mocks = vi.hoisted(() => {
    let state:
        | {
              editorId: string;
              viewbox:
                  | { x: number; y: number; width: number; height: number }
                  | undefined;
          }
        | undefined;
    const handlers = new Map<string, () => void>();
    const client = {
        import: vi.fn(),
        export: vi.fn(),
        on: vi.fn((event: string, handler: () => void) =>
            handlers.set(event, handler),
        ),
    };
    const host = {
        getState: vi.fn(() => {
            if (!state) throw new Error("missing");
            return state;
        }),
        setState: vi.fn((next) => {
            state = { ...next };
        }),
        updateState: vi.fn((patch) => {
            if (!state) throw new Error("missing");
            state = { ...state, ...patch };
        }),
        postMessage: vi.fn(),
        state: () => state,
    };
    return { client, handlers, host };
});

vi.mock("./vscode/api", () => ({ getHostApi: () => mocks.host }));
vi.mock("diagram-js-minimap", () => ({ default: {} }));
vi.mock("lodash", () => ({
    debounce: (handler: (...args: unknown[]) => unknown) => handler,
}));
vi.mock("egon-core", () => ({
    EgonClient: { create: vi.fn(async () => mocks.client) },
}));

describe("webview host boundary", () => {
    beforeAll(() => {
        document.body.innerHTML = '<div id="egon-io-container"></div>';
        mocks.client.export.mockReturnValue(validStory);
    });

    it("uses typed initialization, display, synchronization, and diagnostics", async () => {
        await import("./main");
        window.onload?.(new Event("load"));

        expect(mocks.host.state()).toEqual({
            editorId: "",
            viewbox: undefined,
        });
        expect(mocks.host.postMessage).toHaveBeenCalledWith({
            type: "InitializeWebviewCommand",
        });

        window.dispatchEvent(
            new MessageEvent("message", {
                data: {
                    type: "DisplayDomainStoryCommand",
                    sessionId: "session-1",
                    text: "not json",
                },
            }),
        );
        await vi.waitFor(() =>
            expect(mocks.host.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: "LogErrorCommand" }),
            ),
        );
        expect(mocks.client.import).not.toHaveBeenCalled();

        window.dispatchEvent(
            new MessageEvent("message", {
                data: {
                    type: "DisplayDomainStoryCommand",
                    sessionId: "session-1",
                    text: JSON.stringify(validStory),
                },
            }),
        );
        await vi.waitFor(() =>
            expect(mocks.client.import).toHaveBeenCalledWith(validStory),
        );
        expect(mocks.host.state()?.editorId).toBe("session-1");

        mocks.handlers.get("story.changed")?.();
        expect(mocks.host.postMessage).toHaveBeenCalledWith({
            type: "SyncDocumentCommand",
            sessionId: "session-1",
            text: JSON.stringify(validStory),
        });

        const importCount = mocks.client.import.mock.calls.length;
        window.dispatchEvent(
            new MessageEvent("message", {
                data: {
                    type: "DisplayDomainStoryCommand",
                    sessionId: "session-2",
                    text: JSON.stringify(validStory),
                },
            }),
        );
        await vi.waitFor(() =>
            expect(mocks.host.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: "LogErrorCommand",
                    message: expect.stringContaining("Editor ID mismatch"),
                }),
            ),
        );
        expect(mocks.client.import).toHaveBeenCalledTimes(importCount);
    });
});
