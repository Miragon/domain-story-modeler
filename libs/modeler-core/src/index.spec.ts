import { describe, expect, it } from "vitest";
import * as core from "./index";

describe("@egon/modeler-core entrypoint", () => {
    it("exports host-independent services, domain models, and ports", () => {
        expect(core.DomainStoryEditorService).toBeTypeOf("function");
        expect(core.EditorSession).toBeTypeOf("function");
        expect(core.StoryIcons).toBeTypeOf("function");
        expect(core.ApplyIconChange).toBeTypeOf("function");
    });

    it("does not export VS Code adapters", () => {
        expect(core).not.toHaveProperty("VsCodeDocumentPort");
        expect(core).not.toHaveProperty("VsCodeViewPort");
    });
});
