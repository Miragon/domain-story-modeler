import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        name: "modeler-types",
        environment: "node",
        include: ["src/**/*.{spec,test}.ts"],
    },
});
