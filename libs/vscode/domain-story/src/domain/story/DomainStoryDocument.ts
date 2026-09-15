export interface IconMap {
    [name: string]: string;
}

export interface IconSetSection {
    name: string;
    actors: IconMap;
    workObjects: IconMap;
    [key: string]: unknown;
}

export interface LegacyDomainStoryDocument {
    domain: IconSetSection;
    dst: unknown[];
    [key: string]: unknown;
}

export interface DomainStoryContent {
    businessObjects: unknown[];
    title: string;
    description: string;
    version: string;
    [key: string]: unknown;
}

export interface V4DomainStoryDocument {
    iconSet: IconSetSection;
    domainStory: DomainStoryContent;
    [key: string]: unknown;
}

export type DomainStoryDocument =
    | LegacyDomainStoryDocument
    | V4DomainStoryDocument;

export function isV4DomainStoryDocument(
    doc: DomainStoryDocument,
): doc is V4DomainStoryDocument {
    return "iconSet" in doc;
}
