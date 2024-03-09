import type { TinySynq } from "../src/lib/tinysynq.class";
import { nanoid } from 'nanoid';
import { getRandomDbPath } from "./utils";
import { TinySynqOptions } from "../src/lib/types";

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
  )`
];

export const postCreate = async () => {
  const sq = window['sq'];
  
  // Create some records
  //const savepoint = await sq.beginTransaction();

  //console.debug('::: BEGINNING TRANSACTION:', sq.constructor.name); 
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
    //await sq.commitTransaction({ savepoint });
    const result = await sq.runQuery({
      sql: `SELECT * FROM message`
    });
    sq.log.warn('<<<< RESULT >>>>', result.length);
    return result;
  }
  catch(err) {
    console.error('::: TRANSACTION FAILED!', err);
    //await sq.rollbackTransaction({ savepoint });
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

export const setupDb = async (args: any[]) => {
  const [preInit, LogLevel] = args;
  const { tinysynq } = window as TestWindow;
  const randVal = Math.ceil(Math.random() * 1000);
  const filePath = `tst_${randVal}.db`;
  const prefix = `tst_${randVal}`;
console.log('<<<< SETUP >>>>',{filePath, prefix})
  try {
    window['sq'] = await tinysynq({
      filePath,
      prefix,
      tables: [
        { name: 'member', id: 'member_id', editable: ['member_name', 'member_status']},
        { name: 'message', id: 'message_id', editable: ['message_text', 'message_updated']}
      ],
      preInit,
      logOptions: {
        name: 'test-tinysynq',
        minLevel: LogLevel['Trace'],
        type: 'pretty'
      }
    } as TinySynqOptions);
    return window['sq']?.deviceId;
  }
  catch(err) {
    console.error('\n >>>>> ERR! Unable to complete setup <<<<<\n', err);
    return false;
  }
}