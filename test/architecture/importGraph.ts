import { builtinModules } from "node:module";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import ts from "typescript";

export interface ImportEdge { readonly from: string; readonly to: string; readonly specifier: string }
export interface ArchitectureResult { readonly edges: readonly ImportEdge[]; readonly errors: readonly string[] }

const workspaces = [
    { name: "modeler-types", path: "libs/modeler-types", allowed: [] },
    { name: "modeler-shared", path: "libs/modeler-shared", allowed: [] },
    { name: "modeler-core", path: "libs/modeler-core", allowed: ["modeler-types", "modeler-shared"] },
    { name: "vscode-plugin", path: "apps/vscode-plugin", allowed: ["modeler-core", "modeler-shared"] },
    { name: "egn-webview", path: "apps/egn-webview", allowed: ["modeler-types", "modeler-shared"] },
] as const;
const builtins = new Set(builtinModules.map((name) => name.replace(/^node:/, "")));
const hostPackages = new Set(["vscode", "tsyringe", "reflect-metadata", "inversify", "typedi", "awilix"]);

function discover(directory: string): string[] {
    if (!existsSync(directory)) return [];
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        if (entry.name.startsWith(".") || ["node_modules", "dist", "fixtures", "generated", "__fixtures__"].includes(entry.name)) return [];
        const file = join(directory, entry.name);
        if (entry.isDirectory()) return discover(file);
        return /\.[cm]?tsx?$/.test(entry.name) && !/(?:\.spec|\.test|\.fixture|\.generated|\.d)\.[cm]?tsx?$/.test(entry.name) ? [file] : [];
    });
}

function imports(file: string): string[] {
    const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
    const names: string[] = [];
    function visit(node: ts.Node): void {
        if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) names.push(node.moduleSpecifier.text);
        if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference) && node.moduleReference.expression && ts.isStringLiteral(node.moduleReference.expression)) names.push(node.moduleReference.expression.text);
        if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument) && ts.isStringLiteral(node.argument.literal)) names.push(node.argument.literal.text);
        if (ts.isCallExpression(node) && node.arguments.length === 1 && ts.isStringLiteral(node.arguments[0]) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(node.expression) && node.expression.text === "require"))) names.push(node.arguments[0].text);
        ts.forEachChild(node, visit);
    }
    visit(source);
    return names;
}

function workspaceOf(root: string, file: string): typeof workspaces[number] | undefined {
    const path = relative(root, file).split(sep).join("/");
    return workspaces.find((workspace) => path.startsWith(`${workspace.path}/`));
}

function layer(file: string): "domain" | "service" | "infrastructure" | undefined {
    const parts = file.split(sep);
    if (parts.includes("domain")) return "domain";
    if (parts.includes("service")) return "service";
    if (parts.includes("infrastructure")) return "infrastructure";
    return undefined;
}

