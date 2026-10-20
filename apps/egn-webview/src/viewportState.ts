import {
  defaultWebviewState,
  ViewportState,
  WebviewState,
} from "@egon/modeler-shared";
import { ModelerClient } from "./egonClient";
import { WebviewHost } from "./communication";

export function isValidViewport(value: unknown): value is ViewportState {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const viewport = value as Record<string, unknown>;
  return (
    ["x", "y", "width", "height"].every(
      (key) =>
        typeof viewport[key] === "number" && Number.isFinite(viewport[key]),
    ) &&
    (viewport.width as number) > 0 &&
    (viewport.height as number) > 0
  );
}

export function normalizeWebviewState(value: unknown): WebviewState {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return defaultWebviewState();
  }
  const state = value as Record<string, unknown>;
  return {
    editorId: typeof state.editorId === "string" ? state.editorId : "",
    viewbox: isValidViewport(state.viewbox) ? { ...state.viewbox } : undefined,
  };
}

export class ViewportStateManager {
  private observer: ResizeObserver | undefined;
  private restored = false;
  private disposed = false;

  constructor(
    private readonly host: WebviewHost,
    private readonly client: ModelerClient,
    private readonly container: HTMLElement,
    private readonly page: Document,
    private readonly resizeObserverFactory: (
      callback: ResizeObserverCallback,
    ) => ResizeObserver | undefined = (callback) =>
      typeof ResizeObserver === "undefined"
        ? undefined
        : new ResizeObserver(callback),
  ) {}

  restoreAfterFirstImport(): void {
    if (this.restored || this.disposed) return;
    const saved = normalizeWebviewState(this.readState()).viewbox;
    if (!saved) {
      this.restored = true;
      return;
    }
    if (this.container.clientWidth > 0 && this.container.clientHeight > 0) {
      this.client.setViewport(saved);
      this.restored = true;
      this.stopObserving();
      return;
    }
    this.observer ??= this.resizeObserverFactory(() =>
      this.restoreAfterFirstImport(),
    );
    this.observer?.observe(this.container);
  }

  persist(viewport: unknown): void {
    if (!isValidViewport(viewport) || this.disposed) return;
    this.host.setState({
      ...normalizeWebviewState(this.readState()),
      viewbox: { ...viewport },
    });
  }

  capture(): ViewportState | undefined {
    try {
      const viewport = this.client.getViewport();
      return isValidViewport(viewport) ? { ...viewport } : undefined;
    } catch {
      return undefined;
    }
  }

  start(): () => void {
    const onViewport = (viewport: ViewportState): void =>
      this.persist(viewport);
    const onVisibility = (): void => {
      if (this.page.visibilityState === "hidden") {
        const viewport = this.capture();
        if (viewport) this.persist(viewport);
      }
    };
    this.client.on("viewport.changed", onViewport);
    this.page.addEventListener("visibilitychange", onVisibility);
    return () => {
      this.client.off("viewport.changed", onViewport);
      this.page.removeEventListener("visibilitychange", onVisibility);
    };
  }

  dispose(): void {
    if (this.disposed) return;
    try {
      const viewport = this.capture();
      if (viewport) this.persist(viewport);
    } finally {
      this.disposed = true;
      this.stopObserving();
    }
  }

  private readState(): unknown {
    try {
      return this.host.getState();
    } catch {
      return undefined;
    }
  }

  private stopObserving(): void {
    this.observer?.disconnect();
    this.observer = undefined;
  }
}
