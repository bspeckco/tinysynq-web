export type SyncableTable = {
  name: string;
  id: string;
}

export type SynQLiteOptionsBase = {
  sqlite3?: any;
  filename?: string;
  prefix: string;
  tables: SyncableTable[];
  batchSize?: number;
  wal?: boolean;
}

export type SynQLiteOptions = SynQLiteOptionsBase & (
  {
    sqlite3: any;
  } | {
    filename: string;
  }
)

// @TODO: create types for WASM SQLite3 instance?
export type Database = { }

export type SynqlDatabase = Database & {
  synqPrefix?: string;
  synqTables?: SyncableTable[];
  synqBatchSize: number;
  utils: {
    utcNowAsISO8601: () => string;
    strtimeAsISO8601: string;
  }
  [key: string]: any;
}

export interface SynQLiteInterface {
  synqDbId?: string;
  synqPrefix?: string;
  synqTables?: SyncableTable[];
  synqBatchSize: number;
  utils: {
    utcNowAsISO8601: () => string;
    strtimeAsISO8601: string;
  },
  getLastSync: (db: any) => Promise<string>
}

export type Change = {
  id: number;
  table_name: string;
  row_id: string;
  operation: string;
  data: string; // JSON string
  modified_at: string;
}