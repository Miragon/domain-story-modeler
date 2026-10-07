const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const { JSDOM } = require("jsdom");

const root = path.resolve(__dirname, "../..");
const extensionArtifact = path.join(root, "dist/apps/vscode-plugin/main.js");
const webviewArtifact = path.join(
    root,
    "dist/apps/vscode-plugin/webview/index.js",
);

const story = JSON.stringify({
    iconSet: { name: "default", actors: {}, workObjects: {} },
    domainStory: {
        businessObjects: [],
        title: "",
        description: "",
        version: "4.0.0",
    },
});
const updatedStory = story.replace('"title":""', '"title":"Updated"');

function disposable() {
    return { dispose() {} };
}

async function eventually(check, label) {
    for (let attempt = 0; attempt < 100; attempt++) {
        if (check()) return;
        await new Promise((resolve) => setTimeout(resolve, 5));
    }
    assert.fail(`Timed out waiting for ${label}`);
}

async function testExtensionArtifact() {
    const documentListeners = [];
    const vscode = {
        workspace: {
            onDidChangeTextDocument(listener) {
                documentListeners.push(listener);
                return disposable();
            },
            getWorkspaceFolder() {
                return undefined;
            },
            findFiles: async () => [],
            openTextDocument: async () => ({ getText: () => story }),
            applyEdit: async () => true,
            fs: {
                readFile: async () => new Uint8Array(),
                writeFile: async () => {},
                isWritableFileSystem: () => true,
                stat: async () => ({ permissions: 0 }),
            },
        },
        window: {
            createOutputChannel: () => ({ appendLine() {}, dispose() {} }),
            registerCustomEditorProvider: () => disposable(),
            showErrorMessage() {},
            showWarningMessage() {},
        },
        Uri: {
            file: (value) => ({
                path: value,
                fsPath: value,
                toString: () => value,
            }),
            parse: (value) => ({
                scheme: value.split(":")[0],
                path: value,
                fsPath: value,
                toString: () => value,
            }),
            joinPath: (base, ...parts) => ({
                path: [base.path, ...parts].join("/"),
                toString() {
                    return this.path;
                },
            }),
        },
        RelativePattern: function RelativePattern(base, pattern) {
            this.base = base;
            this.pattern = pattern;
        },
        Range: function Range() {},
        Position: function Position() {},
        FilePermission: { Readonly: 1 },
        WorkspaceEdit: function WorkspaceEdit() {
            this.replace = () => {};
        },
    };

    const originalLoad = Module._load;
    Module._load = function load(request, parent, isMain) {
        if (request === "vscode") return vscode;
        return originalLoad.call(this, request, parent, isMain);
    };
    let extension;
    try {
        delete require.cache[extensionArtifact];
        extension = require(extensionArtifact);
    } finally {
        Module._load = originalLoad;
    }

    let controller;
    const errors = [];
    const debug = [];
    const writes = [];
    const context = {
        extensionUri: { path: "/extension" },
        subscriptions: [],
    };
    extension.activate(context, {
        logger: {
            debug: (message) => debug.push(message),
            error: (message, error) => errors.push([message, error]),
        },
        notifier: { warning() {}, error() {} },
        documentPort: {
            read: async () => ({ text: story, version: 1 }),
            write: async (documentId, text) => {
                writes.push([documentId, text]);
                return { status: "applied", snapshot: { text, version: 2 } };
            },
        },
        iconHost: {
            workspaceFolders: { getWorkspaceFolder: () => undefined },
            files: {
                findFiles: async () => [],
                readFile: async () => story,
                writeFile: async () => {},
            },
            textDocuments: { readTextDocument: async () => story },
        },
        registerEditor: (_viewType, registered) => {
            controller = registered;
            return disposable();
        },
        registerIconWatcher: () => disposable(),
    });
    assert.ok(
        controller,
        "minified extension registered its editor controller",
    );

    const messages = [];
    const posted = [];
    const disposals = [];
    const panel = {
        webview: {
            options: {},
            onDidReceiveMessage(listener) {
                messages.push(listener);
                return disposable();
            },
            postMessage(message) {
                posted.push(message);
                return Promise.resolve(true);
            },
            asWebviewUri: (uri) => uri,
            set html(value) {
                this.renderedHtml = value;
            },
        },
        onDidDispose(listener) {
            disposals.push(listener);
            return disposable();
        },
    };
    const document = {
        uri: { scheme: "file", path: "/artifact.egn", toString: () => "file:///artifact.egn" },
        version: 1,
        getText: () => story,
    };
    await controller.resolveCustomTextEditor(document, panel);

    messages[0]({ type: "InitializeWebviewCommand" });
    await eventually(() => posted.length === 1, "typed display response");
    assert.deepEqual(posted[0], {
        type: "DisplayDomainStoryCommand",
        sessionId: "session-1",
        text: story,
        documentRevision: 0,
    });

    messages[0]({
        type: "SyncDocumentCommand",
        sessionId: "session-1",
        text: updatedStory,
        documentRevision: 0,
        requestId: 1,
    });
    await eventually(() => writes.length === 1, "typed synchronization");
    assert.deepEqual(writes[0], ["file:///artifact.egn", updatedStory]);

    messages[0]({
        type: "SyncDocumentCommand",
        sessionId: "/spoofed:1",
        text: updatedStory,
        documentRevision: 1,
        requestId: 2,
    });
    await eventually(
        () =>
            errors.some(
                ([message]) =>
                    message === "Failed to process a webview message",
            ),
        "spoof rejection",
    );
    assert.equal(writes.length, 1);

    messages[0]({
        type: "SyncDocumentCommand",
        sessionId: "session-1",
        text: "not json",
        documentRevision: 1,
        requestId: 3,
    });
    assert.equal(writes.length, 1);
    assert.ok(
        errors.some(
            ([message]) => message === "Rejected invalid webview message",
        ),
        "malformed synchronization reached diagnostics",
    );

    messages[0]({ type: "LogDebugCommand", message: "artifact debug" });
    messages[0]({
        type: "LogErrorCommand",
        message: "artifact error",
        stack: "serialized stack",
    });
    await eventually(
        () => debug.includes("artifact debug"),
        "typed diagnostics",
    );
    assert.ok(
        errors.some(
            ([message, detail]) =>
                message === "artifact error" && detail === "serialized stack",
        ),
    );

    disposals[0]();
    messages[0]({
        type: "SyncDocumentCommand",
        sessionId: "session-1",
        text: updatedStory,
        documentRevision: 1,
        requestId: 4,
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(writes.length, 1);
}

async function testWebviewArtifact() {
    const source = fs.readFileSync(webviewArtifact, "utf8");
    const executable = source.replace(/export\{[^}]*\};?\s*$/, "");
    assert.notEqual(
        executable,
        source,
        "webview artifact has a removable ESM export",
    );

    const dom = new JSDOM('<div id="egon-io-container"></div>', {
        runScripts: "outside-only",
        url: "https://artifact.test/",
    });
    let state;
    const posted = [];
    dom.window.fetch = async () => ({ ok: true });
    dom.window.acquireVsCodeApi = () => ({
        getState: () => state,
        setState(next) {
            state = { ...next };
            return state;
        },
        postMessage(message) {
            posted.push(message);
        },
    });

    dom.window.eval(executable);
    dom.window.onload(new dom.window.Event("load"));
    assert.ok(
        posted.some((message) => message.type === "InitializeWebviewCommand"),
        "minified webview posted typed initialization",
    );
    assert.deepEqual(state, { editorId: "", viewbox: undefined });

    dom.window.dispatchEvent(
        new dom.window.MessageEvent("message", {
            data: {
                type: "DisplayDomainStoryCommand",
                sessionId: "artifact-session",
                text: "not json",
                documentRevision: 0,
            },
        }),
    );
    await eventually(
        () => posted.some((message) => message.type === "LogErrorCommand"),
        "invalid display diagnostics",
    );
    assert.equal(state.editorId, "");

    dom.window.dispatchEvent(
        new dom.window.MessageEvent("message", {
            data: {
                type: "DisplayDomainStoryCommand",
                sessionId: "artifact-session",
                text: "",
                documentRevision: 0,
            },
        }),
    );
    await eventually(
        () => state.editorId === "artifact-session",
        "display session establishment",
    );

    dom.window.dispatchEvent(
        new dom.window.MessageEvent("message", {
            data: {
                type: "DisplayDomainStoryCommand",
                sessionId: "other-session",
                text: "",
                documentRevision: 1,
            },
        }),
    );
    await eventually(
        () =>
            posted.some(
                (message) =>
                    message.type === "LogErrorCommand" &&
                    message.message.includes("Editor ID mismatch"),
            ),
        "display session mismatch diagnostics",
    );
    assert.equal(state.editorId, "artifact-session");
    dom.window.close();
}

(async () => {
    assert.ok(
        fs.existsSync(extensionArtifact),
        "run yarn build before artifact tests",
    );
    assert.ok(
        fs.existsSync(webviewArtifact),
        "run yarn build before artifact tests",
    );
    await testExtensionArtifact();
    await testWebviewArtifact();
    process.stdout.write("Production protocol artifact tests passed.\n");
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
