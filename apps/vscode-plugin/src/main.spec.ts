import type { ExtensionContext, OutputChannel } from "vscode";
import { describe, expect, it, vi } from "vitest";
import { IconHostPorts, LoggerPort, NotifierPort } from "@egon/modeler-core";
import { activate } from "./main";

const logger: LoggerPort = { debug: vi.fn(), error: vi.fn() };
const notifier: NotifierPort = { warning: vi.fn(), error: vi.fn() };
const iconHost: IconHostPorts = {
    workspaceFolders: { getWorkspaceFolder: () => undefined },
    files: {
        findFiles: vi.fn(),
        readFile: vi.fn(),
        writeFile: vi.fn(),
    },
    textDocuments: { readTextDocument: vi.fn() },
};

function context(): ExtensionContext {
    return {
        extensionUri: { path: "/extension" },
        subscriptions: [],
    } as unknown as ExtensionContext;
}

describe("activation composition", () => {
    it("owns registrations through one repeat-safe activation scope", () => {
        const editorDispose = vi.fn();
        const watcherDispose = vi.fn();
        const extension = context();

        activate(extension, {
            logger,
            notifier,
            documentPort: { read: vi.fn(), write: vi.fn() },
            iconHost,
            registerEditor: () => ({ dispose: editorDispose }),
            registerIconWatcher: () => ({ dispose: watcherDispose }),
        });

        expect(extension.subscriptions).toHaveLength(1);
        extension.subscriptions[0].dispose();
        extension.subscriptions[0].dispose();
        expect(editorDispose).toHaveBeenCalledOnce();
        expect(watcherDispose).toHaveBeenCalledOnce();
    });

    it("cleans up partial activation when later registration fails", () => {
        const editorDispose = vi.fn();
        const extension = context();

        expect(() =>
            activate(extension, {
                logger,
                notifier,
                documentPort: { read: vi.fn(), write: vi.fn() },
                iconHost,
                registerEditor: () => ({ dispose: editorDispose }),
                registerIconWatcher: () => {
                    throw new Error("watcher failed");
                },
            }),
        ).toThrow("watcher failed");
        expect(editorDispose).toHaveBeenCalledOnce();
        extension.subscriptions[0].dispose();
        expect(editorDispose).toHaveBeenCalledOnce();
    });

    it("owns the single default output channel", () => {
        const outputDispose = vi.fn();
        const output = {
            appendLine: vi.fn(),
            dispose: outputDispose,
        } as unknown as OutputChannel;
        const extension = context();

        activate(extension, {
            createOutputChannel: () => output,
            notifier,
            documentPort: { read: vi.fn(), write: vi.fn() },
            iconHost,
            registerEditor: () => ({ dispose: vi.fn() }),
            registerIconWatcher: () => ({ dispose: vi.fn() }),
        });
        extension.subscriptions[0].dispose();

        expect(outputDispose).toHaveBeenCalledOnce();
    });
});
