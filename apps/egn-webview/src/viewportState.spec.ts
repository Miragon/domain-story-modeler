// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { WebviewState } from "@egon/modeler-shared";
import { WebviewHost } from "./communication";
import { ModelerClient } from "./egonClient";
import {
  isValidViewport,
  normalizeWebviewState,
  ViewportStateManager,
} from "./viewportState";

describe("viewport state", () => {
  it.each([
    undefined,
    null,
    {},
    { x: 0, y: 0, width: 0, height: 10 },
    { x: 0, y: 0, width: 10, height: -1 },
    { x: Number.NaN, y: 0, width: 10, height: 10 },
    { x: 0, y: Infinity, width: 10, height: 10 },
  ])("rejects unusable viewport state", (viewport) => {
    expect(isValidViewport(viewport)).toBe(false);
    expect(normalizeWebviewState({ editorId: 1, viewbox: viewport })).toEqual({
      editorId: "",
      viewbox: undefined,
    });
  });

  it("accepts finite coordinates and positive dimensions", () => {
    const viewport = { x: -20, y: 30, width: 640, height: 480 };
    expect(isValidViewport(viewport)).toBe(true);
    expect(
      normalizeWebviewState({ editorId: "session", viewbox: viewport }),
    ).toEqual({ editorId: "session", viewbox: viewport });
  });

  it("defers restoration while hidden and stops observing after success", () => {
    let state: WebviewState = {
      editorId: "session",
      viewbox: { x: 1, y: 2, width: 300, height: 200 },
    };
    const host = {
      getState: () => state,
      setState: (next: WebviewState) => (state = next),
      updateState: vi.fn(),
      postMessage: vi.fn(),
    } as WebviewHost;
    const client = {
      getViewport: vi.fn(() => state.viewbox),
      setViewport: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    } as unknown as ModelerClient;
    const container = document.createElement("div");
    let width = 0;
    let height = 0;
    Object.defineProperties(container, {
      clientWidth: { get: () => width },
      clientHeight: { get: () => height },
    });
    let resize!: ResizeObserverCallback;
    const disconnect = vi.fn();
    const observer = {
      observe: vi.fn(),
      disconnect,
    } as unknown as ResizeObserver;
    const manager = new ViewportStateManager(
      host,
      client,
      container,
      document,
      (callback) => {
        resize = callback;
        return observer;
      },
    );

    manager.restoreAfterFirstImport();
    expect(client.setViewport).not.toHaveBeenCalled();
    expect(observer.observe).toHaveBeenCalledWith(container);
    width = 800;
    height = 600;
    resize([], observer);
    expect(client.setViewport).toHaveBeenCalledWith(state.viewbox);
    expect(disconnect).toHaveBeenCalledOnce();
  });

  it("retains the client default when no valid saved viewport exists", () => {
    const host = {
      getState: () => ({ editorId: "", viewbox: undefined }),
      setState: vi.fn(),
      updateState: vi.fn(),
      postMessage: vi.fn(),
    } as WebviewHost;
    const client = {
      getViewport: vi.fn(),
      setViewport: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    } as unknown as ModelerClient;
    const manager = new ViewportStateManager(
      host,
      client,
      document.createElement("div"),
      document,
    );

    manager.restoreAfterFirstImport();
    expect(client.setViewport).not.toHaveBeenCalled();
  });

  it("captures the latest viewport when hidden and on disposal", () => {
    let state: WebviewState = { editorId: "session", viewbox: undefined };
    const host = {
      getState: () => state,
      setState: vi.fn((next: WebviewState) => (state = next)),
      updateState: vi.fn(),
      postMessage: vi.fn(),
    } as WebviewHost;
    const first = { x: 5, y: 6, width: 700, height: 500 };
    const latest = { x: 7, y: 8, width: 900, height: 600 };
    const client = {
      getViewport: vi.fn().mockReturnValueOnce(first).mockReturnValue(latest),
      setViewport: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    } as unknown as ModelerClient;
    const visibility = vi
      .spyOn(document, "visibilityState", "get")
      .mockReturnValue("hidden");
    const manager = new ViewportStateManager(
      host,
      client,
      document.createElement("div"),
      document,
    );
    const stop = manager.start();

    document.dispatchEvent(new Event("visibilitychange"));
    expect(state.viewbox).toEqual(first);
    stop();
    manager.dispose();
    expect(state.viewbox).toEqual(latest);
    expect(client.off).toHaveBeenCalledWith(
      "viewport.changed",
      expect.any(Function),
    );
    visibility.mockRestore();
  });
});
