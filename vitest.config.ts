import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        projects: [
            "apps/vscode-plugin/vitest.config.ts",
            "apps/egn-webview/vitest.config.ts",
            "libs/modeler-core/vitest.config.ts",
            "libs/modeler-shared/vitest.config.ts",
            "libs/modeler-types/vitest.config.ts",
        ],
        coverage: {
            provider: "v8",
            reportsDirectory: "./coverage",
            reporter: ["text", "html", "lcov", "clover", "json"],
            include: [
                "apps/vscode-plugin/src/**/*.ts",
                "apps/egn-webview/src/**/*.ts",
                "libs/modeler-core/src/**/*.ts",
                "libs/modeler-shared/src/**/*.ts",
                "libs/modeler-types/src/**/*.ts",
            ],
            exclude: [
                "**/*.{spec,test}.ts",
                "**/test-setup.ts",
                "**/mocks/**",
                "**/mock.ts",
                "**/*.d.ts",
                "**/generated/**",
            ],
        },
    },
});
