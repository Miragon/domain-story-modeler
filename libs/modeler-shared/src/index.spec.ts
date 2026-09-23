import { describe, expect, it } from "vitest";
import {
    DisplayDomainStoryCommand,
    GetDomainStoryAsSvgCommand,
    InitializeWebviewCommand,
    SyncDocumentCommand,
} from "./index";

describe("@egon/modeler-shared entrypoint", () => {
    it.each([
        [new InitializeWebviewCommand("session"), "InitializeWebviewCommand"],
        [
            new DisplayDomainStoryCommand("session", "story"),
            "DisplayDomainStoryCommand",
        ],
        [new SyncDocumentCommand("session", "story"), "SyncDocumentCommand"],
        [
            new GetDomainStoryAsSvgCommand("session", "<svg />"),
            "GetDomainStoryAsSvgCommand",
        ],
    ])("preserves the %s message name", (command, name) => {
        expect(command.TYPE).toBe(name);
        expect(command.sessionId).toBe("session");
    });
});
