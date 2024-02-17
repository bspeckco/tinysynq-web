import { sqlite3Worker1Promiser } from '@sqlite.org/sqlite-wasm';
import { SYNQLITE_BATCH_SIZE, SYNQLITE_PREFIX } from './constants.js';
import { ApplyChangeParams, Change, LogLevel, SynQLiteOptions, SyncableTable } from './types.js';
import { Logger, ILogObj, ISettingsParam } from 'tslog';

const log = new Logger({ name: 'synqlite-web-init', minLevel: LogLevel.Info });
const strtimeAsISO8601 = `STRFTIME('%Y-%m-%dT%H:%M:%f','NOW')`;

export class SynQLite {
  private _db: any;
  private _dbName: string;
  private _synqDbId?: string;
  private _synqPrefix?: string;
  private _synqTables?: SyncableTable[];
  private _synqBatchSize: number = 20;
  private _wal = false;
  private log: Logger<ILogObj>;

  utils = {
    strtimeAsISO8601,
    nowAsISO8601: strtimeAsISO8601,
    utcNowAsISO8601: (): string => {
      return new Date((new Date()).toUTCString()).toISOString();
    }
  }

  constructor(initData: SynQLiteOptions) {
    this._dbName = initData.filename || '';
    this._db = initData.sqlite3 || undefined;
    this._synqPrefix = initData.prefix;
    this._synqTables = initData.tables;
    this._synqBatchSize = initData.batchSize || this._synqBatchSize;
    this._wal = initData.wal ?? false;
    this.log = new Logger({
      name: 'synqlite-web',
      minLevel: LogLevel.Info,
      type: 'json',
      maskValuesOfKeys: ['password', 'encryption_key'],
      hideLogPositionForProduction: true,
      ...(initData.logOptions || {})
    });
  }

  async init() {
    if (this.db) return Promise.resolve(this.db); // @TODO: test DB connection
    if (!this.dbName) return Promise.reject('No DB filename or connection provided');

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
          this.log.debug(`open ${this.dbName}...`);
          res = await promiser('open', {
            filename: `file:${this.dbName}?vfs=opfs`,
          });
  
          this.log.info(
            'OPFS is available, created persisted database at',
            res.result.filename.replace(/^file:(.*?)\?vfs=opfs$/, '$1'),
          );
        }
        catch(err) {
          // Probably no vfs
          res = await promiser('open', {
            filename: `file:${this.dbName}`
          });
          this.log.info(
            'OPFS not available, created in-memory database at',
            res.result.filename, '$1'
          );
        }
  
        if (!res) return reject('Unable to start DB');

        const { dbId } = res;
        this._synqDbId = dbId;
      
        const conf = await promiser('config-get', {});
        this.log.info('Running SQLite3 version', conf.result.version.libVersion);
        
        this._db = promiser;
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

  get db() {
    return this._db;
  }

  get dbName() {
    return this._dbName;
  }

  get synqDbId() {
    return this._synqDbId;
  }

  get synqPrefix() {
    return this._synqPrefix;
  }

  get synqTables() {
    return this._synqTables;
  }

  get synqBatchSize() {
    return this._synqBatchSize;
  }

  get wal() {
    return this._wal;
  }

