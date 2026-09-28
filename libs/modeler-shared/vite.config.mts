import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import dts from "vite-plugin-dts";

export default defineConfig({
    root: __dirname,
    cacheDir: "../../node_modules/.vite/libs/modeler-shared",
    plugins: [
        tsconfigPaths(),
        dts({
            outDir: "../../dist/libs/modeler-shared",
            entryRoot: "src",
        }),
    ],
    build: {
        outDir: "../../dist/libs/modeler-shared",
        reportCompressedSize: true,
        lib: {
            entry: "src/index.ts",
            name: "modeler-shared",
            fileName: "index",
            formats: ["es", "cjs"],
        },
    },
});
