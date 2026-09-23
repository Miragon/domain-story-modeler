import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        name: "modeler-core",
        environment: "node",
        include: ["src/**/*.{spec,test}.ts"],
        setupFiles: ["src/test-setup.ts"],
        alias: {
            "@egon/modeler-core": resolve(__dirname, "src/index.ts"),
            "@egon/modeler-types": resolve(
                __dirname,
                "../modeler-types/src/index.ts",
            ),
        },
    },
});
