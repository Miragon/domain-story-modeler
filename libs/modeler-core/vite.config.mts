import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import dts from "vite-plugin-dts";

export default defineConfig({
    root: __dirname,
    cacheDir: "../../node_modules/.vite/libs/modeler-core",
    plugins: [
        tsconfigPaths(),
        dts({
            outDir: "../../dist/libs/modeler-core",
            entryRoot: "src",
        }),
    ],
    build: {
        outDir: "../../dist/libs/modeler-core",
        reportCompressedSize: true,
        lib: {
            entry: "src/index.ts",
            name: "modeler-core",
            fileName: "index",
            formats: ["es", "cjs"],
        },
        rollupOptions: {
            external: ["@egon/modeler-types", "tsyringe"],
        },
    },
});
