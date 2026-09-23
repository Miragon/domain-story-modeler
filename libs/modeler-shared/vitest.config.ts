import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        name: "modeler-shared",
        environment: "node",
        include: ["src/**/*.{spec,test}.ts"],
    },
});
