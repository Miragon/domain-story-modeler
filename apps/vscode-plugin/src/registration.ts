import { DisposalScope, LoggerPort } from "@egon/modeler-core";
import { window } from "vscode";
import { IconWatcherController } from "./IconWatcherController";
import { WebviewController } from "./WebviewController";

export function registerEditor(
    viewType: string,
    controller: WebviewController,
    logger: LoggerPort,
): DisposalScope {
    const scope = new DisposalScope((error) =>
        logger.error("Failed to dispose editor registration", error),
    );
    scope.add(controller);

    try {
        scope.add(window.registerCustomEditorProvider(viewType, controller));
        return scope;
    } catch (error) {
        scope.dispose();
        throw error;
    }
}

export function registerIconWatcher(
    controller: IconWatcherController,
    logger: LoggerPort,
): DisposalScope {
    const scope = new DisposalScope((error) =>
        logger.error("Failed to dispose icon watcher registration", error),
    );

    try {
        controller.register(scope);
        return scope;
    } catch (error) {
        scope.dispose();
        throw error;
    }
}
