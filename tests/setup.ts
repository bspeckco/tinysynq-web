import type { TinySynq } from "../src/lib/tinysynq.class";
import { nanoid } from 'nanoid';

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

export const postCreate = async ({ db }: { db: TinySynq }) => {
  // Create some records
  const savepoint = await db.beginTransaction();

  console.debug('::: BEGINNING TRANSACTION:', db.constructor.name); 
  try {
    for (let i = 0; i < 20; i++) {
      const id = nanoid(16);
      await db.runQuery({
        sql:`
        INSERT INTO member (member_id, member_name, member_status)
        VALUES (:member_id, :member_name, :member_status)`,
        values: [id, `member:${id}`, 'ONLINE']
      });
    }
    for (let i = 0; i < 20; i++) {
      const id = nanoid(16);
      await db.runQuery({
        sql:`
        INSERT INTO message (message_id, message_text, message_member_id)
        SELECT :message_id, :message_text, member_id
        FROM member
        ORDER BY RANDOM()
        LIMIT 1`,
        values: [ id, `${id} message text ${Date.now()}` ]
      });
    }
    await db.commitTransaction({ savepoint });
  }
  catch(err) {
    console.error('::: TRANSACTION FAILED!', err);
    await db.rollbackTransaction({ savepoint });
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
  const [preInit, LogLevel, funcDef] = args;
  const { tinysynq } = window as TestWindow;
  try {
    window['sq'] = await tinysynq({
      filePath: 'pwtst.db',
      prefix: 'pwtst',
      tables: [
        { name: 'member', id: 'member_id'},
        { name: 'message', id: 'message_id'}
      ],
      preInit,
      logOptions: {
        name: 'test-tinysynq',
        minLevel: LogLevel['Trace'],
        type: 'pretty'
      }
    });
    return window['sq']?.deviceId;
  }
  catch(err) {
    console.error('\n >>>>> ERR! Unable to complete setup <<<<<\n', err);
    return false;
  }
}