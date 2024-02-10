//import { sqlite3Worker1Promiser } from '@sqlite.org/sqlite-wasm';
import { SYNQLITE_BATCH_SIZE, SYNQLITE_PREFIX } from './constants.js';
import { Change, SynQLiteOptions, SyncableTable } from './types.js';
// import pino from 'pino';

declare var sqlite3Worker1Promiser: any; 

console.log({ sqlite3Worker1Promiser });

type ApplyChangeParams = {
  change: Change,
  savepoint: string
}

const strtimeAsISO8601 = `STRFTIME('%Y-%m-%dT%H:%M:%f','NOW')`;

class SynQLite {
  private _db: any;
  private _dbName: string;
  private _synqDbId?: string;
  private _synqPrefix?: string;
  private _synqTables?: SyncableTable[];
  private _synqBatchSize: number = 20;

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
    // @TODO: take code from sqlite-example-app to initialise DB
  }

  async init() {
    if (this.db) return Promise.resolve(this.db); // @TODO: test DB connection
    if (!this.dbName) return Promise.reject('No DB filename or connection provided');

    return new Promise(async (resolve, reject) => {
      try {
        console.debug('get promiser...')
        const promiser: any = await new Promise(async (res) => {
          const _promiser = sqlite3Worker1Promiser({
            onready: () => {
              res(_promiser);
            },
            onerror: (err: any) => {
              console.error('@ERROR', err)
            },
            debug: (...args: any) => {
              console.debug(...args);
            }
          });
        });
        
        console.debug('get config...')
        await promiser('config-get', {});

        let res;
  
        try {
          console.debug(`open ${this.dbName}...`);
          res = await promiser('open', {
            filename: `file:${this.dbName}?vfs=opfs`,
          });
  
          console.log(
            'OPFS is available, created persisted database at',
            res.result.filename.replace(/^file:(.*?)\?vfs=opfs$/, '$1'),
          );
        }
        catch(err) {
          // Probably no vfs
          res = await promiser('open', {
            filename: `file:${this.dbName}`
          });
          console.log(
            'OPFS not available, created in-memory database at',
            res.result.filename, '$1'
          );
        }
  
        if (!res) return reject('Unable to start DB');

        const { dbId } = res;
        this._synqDbId = dbId;
      
        const conf = await promiser('config-get', {});
        console.log('Running SQLite3 version', conf.result.version.libVersion);
        
        this._db = promiser;
        resolve(this);
      }
      catch(err: any) {
        if (!(err instanceof Error)) {
          err = new Error(err.result.message);
        }
        console.error(err.name, err.message);
        console.error(err)
        reject('DB setup failed.');
      }
      console.groupEnd();
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

  async runQuery<T>({sql, values}: {sql: string, values?: any[]}): Promise<T> {
    const dbId = this.synqDbId;
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      try {
        this.db('exec', {
          dbId,
          sql, // I think we can make this sexier, in Minmail
          bind: values,
          callback: (result: any) => {
            if (!result.row) return resolve(results as T);
            const o: any = {};
            result.row.forEach((col: string, i: number) => o[result.columnNames[i]] = result.row[i]);
            results.push(o);
          }
        });
      }
      catch(err) {
        console.error(err);
        reject(err);
      }
    });
  }

  async getLastSync() {
    return this.db.exec(`
      SELECT * FROM ${this.db.synqPrefix}_meta
      WHERE meta_name = 'last_local_sync'`
    ).get();
  }
  
  async getChangesSinceLastSync(db: any, lastSync?: string) {
    let lastLocalSync: string = lastSync || (await this.getLastSync()).last_local_sync;
    console.debug('@getChangesSinceLastSync', lastLocalSync);
  
    let where: string = '';
  
    if (lastLocalSync) {
      where = 'WHERE modified_at > ?'
    }
    const sql = `
    SELECT * FROM ${db.synqPrefix}_changes
      ${where}
      ORDER BY modified_at ASC
    `;
    const values = lastLocalSync ? [lastLocalSync] : [];
    console.debug(sql, values);
  
    return this.runQuery<Change[]>({sql, values});
  };

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

  async applyChange({
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
          console.debug(change);
          throw new Error('Invalid data for insert or update');
        }
      }
        
      if (!table) throw new Error(`Unable to find table ${change.table_name}`);
      switch(change.operation) {
        case 'UPDATE':
          const columnsToUpdate = Object.keys(recordData).map(key => `${key} = :${key}`).join(', ');
          const updateValues = { ...recordData, [table.id]: change.row_id};
          const updateSql = `UPDATE ${change.table_name} SET ${columnsToUpdate} WHERE ${table.id} = :${table.id}`;
          // console.debug('@performing update... sql:', updateSql, updateValues);
          await this.runQuery({sql: updateSql, values: updateValues});
          break;
        case 'INSERT':
          const columnsToInsert = Object.keys(recordData).join(',');
          const insertPlaceholders = Object.keys(recordData).map(k => `:${k}`).join(',')
          const insertSql = `INSERT OR REPLACE INTO ${change.table_name} (${columnsToInsert}) VALUES (${insertPlaceholders});`;
          // console.debug('@performing insert... sql:', insertSql, recordData);
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
      console.error(`Error applying change: ${error}`);
      throw error; // Throw the error to trigger rollback
    }
  }
  
  async applyChangesToLocalDB(changes: Change[]) {
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
        console.error(`Transaction failed, changes rolled back: ${error}`);
        // Handle transaction failure (e.g., log, retry logic, notification)
      }
    }
    console.debug(`Applied ${changes.length} change(s)`)
  };
}