/** Resolve the same aliases and extensions as the workspace TypeScript builds. */
export function analyzeArchitecture(root: string): ArchitectureResult {
    const config = ts.readConfigFile(join(root, "tsconfig.base.json"), ts.sys.readFile);
    if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, "\n"));
    const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
    const options: ts.CompilerOptions = { ...parsed.options, baseUrl: root };
    const workspaceOptions = new Map<string, ts.CompilerOptions>();
    for (const workspace of workspaces) {
        const file = join(root, workspace.path, workspace.path.startsWith("apps/") ? "tsconfig.app.json" : "tsconfig.lib.json");
        if (!existsSync(file)) continue;
        const local = ts.readConfigFile(file, ts.sys.readFile);
        if (local.error) throw new Error(ts.flattenDiagnosticMessageText(local.error.messageText, "\n"));
        workspaceOptions.set(workspace.name, ts.parseJsonConfigFileContent(local.config, ts.sys, join(root, workspace.path), undefined, file).options);
    }
    const files = workspaces.flatMap((workspace) => discover(join(root, workspace.path, "src")));
    const edges: ImportEdge[] = [];
    const errors: string[] = [];
    const adjacency = new Map<string, string[]>();
    const hostImports = new Map<string, string[]>();

    for (const from of files) {
        const sourceWorkspace = workspaceOf(root, from)!;
        const targets: string[] = [];
        for (const specifier of imports(from)) {
            const packageName = specifier.match(/^@egon\/(modeler-(?:types|shared|core))(?:\/|$)/)?.[1];
            if (packageName && specifier !== `@egon/${packageName}`) errors.push(`${relative(root, from)} deep imports ${specifier}`);
            const moduleName = specifier.replace(/^node:/, "").split("/")[0];
            const hostImport = specifier.startsWith("node:") || builtins.has(specifier) || hostPackages.has(moduleName);
            if (hostImport) hostImports.set(from, [...(hostImports.get(from) ?? []), specifier]);
            if (sourceWorkspace.name !== "vscode-plugin" && hostImport) errors.push(`${relative(root, from)} imports host module ${specifier}`);
            if (sourceWorkspace.name === "vscode-plugin" && layer(from) && layer(from) !== "infrastructure" && hostImport) errors.push(`${relative(root, from)} imports host module ${specifier} inside ${layer(from)}`);
            const resolved = ts.resolveModuleName(specifier, from, workspaceOptions.get(sourceWorkspace.name) ?? options, ts.sys).resolvedModule?.resolvedFileName;
            if (!resolved) {
                if (specifier.startsWith(".") || specifier.startsWith("@egon/") || isAbsolute(specifier)) errors.push(`${relative(root, from)} has unresolved internal import ${specifier}`);
                continue;
            }
            const to = resolve(resolved);
            const targetWorkspace = workspaceOf(root, to);
            if (!targetWorkspace) continue;
            edges.push({ from, to, specifier });
            targets.push(to);
            if (targetWorkspace.name !== sourceWorkspace.name) {
                if (!(sourceWorkspace.allowed as readonly string[]).includes(targetWorkspace.name)) errors.push(`${relative(root, from)} cannot depend on ${targetWorkspace.name}`);
                if (specifier !== `@egon/${targetWorkspace.name}`) errors.push(`${relative(root, from)} crosses into ${targetWorkspace.name} without its package entrypoint: ${specifier}`);
            }
            if (targetWorkspace.name === sourceWorkspace.name && ["modeler-core", "vscode-plugin"].includes(sourceWorkspace.name)) {
                const fromLayer = layer(from);
                const toLayer = layer(to);
                if ((fromLayer === "domain" && (toLayer === "service" || toLayer === "infrastructure")) || (fromLayer === "service" && toLayer === "infrastructure")) errors.push(`${relative(root, from)} ${fromLayer} reaches ${toLayer}: ${relative(root, to)}`);
            }
        }
        adjacency.set(from, targets);
    }

    // Reachability catches host code reached through a workspace barrel or alias.
    for (const from of files) {
        if (workspaceOf(root, from)?.name === "vscode-plugin") continue;
        const visited = new Set<string>();
        const pending = [...(adjacency.get(from) ?? [])];
        while (pending.length) {
            const to = pending.pop()!;
            if (visited.has(to)) continue;
            visited.add(to);
            if (workspaceOf(root, to)?.name === "vscode-plugin") errors.push(`${relative(root, from)} transitively reaches the VS Code plugin`);
            for (const hostImport of hostImports.get(to) ?? []) errors.push(`${relative(root, from)} transitively reaches host module ${hostImport} through ${relative(root, to)}`);
            pending.push(...(adjacency.get(to) ?? []));
        }
    }

    for (const from of files) {
        const workspace = workspaceOf(root, from)?.name;
        const fromLayer = layer(from);
        if (!["modeler-core", "vscode-plugin"].includes(workspace ?? "") || (fromLayer !== "domain" && fromLayer !== "service")) continue;
        const visited = new Set<string>();
        const pending = [...(adjacency.get(from) ?? [])];
        while (pending.length) {
            const to = pending.pop()!;
            if (visited.has(to) || workspaceOf(root, to)?.name !== workspace) continue;
            visited.add(to);
            const toLayer = layer(to);
            if ((fromLayer === "domain" && (toLayer === "service" || toLayer === "infrastructure")) || (fromLayer === "service" && toLayer === "infrastructure")) errors.push(`${relative(root, from)} transitively reaches ${toLayer}: ${relative(root, to)}`);
            pending.push(...(adjacency.get(to) ?? []));
        }
    }

    const state = new Map<string, number>();
    const stack: string[] = [];
    function detectCycle(file: string): void {
        if (state.get(file) === 2) return;
        if (state.get(file) === 1) {
            errors.push(`import cycle: ${[...stack.slice(stack.indexOf(file)), file].map((path) => relative(root, path)).join(" -> ")}`);
            return;
        }
        state.set(file, 1);
        stack.push(file);
        for (const to of adjacency.get(file) ?? []) if (adjacency.has(to)) detectCycle(to);
        stack.pop();
        state.set(file, 2);
    }
    for (const file of files) detectCycle(file);
    return { edges, errors: [...new Set(errors)] };
}
