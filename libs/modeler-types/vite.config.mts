import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
    root: __dirname,
    cacheDir: "../../node_modules/.vite/libs/modeler-types",
    plugins: [
        dts({
            outDir: "../../dist/libs/modeler-types",
            entryRoot: "src",
        }),
    ],
    build: {
        outDir: "../../dist/libs/modeler-types",
        reportCompressedSize: true,
        lib: {
            entry: "src/index.ts",
            name: "modeler-types",
            fileName: "index",
            formats: ["es", "cjs"],
        },
    },
});
