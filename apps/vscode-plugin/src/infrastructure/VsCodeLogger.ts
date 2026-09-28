import { LoggerPort } from "@egon/modeler-core";
import { OutputChannel } from "vscode";

export class VsCodeLogger implements LoggerPort {
    constructor(private readonly output: OutputChannel) {}

    debug(message: string): void {
        this.output.appendLine(`[debug] ${message}`);
    }

    error(message: string, error?: unknown): void {
        const detail = error instanceof Error ? (error.stack ?? error.message) : error;
        this.output.appendLine(
            detail === undefined ? `[error] ${message}` : `[error] ${message}: ${String(detail)}`,
        );
    }
}
