/// <reference types="bun-types" />
/// <reference types="node" />

import { ILogObj } from 'tslog';
import { ILogObjMeta } from 'tslog';
import { ISettingsParam } from 'tslog';

declare interface BaseLatestChangesOptions {
    /**
     * A device ID whose changes should be excluded from retrieval (usually the requester).
     */
    exclude?: string;
    since?: string;
    checkpoint?: number;
}

/**
 * Object transferred between devices to convey individual record changes.
 *
 * @public
 */
export declare interface Change {
    /**
     * Change record ID from central server.
     */
    id?: number;
    /**
     * Table name of the record that was modified.
     */
    table_name: string;
    /**
     * Row ID of the record that was modified.
     */
    row_id: string;
    /**
     * The type of operation that took place.
     */
    operation: keyof typeof TinySynqOperation;
    /**
     * The serialised object in the post-modified state.
     */
    data: string;
    /**
     * Vector Clock holding all device values for the record, as known by the source device of the change.
     */
    vclock: VClock;
    /**
     * An ISO8601 formatted date and time that the change was recorded on the source device.
     */
    modified: string;
}

/**
 * Parameters for retrieving table's ID column.
 *
 * @public
 */
export declare type GetTableIdColumnParams = {
    table_name: string;
};

/**
 * Returns a configured instance of TinySynq
 *
 * @param config - Configuration object
 * @returns TinySynq instance
 *
 * @public
 */
export declare const initTinySynq: (config: TinySynqOptions) => Promise<TinySynq>;

declare type LatestChangesOptions = LatestChangesWithSince | LatestChangesWithCheckpoint;

declare interface LatestChangesWithCheckpoint extends BaseLatestChangesOptions {
    /**
     * A server-specific change ID.
     *
     * @remarks
     *
     * When provided it will limit retrieved changes to those _after_ the specified change ID.
     * The change ID is specific to the hub/root server (of which there should be only one).
     */
    checkpoint: number;
}

declare interface LatestChangesWithSince extends BaseLatestChangesOptions {
    /**
     * An ISO8601 date string. Providing this will limit retrieved changes to this date/time onwards.
     */
    since: string;
}

export declare enum LogLevel {
    Silly = 0,
    Trace = 1,
    Debug = 2,
    Info = 3,
    Warn = 4,
    Error = 5,
    Fatal = 6
}

/**
 * Basic query params for methods that read from/write to DB.
 *
 * @public
 */
export declare type QueryParams = {
    sql: string;
    values?: any;
    prefix?: string;
};

/**
 * A {@link https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md | BetterSqlite3} instance.
 *
 * @public
 */
export declare type SQLiteWASM = any;

/**
 * Provided to TinySynq constructor.
 *
 * @public
 */
export declare interface SyncableTable {
    /**
     * Table name.
     */
    name: string;
    /**
     * Row identifier; typically the column used as primary key.
     */
    id: string;
    /**
     * Columns that can be updated by a sync-based change.
     */
    editable: string[];
}

/**
 * Table name and row parameters for retrieving data for a specific record.
 */
declare interface TableNameRowParams {
    table_name: string;
    row_id: string;
}

/**
 * The main class for managing SQLite3 synchronisation.
 *
 * @remarks
 * Expects SQLite3 version \>=3.45.1
 *
 * @public
 */
