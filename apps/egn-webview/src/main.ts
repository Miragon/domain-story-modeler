import { debounce } from "lodash";
import minimapModule from "diagram-js-minimap";
import { DomainStoryDocument, EgonClient, ViewportData } from "egon-core";
import {
    Command,
    DisplayDomainStoryCommand,
    InitializeWebviewCommand,
    SyncDocumentCommand,
} from "@egon/modeler-shared";
import { createEmptyStory } from "@egon/modeler-types";
import { getVsCodeApi } from "./vscode/api";

const vscode = getVsCodeApi();

let egonClient: EgonClient | undefined;

interface WebviewState {
    editorId: string;
    viewbox?: ViewportData;
}

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

const updateStory = debounce(importStory, 100);

function exportStory(): string {
    const document: DomainStoryDocument = getEgonClient().export();
    return JSON.stringify(document);
}

function sendStoryChanges(): void {
    const egn = exportStory();
    vscode.postMessage(new SyncDocumentCommand(vscode.getState().editorId, egn));
}

async function initializeDomainStoryModeler(story: string, state: WebviewState) {
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
        vscode.updateState({ viewbox: viewport }),
    );
}

async function onReceiveMessage(message: MessageEvent<Command>) {
    const command = message.data;

    if (command.TYPE === DisplayDomainStoryCommand.name) {
        const displayCommand = command as DisplayDomainStoryCommand;
        try {
            getEgonClient();
            updateStory(displayCommand.text);
        } catch (error: unknown) {
            if (error instanceof NoClientError) {
                try {
                    vscode.updateState({ editorId: displayCommand.sessionId });
                } catch {
                    vscode.setState({
                        editorId: displayCommand.sessionId,
                        viewbox: undefined,
                    });
                }

                await initializeDomainStoryModeler(
                    displayCommand.text,
                    vscode.getState(),
                );
            }
        }
    }
}

window.onload = function () {
    window.addEventListener("message", onReceiveMessage);

    let editorId: string;
    try {
        editorId = vscode.getState().editorId;
    } catch {
        editorId = "";
    }

    vscode.postMessage(new InitializeWebviewCommand(editorId));
    console.debug("[DEBUG] Modeler is initialized...");
};
