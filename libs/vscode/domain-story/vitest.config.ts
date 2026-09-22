import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        name: "domain-story",
        environment: "node",
        include: ["src/**/*.{spec,test}.ts"],
        setupFiles: ["src/test-setup.ts"],
        alias: {
            "@egon/data-transfer-objects": resolve(
                __dirname,
                "../data-transfer-objects/src/index.ts",
            ),
            "@egon/domain-story": resolve(__dirname, "src/index.ts"),
            vscode: resolve(__dirname, "../../../test/mocks/vscode.ts"),
        },
    },
});