export declare class TinySynq extends EventTarget {
    private _db;
    private _dbPath;
    private _deviceId;
    private _synqPrefix?;
    private _synqTables?;
    private _synqBatchSize;
    private _wal;
    private log;
    /**
     * Basic Helpers.
     *
     * @TODO move to a separate file.
     *
     * @public
     */
    readonly utils: Utils;
    /**
     * Configure new TinySynq instance.
     *
     * @param opts - Configuration options
     */
    constructor(opts: TinySynqOptions);
    init(): Promise<any>;
    /**
     * SQLiteWASM instance (See {@link https://github.com/sqlite/sqlite-wasm | SQLite Wasm})
     */
    get db(): any;
    /**
     * Path to DB file
     *
     * @example
     *
     * `./app.db` or `/tmp/app.db`
     */
    get dbPath(): string;
    /**
     * Automatically generated ID for device's DB instance.
     *
     * @remarks
     *
     * This ID is used by the sync protocol to identify the database.
     * One it is generated once during setup and does not change. The
     * value is stored in the `_meta` table (`meta_name='device_id'`).
     * __Do not edit this value; doing so would corrupt synchronisation__.
     */
    get deviceId(): string | undefined;
    /**
     * Alias for {@link TinySynq.deviceId}.
     */
    get synqDbId(): string | undefined;
    /**
     * The prefix used for TinySynq's tables.
     *
     * @defaultValue `tinysynq`
     */
    get synqPrefix(): string | undefined;
    /**
     * Object containing {@link SyncableTable}s, keyed by table name.
     *
     * @remarks
     *
     * A {@link SyncableTable} structure is never modified. TinySynq maintains
     * its own tables and triggers for tracking and responding to changes.
     *
     * @returns Record\<string, SyncableTable\>
     */
    get synqTables(): Record<string, SyncableTable> | undefined;
    /**
     * Number of records to process in each batch when syncing changes.
     */
    get synqBatchSize(): number;
    /**
     * Enable or disable WAL mode.
     *
     * @defaultValue true
     */
    get wal(): boolean;
    /**
     * Get a random 16-character ID generated by nanoid
     *
     * @returns string
     */
    getNewId(): string;
    /**
     * Get the column used as identifier for the {@link SyncableTable}.
     *
     * @param params - Details of table for which to retrieve ID column.
     * @returns Column name
     */
    getTableIdColumn(params: GetTableIdColumnParams): string;
    /**
     * If not already set, generates and sets deviceId.
     */
    setDeviceId(): Promise<void>;
    /**
     * Run an operation against the DB
     *
     * @remarks
     * This method does not return any records, only the result of the operation.
     *
     * @param params - The SQL query and optionally any values.
     * @returns
     */
    run<T = any>(params: QueryParams): Promise<T>;
    /**
     * Run multiple operations against the DB
     *
     * @remarks
     * This method does not return any records.
     *
     * @param params - The SQL query and optionally an array of arrays or key/value pairs
     * @returns Undefined or an error, if one occurred
     */
    runMany(params: QueryParams): Promise<unknown>;
    /**
     * Run an operation against the DB
     *
     * @param params - The SQL query and optionally any values
     * @returns Array of records returned from the database
     */
    runQuery<T = any>(params: QueryParams): Promise<T>;
    /**
     * Renames keys of a query's value object to make them compatible
     * with the SQLiteWASM API's bind parameters.
     *
     * @param
     * @returns
     */
    reformatQueryValues({ values, prefix }: {
        values: any;
        prefix?: string;
    }): any;
    /**
     * Returns the current device's unique TinySynq ID.
     *
     * @returns The device's assigned ID.
     */
    getDeviceId(): Promise<string>;
    /**
     * Returns an ISO8601 formatted date and time of the last successful local sync.
     *
     * @remarks
     *
     * A "local sync" is the process of sending local changes to the remote hub.
     *
     * @returns The time of the last sync.
     */
    getLastSync(): Promise<string>;
    /**
     * Returns matching {@link Change} objects since the last local sync.
     *
     * @remarks
     *
     * If `lastLocalSync` is empty, all changes are returned.
     *
     * @param params - Object containing retrieval parameters.
     * @returns An array of {@link Change} objects.
     */
    getChanges(params?: {
        lastLocalSync?: string;
        columns?: string[];
    }): Promise<Change[]>;
    /**
     * Returns {@link Change} objects since the last local sync.
     *
     * @remarks
     *
     * If `lastLocalSync` is empty, all changes are returned.
     *
     * @param params - Object containing retrieval parameters.
     * @returns An array of {@link Change} objects.
     */
    getChangesSinceLastSync(params?: {
        columns?: string[];
    }): Promise<Change[]>;
    /**
     * Writes debug mode value (true) which disables recording
     * of operations on syncable tables.
     *
     * @remarks
     *
     * The value set by this method is checked by dedicated triggers.
     * If the value is `1`, the active trigger writes the data to the
     * `*_dump` table. It's worth purging the table data once done
     * with debugging.
     *
     * @returns Result of the operation.
     */
    enableDebug(): Promise<any>;
    /**
     * Writes debug mode value (false) which disables recording
     * of operations on syncable tables.
     *
     * @see {@link TinySynq.enableDebug} for more details.
     *
     * @returns Result of the operation.
     */
    disableDebug(): Promise<any>;
    /**
     * Empties the `*_dump` table.
     *
     * @see {@link TinySynq.enableDebug} for more details.
     */
    clearDebugData(): Promise<void>;
    /**
     * Writes value (true) which determines whether or not triggers on syncable
     * tables are executed.
     *
     * @returns Result of operation.
     */
    private enableTriggers;
    /**
     * Writes value (true) which determines whether or not triggers on syncable
     * tables are executed.
     *
     * @returns Result of operation.
     */
    private disableTriggers;
    beginTransaction(): Promise<string>;
    commitTransaction({ savepoint }: {
        savepoint: string;
    }): Promise<any>;
    rollbackTransaction({ savepoint }: {
        savepoint: string;
    }): Promise<any>;
    /**
     * Retrieves a single record.
     *
     * @param params - Object containing table/row parameters.
     * @returns
     */
    private getRecord;
    /**
     * Retrieves a single record by it's ID.
     *
     * @remarks
     *
     * The column used to identify the record is according to the {@link SyncableTable}
     * that was provided in {@link TinySynqOptionsBase.tables} at instantiation.
     *
     * @param params - Object containing table/row parameters.
     * @returns
     */
    getById<T>(params: TableNameRowParams): Promise<T | any>;
    insertRecordMeta({ change, vclock }: any): Promise<any>;
    /**
     * Get associated meta data (including `vclock`) for record.
     *
     * @param params - Object containing table/row parameters.
     *
     * @returns Object containing row data from `*_record_meta`.
     */
    getRecordMeta(params: {
        table_name: string;
        row_id: string;
    }): Promise<any>;
    /**
     * Returns changes that couldn't be applied yet because they
     * were received out of sequence.
     *
     * @returns Array of pending changes.
     */
    getPending(): Promise<any>;
    /**
     * Returns the most recent change for a specific record.
     *
     * @param params
     * @returns A single change record, if one exists
     */
    getMostRecentChange(params: {
        table_name: string;
        row_id: string;
        operation?: TinySynqOperation;
    }): Promise<any>;
    /**
     * Creates new pending record to be applied later.
     *
     * @param opts - Options for processing out-of-order change
     * @returns Newly created pending record
     */
    private processOutOfOrderChange;
    /**
     * Determines whether to treat conflicted change as valid or invalid.
     *
     * @param opts - Options for processing concurrent change
     * @returns boolean
     */
    private processConflictedChange;
    /**
     * Checks for and handles issues with incoming change to be applied.
     *
     * @returns Result of pre-processing.
     */
    private preProcessChange;
    /**
     * Checks for incoming update on deleted record and attempts to resurrect it.
     *
     * @param params
     * @returns Object with `valid` property
     */
    private processUpdateAfterDelete;
    /**
     * Creates an insert query based on the syncable table name and data provided.
     *
     * @remarks
     *
     * This method is specifically for tables that have been registerd as syncable
     * by passing them in as a {@link SyncableTable} at instantiation.
     *
     * @see {@link SyncableTable} for more information.
     *
     * @param param0 - Parameters from which to create the query.
     * @returns A SQL query string.
     */
    createInsertFromObject({ data, table_name: table }: {
        data: Record<string, any>;
        table_name: string;
    }): string;
    /**
     * Creates an update query based on the syncable table name and data provided.
     *
     * @remarks
     *
     * This method is specifically for tables that have been registerd as syncable
     * by passing them in as a {@link SyncableTable} at instantiation.
     *
     * @see {@link SyncableTable} for more information.
     *
     * @param param0 - Parameters from which to create the query.
     * @returns A SQL query string.
     */
    createUpdateFromObject({ data, table_name: table }: {
        data: Record<string, any>;
        table_name: string;
    }): string;
    /**
     * Creates an insert query based on the system table name and data provided.
     *
     * @param param0 - Parameters from which to create the query.
     *
     * @returns A SQL query string.
     */
    private createInsertFromSystemObject;
    private updateLastSync;
    private applyChange;
    applyChangesToLocalDB({ changes, restore }: {
        changes: Change[];
        restore?: boolean;
    }): Promise<void>;
    /**
     * Get items that have been recently changed.
     *
     * @param opts
     */
    getFilteredChanges(opts?: LatestChangesOptions): Promise<any>;
    updateLastPush(params: {
        time: string;
        id: string;
    }): Promise<{
        timeResult: any;
        idResult: any;
    }>;
    tablesReady(): Promise<void>;
    obliterate(): Promise<void>;
}

