import { resolve } from "node:path";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

export default defineConfig({
  root: __dirname,
  test: {
    name: "egon-modeler-webview-browser",
    include: ["src/**/*.browser.spec.ts"],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: "chromium" }],
    },
    alias: {
      "@egon/modeler-shared": resolve(
        __dirname,
        "../../libs/modeler-shared/src/index.ts",
      ),
      "@egon/modeler-types": resolve(
        __dirname,
        "../../libs/modeler-types/src/index.ts",
      ),
    },
  },
});
