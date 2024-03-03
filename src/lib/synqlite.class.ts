import { sqlite3Worker1Promiser } from '@sqlite.org/sqlite-wasm';
import { ApplyChangeParams, Change, LogLevel, QueryParams, SynQLiteOperation, SynQLiteOptions, SyncableTable, TableNameRowParams, VClock } from './types.js';
import { Logger, ILogObj } from 'tslog';
import { VCompare } from './vcompare.class.js';

const log = new Logger({ name: 'synqlite-web-init', minLevel: LogLevel.Info });
const strtimeAsISO8601 = `STRFTIME('%Y-%m-%dT%H:%M:%f','NOW')`;

type PreProcessChangeOptions = {
  change: Change, restore?: boolean
}

type PreProcessChangeResult = { 
  valid: boolean;
  reason: string;
  vclock: VClock;
  checks: Record<string, boolean>
}

/**
 * Basic utilities, mainly date-oriented.
 */
export type Utils = {
  strtimeAsISO8601: string,
  nowAsISO8601: string,
  utcNowAsISO8601: () => string
}

/**
 * Parameters for retrieving table's ID column.
 * 
 * @public
 */
export type GetTableIdColumnParams = {
  table_name: string;
}

/**
 * The main class for managing SQLite3 synchronisation.
 * 
 * @remarks
 * Expects SQLite3 version \>=3.45.1
 * 
 * @public
 */
export class SynQLite {
  private _db: any;
  private _dbPath: string;
  private _deviceId: string | undefined;
  private _synqPrefix?: string;
  private _synqTables?: Record<string, SyncableTable>;
  private _synqBatchSize: number = 20;
  private _wal = true;
  private log: Logger<ILogObj>;

  /**
   * Basic Helpers.
   * 
   * @TODO move to a separate file.
   * 
   * @public
   */
  readonly utils: Utils = {
    strtimeAsISO8601,
    nowAsISO8601: strtimeAsISO8601,
    utcNowAsISO8601: (): string => {
      return new Date((new Date()).toUTCString()).toISOString();
    }
  }

  /**
   * Configure new SynQLite instance.
   * 
   * @param opts - Configuration options
   */
  constructor(opts: SynQLiteOptions) {
    if (!opts.filePath && !opts.sqlite3) {
      throw new Error('No DB filePath or connection provided');
    }
    const _synqTables: Record<string, SyncableTable> = {};
    opts.tables.forEach(t => {
      _synqTables[t.name] = t;
    })
    this._dbPath = opts.filePath || '';
    this._db = opts.sqlite3 || undefined;
    this._synqPrefix = opts.prefix?.trim().replace(/[^a-z0-9]+$/i, '');
    this._synqTables = _synqTables;
    this._synqBatchSize = opts.batchSize || this._synqBatchSize;
    this._wal = opts.wal ?? false;
    this.log = new Logger({
      name: 'synqlite-node',
      minLevel: LogLevel.Debug,
      type: 'json',
      maskValuesOfKeys: ['password', 'encryption_key'],
      hideLogPositionForProduction: true,
      ...(opts.logOptions || {})
    });
  }

  async init() {
    if (this.db) return Promise.resolve(this.db); // @TODO: test DB connection
    if (!this.dbPath) return Promise.reject('No DB filename or connection provided');

    return new Promise(async (resolve, reject) => {
      try {
        this.log.debug('get promiser...')
        const promiser: any = await new Promise((res) => {
          const _promiser = sqlite3Worker1Promiser({
            onready: () => {
              res(_promiser);
            },
            onerror: (err: any) => {
              this.log.error('@ERROR', err);
            },
            debug: (...args: any) => {
              this.log.debug(...args);
            },
            onunhandled: (event: any) => {
              this.log.error('@UNHANDLED', event);
            }
          });
        });
        
        this.log.debug('get config...')
        await promiser('config-get', {});

        let res;
  
        try {
          this.log.debug(`open ${this.dbPath}...`);
          res = await promiser('open', {
            filename: `file:${this.dbPath}?vfs=opfs`,
          });
  
          this.log.info(
            'OPFS is available, created persisted database at',
            res.result.filename.replace(/^file:(.*?)\?vfs=opfs$/, '$1'),
          );
        }
        catch(err) {
          // Probably no vfs
          res = await promiser('open', {
            filename: `file:${this.dbPath}`
          });
          this.log.info(
            'OPFS not available, created in-memory database at',
            res.result.filename, '$1'
          );
        }
  
        if (!res) return reject('Unable to start DB');

        const { dbId } = res;
        this._deviceId = dbId;
        this.setDeviceId();
      
        const conf = await promiser('config-get', {});
        this.log.info('Running SQLite3 version', conf.result.version.libVersion);
        
        this._db = promiser;
    
        // Set WAL mode if necessary
        if (this._wal === true) {
          await this.runQuery({
            sql: `PRAGMA journal_mode=WAL;`
          });
        }
        resolve(this);
      }
      catch(err: any) {
        if (!(err instanceof Error)) {
          err = new Error(err.result.message);
        }
        this.log.error(err.name, err.message);
        this.log.error(err)
        reject('DB setup failed.');
      }
    });
  };

