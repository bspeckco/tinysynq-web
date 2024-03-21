import initTinySynq from './lib/index.js';
import { TinySynqClient } from './lib/client.js';

export { TinySynqClient, initTinySynq };

export type {
  Change,
  LogLevel,
  QueryParams,
  SQLiteWASM,
  SyncableTable,
  TinySynqOptions,
  TinySynqOptionsBase,
} from './lib/types.js';

export type {
  GetTableIdColumnParams,
  TinySynq,
} from './lib/tinysynq.class.js';