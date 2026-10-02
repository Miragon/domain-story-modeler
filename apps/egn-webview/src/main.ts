import { debounce } from "lodash";
import minimapModule from "diagram-js-minimap";
import { DomainStoryDocument, EgonClient, ViewportData } from "egon-core";
import {
    defaultWebviewState,
    ErrorDiagnosticMessage,
    parseHostToWebviewMessage,
    WebviewState,
} from "@egon/modeler-shared";
import { createEmptyStory } from "@egon/modeler-types";
import { getHostApi } from "./vscode/api";

const host = getHostApi();

try {
    host.getState();
} catch {
    host.setState(defaultWebviewState());
}

let egonClient: EgonClient | undefined;
let activeSessionId: string | undefined;

class NoClientError extends Error {
    constructor() {
        super("EgonClient is not initialized!");
    }
}

function getEgonClient(): EgonClient {
    if (!egonClient) {
        throw new NoClientError();
    }
    return egonClient;
}

function importStory(story: string): void {
    const document: DomainStoryDocument = JSON.parse(story);
    getEgonClient().import(document);
}

const updateStory = debounce((story: string) => {
    try {
        importStory(story);
    } catch (error) {
        sendErrorDiagnostic("Failed to display a domain story", error);
    }
}, 100);

function exportStory(): string {
    const document: DomainStoryDocument = getEgonClient().export();
    return JSON.stringify(document);
}

function sendStoryChanges(): void {
    const egn = exportStory();
    const sessionId = activeSessionId;
    if (!sessionId) {
        sendErrorDiagnostic(
            "Cannot synchronize before a display session is established",
        );
        return;
    }
    host.postMessage({ type: "SyncDocumentCommand", sessionId, text: egn });
}

async function initializeDomainStoryModeler(
    story: string,
    state: WebviewState,
) {
    const container = document.getElementById("egon-io-container");
    if (!container) {
        throw new Error("Container for Egon.io modeler not found!");
    }

    egonClient = await EgonClient.create(
        {
            container,
            width: "100%",
            height: "100%",
            viewport: state.viewbox,
        },
        [minimapModule],
    );

    importStory(story === "" ? JSON.stringify(createEmptyStory()) : story);

    // EgonClient debounces story changes internally at 100 ms.
    egonClient.on("story.changed", sendStoryChanges);
    egonClient.on("viewport.changed", (viewport: ViewportData) =>
        host.updateState({ viewbox: viewport }),
    );
}

export async function onReceiveMessage(
    event: MessageEvent<unknown>,
): Promise<void> {
    const message = parseHostToWebviewMessage(event.data);
    if (message.type !== "DisplayDomainStoryCommand") return;

    if (
        activeSessionId !== undefined &&
        activeSessionId !== message.sessionId
    ) {
        throw new Error(
            `Editor ID mismatch (${message.sessionId} != ${activeSessionId})`,
        );
    }
    if (activeSessionId === undefined) {
        activeSessionId = message.sessionId;
        host.updateState({ editorId: message.sessionId });
    }

    try {
        getEgonClient();
        updateStory(message.text);
    } catch (error: unknown) {
        if (error instanceof NoClientError) {
            await initializeDomainStoryModeler(message.text, host.getState());
        } else {
            throw error;
        }
    }
}

function sendErrorDiagnostic(message: string, error?: unknown): void {
    const detail = error instanceof Error ? error : undefined;
    const diagnostic: ErrorDiagnosticMessage = {
        type: "LogErrorCommand",
        message: detail?.message ? `${message}: ${detail.message}` : message,
        ...(detail?.stack === undefined ? {} : { stack: detail.stack }),
    };
    host.postMessage(diagnostic);
}

window.onload = function () {
    window.addEventListener("message", (event: MessageEvent<unknown>) => {
        void onReceiveMessage(event).catch((error) =>
            sendErrorDiagnostic("Failed to process a host message", error),
        );
    });

    host.postMessage({ type: "InitializeWebviewCommand" });
    console.debug("[DEBUG] Modeler is initialized...");
};
