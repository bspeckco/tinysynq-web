import { TinySynqOptions } from "../src/lib/types";
import { journalCreateTableQueries } from "./test-data/journal-table.data";
import { testCreateTableUser } from "./test-data/trigger.data";

export type TestWindow = Window & {
  tinysynq?: any;
  sq?: any;
  [key: string]: any
};

export const createStatements = [
  `CREATE TABLE IF NOT EXISTS member (
    member_id TEXT NOT NULL PRIMARY KEY,
    member_name TEXT NOT NULL,
    member_status TEXT NOT NULL, 
    member_created TIMESTAMP DEFAULT(STRFTIME('%Y-%m-%dT%H:%M:%f','NOW')),
    member_updated TIMESTAMP,
    member_deleted TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS message (
    message_id TEXT NOT NULL PRIMARY KEY,
    message_member_id TEXT,
    message_text TEXT NOT NULL,
    message_created TIMESTAMP DEFAULT(STRFTIME('%Y-%m-%dT%H:%M:%f','NOW')),
    message_updated TIMESTAMP,
    message_deleted TIMESTAMP,
    FOREIGN KEY (message_member_id) REFERENCES member (member_id)
  )`,
  ...journalCreateTableQueries,
  testCreateTableUser
];

export const postCreate = async () => {
  const sq = window['sq'];
  
  // Create some records
  try {
    for (let i = 0; i < 20; i++) {
      const id = sq.getNewId();
      await sq.runQuery({
        sql:`
        INSERT INTO member (member_id, member_name, member_status)
        VALUES (:member_id, :member_name, :member_status)`,
        values: {member_id: id, member_name: `member:${id}`, member_status: 'ONLINE'}
      });
    }
    for (let i = 0; i < 20; i++) {
      const id = sq.getNewId();
      await sq.runQuery({
        sql:`
        INSERT INTO message (message_id, message_text, message_member_id)
        SELECT :message_id, :message_text, member_id
        FROM member
        ORDER BY RANDOM()
        LIMIT 1`,
        values: { message_id: id, message_text: `${id} message text ${Date.now()}` }
      });
    }
    const result = await sq.runQuery({
      sql: `SELECT * FROM message`
    });
    sq.log.warn('<<<< RESULT >>>>', result.length);
    return result;
  }
  catch(err) {
    console.error('::: POST-CREATE INSERTS FAILED!', err);
    throw err;
  }
};

export const pageInit = async ({page, log}) => {
  page.on('console', (...args) => {
    log.info(...args);
  });
  await page.goto('http://localhost:8181');
  await page.waitForFunction(() => !!window['tinysynq']);
}

 // @TODO: Need to rethink how args are passed in here.
export const setupDb = async (args: any[]) => {
  if (window['sq']) return window['sq'].deviceId;

  const [preInit, LogLevel] = args;
  const { tinysynq } = window as TestWindow;
  const randVal = Math.ceil(Math.random() * 1000);
  const filePath = `tst_${randVal}.db`;
  const prefix = `tst_${randVal}`;
  
  try {
    window['sq'] = await tinysynq({
      filePath,
      prefix,
      tables: [
        { name: 'member', id: 'member_id', editable: ['member_name', 'member_status']},
        { name: 'message', id: 'message_id', editable: ['message_text', 'message_updated']},
        { name: 'journal', id: 'journal_id', editable: ['journal_name']},
        { name: 'user', id: 'user_id', editable: ['user_admin', 'user_internal', 'user_system']},
      ],
      preInit,
      logOptions: {
        name: 'test-tinysynq',
        minLevel: 2,
        type: 'json'
      }
    } as TinySynqOptions);
    return window['sq']?.deviceId;
  }
  catch(err) {
    console.error('\n >>>>> ERR! Unable to complete setup <<<<<\n', err.message);
    return false;
  }
}