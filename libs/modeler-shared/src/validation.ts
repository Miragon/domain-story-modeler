import {
    DocumentFlushedResponse,
    HostToWebviewMessage,
    WebviewToHostMessage,
} from "./messages";

export class ProtocolValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ProtocolValidationError";
    }
}

function invalid(message: string): never {
    throw new ProtocolValidationError(message);
}

function record(value: unknown, label: string): Record<string, unknown> {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return invalid(`${label} must be an object`);
    }
    return value as Record<string, unknown>;
}

function stringField(value: Record<string, unknown>, key: string): string {
    const field = value[key];
    if (typeof field !== "string") return invalid(`${key} must be a string`);
    return field;
}

function optionalStringField(
    value: Record<string, unknown>,
    key: string,
): string | undefined {
    const field = value[key];
    if (field !== undefined && typeof field !== "string") {
        return invalid(`${key} must be a string when supplied`);
    }
    return field as string | undefined;
}

function numericField(value: Record<string, unknown>, key: string): number {
    const field = value[key];
    if (typeof field !== "number" || !Number.isFinite(field)) {
        return invalid(`${key} must be a finite number`);
    }
    return field;
}

function revisionField(value: Record<string, unknown>, key: string): number {
    const field = numericField(value, key);
    if (!Number.isSafeInteger(field) || field < 0) return invalid(`${key} must be a nonnegative integer`);
    return field;
}

function optionalNumericField(
    value: Record<string, unknown>,
    key: string,
): number | undefined {
    if (value[key] === undefined) return undefined;
    return numericField(value, key);
}

function booleanField(value: Record<string, unknown>, key: string): boolean {
    const field = value[key];
    if (typeof field !== "boolean") return invalid(`${key} must be a boolean`);
    return field;
}

function validateIconMap(value: unknown, label: string): void {
    const icons = record(value, label);
    for (const [name, svg] of Object.entries(icons)) {
        if (typeof svg !== "string")
            invalid(`${label}.${name} must be a string`);
    }
}

function validateIconSet(value: unknown, label: string): void {
    const iconSet = record(value, label);
    stringField(iconSet, "name");
    validateIconMap(iconSet["actors"], `${label}.actors`);
    validateIconMap(iconSet["workObjects"], `${label}.workObjects`);
}

/**
 * Validates only the stable EGN document envelope. EgonClient remains
 * responsible for business-object semantics and supported repair behavior.
 */
export function validateDomainStoryText(
    text: string,
    allowEmpty = false,
): void {
    if (text.trim() === "") {
        if (allowEmpty) return;
        invalid("story text must not be empty");
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(text);
    } catch {
        return invalid("story text must be valid JSON");
    }

    const document = record(parsed, "story");
    const hasLegacy = "domain" in document || "dst" in document;
    const hasV4 = "iconSet" in document || "domainStory" in document;

    if (hasLegacy && hasV4)
        invalid("story must use either the legacy or v4 envelope");
    if (hasLegacy) {
        validateIconSet(document["domain"], "domain");
        if (!Array.isArray(document["dst"])) invalid("dst must be an array");
        return;
    }
    if (hasV4) {
        validateIconSet(document["iconSet"], "iconSet");
        const story = record(document["domainStory"], "domainStory");
        if (!Array.isArray(story["businessObjects"])) {
            invalid("domainStory.businessObjects must be an array");
        }
        stringField(story, "title");
        stringField(story, "description");
        stringField(story, "version");
        return;
    }
    invalid(
        "story must contain legacy domain/dst or v4 iconSet/domainStory fields",
    );
}

function parseDocumentFlushed(
    message: Record<string, unknown>,
): DocumentFlushedResponse {
    const token = numericField(message, "token");
    const status = stringField(message, "status");
    if (
        !(
            ["clean", "flushed", "host-updated", "unavailable"] as const
        ).includes(status as never)
    ) {
        return invalid(`unknown document flush status: ${status}`);
    }
    const content = optionalStringField(message, "content");
    const documentRevision = optionalNumericField(message, "documentRevision");

    if (status === "flushed") {
        if (content === undefined)
            invalid("flushed responses must contain content");
        validateDomainStoryText(content);
    } else if (content !== undefined || documentRevision !== undefined) {
        invalid(
            `${status} responses must not contain content or a document revision`,
        );
    }
    if (documentRevision !== undefined && content === undefined) {
        invalid("documentRevision requires content");
    }

    return {
        type: "DocumentFlushedCommand",
        token,
        status: status as DocumentFlushedResponse["status"],
        ...(content === undefined ? {} : { content }),
        ...(documentRevision === undefined ? {} : { documentRevision }),
    };
}

export function parseWebviewToHostMessage(
    input: unknown,
): WebviewToHostMessage {
    const message = record(input, "webview message");
    const type = stringField(message, "type");
    switch (type) {
        case "InitializeWebviewCommand":
            if ("sessionId" in message) {
                return invalid("initialization must not supply a sessionId");
            }
            return { type };
        case "SyncDocumentCommand": {
            const sessionId = stringField(message, "sessionId");
            const text = stringField(message, "text");
            validateDomainStoryText(text);
            return { type, sessionId, text, documentRevision: revisionField(message, "documentRevision"), requestId: revisionField(message, "requestId") };
        }
        case "LogDebugCommand": {
            const stack = optionalStringField(message, "stack");
            return {
                type,
                message: stringField(message, "message"),
                ...(stack === undefined ? {} : { stack }),
            };
        }
        case "LogErrorCommand": {
            const stack = optionalStringField(message, "stack");
            return {
                type,
                message: stringField(message, "message"),
                ...(stack === undefined ? {} : { stack }),
            };
        }
        case "DocumentFlushedCommand":
            return parseDocumentFlushed(message);
        default:
            return invalid(`unsupported webview-to-host message type: ${type}`);
    }
}

export function parseHostToWebviewMessage(
    input: unknown,
): HostToWebviewMessage {
    const message = record(input, "host message");
    const type = stringField(message, "type");
    switch (type) {
        case "DisplayDomainStoryCommand": {
            const sessionId = stringField(message, "sessionId");
            const text = stringField(message, "text");
            validateDomainStoryText(text, true);
            return { type, sessionId, text, documentRevision: revisionField(message, "documentRevision") };
        }
        case "SyncDocumentResultCommand": {
            const status = stringField(message, "status");
            if (!["applied", "unchanged", "stale", "failed"].includes(status)) return invalid(`unknown synchronization status: ${status}`);
            return { type, sessionId: stringField(message, "sessionId"), requestId: revisionField(message, "requestId"), documentRevision: revisionField(message, "documentRevision"), status: status as "applied" | "unchanged" | "stale" | "failed" };
        }
        case "FlushDocumentQuery":
            return {
                type,
                token: numericField(message, "token"),
                destructive: booleanField(message, "destructive"),
                exportWhenClean: booleanField(message, "exportWhenClean"),
            };
        case "ReleaseDocumentFlushQuery":
            return { type, token: numericField(message, "token") };
        default:
            return invalid(`unsupported host-to-webview message type: ${type}`);
    }
}
