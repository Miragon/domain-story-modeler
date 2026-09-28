interface HostBridge<T> {
    getState(): T | undefined;
    setState(state: T): T;
    postMessage(message: unknown): void;
}

declare function acquireVsCodeApi<T = unknown>(): HostBridge<T>;

export interface ViewportState {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
}

/** State persisted by both the production bridge and standalone preview. */
export interface WebviewState {
    editorId: string;
    viewbox: ViewportState | undefined;
}

export const defaultWebviewState = (): WebviewState => ({
    editorId: "",
    viewbox: undefined,
});

export interface HostApi<T, M> {
    getState(): T;
    setState(state: T): void;
    updateState(state: Partial<T>): void;
    postMessage(message: M): void;
}

export class MissingStateError extends Error {
    constructor() {
        super("State is missing.");
        this.name = "MissingStateError";
    }
}

let acquiredBridge: HostBridge<unknown> | undefined;

function acquireBridgeOnce<T>(): HostBridge<T> {
    acquiredBridge ??= acquireVsCodeApi<unknown>();
    return acquiredBridge as HostBridge<T>;
}

/** Production adapter for the host-injected VS Code-compatible bridge. */
export class HostApiImpl<T, M> implements HostApi<T, M> {
    constructor(
        private readonly host: HostBridge<T> = acquireBridgeOnce<T>(),
    ) {}

    getState(): T {
        const state = this.host.getState();
        if (state === undefined || state === null)
            throw new MissingStateError();
        return state;
    }

    setState(state: T): void {
        this.host.setState({ ...state });
    }

    updateState(state: Partial<T>): void {
        this.setState({ ...this.getState(), ...state });
    }

    postMessage(message: M): void {
        this.host.postMessage(message);
    }
}

/** Base for development previews using the same state contract as production. */
export abstract class MockHostApi<T, M> implements HostApi<T, M> {
    protected state: T | undefined;

    getState(): T {
        if (this.state === undefined || this.state === null)
            throw new MissingStateError();
        return this.state;
    }

    setState(state: T): void {
        this.state = { ...state };
    }

    updateState(state: Partial<T>): void {
        this.setState({ ...this.getState(), ...state });
    }

    abstract postMessage(message: M): void;
}
