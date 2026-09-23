import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        name: "egon-modeler-plugin",
        environment: "node",
        include: ["src/**/*.{spec,test}.ts"],
        alias: {
            "@egon/data-transfer-objects": resolve(
                __dirname,
                "../../libs/vscode/data-transfer-objects/src/index.ts",
            ),
            "@egon/domain-story": resolve(
                __dirname,
                "../../libs/vscode/domain-story/src/index.ts",
            ),
            vscode: resolve(__dirname, "../../test/mocks/vscode.ts"),
        },
    },
});
