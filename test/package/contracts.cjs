const assert = require("node:assert/strict");
const { existsSync, readFileSync } = require("node:fs");
const path = require("node:path");
const yauzl = require("yauzl");

const root = path.resolve(__dirname, "../..");
const source = JSON.parse(readFileSync(path.join(root, "apps/vscode-plugin/package.json"), "utf8"));
const repository = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
const built = JSON.parse(readFileSync(path.join(root, "dist/apps/vscode-plugin/package.json"), "utf8"));
const vsix = path.join(root, "dist/egon-vscode-extension.vsix");
assert.ok(existsSync(vsix), "Run yarn package before the package contract");
function readArchive() {
    return new Promise((resolve, reject) => {
        yauzl.fromBuffer(readFileSync(vsix), { lazyEntries: true }, (error, archive) => {
            if (error) return reject(error);
            const entries = [];
            let shipped;
            archive.on("error", reject);
            archive.on("entry", (entry) => {
                entries.push(entry.fileName);
                if (entry.fileName !== "extension/package.json") return archive.readEntry();
                archive.openReadStream(entry, (streamError, stream) => {
                    if (streamError) return reject(streamError);
                    const chunks = [];
                    stream.on("error", reject);
                    stream.on("data", (chunk) => chunks.push(chunk));
                    stream.on("end", () => {
                        shipped = JSON.parse(Buffer.concat(chunks).toString("utf8"));
                        archive.readEntry();
                    });
                });
            });
            archive.on("end", () => resolve({ entries, shipped }));
            archive.readEntry();
        });
    });
}

readArchive().then(({ entries, shipped }) => {

for (const manifest of [source, built, shipped]) {
    assert.equal(manifest.publisher, "miragon-gmbh");
    assert.equal(manifest.version, source.version);
    assert.equal(manifest.engines.vscode, "^1.76.0");
    assert.equal(manifest.contributes.customEditors[0].id, "egon.io");
    assert.equal(manifest.contributes.customEditors[0].selector[0].filenamePattern, "*.egn");
}
assert.equal(source.publishName, "egon-vscode-extension");
assert.equal(source.version, repository.version);
assert.equal(built.name, source.publishName);
assert.equal(shipped.name, source.publishName);
assert.equal(shipped.main, "main.js");
assert.equal(shipped.dependencies, undefined);
assert.equal(shipped.devDependencies, undefined);
for (const required of ["main.js", "webview/index.js", "webview/index.css", "assets/style.css", "assets/egon-io-logo.png", "LICENSE.txt", "readme.md"]) {
    assert.ok(entries.includes(`extension/${required}`), `Missing packaged ${required}`);
}
for (const entry of entries) {
    assert.doesNotMatch(entry, /(?:node_modules|\.spec\.|\.test\.|src\/|dist\/apps\/|vscodeignore|webpack|tsconfig|\.map$)/, `Unexpected package entry ${entry}`);
}
console.log("Source manifest and VSIX contracts passed.");
}).catch((error) => { console.error(error); process.exitCode = 1; });
