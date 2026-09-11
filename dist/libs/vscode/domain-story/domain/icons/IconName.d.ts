export declare class IconName {
    readonly value: string;
    private constructor();
    static fromFileName(fileName: string): IconName | null;
    static fromString(name: string): IconName | null;
}
