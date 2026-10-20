import {
  ErrorDiagnosticMessage,
  HostApi,
  HostToWebviewMessage,
  parseHostToWebviewMessage,
  WebviewState,
  WebviewToHostMessage,
} from "@egon/modeler-shared";

export type WebviewHost = HostApi<WebviewState, WebviewToHostMessage>;

export function errorDiagnostic(
  message: string,
  error?: unknown,
): ErrorDiagnosticMessage {
  const detail = error instanceof Error ? error : undefined;
  return {
    type: "LogErrorCommand",
    message: detail?.message ? `${message}: ${detail.message}` : message,
    ...(detail?.stack === undefined ? {} : { stack: detail.stack }),
  };
}

/** Registers transport parsing before the initialization handshake is sent. */
export function listenForHostMessages(
  host: WebviewHost,
  target: Window,
  receive: (message: HostToWebviewMessage) => void | Promise<void>,
): () => void {
  const listener = (event: MessageEvent<unknown>): void => {
    let message: HostToWebviewMessage;
    try {
      message = parseHostToWebviewMessage(event.data);
    } catch (error) {
      host.postMessage(
        errorDiagnostic("Rejected an invalid host message", error),
      );
      return;
    }
    void Promise.resolve(receive(message)).catch((error) =>
      host.postMessage(
        errorDiagnostic("Failed to process a host message", error),
      ),
    );
  };
  target.addEventListener("message", listener);
  return () => target.removeEventListener("message", listener);
}
