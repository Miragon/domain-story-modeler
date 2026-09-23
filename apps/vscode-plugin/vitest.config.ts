import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        name: "egon-modeler-plugin",
        environment: "node",
        include: ["src/**/*.{spec,test}.ts"],
        alias: {
            "@egon/modeler-core": resolve(
                __dirname,
                "../../libs/modeler-core/src/index.ts",
            ),
            "@egon/modeler-shared": resolve(
                __dirname,
                "../../libs/modeler-shared/src/index.ts",
            ),
            "@egon/modeler-types": resolve(
                __dirname,
                "../../libs/modeler-types/src/index.ts",
            ),
            vscode: resolve(__dirname, "../../test/mocks/vscode.ts"),
        },
    },
});
