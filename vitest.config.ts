import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        projects: [
            "apps/dst-plugin/vitest.config.ts",
            "apps/dst-webview/vitest.config.ts",
            "libs/vscode/domain-story/vitest.config.ts",
            "libs/vscode/data-transfer-objects/vitest.config.ts",
        ],
        coverage: {
            provider: "v8",
            reportsDirectory: "./coverage",
            reporter: ["text", "html", "lcov", "clover", "json"],
            include: [
                "apps/dst-plugin/src/**/*.ts",
                "apps/dst-webview/src/**/*.ts",
                "libs/vscode/domain-story/src/**/*.ts",
                "libs/vscode/data-transfer-objects/src/**/*.ts",
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
