import { window, workspace } from "vscode";
import { LoggerPort } from "@egon/modeler-core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { IconWatcherController } from "./IconWatcherController";
import { WebviewController } from "./WebviewController";
import { registerEditor, registerIconWatcher } from "./registration";

const logger: LoggerPort = { debug: vi.fn(), error: vi.fn() };

describe("extension registrations", () => {
    beforeEach(() => vi.clearAllMocks());

    it("owns the provider and controller exactly once", () => {
        const providerDispose = vi.fn();
        const controllerDispose = vi.fn();
        vi.mocked(window.registerCustomEditorProvider).mockReturnValue({
            dispose: providerDispose,
        });

        const registration = registerEditor(
            "egon.io",
            { dispose: controllerDispose } as unknown as WebviewController,
            logger,
        );
        registration.dispose();
        registration.dispose();

        expect(providerDispose).toHaveBeenCalledOnce();
        expect(controllerDispose).toHaveBeenCalledOnce();
    });

    it("cleans up a controller when provider registration fails", () => {
        const controllerDispose = vi.fn();
        vi.mocked(window.registerCustomEditorProvider).mockImplementation(() => {
            throw new Error("registration failed");
        });

        expect(() =>
            registerEditor(
                "egon.io",
                { dispose: controllerDispose } as unknown as WebviewController,
                logger,
            ),
        ).toThrow("registration failed");
        expect(controllerDispose).toHaveBeenCalledOnce();
    });

    it("owns every watcher subscription and the watcher exactly once", () => {
        const disposals = Array.from({ length: 4 }, () => vi.fn());
        const watcher = {
            dispose: disposals[0],
            onDidCreate: vi.fn(() => ({ dispose: disposals[1] })),
            onDidChange: vi.fn(() => ({ dispose: disposals[2] })),
            onDidDelete: vi.fn(() => ({ dispose: disposals[3] })),
        };
        vi.mocked(workspace.createFileSystemWatcher).mockReturnValue(watcher as never);

        const registration = registerIconWatcher(
            { handle: vi.fn() } as unknown as IconWatcherController,
            logger,
        );
        registration.dispose();
        registration.dispose();

        for (const dispose of disposals) expect(dispose).toHaveBeenCalledOnce();
    });
});
