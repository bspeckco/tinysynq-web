import initTinySynq from './lib/index.js';
import { TinySynqClient } from './lib/client.js';

export { TinySynqClient, initTinySynq };

export type { 
  SyncableTable,
  TinySynqOptions,
  TinySynqOptionsBase,
  Change,
  QueryParams,
  SQLiteWASM,
} from './lib/types.js';

export type {
  TinySynq,
  GetTableIdColumnParams
} from './lib/tinysynq.class.js';