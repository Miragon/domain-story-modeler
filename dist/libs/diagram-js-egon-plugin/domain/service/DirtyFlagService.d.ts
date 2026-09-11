export declare class DirtyFlagService {
    static $inject: string[];
    private isDirtySubject;
    dirty$: import('rxjs').Observable<boolean>;
    get dirty(): boolean;
    makeDirty(): void;
    makeClean(): void;
}