export declare class TinySynqClient extends EventTarget {
    private _config;
    private _serverUrl;
    private _ts;
    private _ws;
    private log;
    get serverUrl(): string;
    get ts(): TinySynq;
    get ws(): WebSocket | undefined;
    constructor(config: TinySynqClientConfig);
    isOpenOrConnecting(): boolean | undefined;
    connect(): Promise<WebSocket>;
    push(): Promise<(ILogObj & ILogObjMeta) | undefined>;
    pull(): Promise<void>;
    private handleMessage;
}

declare interface TinySynqClientConfig {
    /**
     * Initialised TinySynq instance.
     */
    ts: TinySynq;
    /**
     * The domain or IP address (no protocol or port).
     *
     * @default localhost
     */
    hostname?: string;
    /**
     * The port number on which to connect.
     *
     * @default 7174
     */
    port?: number;
    /**
     * Whether or not it should a secure connection (wss://)
     *
     * @default false
     */
    secure?: boolean;
}

declare enum TinySynqOperation {
    'INSERT' = "INSERT",
    'UPDATE' = "UPDATE",
    'DELETE' = "DELETE"
}

/**
 * {@inheritdoc TinySynqOptionsBase}
 *
 * @public
 */
export declare type TinySynqOptions = TinySynqOptionsWithInstance | TinySynqOptionsWithFilePath;

