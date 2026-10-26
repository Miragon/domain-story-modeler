import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import Mocha from "mocha";
import { chromium, Browser, Frame, Page } from "playwright";
import * as vscode from "vscode";

const workspace = process.env.EGON_TEST_WORKSPACE!;
const diagnostics = process.env.EGON_TEST_DIAGNOSTICS!;
const load = createRequire(__filename);
const validSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><circle cx="12" cy="12" r="9"/></svg>';
const emptyStory = (): { iconSet: { name: string; actors: Record<string, string>; workObjects: Record<string, string> }; domainStory: { businessObjects: object[]; title: string; description: string; version: string } } => load(path.resolve(__dirname, "../../libs/modeler-types/index.cjs")).createEmptyStory();

async function until<T>(label: string, check: () => Promise<T | undefined> | T | undefined, timeout = 15000): Promise<T> {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
        const value = await check();
        if (value) return value;
        await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error(`Timed out waiting for ${label}`);
}

function storyFile(name: string, story: object = emptyStory()): vscode.Uri {
    const file = path.join(workspace, name);
    writeFileSync(file, JSON.stringify(story, null, 2));
    return vscode.Uri.file(file);
}

async function openStory(uri: vscode.Uri, column = vscode.ViewColumn.Active): Promise<void> {
    await vscode.commands.executeCommand("vscode.openWith", uri, "egon.io", column);
}

async function canvasFrames(browser: Browser): Promise<Frame[]> {
    const frames = browser.contexts().flatMap((context) => context.pages()).flatMap((page) => page.frames());
    const ready: Frame[] = [];
    for (const frame of frames) {
        try {
            if (await frame.locator("#egon-io-container .djs-container").count()) ready.push(frame);
        } catch { /* A frame may detach while an editor closes. */ }
    }
    return ready;
}

async function canvas(browser: Browser): Promise<Frame> {
    return until("rendered Egon canvas", async () => (await canvasFrames(browser))[0]);
}

function nearMatrix(actual: string | null, expected: string): boolean {
    const numbers = (value: string): number[] => [...value.matchAll(/-?\d+(?:\.\d+)?/g)].map((match) => Number(match[0]));
    const left = numbers(actual ?? "");
    const right = numbers(expected);
    return left.length === 6 && right.length === 6 && left.every((value, index) => Math.abs(value - right[index]) < 0.002);
}

async function addActor(frame: Frame): Promise<void> {
    const palette = frame.locator('.djs-palette [data-action^="domainStory-actor"]').first();
    await palette.waitFor({ timeout: 10000 });
    const before = await frame.locator(".djs-element.djs-shape").count();
    await palette.click();
    const bounds = await frame.locator("#egon-io-container .djs-container").boundingBox();
    assert.ok(bounds, "Canvas must have bounds");
    await frame.page().mouse.click(bounds.x + bounds.width * 0.7, bounds.y + bounds.height * 0.7);
    await until("actor on canvas", async () => (await frame.locator(".djs-element.djs-shape").count()) > before || undefined);
}

async function replaceDocument(uri: vscode.Uri, text: string): Promise<void> {
    const document = await vscode.workspace.openTextDocument(uri);
    const edit = new vscode.WorkspaceEdit();
    edit.replace(uri, new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length)), text);
    assert.equal(await vscode.workspace.applyEdit(edit), true);
}

async function save(uri: vscode.Uri): Promise<void> {
    const document = await vscode.workspace.openTextDocument(uri);
    assert.equal(await document.save(), true);
}

