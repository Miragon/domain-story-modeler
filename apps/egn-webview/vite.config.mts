import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

export default defineConfig({
    root: __dirname,
    cacheDir: "../../node_modules/.vite/apps/egn-webview",
    server: {
        port: 4200,
        host: "localhost",
    },
    preview: {
        port: 4300,
        host: "localhost",
    },

    plugins: [tsconfigPaths()],

    esbuild: {
        minifyIdentifiers: false,
        keepNames: true,
    },

    build: {
        outDir: path.resolve(__dirname, "../../dist/apps/vscode-plugin/webview"),
        emptyOutDir: false,
        assetsInlineLimit: 20_000,
        reportCompressedSize: true,
        commonjsOptions: {
            transformMixedEsModules: true,
        },
        rollupOptions: {
            output: {
                entryFileNames: `[name].js`,
                assetFileNames: `[name].[ext]`,
            },
        },
    },
});
