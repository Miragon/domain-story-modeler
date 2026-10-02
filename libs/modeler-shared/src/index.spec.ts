import { describe, expect, it, vi } from "vitest";
import {
    HostApiImpl,
    MissingStateError,
    MockHostApi,
    parseHostToWebviewMessage,
    parseWebviewToHostMessage,
    ProtocolValidationError,
    validateDomainStoryText,
} from "./index";

const legacyStory = JSON.stringify({
    domain: { name: "legacy", actors: {}, workObjects: {} },
    dst: [],
    extension: { preserved: true },
});

const v4Story = JSON.stringify({
    iconSet: { name: "default", actors: {}, workObjects: {} },
    domainStory: {
        businessObjects: [],
        title: "Story",
        description: "Description",
        version: "4.0.0",
        extra: true,
    },
});

describe("directional protocol parsing", () => {
    it.each([
        [{ type: "InitializeWebviewCommand" }],
        [
            {
                type: "SyncDocumentCommand",
                sessionId: "session",
                text: legacyStory,
            },
        ],
        [{ type: "LogDebugCommand", message: "debug", stack: "stack" }],
        [{ type: "LogErrorCommand", message: "error", stack: "stack" }],
        [{ type: "DocumentFlushedCommand", token: 1, status: "clean" }],
    ])("accepts a valid webview-to-host contract", (message) => {
        expect(parseWebviewToHostMessage(message)).toEqual(message);
    });

    it.each([
        [{ type: "DisplayDomainStoryCommand", sessionId: "session", text: "" }],
        [
            {
                type: "FlushDocumentQuery",
                token: 1,
                destructive: true,
                exportWhenClean: false,
            },
        ],
        [{ type: "ReleaseDocumentFlushQuery", token: 1 }],
    ])("accepts a valid host-to-webview contract", (message) => {
        expect(parseHostToWebviewMessage(message)).toEqual(message);
    });

    it("rejects unknown and wrong-direction messages", () => {
        expect(() => parseWebviewToHostMessage({ type: "Unknown" })).toThrow(
            ProtocolValidationError,
        );
        expect(() =>
            parseWebviewToHostMessage({
                type: "DisplayDomainStoryCommand",
                sessionId: "session",
                text: "",
            }),
        ).toThrow(ProtocolValidationError);
        expect(() =>
            parseHostToWebviewMessage({ type: "InitializeWebviewCommand" }),
        ).toThrow(ProtocolValidationError);
    });

    it.each([
        [undefined],
        [null],
        [[]],
        [{}],
        [{ type: 1 }],
        [{ type: "SyncDocumentCommand", sessionId: 1, text: legacyStory }],
        [{ type: "InitializeWebviewCommand", sessionId: "not-allowed" }],
        [{ type: "LogDebugCommand", message: "debug", stack: {} }],
        [{ type: "LogErrorCommand", message: "error", stack: {} }],
    ])("rejects malformed webview input", (input) => {
        expect(() => parseWebviewToHostMessage(input)).toThrow(
            ProtocolValidationError,
        );
    });
});

describe("EGN envelope validation", () => {
    it("accepts legacy and v4 stories while allowing extension fields", () => {
        expect(() => validateDomainStoryText(legacyStory)).not.toThrow();
        expect(() => validateDomainStoryText(v4Story)).not.toThrow();
    });

    it.each([
        ["not json"],
        ["{}"],
        [
            JSON.stringify({
                domain: { name: "x", actors: {}, workObjects: {} },
            }),
        ],
        [
            JSON.stringify({
                domain: { name: "x", actors: { Person: 1 }, workObjects: {} },
                dst: [],
            }),
        ],
        [
            JSON.stringify({
                iconSet: { name: "x", actors: {}, workObjects: {} },
                domainStory: {
                    businessObjects: {},
                    title: "",
                    description: "",
                    version: "4.0.0",
                },
            }),
        ],
        [
            JSON.stringify({
                iconSet: { name: "x", actors: {}, workObjects: {} },
                domainStory: {
                    businessObjects: [],
                    title: "",
                    description: "",
                },
            }),
        ],
    ])("rejects invalid story text", (text) => {
        expect(() => validateDomainStoryText(text)).toThrow(
            ProtocolValidationError,
        );
    });

    it("allows empty text only for display", () => {
        expect(() => validateDomainStoryText("")).toThrow();
        expect(() => validateDomainStoryText("", true)).not.toThrow();
    });
});

describe("reserved flush validation", () => {
    it("accepts flushed content and an optional revision", () => {
        const response = {
            type: "DocumentFlushedCommand",
            token: 9,
            status: "flushed",
            content: v4Story,
            documentRevision: 4,
        };
        expect(parseWebviewToHostMessage(response)).toEqual(response);
    });

    it.each([
        [{ type: "DocumentFlushedCommand", token: 1, status: "flushed" }],
        [
            {
                type: "DocumentFlushedCommand",
                token: 1,
                status: "clean",
                content: legacyStory,
            },
        ],
        [
            {
                type: "DocumentFlushedCommand",
                token: 1,
                status: "host-updated",
                documentRevision: 2,
            },
        ],
        [{ type: "DocumentFlushedCommand", token: "1", status: "unavailable" }],
        [{ type: "DocumentFlushedCommand", token: 1, status: "other" }],
    ])("rejects an inconsistent flush response", (response) => {
        expect(() => parseWebviewToHostMessage(response)).toThrow(
            ProtocolValidationError,
        );
    });
});

describe("host state adapters", () => {
    interface State {
        editorId: string;
        viewbox:
            | { x: number; y: number; width: number; height: number }
            | undefined;
    }

    class PreviewHost extends MockHostApi<State, string> {
        postMessage(): void {}
    }

    function state(editorId = "one"): State {
        return {
            editorId,
            viewbox: { x: 1, y: 2, width: 3, height: 4 },
        };
    }

    it("retains missing-state behavior in production and preview", () => {
        const production = new HostApiImpl<State, string>({
            getState: () => undefined,
            setState: vi.fn((next) => next),
            postMessage: vi.fn(),
        });
        const preview = new PreviewHost();

        expect(() => production.getState()).toThrow(MissingStateError);
        expect(() => preview.getState()).toThrow(MissingStateError);
    });

    it("replaces state and shallow-merges patches identically", () => {
        let stored: State | undefined = state();
        const production = new HostApiImpl<State, string>({
            getState: () => stored,
            setState: vi.fn((next) => (stored = next)),
            postMessage: vi.fn(),
        });
        const preview = new PreviewHost();
        preview.setState(state());

        production.updateState({ editorId: "two" });
        preview.updateState({ editorId: "two" });
        expect(production.getState()).toEqual(state("two"));
        expect(preview.getState()).toEqual(state("two"));

        const replacement: State = { editorId: "three", viewbox: undefined };
        production.setState(replacement);
        preview.setState(replacement);
        expect(production.getState()).toEqual(replacement);
        expect(preview.getState()).toEqual(replacement);
    });
});
