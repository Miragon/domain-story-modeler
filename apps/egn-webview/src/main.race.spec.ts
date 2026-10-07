// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";

const story = { iconSet: { name: "default", actors: {}, workObjects: {} }, domainStory: { businessObjects: [], title: "", description: "", version: "4.0.0" } };
const mocks = vi.hoisted(() => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const handlers = new Map<string, () => void>();
    const client = { import: vi.fn(), export: vi.fn(), on: vi.fn((name: string, handler: () => void) => { handlers.set(name, handler); }) };
    const host = { getState: vi.fn(() => ({ editorId: "", viewbox: undefined })), setState: vi.fn(), updateState: vi.fn(), postMessage: vi.fn() };
    return { gate, release, handlers, client, host, create: vi.fn(), flush: undefined as undefined | (() => void) };
});
vi.mock("./vscode/api", () => ({ getHostApi: () => mocks.host }));
vi.mock("diagram-js-minimap", () => ({ default: {} }));
vi.mock("lodash", () => ({ debounce: (handler: (...args: unknown[]) => void) => (...args: unknown[]) => { mocks.flush = () => handler(...args); } }));
vi.mock("egon-core", () => ({ EgonClient: { create: async () => { mocks.create(); await mocks.gate; return mocks.client; } } }));

describe("webview synchronization races", () => {
    it("shares modeler creation, imports only the newest display, and blocks export while another display waits", async () => {
        document.body.innerHTML = '<div id="egon-io-container"></div>';
        const { onReceiveMessage } = await import("./main");
        const first = onReceiveMessage(new MessageEvent("message", { data: { type: "DisplayDomainStoryCommand", sessionId: "s", text: JSON.stringify(story), documentRevision: 1 } }));
        const newer = { ...story, domainStory: { ...story.domainStory, title: "newer" } };
        const second = onReceiveMessage(new MessageEvent("message", { data: { type: "DisplayDomainStoryCommand", sessionId: "s", text: JSON.stringify(newer), documentRevision: 2 } }));
        expect(mocks.create).toHaveBeenCalledTimes(1);
        mocks.release();
        await Promise.all([first, second]);
        expect(mocks.client.import).toHaveBeenCalledTimes(1);
        expect(mocks.client.import).toHaveBeenCalledWith(newer);

        mocks.client.export.mockReturnValue(newer);
        mocks.handlers.get("story.changed")?.();
        expect(mocks.host.postMessage).toHaveBeenCalledWith({ type: "SyncDocumentCommand", sessionId: "s", text: JSON.stringify(newer), documentRevision: 2, requestId: 1 });
        await onReceiveMessage(new MessageEvent("message", { data: { type: "SyncDocumentResultCommand", sessionId: "s", requestId: 1, documentRevision: 1, status: "unchanged" } }));
        await onReceiveMessage(new MessageEvent("message", { data: { type: "DisplayDomainStoryCommand", sessionId: "s", text: JSON.stringify(story), documentRevision: 3 } }));
        mocks.handlers.get("story.changed")?.();
        expect(mocks.host.postMessage.mock.calls.filter(([message]) => message.type === "SyncDocumentCommand")).toHaveLength(1);
        mocks.flush?.();
        mocks.handlers.get("story.changed")?.();
        expect(mocks.host.postMessage).toHaveBeenCalledWith(expect.objectContaining({ type: "SyncDocumentCommand", documentRevision: 3, requestId: 2 }));
        await onReceiveMessage(new MessageEvent("message", { data: { type: "SyncDocumentResultCommand", sessionId: "s", requestId: 2, documentRevision: 3, status: "failed" } }));
        const later = { ...story, domainStory: { ...story.domainStory, title: "later" } };
        mocks.client.export.mockReturnValue(later);
        mocks.handlers.get("story.changed")?.();
        expect(mocks.host.postMessage).toHaveBeenCalledWith({ type: "SyncDocumentCommand", sessionId: "s", text: JSON.stringify(later), documentRevision: 3, requestId: 3 });
    });
});
