import { ReportWebviewIssueCommand } from "@egon/modeler-shared";
import { commands, Uri, window } from "vscode";

export type WebviewIssueAction = "retry" | "openAsText" | "acceptRepairs";

export interface WebviewInteractionPort {
  chooseAction(
    issue: ReportWebviewIssueCommand,
  ): Promise<WebviewIssueAction | undefined>;
  openAsText(documentId: string): Promise<void>;
}

/** Actionable VS Code notifications kept separate from output-channel logging. */
export class VsCodeWebviewInteraction implements WebviewInteractionPort {
  async chooseAction(
    issue: ReportWebviewIssueCommand,
  ): Promise<WebviewIssueAction | undefined> {
    if (issue.kind === "repair") {
      const details = issue.removedConnectionIds?.length
        ? ` Removed connections: ${issue.removedConnectionIds.join(", ")}.`
        : "";
      const selected = await window.showWarningMessage(
        `${issue.message}${details}`,
        "Accept Repairs",
        "Open as Text",
      );
      if (selected === "Accept Repairs") return "acceptRepairs";
      if (selected === "Open as Text") return "openAsText";
      return undefined;
    }

    const selected = await window.showErrorMessage(
      issue.message,
      "Retry",
      "Open as Text",
    );
    if (selected === "Retry") return "retry";
    if (selected === "Open as Text") return "openAsText";
    return undefined;
  }

  async openAsText(documentId: string): Promise<void> {
    await commands.executeCommand(
      "vscode.openWith",
      Uri.parse(documentId),
      "default",
    );
  }
}
