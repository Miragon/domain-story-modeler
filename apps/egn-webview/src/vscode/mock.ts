import {
  HostToWebviewMessage,
  MockHostApi,
  WebviewState,
  WebviewToHostMessage,
} from "@egon/modeler-shared";
import { createEmptyStory } from "@egon/modeler-types";

const STORAGE_KEY = "egon.preview.webviewState";

export class VsCodeMock extends MockHostApi<
  WebviewState,
  WebviewToHostMessage
> {
  private storyText = JSON.stringify(createEmptyStory());

  constructor() {
    super();
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) this.state = JSON.parse(saved) as WebviewState;
    } catch {
      // Invalid preview state is normalized by the lifecycle.
    }
  }

  override setState(state: WebviewState): void {
    super.setState(state);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  postMessage(message: WebviewToHostMessage): void {
    switch (message.type) {
      case "InitializeWebviewCommand":
        this.dispatch({
          type: "DisplayDomainStoryCommand",
          sessionId: "preview",
          text: this.storyText,
          documentRevision: 0,
        });
        break;
      case "SyncDocumentCommand":
        this.storyText = message.text;
        console.debug("[DEBUG] Preview synchronized story", message.text);
        this.dispatch({
          type: "SyncDocumentResultCommand",
          sessionId: message.sessionId,
          requestId: message.requestId,
          documentRevision: message.documentRevision + 1,
          status: "applied",
        });
        break;
      case "ReportWebviewIssueCommand": {
        const repair = message.kind === "repair";
        const choice = window.prompt(
          `${message.message}\n\nEnter ${repair ? '"accept"' : '"retry"'}, "text", or Cancel to dismiss.`,
        );
        if (choice?.toLowerCase() === "text") {
          this.openAsText();
        } else if (choice?.toLowerCase() === (repair ? "accept" : "retry")) {
          this.dispatch({
            type: "ResolveWebviewIssueCommand",
            sessionId: message.sessionId,
            documentRevision: message.documentRevision,
            issueToken: message.issueToken,
            decision: repair ? "acceptRepairs" : "retry",
          });
        }
        break;
      }
      case "LogDebugCommand":
        console.debug(message.message);
        break;
      case "LogErrorCommand":
        console.error(message.message, message.stack ?? "");
        break;
      case "DocumentFlushedCommand":
        console.debug("[DEBUG] Reserved flush response", message);
        break;
    }
  }

  private dispatch(message: HostToWebviewMessage): void {
    window.dispatchEvent(new MessageEvent("message", { data: message }));
  }

  private openAsText(): void {
    const textView = window.open("", "_blank");
    if (!textView) return;
    textView.document.title = "Domain story source";
    const source = textView.document.createElement("pre");
    source.textContent = this.storyText;
    textView.document.body.replaceChildren(source);
  }
}
