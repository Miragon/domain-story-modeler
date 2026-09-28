import { DisposalScope, ICON_BASE_PATH, LoggerPort } from "@egon/modeler-core";
import { window, workspace } from "vscode";
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
        const watcher = scope.add(
            workspace.createFileSystemWatcher(`**/${ICON_BASE_PATH}/**/*.svg`),
        );
        scope.add(
            watcher.onDidCreate((uri) => {
                void controller.handle(uri.toString(), "create", scope);
            }),
        );
        scope.add(
            watcher.onDidChange((uri) => {
                void controller.handle(uri.toString(), "update", scope);
            }),
        );
        scope.add(
            watcher.onDidDelete((uri) => {
                void controller.handle(uri.toString(), "delete", scope);
            }),
        );
        return scope;
    } catch (error) {
        scope.dispose();
        throw error;
    }
}
