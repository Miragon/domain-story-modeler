import { describe, expect, it, vi } from "vitest";
import { WebviewMessageRouter } from "./WebviewMessageRouter";

type TestMessage =
    | { type: "known"; value: number }
    | { type: "unknown"; value: number };

describe("WebviewMessageRouter", () => {
    it("dispatches a registered handler with a narrowed message and context", async () => {
        const handler = vi.fn();
        const router = new WebviewMessageRouter<TestMessage, string>().on(
            "known",
            handler,
        );
        const message = { type: "known", value: 1 } as const;

        await router.dispatch(message, "session");

        expect(handler).toHaveBeenCalledWith(message, "session");
    });

    it("is a no-op for an unregistered type", async () => {
        const handler = vi.fn();
        const router = new WebviewMessageRouter<TestMessage, string>().on(
            "known",
            handler,
        );

        await router.dispatch({ type: "unknown", value: 1 }, "session");

        expect(handler).not.toHaveBeenCalled();
    });

    it("awaits multiple handlers in registration order", async () => {
        const calls: string[] = [];
        const router = new WebviewMessageRouter<TestMessage, string>()
            .on("known", async () => {
                await Promise.resolve();
                calls.push("first");
            })
            .on("known", () => calls.push("second"));

        await router.dispatch({ type: "known", value: 1 }, "session");

        expect(calls).toEqual(["first", "second"]);
    });

    it("stops dispatch and propagates a handler failure", async () => {
        const later = vi.fn();
        const error = new Error("failed");
        const router = new WebviewMessageRouter<TestMessage, string>()
            .on("known", () => {
                throw error;
            })
            .on("known", later);

        await expect(
            router.dispatch({ type: "known", value: 1 }, "session"),
        ).rejects.toBe(error);
        expect(later).not.toHaveBeenCalled();
    });
});
