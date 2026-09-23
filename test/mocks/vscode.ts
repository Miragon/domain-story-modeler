import { vi } from "vitest";

export interface MockRange {
    startLine: number;
    startChar: number;
    endLine: number;
    endChar: number;
}

export const Range = vi.fn(function Range(
    this: MockRange,
    startLine: number,
    startChar: number,
    endLine: number,
    endChar: number,
) {
    this.startLine = startLine;
    this.startChar = startChar;
    this.endLine = endLine;
    this.endChar = endChar;
});

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
    file: vi.fn((path: string) => ({ fsPath: path, path })),
};

export const workspace = {
    getConfiguration: vi.fn(),
    openTextDocument: vi.fn(),
    applyEdit: vi.fn(),
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
};

export const commands = {
    registerCommand: vi.fn(),
};