  /**
   * SQLiteWASM instance (See {@link https://github.com/sqlite/sqlite-wasm | SQLite Wasm})
   */
  get db() {
    return this._db;
  }

  /**
   * Path to DB file
   * 
   * @example
   * 
   * `./app.db` or `/tmp/app.db`
   */
  get dbPath() {
    return this._dbPath;
  }

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
  get deviceId() {
    return this._deviceId;
  }

  /**
   * Alias for {@link SynQLite.deviceId}.
   */
  get synqDbId() {
    return this._deviceId;
  }

  /**
   * The prefix used for SynQLite's tables.
   * 
   * @defaultValue `synqlite`
   */
  get synqPrefix() {
    return this._synqPrefix;
  }

  /**
   * Object containing {@link SyncableTable}s, keyed by table name.
   * 
   * @remarks
   * 
   * A {@link SyncableTable} structure is never modified. SynQLite maintains 
   * its own tables and triggers for tracking and responding to changes.
   * 
   * @returns Record\<string, SyncableTable\>
   */
  get synqTables() {
    return this._synqTables;
  }

  /**
   * Number of records to process in each batch when syncing changes. 
   */
  get synqBatchSize() {
    return this._synqBatchSize;
  }

  /**
   * Enable or disable WAL mode.
   * 
   * @defaultValue true
   */
  get wal() {
    return this._wal;
  }

  /**
   * Get the column used as identifier for the {@link SyncableTable}.
   * 
   * @param params - Details of table for which to retrieve ID column.
   * @returns Column name
   */
  getTableIdColumn(params: GetTableIdColumnParams) {
    const {table_name} = params;
    return this.synqTables![table_name]?.id as string;
  }

  /**
   * If not already set, generates and sets deviceId.
   */
  async setDeviceId() {
    // Set the device ID
    let existing: any;
    try {
      existing = (await this.runQuery<any[]>({
        sql: `SELECT meta_value FROM ${this.synqPrefix}_meta WHERE meta_name = 'device_id'`
      }))[0];
    }
    catch(err) {
      this.log.warn(`Couldn't retrieve device ID`);
    }

    log.warn('@device_id', existing);
    if (!existing?.meta_value) {
      const res = await this.runQuery<any[]>({
        sql: `INSERT OR REPLACE INTO ${this.synqPrefix}_meta (meta_name, meta_value) VALUES (?,?) RETURNING *`,
        values: ['device_id', this.deviceId]
      });
      log.warn('@created record for device_id:', res);
      existing = res[0];
    }
    this._deviceId = existing?.meta_value;
  }

  /**
   * Run an operation against the DB
   * 
   * @remarks
   * This method does not return any records, only the result of the operation.
   * 
   * @param params - The SQL query and optionally any values.
   * @returns
   */
  async run<T = any>(params: QueryParams): Promise<T> {
    return this.runQuery(params);
  }

  /**
   * Run multiple operations against the DB
   * 
   * @remarks
   * This method does not return any records.
   * 
   * @param params - The SQL query and optionally an array of arrays or key/value pairs
   * @returns Undefined or an error, if one occurred
   */
  async runMany(params: {sql: string, values: any[]}) {
    const {sql, values} = params;
    const quid = Math.ceil(Math.random() * 1000000);
    this.log.debug('@runMany', quid, sql, values, '/');
    try {
      const query = this.db.prepare(sql);
      for (const v of values) {
        query.run(v);
      }
      this.log.debug({quid, result: 'done'});
    }
    catch(err: any) {
      this.log.error(quid, err);
      return err;
    }
  }

