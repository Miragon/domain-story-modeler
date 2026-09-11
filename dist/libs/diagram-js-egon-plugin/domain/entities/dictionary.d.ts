export declare class Dictionary {
    private entries;
    constructor();
    get length(): number;
    all(): Entry[];
    size(): number;
    isEmpty(): boolean;
    has(key: string): boolean;
    set(key: string, value: any): void;
    add(value: any, key: string): void;
    putEntry(entry: Entry): void;
    keysArray(): string[];
    addEach(object: any): void;
    addBuiltInIcons(builtInIcons: Dictionary): void;
    appendDict(dict: Dictionary): void;
    clear(): void;
    delete(key: string): void;
    get(key: string): any;
}
export declare class Entry {
    value: any;
    key: string;
    keyWords: string[];
    constructor(value: any, key: string, keyWords?: string[]);
}
