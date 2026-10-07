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
let initializing: Promise<void> | undefined;
let activeSessionId: string | undefined;
let importedRevision = -1;
let newestDisplayRevision = -1;
let displaySequence = 0;
let nextRequestId = 0;
let outstanding: { requestId: number; text: string } | undefined;
let pendingLocal: string | undefined;
let importing = false;

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

function applyDisplay(story: string, revision: number, sequence: number): void {
    if (sequence !== displaySequence || revision < importedRevision) return;
    try {
        importing = true;
        importStory(story === "" ? JSON.stringify(createEmptyStory()) : story);
        importedRevision = revision;
        pendingLocal = undefined;
    } catch (error) {
        sendErrorDiagnostic("Failed to display a domain story", error);
    } finally {
        importing = false;
    }
}

const updateStory = debounce(applyDisplay, 100);

function exportStory(): string {
    const document: DomainStoryDocument = getEgonClient().export();
    return JSON.stringify(document);
}

function sendStoryChanges(): void {
    if (importing || importedRevision < newestDisplayRevision) return;
    const egn = exportStory();
    const sessionId = activeSessionId;
    if (!sessionId) {
        sendErrorDiagnostic(
            "Cannot synchronize before a display session is established",
        );
        return;
    }
    if (outstanding) {
        pendingLocal = egn;
        return;
    }
    submitStory(egn);
}

function submitStory(text: string): void {
    if (!activeSessionId || importedRevision < newestDisplayRevision) return;
    const requestId = ++nextRequestId;
    outstanding = { requestId, text };
    host.postMessage({ type: "SyncDocumentCommand", sessionId: activeSessionId, text, documentRevision: importedRevision, requestId });
}

async function initializeDomainStoryModeler(state: WebviewState): Promise<void> {
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

    // EgonClient debounces story changes internally at 100 ms.
    egonClient.on("story.changed", sendStoryChanges);
    egonClient.on("viewport.changed", (viewport: ViewportData) =>
        host.updateState({ viewbox: viewport }),
    );
}

async function ensureModeler(state: WebviewState): Promise<void> {
    if (egonClient) return;
    initializing ??= initializeDomainStoryModeler(state).finally(() => { initializing = undefined; });
    await initializing;
}

export async function onReceiveMessage(
    event: MessageEvent<unknown>,
): Promise<void> {
    const message = parseHostToWebviewMessage(event.data);
    if (message.type === "SyncDocumentResultCommand") {
        if (message.sessionId !== activeSessionId || outstanding?.requestId !== message.requestId) return;
        const acceptedText = outstanding.text;
        outstanding = undefined;
        if (message.status === "stale") {
            pendingLocal = undefined;
            return;
        }
        if (message.status === "failed") {
            sendErrorDiagnostic("Failed to save domain story changes");
            pendingLocal = undefined;
            return;
        }
        importedRevision = Math.max(importedRevision, message.documentRevision);
        if (pendingLocal !== undefined && importedRevision >= newestDisplayRevision) {
            const pending = pendingLocal;
            pendingLocal = undefined;
            if (pending !== acceptedText) submitStory(pending);
        }
        return;
    }
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

    if (message.documentRevision < newestDisplayRevision) return;
    newestDisplayRevision = message.documentRevision;
    const sequence = ++displaySequence;
    if (!egonClient) {
        await ensureModeler(host.getState());
        applyDisplay(message.text, message.documentRevision, sequence);
    } else {
        updateStory(message.text, message.documentRevision, sequence);
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
