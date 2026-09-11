import { DomainStoryDocument } from './DomainStoryDocument';

export declare function parseStoryOrEmpty(egnText: string | undefined | null): DomainStoryDocument;
export declare function serializeStory(doc: DomainStoryDocument): string;