  async runQuery<T>({sql, values}: {sql: string, values?: any[]}): Promise<T> {
    const quid = Math.ceil(Math.random() * 1000000);
    this.log.debug('@runQuery', quid, sql, values, '/');
    const dbId = this.synqDbId;
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      try {
        this.db('exec', {
          dbId,
          sql, // I think we can make this sexier, in Minmail
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

  async getLastSync() {
    const res = await this.runQuery<any[]>({
      sql:`
        SELECT * FROM ${this.synqPrefix}_meta
        WHERE meta_name = 'last_local_sync'`
    });
    return res[0];
  }
  
  async getChangesSinceLastSync({db, lastSync}: {db: any, lastSync?: string}) {
    let lastLocalSync: string = lastSync || (await this.getLastSync()).last_local_sync;
    this.log.debug('@getChangesSinceLastSync', lastLocalSync);
  
    let where: string = '';
  
    if (lastLocalSync) {
      where = 'WHERE modified_at > ?'
    }
    const sql = `
    SELECT * FROM ${this.synqPrefix}_changes
      ${where}
      ORDER BY modified_at ASC
    `;
    const values = lastLocalSync ? [lastLocalSync] : [];
    this.log.debug(sql, values);
  
    return this.runQuery<Change[]>({sql, values});
  };

  private enableTriggers() {
    return this.runQuery({
      sql: `
      INSERT OR REPLACE INTO ${this.synqPrefix}_meta (meta_name, meta_value)
      VALUES ('triggers_on', '1')
      RETURNING *;
      `
    });
  }

  private disableTriggers() {
    return this.runQuery({
      sql: `
      INSERT OR REPLACE INTO ${this.synqPrefix}_meta (meta_name, meta_value)
      VALUES ('triggers_on', '0')
      RETURNING *;
      `
    });
  }

  private async beginTransaction(): Promise<string> {
    const savepoint = `SP${Date.now()}`;
    const sql = `SAVEPOINT ${savepoint};`;
    await this.runQuery({sql});
    return savepoint
  }

  private async commitTransaction({savepoint}: {savepoint: string}) {
    const sql = `RELEASE SAVEPOINT ${savepoint};`;
    return this.runQuery({sql});
  }

  private async rollbackTransaction({savepoint}: {savepoint: string}) {
    const sql = `ROLLBACK TRANSACTION TO SAVEPOINT ${savepoint};`;
    return this.runQuery({sql}); 
  }

  private async applyChange({
    change,
    savepoint
  }: ApplyChangeParams) {
    try {
      const table = this.synqTables?.find(t => t.name === change.table_name);
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
        
      if (!table) throw new Error(`Unable to find table ${change.table_name}`);
      switch(change.operation) {
        case 'UPDATE':
          const columnsToUpdate = Object.keys(recordData).map(key => `${key} = :${key}`).join(', ');
          const updateValues = { ...recordData, [table.id]: change.row_id};
          const updateSql = `UPDATE ${change.table_name} SET ${columnsToUpdate} WHERE ${table.id} = :${table.id}`;
          // this.log.debug('@performing update... sql:', updateSql, updateValues);
          await this.runQuery({sql: updateSql, values: updateValues});
          break;
        case 'INSERT':
          const columnsToInsert = Object.keys(recordData).join(',');
          const insertPlaceholders = Object.keys(recordData).map(k => `:${k}`).join(',')
          const insertSql = `INSERT OR REPLACE INTO ${change.table_name} (${columnsToInsert}) VALUES (${insertPlaceholders});`;
          // this.log.debug('@performing insert... sql:', insertSql, recordData);
          await this.runQuery({sql: insertSql, values: recordData});
          break;
        case 'DELETE':
          const sql = `DELETE FROM ${change.table_name} WHERE ${table.id} = ?`;
          await this.runQuery({sql, values: [change.row_id]});
          break;
      }

      // @TODO: do we need last_sync_local per table?
      this.runQuery({
        sql: `INSERT OR REPLACE INTO ${this.synqPrefix}_meta (meta_name, meta_value) VALUES('last_local_sync', STRFTIME('%Y-%m-%d %H:%M:%f','NOW'))`,
      });
    }
    catch (error) {
      await this.rollbackTransaction({savepoint})
      this.log.error(`Error applying change: ${error}`);
      throw error; // Throw the error to trigger rollback
    }
  }
  
  async applyChangesToLocalDB(changes: Change[]) {
    await this.disableTriggers();
    // Split changes into batches
    for (let i = 0; i < changes.length; i += this.synqBatchSize) {
      const batch = changes.slice(i, i + this.synqBatchSize);
  
      // Create savepoint and apply each batch within a transaction
      const savepoint = await this.beginTransaction();
      try {
        for (const change of batch) {
          await this.applyChange({change, savepoint})
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
    this.log.debug(`Applied ${changes.length} change(s)`)
  };

  async setupTriggersForTable({ table }: { table: SyncableTable }) {
    this.log.debug('Setting up triggers for', table.name);

    // Ensure triggers are up to date
    await this.runQuery({sql: `DROP TRIGGER IF EXISTS ${this.synqPrefix}_after_insert_${table.name}`});
    await this.runQuery({sql: `DROP TRIGGER IF EXISTS ${this.synqPrefix}_after_update_${table.name}`});
    await this.runQuery({sql: `DROP TRIGGER IF EXISTS ${this.synqPrefix}_after_delete_${table.name}`});

    const jsonObject = (await this.runQuery<any>({
      sql:`
      SELECT 'json_object(' || GROUP_CONCAT('''' || name || ''', NEW.' || name, ',') || ')' AS jo
      FROM pragma_table_info('${table.name}');`
    }))[0];
    this.log.debug('@jsonObject', JSON.stringify(jsonObject, null, 2));

    const sql = `
      CREATE TRIGGER IF NOT EXISTS ${this.synqPrefix}_after_insert_${table.name}
      AFTER INSERT ON ${table.name}
      FOR EACH ROW
      WHEN (SELECT meta_value FROM synqlite_meta WHERE meta_name = 'triggers_on')='1'
      BEGIN
        INSERT INTO ${this.synqPrefix}_changes (table_name, row_id, operation, data)
        VALUES ('${table.name}', NEW.${table.id}, 'INSERT', ${jsonObject.jo});
      END;`
    await this.runQuery({sql});

    await this.runQuery({
      sql:`
      CREATE TRIGGER IF NOT EXISTS ${this.synqPrefix}_after_update_${table.name}
      AFTER UPDATE ON ${table.name}
      FOR EACH ROW
      WHEN (SELECT meta_value FROM synqlite_meta WHERE meta_name = 'triggers_on')='1'
      BEGIN
        INSERT INTO ${this.synqPrefix}_changes (table_name, row_id, operation, data)
        VALUES ('${table.name}', NEW.${table.id}, 'UPDATE', ${jsonObject.jo});
      END;`
    });

    await this.runQuery({
      sql:`
      CREATE TRIGGER IF NOT EXISTS ${this.synqPrefix}_after_delete_${table.name}
      AFTER DELETE ON ${table.name}
      FOR EACH ROW
      WHEN (SELECT meta_value FROM synqlite_meta WHERE meta_name = 'triggers_on')='1'
      BEGIN
        INSERT INTO ${this.synqPrefix}_changes (table_name, row_id, operation) VALUES ('${table.name}', OLD.${table.id}, 'DELETE');
      END;`
    });

    await this.enableTriggers();
    this.log.debug(`@@@\nTriggers ready\n@@@`)
  }
}

export const setupDatabase = async ({
  filename,
  sqlite3,
  prefix = SYNQLITE_PREFIX,
  tables,
  batchSize = SYNQLITE_BATCH_SIZE,
  wal = false,
  preInit = [],
  postInit = [],
  logOptions
}: SynQLiteOptions) => {
  /*
  @TODO:
   - check if DB path exists (throw if not)
   - check if table names have been provided (throw if not)
   - check if table names exist (throw if not)
  */
  const db = new SynQLite({
    filename,
    sqlite3,
    prefix,
    tables,
    batchSize,
    wal,
    logOptions
  });
  log.debug('@SynQLite db', db)
  
  // Initialise the DB
  try {
    await db.init();
  }
  catch(err) {
    log.error(err);
    throw err;
  }

  prefix = prefix?.trim().replace(/[^a-z0-9]+$/gi, '');
  log.debug({prefix, batchSize})

  // Set WAL mode if necessary
  if (wal === true) {
    await db.runQuery({
      sql: `PRAGMA journal_mode=WAL;`
    });
  }

  if (preInit?.length > 0) {
    for (const preInitQuery of preInit) {
      log.debug(`@@@\npreInit\n${preInitQuery}\n@@@`)
      await db.runQuery({
        sql: preInitQuery
      });
    }
  }
  
  // Create a change-tracking table
  await db.runQuery({
    sql:`
    CREATE TABLE IF NOT EXISTS ${prefix}_changes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name TEXT NOT NULL,
      row_id TEXT NOT NULL,
      data BLOB,
      operation TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
      modified_at TIMESTAMP DATETIME DEFAULT(STRFTIME('%Y-%m-%d %H:%M:%f','NOW'))
    );`
  });
    
  // Create the index
  db.runQuery({
    sql: `CREATE INDEX IF NOT EXISTS ${prefix}_change_modified_idx ON ${prefix}_changes(modified_at)`
  });

  db.runQuery({
    sql:`
    CREATE TABLE IF NOT EXISTS ${prefix}_meta (
      meta_name TEXT NOT NULL PRIMARY KEY,
      meta_value TEXT NOT NULL
    );`
  });
  db.runQuery({
    sql: `CREATE INDEX IF NOT EXISTS ${prefix}_meta_name_idx ON ${prefix}_meta(meta_name)`
  });

  try {
    for (const table of tables) {
      await db.setupTriggersForTable({ table });
    }

    if (postInit?.length > 0) {
      for (const postInitQuery of postInit) {
        log.debug(`@@@\npostInit\n${postInitQuery}\n@@@`)
        await db.runQuery({
          sql: postInitQuery
        });
      }
    }
  }
  catch(err) {
    log.error('Failed to setup triggers', err);
    return null
  }

  return db;
};

export default setupDatabase;