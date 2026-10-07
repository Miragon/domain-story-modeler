import { vi } from "vitest";

export interface MockRange {
    startLine: number;
    startChar: number;
    endLine: number;
    endChar: number;
}

export const Range = vi.fn(function Range(
    this: MockRange,
    startLine: number | MockPosition,
    startChar: number | MockPosition,
    endLine?: number,
    endChar?: number,
) {
    this.startLine = typeof startLine === "number" ? startLine : startLine.line;
    this.startChar = typeof startLine === "number" ? startChar as number : startLine.character;
    this.endLine = typeof startChar === "number" ? endLine as number : startChar.line;
    this.endChar = typeof startChar === "number" ? endChar as number : startChar.character;
});

export const FilePermission = { Readonly: 1 };

export interface MockPosition {
    line: number;
    character: number;
}

export const Position = vi.fn(function Position(
    this: MockPosition,
    line: number,
    character: number,
) {
    this.line = line;
    this.character = character;
});

export const Uri = {
    file: vi.fn((path: string) => ({ fsPath: path, path, toString: () => path })),
    parse: vi.fn((value: string) => ({ scheme: value.split(":", 1)[0], path: value, toString: () => value })),
    joinPath: vi.fn((base: { path: string }, ...parts: string[]) => ({
        path: [base.path.replace(/\/$/, ""), ...parts].join("/"),
    })),
};

export const RelativePattern = vi.fn(function RelativePattern(
    this: { base: unknown; pattern: string },
    base: unknown,
    pattern: string,
) {
    this.base = base;
    this.pattern = pattern;
});

const disposable = () => ({ dispose: vi.fn() });

export const workspace = {
    getConfiguration: vi.fn(),
    getWorkspaceFolder: vi.fn(),
    findFiles: vi.fn(),
    openTextDocument: vi.fn(),
    applyEdit: vi.fn(),
    onDidChangeTextDocument: vi.fn(disposable),
    createFileSystemWatcher: vi.fn(),
    fs: {
        readFile: vi.fn(),
        writeFile: vi.fn(),
        stat: vi.fn(async () => ({ permissions: 0 })),
        isWritableFileSystem: vi.fn(() => true),
    },
};

export const WorkspaceEdit = vi.fn(function WorkspaceEdit(this: {
    replace: ReturnType<typeof vi.fn>;
}) {
    this.replace = vi.fn();
});

export const window = {
    showErrorMessage: vi.fn(),
    showInformationMessage: vi.fn(),
    showWarningMessage: vi.fn(),
    createOutputChannel: vi.fn(),
    registerCustomEditorProvider: vi.fn(),
};

export const commands = {
    registerCommand: vi.fn(),
};
