import { commands, window } from "vscode";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { VsCodeWebviewInteraction } from "./VsCodeWebviewInteraction";

describe("VsCodeWebviewInteraction", () => {
  beforeEach(() => vi.clearAllMocks());

  it("offers retry and opening text for failures", async () => {
    vi.mocked(window.showErrorMessage).mockResolvedValue("Retry" as never);
    const interaction = new VsCodeWebviewInteraction();

    await expect(
      interaction.chooseAction({
        type: "ReportWebviewIssueCommand",
        sessionId: "session",
        documentRevision: 1,
        issueToken: "issue",
        kind: "import",
        message: "Import failed",
      }),
    ).resolves.toBe("retry");
    expect(window.showErrorMessage).toHaveBeenCalledWith(
      "Import failed",
      "Retry",
      "Open as Text",
    );
  });

  it("shows removed connections and maps repair acceptance", async () => {
    vi.mocked(window.showWarningMessage).mockResolvedValue(
      "Accept Repairs" as never,
    );
    const interaction = new VsCodeWebviewInteraction();

    await expect(
      interaction.chooseAction({
        type: "ReportWebviewIssueCommand",
        sessionId: "session",
        documentRevision: 1,
        issueToken: "issue",
        kind: "repair",
        message: "Story repaired.",
        removedConnectionIds: ["connection-1"],
      }),
    ).resolves.toBe("acceptRepairs");
    expect(window.showWarningMessage).toHaveBeenCalledWith(
      expect.stringContaining("connection-1"),
      "Accept Repairs",
      "Open as Text",
    );
  });

  it("opens the exact current document with the default text editor", async () => {
    const interaction = new VsCodeWebviewInteraction();
    await interaction.openAsText("file:///story.egn");
    expect(commands.executeCommand).toHaveBeenCalledWith(
      "vscode.openWith",
      expect.objectContaining({ path: "file:///story.egn" }),
      "default",
    );
  });
});
