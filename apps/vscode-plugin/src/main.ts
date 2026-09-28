import {
    DisposablePort,
    DisposalScope,
    DocumentPort,
    DomainStoryEditorService,
    IconHostPorts,
    IconService,
    LoggerPort,
    NotifierPort,
    ViewPort,
} from "@egon/modeler-core";
import { ExtensionContext, OutputChannel, WebviewPanel, window } from "vscode";
import { IconWatcherController } from "./IconWatcherController";
import { WebviewController } from "./WebviewController";
import { VsCodeDocumentPort } from "./infrastructure/VsCodeDocumentPort";
import { VsCodeIconHost } from "./infrastructure/VsCodeIconHost";
import { VsCodeLogger } from "./infrastructure/VsCodeLogger";
import { VsCodeNotifier } from "./infrastructure/VsCodeNotifier";
import { VsCodeViewPort } from "./infrastructure/VsCodeViewPort";
import { registerEditor, registerIconWatcher } from "./registration";

export const VIEW_TYPE = "egon.io";
export const EXTENSION_ID = "egn";

export interface ActivationOverrides {
    documentPort?: DocumentPort;
    iconHost?: IconHostPorts;
    logger?: LoggerPort;
    notifier?: NotifierPort;
    createOutputChannel?: () => OutputChannel;
    createView?: (panel: WebviewPanel) => ViewPort;
    registerEditor?: (
        viewType: string,
        controller: WebviewController,
        logger: LoggerPort,
    ) => DisposablePort;
    registerIconWatcher?: (controller: IconWatcherController, logger: LoggerPort) => DisposablePort;
}

/** Extension composition root. All activation resources belong to one scope. */
export function activate(context: ExtensionContext, overrides: ActivationOverrides = {}): void {
    let logger = overrides.logger;
    const activation = new DisposalScope((error) =>
        logger?.error("Failed to dispose an activation resource", error),
    );
    context.subscriptions.push(activation);

    try {
        if (!logger) {
            const output = activation.add(
                (overrides.createOutputChannel ?? (() => window.createOutputChannel("Egon")))(),
            );
            logger = new VsCodeLogger(output);
        }

        const notifier = overrides.notifier ?? new VsCodeNotifier();
        const documentPort = overrides.documentPort ?? new VsCodeDocumentPort();
        const iconAdapter = overrides.iconHost ?? createIconHost();
        const editorService = new DomainStoryEditorService(documentPort);
        const iconService = new IconService(iconAdapter);

        const editorController = new WebviewController({
            extensionUri: context.extensionUri,
            extensionId: EXTENSION_ID,
            app: editorService,
            icons: iconService,
            logger,
            notifier,
            createView: overrides.createView ?? ((panel) => new VsCodeViewPort(panel)),
        });
        const watcherController = new IconWatcherController(iconService, logger, notifier);

        activation.add(
            (overrides.registerEditor ?? registerEditor)(VIEW_TYPE, editorController, logger),
        );
        activation.add(
            (overrides.registerIconWatcher ?? registerIconWatcher)(watcherController, logger),
        );
    } catch (error) {
        logger?.error("Failed to activate the Domain Story Modeler", error);
        activation.dispose();
        throw error;
    }
}

function createIconHost(): IconHostPorts {
    const adapter = new VsCodeIconHost();
    return {
        workspaceFolders: adapter,
        files: adapter,
        textDocuments: adapter,
    };
}
