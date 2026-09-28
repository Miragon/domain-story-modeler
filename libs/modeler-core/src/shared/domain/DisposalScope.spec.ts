import { describe, expect, it, vi } from "vitest";
import { DisposalScope } from "./DisposalScope";

describe("DisposalScope", () => {
    it("disposes resources once in reverse acquisition order", () => {
        const calls: string[] = [];
        const scope = new DisposalScope();
        scope.add({ dispose: () => calls.push("first") });
        scope.add({ dispose: () => calls.push("second") });

        scope.dispose();
        scope.dispose();

        expect(calls).toEqual(["second", "first"]);
        expect(scope.isRetired).toBe(true);
    });

    it("immediately disposes resources added after retirement", () => {
        const dispose = vi.fn();
        const scope = new DisposalScope();
        scope.dispose();

        scope.add({ dispose });

        expect(dispose).toHaveBeenCalledOnce();
    });

    it("continues cleanup when a resource throws", () => {
        const dispose = vi.fn();
        const onError = vi.fn();
        const scope = new DisposalScope(onError);
        scope.add({ dispose });
        scope.add({
            dispose: () => {
                throw new Error("broken cleanup");
            },
        });

        scope.dispose();

        expect(onError).toHaveBeenCalledOnce();
        expect(dispose).toHaveBeenCalledOnce();
    });

    it("continues cleanup when error reporting also throws", () => {
        const dispose = vi.fn();
        const scope = new DisposalScope(() => {
            throw new Error("report failed");
        });
        scope.add({ dispose });
        scope.add({
            dispose: () => {
                throw new Error("cleanup failed");
            },
        });

        expect(() => scope.dispose()).not.toThrow();
        expect(dispose).toHaveBeenCalledOnce();
    });
});
