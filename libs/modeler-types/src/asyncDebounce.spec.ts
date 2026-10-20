import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { asyncDebounce, serializeAsync } from "./asyncDebounce";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("asyncDebounce", () => {
  it("coalesces callers onto the latest invocation and shared result", async () => {
    const work = vi.fn().mockResolvedValue("done");
    const debounced = asyncDebounce(work, 100);
    const first = debounced("first");
    const second = debounced("second");

    await vi.advanceTimersByTimeAsync(100);

    expect(work).toHaveBeenCalledOnce();
    expect(work).toHaveBeenCalledWith("second");
    await expect(first).resolves.toBe("done");
    await expect(second).resolves.toBe("done");
  });

  it("does not let an older in-flight generation settle a newer one", async () => {
    const settlers = new Map<string, (value: string) => void>();
    const debounced = asyncDebounce(
      (key: string) =>
        new Promise<string>((resolve) => settlers.set(key, resolve)),
      100,
    );
    const first = debounced("first");
    await vi.advanceTimersByTimeAsync(100);
    const second = debounced("second");
    settlers.get("first")?.("old");
    await expect(first).resolves.toBe("old");
    expect(debounced.pending()).toBe(true);

    await vi.advanceTimersByTimeAsync(100);
    settlers.get("second")?.("new");
    await expect(second).resolves.toBe("new");
  });

  it("flush awaits work and cancel settles scheduled callers", async () => {
    let finish = (): void => undefined;
    const debounced = asyncDebounce(
      () => new Promise<void>((resolve) => (finish = resolve)),
      100,
    );
    void debounced();
    const flushing = debounced.flush();
    expect(debounced.pending()).toBe(true);
    finish();
    await flushing;
    expect(debounced.pending()).toBe(false);

    const canceled = debounced();
    debounced.cancel();
    await expect(canceled).resolves.toBeUndefined();
    expect(debounced.pending()).toBe(false);
  });
});

describe("serializeAsync", () => {
  it("continues in order after success and rejection", async () => {
    const order: string[] = [];
    const serialized = serializeAsync(async (value: string) => {
      order.push(value);
      if (value === "bad") throw new Error("bad");
      return value;
    });

    const first = serialized("bad").catch(() => undefined);
    const second = serialized("good");
    await Promise.all([first, second]);
    expect(order).toEqual(["bad", "good"]);
  });
});
