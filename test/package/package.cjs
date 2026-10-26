const { execFileSync } = require("node:child_process");
const { existsSync, mkdirSync } = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const extension = path.join(root, "dist/apps/vscode-plugin");
const output = path.join(root, "dist/egon-vscode-extension.vsix");
if (!existsSync(path.join(extension, "main.js"))) throw new Error("Run yarn build before yarn package");
mkdirSync(path.dirname(output), { recursive: true });
execFileSync(process.execPath, [path.join(root, "node_modules/@vscode/vsce/vsce"), "package", "--out", output, "--no-dependencies"], { cwd: extension, stdio: "inherit" });
console.log(output);
