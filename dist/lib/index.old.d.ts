import { Change, TinySynqOptions, SyncableTable } from './types.js';
export declare class TinySynq {
    private _db;
    private _dbName;
    private _synqDbId?;
    private _synqPrefix?;
    private _synqTables?;
    private _synqBatchSize;
    private _wal;
    private log;
    utils: {
        strtimeAsISO8601: string;
        nowAsISO8601: string;
        utcNowAsISO8601: () => string;
    };
    constructor(initData: TinySynqOptions);
    init(): Promise<any>;
    get db(): any;
    get dbName(): string;
    get synqDbId(): string | undefined;
    get synqPrefix(): string | undefined;
    get synqTables(): SyncableTable[] | undefined;
    get synqBatchSize(): number;
    get wal(): boolean;
    runQuery<T>({ sql, values }: {
        sql: string;
        values?: any[];
    }): Promise<T>;
    getLastSync(): Promise<any>;
    getChangesSinceLastSync({ db, lastSync }: {
        db: any;
        lastSync?: string;
    }): Promise<Change[]>;
    private enableTriggers;
    private disableTriggers;
    private beginTransaction;
    private commitTransaction;
    private rollbackTransaction;
    private applyChange;
    applyChangesToLocalDB(changes: Change[]): Promise<void>;
    setupTriggersForTable({ table }: {
        table: SyncableTable;
    }): Promise<void>;
}
export declare const setupDatabase: ({ filePath, sqlite3, prefix, tables, batchSize, wal, preInit, postInit, logOptions }: TinySynqOptions) => Promise<TinySynq | null>;
export default setupDatabase;