export async function run(): Promise<void> {
    mkdirSync(diagnostics, { recursive: true });
    const browser = await until("VS Code debugging connection", async () => {
        try { return await chromium.connectOverCDP("http://127.0.0.1:9222"); } catch { return undefined; }
    }, 20000);
    const errors: string[] = [];
    for (const context of browser.contexts()) {
        context.on("page", (page) => attachErrors(page, errors));
        for (const page of context.pages()) attachErrors(page, errors);
    }
    const mocha = new Mocha({ timeout: 45000, reporter: "spec" });
    let caseNumber = 0;
    function scenario(name: string, test: () => Promise<void>): void {
        if (process.env.EGON_TEST_CASE && !name.includes(process.env.EGON_TEST_CASE)) return;
        mocha.suite.addTest(new Mocha.Test(name, async () => {
            const current = ++caseNumber;
            await vscode.commands.executeCommand("workbench.action.closeAllEditors");
            try {
                await test();
                assert.deepEqual(errors.filter((error) => !error.includes("net::ERR_ACCESS_DENIED")), [], "Browser errors");
            } catch (error) {
                const pages = browser.contexts().flatMap((context) => context.pages());
                for (const [index, page] of pages.entries()) {
                    try { await page.screenshot({ path: path.join(diagnostics, `failure-${current}-${index}.png`), fullPage: true }); } catch { /* Detached page. */ }
                }
                writeFileSync(path.join(diagnostics, `failure-${current}.txt`), `${name}\n${String(error)}\n${errors.join("\n")}`);
                throw error;
            } finally {
                await vscode.commands.executeCommand("workbench.action.closeAllEditors");
            }
        }));
    }

    scenario("runs the installed VSIX and saves a canvas edit across reopen", async () => {
        const extension = vscode.extensions.getExtension("miragon-gmbh.egon-vscode-extension");
        assert.ok(extension, "Packaged extension is installed");
        assert.ok(extension.extensionPath.startsWith(process.env.EGON_TEST_EXTENSIONS!), "Editor comes from installed VSIX");
        const uri = storyFile("canvas.egn");
        await openStory(uri);
        const frame = await canvas(browser);
        await addActor(frame);
        await until("canvas edit in open buffer", async () => JSON.parse((await vscode.workspace.openTextDocument(uri)).getText()).domainStory.businessObjects.length > 0 || undefined);
        await save(uri);
        await until("saved actor on disk", () => JSON.parse(readFileSync(uri.fsPath, "utf8")).domainStory.businessObjects.length > 0 || undefined);
        await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
        await openStory(uri);
        assert.ok(await (await canvas(browser)).locator(".djs-element.djs-shape").count() > 0);
    });

    scenario("synchronizes source changes, undo and redo, then saves", async () => {
        const uri = storyFile("source.egn");
        await openStory(uri);
        await canvas(browser);
        const updated = emptyStory();
        updated.domainStory.title = "Source edit";
        updated.iconSet.actors = { Custom: validSvg };
        await replaceDocument(uri, JSON.stringify(updated));
        await until("source update in palette", async () => (await canvas(browser)).locator('.djs-palette [data-action*="Custom"]').count().then((count) => count > 0 || undefined));
        await vscode.commands.executeCommand("undo");
        await until("undo in text buffer", async () => !(await vscode.workspace.openTextDocument(uri)).getText().includes("Source edit") || undefined);
        await vscode.commands.executeCommand("redo");
        await until("redo in text buffer", async () => (await vscode.workspace.openTextDocument(uri)).getText().includes("Source edit") || undefined);
        await save(uri);
        assert.equal(JSON.parse(readFileSync(uri.fsPath, "utf8")).domainStory.title, "Source edit");
    });

    scenario("isolates different stories and converges split editors", async () => {
        const first = storyFile("first.egn");
        const second = storyFile("second.egn");
        await openStory(first);
        await addActor(await canvas(browser));
        await until("first story edit in buffer", async () => JSON.parse((await vscode.workspace.openTextDocument(first)).getText()).domainStory.businessObjects.length === 1 || undefined);
        await openStory(second, vscode.ViewColumn.Beside);
        await until("two story canvases", async () => (await canvasFrames(browser)).length >= 2 || undefined);
        await openStory(first, vscode.ViewColumn.Three);
        const frames = await until("three story canvases", async () => {
            const found = await canvasFrames(browser);
            return found.length >= 3 ? found : undefined;
        });
        const firstFrames: Frame[] = [];
        for (const frame of frames) if (await frame.locator(".djs-element.djs-shape").count()) firstFrames.push(frame);
        assert.equal(firstFrames.length, 2, "Both first-story panels render the actor; the other story stays empty");
        await addActor(firstFrames[0]);
        await until("split editor convergence", async () => JSON.parse((await vscode.workspace.openTextDocument(first)).getText()).domainStory.businessObjects.length === 2 || undefined);
        await until("sibling canvas convergence", async () => (await firstFrames[1].locator(".djs-element.djs-shape").count()) >= 2 || undefined);
        assert.equal(JSON.parse((await vscode.workspace.openTextDocument(second)).getText()).domainStory.businessObjects.length, 0);
        await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
        const survivor = await until("remaining first-story panel", async () => {
            for (const frame of await canvasFrames(browser)) if ((await frame.locator(".djs-element.djs-shape").count()) >= 2) return frame;
            return undefined;
        });
        const continued = JSON.parse((await vscode.workspace.openTextDocument(first)).getText());
        continued.iconSet.actors.Remaining = validSvg;
        await replaceDocument(first, JSON.stringify(continued));
        await until("remaining panel stays synchronized", async () => (await survivor.locator('.djs-palette [data-action*="Remaining"]').count()) > 0 || undefined);
        assert.equal(JSON.parse((await vscode.workspace.openTextDocument(second)).getText()).domainStory.businessObjects.length, 0);
    });

    scenario("updates open icon buffers with undo and leaves closed files unchanged", async () => {
        const iconDirectory = path.join(workspace, ".egon/icons/actors");
        mkdirSync(iconDirectory, { recursive: true });
        const uri = storyFile("icons.egn");
        const closed = storyFile("closed.egn");
        await openStory(uri);
        await addActor(await canvas(browser));
        await until("unsaved canvas edit in open story", async () => JSON.parse((await vscode.workspace.openTextDocument(uri)).getText()).domainStory.businessObjects.length === 1 || undefined);
        const icon = path.join(iconDirectory, "Created.svg");
        writeFileSync(icon, validSvg);
        await until("created icon in open buffer", async () => (await vscode.workspace.openTextDocument(uri)).getText().includes("Created") || undefined);
        writeFileSync(icon, validSvg.replace("r=\"9\"", "r=\"7\""));
        await until("changed icon in open buffer", async () => JSON.parse((await vscode.workspace.openTextDocument(uri)).getText()).iconSet.actors.Created?.includes('r="7"') || undefined);
        rmSync(icon);
        await until("deleted icon from open buffer", async () => !(await vscode.workspace.openTextDocument(uri)).getText().includes("Created") || undefined);
        await vscode.commands.executeCommand("undo");
        await until("undoable icon edit", async () => (await vscode.workspace.openTextDocument(uri)).getText().includes("Created") || undefined);
        assert.equal(JSON.parse((await vscode.workspace.openTextDocument(uri)).getText()).domainStory.businessObjects.length, 1);
        assert.deepEqual(JSON.parse(readFileSync(closed.fsPath, "utf8")), emptyStory());
    });

    scenario("restores viewport after hiding and source reimport", async () => {
        const uri = storyFile("viewport.egn");
        await openStory(uri);
        const frame = await canvas(browser);
        const surface = frame.locator("#egon-io-container .djs-container");
        const before = await frame.locator("svg g.viewport").getAttribute("transform");
        await surface.hover();
        await frame.page().mouse.wheel(120, -300);
        const panned = await until("panned viewport", async () => {
            const value = await frame.locator("svg g.viewport").getAttribute("transform");
            return value !== before ? value ?? undefined : undefined;
        });
        await frame.page().keyboard.down("Control");
        await frame.page().mouse.wheel(0, -250);
        await frame.page().keyboard.up("Control");
        const changed = await until("zoomed viewport", async () => {
            const value = await frame.locator("svg g.viewport").getAttribute("transform");
            return value !== panned ? value ?? undefined : undefined;
        });
        const notes = vscode.Uri.file(path.join(workspace, "notes.txt"));
        writeFileSync(notes.fsPath, "Hide the Egon editor");
        await vscode.window.showTextDocument(notes, { viewColumn: vscode.ViewColumn.Active, preview: false });
        await until("editor hidden behind text document", () => vscode.window.tabGroups.activeTabGroup.activeTab?.label === "notes.txt" || undefined);
        await vscode.commands.executeCommand("workbench.action.previousEditor");
        const restored = await canvas(browser);
        try {
            await until("restored viewport", async () => nearMatrix(await restored.locator("svg g.viewport").getAttribute("transform"), changed) || undefined);
        } catch (error) {
            writeFileSync(path.join(diagnostics, "viewport-state.json"), JSON.stringify({ before, panned, changed, frames: await Promise.all((await canvasFrames(browser)).map(async (candidate) => ({ url: candidate.url(), transform: await candidate.locator("svg g.viewport").getAttribute("transform"), bounds: await candidate.locator("#egon-io-container").boundingBox() }))) }, null, 2));
            throw error;
        }
        const current = JSON.parse((await vscode.workspace.openTextDocument(uri)).getText());
        current.domainStory.title = "Reimport";
        await replaceDocument(uri, JSON.stringify(current));
        await until("viewport preserved across source reimport", async () => nearMatrix(await restored.locator("svg g.viewport").getAttribute("transform"), changed) || undefined);
    });

    scenario("imports a legacy story and reopens the saved EGN v4 document", async () => {
        const uri = storyFile("legacy.egn", { domain: { name: "legacy", actors: { Person: validSvg }, workObjects: {} }, dst: [] });
        await openStory(uri);
        const frame = await canvas(browser);
        await addActor(frame);
        await until("legacy canvas edit in open buffer", async () => (await vscode.workspace.openTextDocument(uri)).isDirty || undefined);
        await save(uri);
        await until("legacy converted to v4", () => JSON.parse(readFileSync(uri.fsPath, "utf8")).domainStory?.version === "4.0.0" || undefined);
        await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
        await openStory(uri);
        assert.ok(await (await canvas(browser)).locator(".djs-element.djs-shape").count() > 0);
    });

    try {
        const failures = await new Promise<number>((resolve) => mocha.run(resolve));
        if (failures) throw new Error(`${failures} packaged editor scenario(s) failed; see ${diagnostics}`);
    } finally {
        await browser.close();
    }
}

function attachErrors(page: Page, errors: string[]): void {
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
        if (message.type() === "error" && /vscode-webview|vscode-resource/.test(message.location().url)) errors.push(message.text());
    });
}
