import type { SynQLite } from "../src/lib/synqlite.class";
import { nanoid } from 'nanoid';

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

export const postCreate = async ({ db }: { db: SynQLite }) => {
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