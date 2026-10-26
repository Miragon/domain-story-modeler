import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { analyzeArchitecture } from "../../../test/architecture/importGraph";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

describe("production architecture", () => {
    it("resolves real workspace edges and enforces all boundaries", () => {
        const result = analyzeArchitecture(root);
        expect(result.edges.some((edge) => edge.specifier === "@egon/modeler-shared")).toBe(true);
        expect(result.edges.some((edge) => edge.specifier === "@egon/modeler-types")).toBe(true);
        expect(result.edges.length).toBeGreaterThan(30);
        expect(result.errors).toEqual([]);
    });

    it.each([
        ["workspace direction", "libs/modeler-types/src/bad.ts", 'import "@egon/modeler-core";', "cannot depend"],
        ["relative crossing", "libs/modeler-core/src/bad.ts", 'import "../../modeler-types/src/index";', "without its package entrypoint"],
        ["deep package import", "apps/egn-webview/src/bad.ts", 'import "@egon/modeler-types/src/index";', "deep imports"],
        ["app dependency", "apps/egn-webview/src/bad.ts", 'import "../../vscode-plugin/src/index";', "cannot depend"],
        ["unresolved internal", "libs/modeler-core/src/bad.ts", 'import "./missing";', "unresolved internal"],
        ["Node import", "libs/modeler-shared/src/bad.ts", 'import "node:fs";', "imports host module"],
        ["VS Code import", "apps/egn-webview/src/bad.ts", 'import "vscode";', "imports host module"],
        ["runtime DI", "libs/modeler-core/src/bad.ts", 'import "tsyringe";', "imports host module"],
        ["domain layer", "libs/modeler-core/src/shared/domain/bad.ts", 'import "../service/target";', "domain reaches service"],
        ["service layer", "libs/modeler-core/src/shared/service/bad.ts", 'import "../infrastructure/target";', "service reaches infrastructure"],
        ["plugin domain", "apps/vscode-plugin/src/domain/bad.ts", 'import "vscode";', "inside domain"],
        ["type import", "libs/modeler-shared/src/bad.ts", 'type Bad = import("@egon/modeler-core").Bad;', "cannot depend"],
        ["side effect import", "libs/modeler-types/src/bad.ts", 'import "@egon/modeler-shared";', "cannot depend"],
        ["dynamic import", "libs/modeler-types/src/bad.ts", 'void import("@egon/modeler-shared");', "cannot depend"],
        ["require", "libs/modeler-types/src/bad.ts", 'require("@egon/modeler-shared");', "cannot depend"],
    ])("rejects %s", (_case, file, source, message) => {
        withFixture({ [file]: source }, (fixtureRoot) => {
            const result = analyzeArchitecture(fixtureRoot);
            expect(result.edges.length).toBeGreaterThan(0);
            expect(result.errors.join("\n")).toContain(message);
        });
    });

    it("detects barrel indirection and file cycles", () => {
        withFixture({
            "libs/modeler-types/src/index.ts": 'export * from "./barrel";',
            "libs/modeler-types/src/barrel.ts": 'import "node:fs"; export * from "./index";',
            "apps/egn-webview/src/bad.ts": 'import "@egon/modeler-types";',
        }, (fixtureRoot) => {
            const result = analyzeArchitecture(fixtureRoot);
            expect(result.edges.length).toBeGreaterThanOrEqual(3);
            expect(result.errors.join("\n")).toContain("transitively reaches host module node:fs");
            expect(result.errors.join("\n")).toContain("import cycle");
        });
    });

    it("detects workspace cycles through named entrypoints", () => {
        withFixture({
            "libs/modeler-types/src/index.ts": 'import "@egon/modeler-shared";',
            "libs/modeler-shared/src/index.ts": 'import "@egon/modeler-types";',
        }, (fixtureRoot) => {
            const result = analyzeArchitecture(fixtureRoot);
            expect(result.edges.some((edge) => edge.specifier === "@egon/modeler-types")).toBe(true);
            expect(result.errors.join("\n")).toContain("import cycle");
        });
    });

    it("rejects a domain import hidden behind a barrel", () => {
        withFixture({
            "libs/modeler-core/src/shared/domain/bad.ts": 'import "../../barrel";',
            "libs/modeler-core/src/barrel.ts": 'export * from "./shared/service/target";',
        }, (fixtureRoot) => {
            const result = analyzeArchitecture(fixtureRoot);
            expect(result.edges.length).toBeGreaterThanOrEqual(3);
            expect(result.errors.join("\n")).toContain("transitively reaches service");
        });
    });
});

function withFixture(files: Record<string, string>, run: (fixtureRoot: string) => void): void {
    const fixtureRoot = mkdtempSync(resolve(tmpdir(), "egon-architecture-"));
    try {
        writeFileSync(resolve(fixtureRoot, "tsconfig.base.json"), readFileSync(resolve(root, "tsconfig.base.json")));
        const sources = {
            "libs/modeler-types/src/index.ts": "export const types = true;",
            "libs/modeler-shared/src/index.ts": "export const shared = true;",
            "libs/modeler-core/src/index.ts": 'import "@egon/modeler-shared"; export const core = true;',
            "apps/vscode-plugin/src/index.ts": "export const plugin = true;",
            "apps/egn-webview/src/index.ts": "export const webview = true;",
            "libs/modeler-core/src/shared/service/target.ts": "export const service = true;",
            "libs/modeler-core/src/shared/infrastructure/target.ts": "export const infrastructure = true;",
            ...files,
        };
        for (const [file, source] of Object.entries(sources)) {
            const target = resolve(fixtureRoot, file);
            mkdirSync(dirname(target), { recursive: true });
            writeFileSync(target, source);
        }
        run(fixtureRoot);
    } finally {
        rmSync(fixtureRoot, { recursive: true, force: true });
    }
}
