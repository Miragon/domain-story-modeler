import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const sourceRoot = dirname(fileURLToPath(import.meta.url));

function productionTypeScriptFiles(directory: string): string[] {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) return productionTypeScriptFiles(path);
        if (!entry.name.endsWith(".ts") || entry.name.endsWith(".spec.ts")) {
            return [];
        }
        return [path];
    });
}

describe("modeler-core architecture", () => {
    it("contains no VS Code imports", () => {
        const offenders = productionTypeScriptFiles(sourceRoot).filter((path) =>
            /(?:from\s+|import\s*\()["']vscode["']/.test(readFileSync(path, "utf8")),
        );

        expect(offenders).toEqual([]);
    });

    it("contains no host-adapter or runtime DI imports", () => {
        const forbidden = [
            /(?:from\s+|import\s*\()["'][^"']*apps\/vscode-plugin/,
            /(?:from\s+|import\s*\()["'][^"']*VsCode/,
            /(?:from\s+|import\s*\()["'](?:tsyringe|reflect-metadata)["']/,
        ];
        const offenders = productionTypeScriptFiles(sourceRoot).filter((path) =>
            forbidden.some((pattern) => pattern.test(readFileSync(path, "utf8"))),
        );

        expect(offenders).toEqual([]);
    });
});
