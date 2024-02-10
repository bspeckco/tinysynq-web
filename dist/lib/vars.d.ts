import { Change, SynQLiteOptions, SyncableTable } from './types.js';
type ApplyChangeParams = {
    change: Change;
    savepoint: string;
};
declare class SynQLite {
    private _db;
    private _dbName;
    private _synqDbId?;
    private _synqPrefix?;
    private _synqTables?;
    private _synqBatchSize;
    utils: {
        strtimeAsISO8601: string;
        nowAsISO8601: string;
        utcNowAsISO8601: () => string;
    };
    constructor(initData: SynQLiteOptions);
    init(): Promise<any>;
    get db(): any;
    get dbName(): string;
    get synqDbId(): string | undefined;
    get synqPrefix(): string | undefined;
    get synqTables(): SyncableTable[] | undefined;
    get synqBatchSize(): number;
    runQuery<T>({ sql, values }: {
        sql: string;
        values?: any[];
    }): Promise<T>;
    getLastSync(): Promise<any>;
    getChangesSinceLastSync(db: any, lastSync?: string): Promise<Change[]>;
    private beginTransaction;
    private commitTransaction;
    private rollbackTransaction;
    applyChange({ change, savepoint }: ApplyChangeParams): Promise<void>;
    applyChangesToLocalDB(changes: Change[]): Promise<void>;
}
export declare const setupDatabase: ({ filename, sqlite3, prefix, tables, batchSize, }: SynQLiteOptions) => Promise<SynQLite>;
export default setupDatabase;