  /**
   * Run an operation against the DB
   * 
   * @param params - The SQL query and optionally any values
   * @returns Array of records returned from the database
   */
  async runQuery<T = any>(params: QueryParams): Promise<T> {
    const {sql, values} = params;
    const quid = Math.ceil(Math.random() * 1000000);
    this.log.debug('@runQuery', quid, sql, values, '/');
    const dbId = this.synqDbId;
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      try {
        this.db('exec', {
          dbId,
          sql, // I think we can make this sexier, like in Minmail
          bind: values,
          callback: (result: any) => {
            if (!result.row) {
              this.log.debug('@runQuery RESOLVED', quid);
              return resolve(results as any);
            }
            const o: any = {};
            result.row.forEach((col: string, i: number) => o[result.columnNames[i]] = result.row[i]);
            results.push(o);
          }
        });
      }
      catch(err) {
        this.log.error(quid, err);
        reject(err);
      }
    });
  }

  /**
   * Returns the current device's unique SynQLite ID.
   * 
   * @returns The device's assigned ID.
   */
  async getDeviceId(): Promise<string> {
    if (this._deviceId) return this._deviceId;
    const res = await this.runQuery<any[]>({
      sql:`
        SELECT meta_value FROM ${this.synqPrefix}_meta
        WHERE meta_name = 'device_id'`
    });
    return res[0].meta_value;
  }

  /**
   * Returns an ISO8601 formatted date and time of the last successful local sync.
   * 
   * @remarks
   * 
   * A "local sync" is the process of sending local changes to the remote hub.
   * 
   * @returns The time of the last sync.
   */
  async getLastSync(): Promise<string> {
    const res = await this.runQuery<any[]>({
      sql:`
        SELECT meta_value FROM ${this.synqPrefix}_meta
        WHERE meta_name = 'last_local_sync'`
    });
    this.log.trace('@getLastSync', res[0]);
    return res[0]?.meta_value;
  }
  
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
  async getChanges(params?: {lastLocalSync?: string, columns?: string[]}): Promise<Change[]> {
    let lastLocalSync: string = params?.lastLocalSync || await this.getLastSync();
    let { columns = [] } = params || {};
    this.log.debug('@getChanges', lastLocalSync);
  
    let where: string = '';
    let columnSelection = columns
      .map(c => c.replace(/[^*._a-z0-9]+/gi, ''))
      .join(',') || '*';
  
    if (lastLocalSync) {
      where = 'WHERE c.modified > ?'
    }
    const sql = `
      SELECT ${columnSelection}
      FROM ${this._synqPrefix}_changes c
      INNER JOIN ${this._synqPrefix}_record_meta trm
      ON trm.table_name = c.table_name
      AND trm.row_id = c.row_id
      ${where}
      ORDER BY c.modified ASC
    `;
    console.log(sql)
    const values = lastLocalSync ? [lastLocalSync] : [];
    this.log.debug(sql, values);
  
    return this.runQuery<Change[]>({sql, values});
  };

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
  async getChangesSinceLastSync(params?: {columns?: string[]}): Promise<Change[]> {
    let lastLocalSync = await this.getLastSync() || undefined;
    return this.getChanges({...params, lastLocalSync});
  };

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
  async enableDebug() {
    return this.run({
      sql: `
      INSERT OR REPLACE INTO ${this.synqPrefix}_meta (meta_name, meta_value)
      VALUES ('debug_on', '1')
      RETURNING *;`
    });
  }

  /**
   * Writes debug mode value (false) which disables recording 
   * of operations on syncable tables.
   * 
   * @see {@link SynQLite.enableDebug} for more details.
   * 
   * @returns Result of the operation.
   */
  async disableDebug() {
    return this.run({
      sql: `
      INSERT OR REPLACE INTO ${this.synqPrefix}_meta (meta_name, meta_value)
      VALUES ('debug_on', '0')
      RETURNING *;`
    });
  }

  /**
   * Empties the `*_dump` table.
   * 
   * @see {@link SynQLite.enableDebug} for more details.
   */
  async clearDebugData() {
    await this.run({sql: `DELETE FROM ${this._synqPrefix}_dump`});
    await this.run({sql: `UPDATE SQLITE_SEQUENCE SET seq = 0 WHERE name = ${this._synqPrefix}_dump`});
  }
  
  /**
   * Writes value (true) which determines whether or not triggers on syncable
   * tables are executed.
   * 
   * @returns Result of operation.
   */
  private enableTriggers() {
    return this.run({
      sql: `
      INSERT OR REPLACE INTO ${this.synqPrefix}_meta (meta_name, meta_value)
      VALUES ('triggers_on', '1');`
    });
  }

  /**
   * Writes value (true) which determines whether or not triggers on syncable
   * tables are executed.
   * 
   * @returns Result of operation.
   */
  private async disableTriggers() {
    return this.run({
      sql: `
      INSERT OR REPLACE INTO ${this.synqPrefix}_meta (meta_name, meta_value)
      VALUES ('triggers_on', '0');`
    });
  }

  async beginTransaction(): Promise<string> {
    const savepoint = `SP${Date.now()}`;
    const sql = `SAVEPOINT ${savepoint};`;
    await this.run({sql});
    return savepoint;
  }

  async commitTransaction({savepoint}: {savepoint: string}) {
    const sql = `RELEASE SAVEPOINT ${savepoint};`;
    return this.run({sql});
  }

  async rollbackTransaction({savepoint}: {savepoint: string}) {
    const sql = `ROLLBACK TRANSACTION TO SAVEPOINT ${savepoint};`;
    return this.run({sql});
  }

  /**
   * Retrieves a single record.
   * 
   * @param params - Object containing table/row parameters. 
   * @returns 
   */
  private async getRecord<T>(params: TableNameRowParams): Promise<T | any> {
    const {table_name, row_id} = params;
    const idCol = this.getTableIdColumn({table_name: table_name});
    const sql = `SELECT * FROM ${table_name} WHERE ${idCol} = ?`;
    const res = await this.runQuery({sql, values: [row_id]});
    this.log.debug('@getRecord', res);
    return res[0];
  }

  /**
   * Retrieves a single record by it's ID.
   * 
   * @remarks
   * 
   * The column used to identify the record is according to the {@link SyncableTable}
   * that was provided in {@link SynQLiteOptionsBase.tables} at instantiation.
   * 
   * @param params - Object containing table/row parameters. 
   * @returns 
   */
  async getById<T>(params: TableNameRowParams): Promise<T | any> {
    const{table_name, row_id} = params;
    return this.getRecord({table_name, row_id});
  }

  async insertRecordMeta({change, vclock}: any) {
    //this.log.warn('<<< @insertRecordMeta >>>', {change, vclock});
    const { table_name, row_id } = change;
    const mod = vclock[this._deviceId!] || 0;
    const values = {
      table_name,
      row_id,
      mod,
      vclock: JSON.stringify(vclock)
    };
    return this.runQuery({
      sql: `
      INSERT INTO ${this._synqPrefix}_record_meta (table_name, row_id, mod, vclock)
      VALUES (:table_name, :row_id, :mod, :vclock)
      ON CONFLICT DO UPDATE SET mod = :mod, vclock = :vclock
      RETURNING *
      `,
      values,
    });
  }

  /**
   * Get associated meta data (including `vclock`) for record.
   * 
   * @param params - Object containing table/row parameters.
   * 
   * @returns Object containing row data from `*_record_meta`.
   */
  async getRecordMeta(params: {table_name: string, row_id: string}) {
    const {table_name, row_id} = params;
    const sql = `
    SELECT *
    FROM ${this.synqPrefix}_record_meta
    WHERE table_name = :table_name
    AND row_id = :row_id`;
    const res = await this.db.prepare(sql).get({table_name, row_id});
    return res;
  }

  /**
   * Returns changes that couldn't be applied yet because they
   * were received out of sequence.
   * 
   * @returns Array of pending changes.
   */
  async getPending() {
    const sql = `
    SELECT *
    FROM ${this._synqPrefix}_pending
    ORDER BY id ASC
    `;
    const res = await this.runQuery({sql});
    return res;
  }

  /**
   * Creates new pending record to be applied later.
   * 
   * @param opts - Options for processing out-of-order change
   * @returns Newly created pending record
   */
  private async processOutOfOrderChange({change}: {change: Change}) {
    const {id, ...data} = change;
    const sql = this.createInsertFromSystemObject({
      data,
      table_name: `${this._synqPrefix}_pending`,
    });
    this.log.trace('@processOutOfOrderChange\n', sql, change);
    const values: any = { ...data};
    values.vclock = JSON.stringify(data.vclock);
    const res = await this.runQuery({sql, values});
    this.log.trace('@processOutOfOrderChange\n', {res});
    return res;
  }

  /**
   * Determines whether to treat conflicted change as valid or invalid.
   * 
   * @param opts - Options for processing concurrent change
   * @returns boolean 
   */
  private async processConflictedChange<T>({ record, change }: {record: T|any, change: Change}): Promise<boolean> {
    const localMeta = await this.getRecordMeta({...change});
    this.log.trace('<<<@ processConflictedChange LLW @>>>', change.id, change.table_name, change.row_id, {record, localMeta, change});
    if (change.modified > localMeta.modified) {
      this.log.trace('<!> INTEGRATING REMOTE', change.id, change.table_name, change.row_id);
      // Update local with the incoming changes
      return true;
    }
    else {
      this.log.warn('<!> KEEPING LOCAL', change.id, change.table_name, change.row_id);
      // Keep the local change, but record receipt of the record.
      return false;
    }
  }

  /**
   * Checks for and handles issues with incoming change to be applied.
   * 
   * @returns Result of pre-processing.
   */
  private async preProcessChange(
    {change, restore}: PreProcessChangeOptions
  ): Promise<PreProcessChangeResult> {
    let defaultReason = 'unknown';
    let valid = false;
    let reason = defaultReason;
    const localId = this.deviceId!;
    const { table_name, row_id, vclock: remote = {} } = change;
    const record = await this.getRecord({table_name, row_id});
    const meta = await this.getRecordMeta({table_name, row_id});
    const local = meta?.vclock ? JSON.parse(meta.vclock) : {};

    let latest: VClock = {};
    const localV = new VCompare({ local, remote, localId });
    let displaced = false;
    let conflicted = false;
    let stale = false;

    // If we don't have the record, treat it as new
    if (!restore && !record && change.operation !== SynQLiteOperation.INSERT) {
      reason = 'update before insert';
      this.processOutOfOrderChange({change});
    }
    else if (restore || !record || !local || !local[localId]) {
      latest = change.vclock;
    }
    
    validationCondition:
    if (restore) {
      valid = true;
      reason = 'restoration';
      latest = localV.merge();
      break validationCondition;
    }
    else if (displaced = localV.isOutOfOrder()) {  
      reason = 'received out of order';
      await this.processOutOfOrderChange({change});
    }
    else if (conflicted = localV.isConflicted()) {
      valid = await this.processConflictedChange({record, change});
      if (!valid) {
        reason = 'concurrent writes'; 
      }
      else {
        latest = localV.merge();
      }
    }
    else if (stale = localV.isOutDated()) {
      reason = 'stale';
    }
    else if (reason === defaultReason) {
      valid = true;
      reason = '';
      latest = localV.merge();
    }

    this.log.debug({table_name, row_id, conflicted, displaced, stale});

    return { valid, reason, vclock: latest, checks: { stale, displaced, conflicted } };
  }

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
  createInsertFromObject({data, table_name: table}: { data: Record<string, any>, table_name: string }) {
    const columnsToInsert = Object.keys(data).join(',');
    const editable = this._synqTables![table].editable;
    const updates = Object.keys(data)
      .filter(key => editable.includes(key))
      .map(k => `${k} = :${k}`)
      .join(',');
    
    if (!updates) throw new Error('No changes availble');
    const insertPlaceholders = Object.keys(data).map(k => `:${k}`).join(',');
    const insertSql = `
      INSERT INTO ${table} (${columnsToInsert})
      VALUES (${insertPlaceholders})
      ON CONFLICT DO UPDATE SET ${updates}
      RETURNING *;`;

    return insertSql;
  }

  /**
   * Creates an insert query based on the system table name and data provided.
   *  
   * @param param0 - Parameters from which to create the query.
   * 
   * @returns A SQL query string. 
   */
  private createInsertFromSystemObject({data, table_name: table}: { data: Record<string, any>, table_name: string }) {
    this.log.silly('@createInsert...', {data});
    const columnsToInsert = Object.keys(data).join(',');
    const updates = Object.keys(data)
      .map(k => `${k} = :${k}`)
      .join(',');
    
    if (!updates) throw new Error('No changes availble');
    const insertPlaceholders = Object.keys(data).map(k => `:${k}`).join(',');
    const insertSql = `
      INSERT INTO ${table} (${columnsToInsert})
      VALUES (${insertPlaceholders})
      ON CONFLICT DO UPDATE SET ${updates}
      RETURNING *;`;

    return insertSql;
  }

  private async updateLastSync({change}: {change: Change}) {
    const sql = `INSERT OR REPLACE INTO ${this.synqPrefix}_meta (meta_name, meta_value) VALUES(:name, :value)`;
    const data = [
      { name: 'last_local_sync', value: `STRFTIME('%Y-%m-%d %H:%M:%f','NOW')`},
      { name: 'last_sync', value: change.id }
    ];
    for (const values of data) {
      await this.runQuery({sql, values});
    };
  }

  private async applyChange({
    change,
    restore,
    savepoint
  }: ApplyChangeParams) {
    try {
      // Check that the changes can actually be applied
      const changeStatus = await this.preProcessChange({change, restore});
      if (!changeStatus.valid) {
        this.log.warn(changeStatus);
        this.updateLastSync({change});
        return;
      }

      const table = this.synqTables![change.table_name];
      let recordData: any;
      if (change.data) {
        try {
          recordData = JSON.parse(change.data);
        }
        catch(err) {
          this.log.debug(change);
          throw new Error('Invalid data for insert or update');
        }
      }
      else {
        // There's no data so bail
        throw new Error(`Cannot perform update with empty data:\n${JSON.stringify(change, null, 2)}`);
      }
 
      if (!table) throw new Error(`Unable to find table ${change.table_name}`);
      this.log.silly('@applyChange', {change, table, changeStatus});
      switch(change.operation) {
        case 'INSERT':
        case 'UPDATE':
          const insertSql = this.createInsertFromObject({
            data: recordData,
            table_name: change.table_name
          });
          await this.run({sql: insertSql, values: recordData});
          break;
        case 'DELETE':
          const sql = `DELETE FROM ${change.table_name} WHERE ${table.id} = ?`;
          this.log.warn('>>> DELETE SQL <<<', sql, change.row_id);
          await this.run({sql, values: [change.row_id]});
          break;
      }

      await this.updateLastSync({change});

      // Insert merged VClock data
      const updatedRecordMeta = await this.insertRecordMeta({change, vclock: changeStatus.vclock});
      this.log.silly({updatedRecordMeta});
    }
    catch (error) {
      await this.rollbackTransaction({savepoint})
      this.log.error(`Error applying change: ${error}. Rolled back.`);
      throw error; // Throw the error to trigger rollback
    }
  }
  
  async applyChangesToLocalDB({ changes, restore = false }: { changes: Change[], restore?: boolean }) {
    await this.disableTriggers();
    // Split changes into batches
    for (let i = 0; i < changes.length; i += this.synqBatchSize) {
      const batch = changes.slice(i, i + this.synqBatchSize);
  
      // Create savepoint and apply each batch within a transaction
      const savepoint = await this.beginTransaction();
      try {
        for (const change of batch) {
          await this.applyChange({change, restore, savepoint})
        }

        // Commit the changes for this batch
        await this.commitTransaction({savepoint});

      } catch (error) {
        await this.rollbackTransaction({savepoint})
        this.log.error(`Transaction failed, changes rolled back: ${error}`);
        // Handle transaction failure (e.g., log, retry logic, notification)
      }
    }
    await this.enableTriggers();
    this.log.silly(`Applied ${changes.length} change(s)`);
  };

  async tablesReady(): Promise<void> {
    await this.enableTriggers();
  }
}