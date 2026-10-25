import { window } from "vscode";
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

    it("delegates watcher resources to the controller scope", () => {
        const dispose = vi.fn();
        const register = vi.fn((scope) => scope.add({ dispose }));
        const registration = registerIconWatcher(
            { register } as unknown as IconWatcherController,
            logger,
        );
        registration.dispose();
        registration.dispose();
        expect(register).toHaveBeenCalledOnce();
        expect(dispose).toHaveBeenCalledOnce();
    });
});
