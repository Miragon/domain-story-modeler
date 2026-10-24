import { createEgonClient } from "./egonClient";
import { bootstrap, WebviewLifecycleHandle } from "./lifecycle";
import { getHostApi } from "./vscode/api";

let session: WebviewLifecycleHandle | undefined;

/** Composition entrypoint kept separate from the testable session lifecycle. */
export function start(): WebviewLifecycleHandle {
  session ??= bootstrap(getHostApi(), createEgonClient);
  return session;
}

window.addEventListener("load", start, { once: true });
window.addEventListener("pagehide", () => session?.dispose(), { once: true });
