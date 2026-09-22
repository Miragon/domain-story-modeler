import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        name: "data-transfer-objects",
        environment: "node",
        include: ["src/**/*.{spec,test}.ts"],
        alias: {
            "@egon/data-transfer-objects": resolve(__dirname, "src/index.ts"),
            "@egon/domain-story": resolve(__dirname, "../domain-story/src/index.ts"),
            vscode: resolve(__dirname, "../../../test/mocks/vscode.ts"),
        },
    },
});
