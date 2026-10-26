const { execFileSync } = require("node:child_process");
const { createWriteStream, existsSync, mkdirSync, mkdtempSync, writeFileSync } = require("node:fs");
const { tmpdir } = require("node:os");
const path = require("node:path");
const { downloadAndUnzipVSCode, resolveCliPathFromVSCodeExecutablePath, runTests } = require("@vscode/test-electron");

const root = path.resolve(__dirname, "../..");
const vsix = path.join(root, "dist/egon-vscode-extension.vsix");
const suite = path.join(root, "dist/test/extension/suite.js");
if (!existsSync(vsix) || !existsSync(suite)) throw new Error("Run yarn build, yarn package, and yarn build:extension-tests first");

(async () => {
    const isolated = mkdtempSync(path.join(tmpdir(), "egon-extension-test-"));
    const extensions = path.join(isolated, "extensions");
    const userData = path.join(isolated, "user-data");
    const workspace = path.join(isolated, "workspace");
    const diagnostics = path.join(root, ".context", "extension-diagnostics");
    for (const directory of [extensions, userData, workspace, diagnostics]) mkdirSync(directory, { recursive: true });
    for (const category of ["actors", "work-objects"]) mkdirSync(path.join(workspace, ".egon/icons", category), { recursive: true });
    mkdirSync(path.join(userData, "User"), { recursive: true });
    writeFileSync(path.join(userData, "User/settings.json"), JSON.stringify({ "extensions.autoUpdate": false, "workbench.startupEditor": "none" }));
    const executable = await downloadAndUnzipVSCode("1.100.3");
    execFileSync(resolveCliPathFromVSCodeExecutablePath(executable), ["--install-extension", vsix, "--extensions-dir", extensions, "--user-data-dir", userData, "--force"], { stdio: "inherit" });
    const stdout = createWriteStream(path.join(diagnostics, "extension-host.stdout.log"));
    const stderr = createWriteStream(path.join(diagnostics, "extension-host.stderr.log"));
    try {
        await runTests({
            vscodeExecutablePath: executable,
            extensionDevelopmentPath: path.join(__dirname, "driver"),
            extensionTestsPath: suite,
            extensionTestsEnv: { EGON_TEST_WORKSPACE: workspace, EGON_TEST_DIAGNOSTICS: diagnostics, EGON_TEST_EXTENSIONS: extensions, EGON_TEST_CASE: process.env.EGON_TEST_CASE },
            launchArgs: [workspace, `--extensions-dir=${extensions}`, `--user-data-dir=${userData}`, "--remote-debugging-port=9222", "--disable-workspace-trust", "--no-sandbox"],
            stdout: { write(chunk) { process.stdout.write(chunk); stdout.write(chunk); } },
            stderr: { write(chunk) { process.stderr.write(chunk); stderr.write(chunk); } },
        });
    } finally {
        stdout.end();
        stderr.end();
    }
})().catch((error) => { console.error(error); process.exitCode = 1; });