/**
 * Base options for TinySynq constructor.
 *
 * @public
 */
export declare interface TinySynqOptionsBase {
    /**
     * A BetterSqlite3 instance.
     *
     * @remarks
     *
     * If not provided, {@link TinySynqOptionsBase.filePath} must be set.
     *
     */
    sqlite3?: SQLiteWASM;
    /**
     * Path to SQLite3 database file.
     *
     * @remarks
     * If not provided, {@link TinySynqOptionsBase.sqlite3} must be set.
     */
    filePath?: string;
    /**
     * Prefix to use for TinySynq tables (trailing underscores will be removed).
     */
    prefix: string;
    /**
     * Tables that should be synced between devices.
     */
    tables: SyncableTable[];
    /**
     * Maximum number of changes to process at once.
     */
    batchSize?: number;
    /**
     * Enable or disable WAL mode.
     */
    wal?: boolean;
    /**
     * Array of queries to run before TinySynq's change tracking is configured.
     *
     * @remarks
     * Include create statements for syncable tables here.
     */
    preInit?: string[];
    /**
     * Array of queries to run after TinySynq's change tracking is configured
     *
     * @remarks
     * You might place any insert queries here.
     */
    postInit?: string[];
    /**
     * Configure logging options.
     *
     * @remarks
     * TinySynq uses TSLog for logging. All optiions are passed directly to it.
     * See https://tslog.js.org/#/?id=settings for details
     */
    logOptions?: ISettingsParam<ILogObj>;
    /**
     * Enable/disable debug mode
     *
     * When enabled, all INSERT/UPDATE/DELETE actions on syncable tables are written
     * to the *_dump table for inspection.
     */
    debug?: boolean;
}

declare interface TinySynqOptionsWithFilePath extends TinySynqOptionsBase {
    /**
     * Path to SQLite3 database file.
     */
    filePath: string;
}

/**
 * Constructor options TinySynq instance.
 *
 * Provide either an existing {@link https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md | BetterSqlite3} instance (`sqlite3`) or the `filePath`.
 *
 * @public
 */
declare interface TinySynqOptionsWithInstance extends TinySynqOptionsBase {
    /**
     * A BetterSqlite3 instance.
     */
    sqlite3: SQLiteWASM;
}

/**
 * Basic utilities, mainly date-oriented.
 */
declare type Utils = {
    strftimeAsISO8601: string;
    nowAsISO8601: string;
    utcNowAsISO8601: () => string;
    isSafeISO8601: (date: string) => boolean;
};

declare type VClock = {
    [deviceId: string]: number;
};

export { }
