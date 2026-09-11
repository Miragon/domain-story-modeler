export declare class DomainStoryIdFactory {
    getId(type: string): string;
    registerId(id: string): void;
    private generateId;
    private fourDigitsId;
    private idSuffix;
}
export declare function containsId(id: string): boolean;