export const setupDatabase = async ({
  filename,
  sqlite3,
  prefix = SYNQLITE_PREFIX,
  tables,
  batchSize = SYNQLITE_BATCH_SIZE,
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
    batchSize
  });
  console.log('@SynQLite db', db)
  
  // Initialise the DB
  try {
    await db.init();
  }
  catch(err) {
    console.error(err);
    throw err;
  }

  prefix = prefix?.trim().replace(/[^a-z0-9]+$/gi, '');
  console.debug({prefix, batchSize})

  // Add a 'last_modified' column to each table you want to sync, if not already present.
  // Example for a table named 'items':
  // db.exec('ALTER TABLE items ADD COLUMN last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL');

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

  for (const table of tables) {
    console.debug('Setting up', table.name, table.id);
    const jsonObject = await db.runQuery<any>({
      sql:`
      SELECT 'json_object(' || GROUP_CONCAT('''' || name || ''', NEW.' || name, ',') || ')' AS jo
      FROM pragma_table_info('${table.name}');`
    });
    console.log(jsonObject, jsonObject.jo)
    const sql = `
      CREATE TRIGGER IF NOT EXISTS ${prefix}_after_insert_${table.name}
      AFTER INSERT ON ${table.name}
      FOR EACH ROW
      BEGIN
        INSERT INTO ${prefix}_changes (table_name, row_id, operation, data)
        VALUES ('${table.name}', NEW.${table.id}, 'INSERT', ${jsonObject.jo});
      END;`
      console.log(sql)
    db.runQuery({sql});

    db.runQuery({
      sql:`
      CREATE TRIGGER IF NOT EXISTS ${prefix}_after_update_${table.name}
      AFTER UPDATE ON ${table.name}
      FOR EACH ROW
      BEGIN
        INSERT INTO ${prefix}_changes (table_name, row_id, operation, data)
        VALUES ('${table.name}', NEW.${table.id}, 'UPDATE', ${jsonObject.jo});
      END;`
    });

    db.runQuery({
      sql:`
      CREATE TRIGGER IF NOT EXISTS ${prefix}_after_delete_${table.name}
      AFTER DELETE ON ${table.name}
      FOR EACH ROW
      BEGIN
        INSERT INTO ${prefix}_changes (table_name, row_id, operation) VALUES ('${table.name}', OLD.${table.id}, 'DELETE');
      END;`
    });
  }

  return db;
};

export default setupDatabase;