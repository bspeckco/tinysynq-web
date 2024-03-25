/// <reference types="bun-types" />
/// <reference types="node" />
import { Change, QueryParams, TinySynqOptions, SyncableTable, TableNameRowParams, LatestChangesOptions } from './types.js';
/**
 * Basic utilities, mainly date-oriented.
 */
export type Utils = {
    strftimeAsISO8601: string;
    nowAsISO8601: string;
    utcNowAsISO8601: () => string;
    isSafeISO8601: (date: string) => boolean;
};
/**
 * Parameters for retrieving table's ID column.
 *
 * @public
 */
export type GetTableIdColumnParams = {
    table_name: string;
};
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
