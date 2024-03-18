import { test, expect } from '@playwright/test';
import { createStatements as defaultPreInit, pageInit, postCreate, setupDb } from './setup';
import { Logger } from 'tslog';
import { LogLevel, TinySynqOperation } from '../src/lib/types';
import { closeDb } from './utils';
import { nanoid } from 'nanoid';

const log = new Logger({ name: 'TinySynq Testing', minLevel: LogLevel.Debug, type: 'pretty' });

test.describe('CRUD', () => {

  test.beforeEach(async ({page}) => {
    test.setTimeout(20000);

    await pageInit({page, log});
    //const sq = getConfiguredDb({useDefault: true});
    const preInit = defaultPreInit;

    await page.evaluate(setupDb, [preInit, LogLevel]);
  });

  test('UPDATE is applied correctly', async ({page}) => {
    const records = await page.evaluate(postCreate);
    expect(records).toHaveLength(20);
    const record = records[0];
    
    const updateText = `Updated message text ${nanoid(16)}`;
    const updated = await page.evaluate(async ([updateText]) => {
      const table = 'message';
      const sq = window['sq'];
      // Simulate changes

      const sql = `SELECT * FROM ${table} ORDER BY RANDOM() LIMIT 1`;
      const random = (await sq.runQuery({sql}))[0];

      if (!random) {
        sq.log.error('Random is empty', {random});
        return;
      }

      const changes = [
        { 
          id: 1,
          table_name: table,
          row_id: random.message_id,
          operation: 'UPDATE',
          data: JSON.stringify({message_id: random.message_id, message_text: updateText }),
          modified: sq.utils.utcNowAsISO8601(),
          vclock: {[sq.deviceId!]: 2}
        },
      ];
      await sq.applyChangesToLocalDB({changes});
      // Verify changes were applied
      const updated: any = (
        await sq.runQuery({sql: 'SELECT * FROM message WHERE message_id = :message_id', values: {message_id: random.message_id}})
      )[0];
      sq.log.warn({updated, random})
      return updated;
    }, [updateText, record]);

    await closeDb(page);
    expect(updated.message_text).toBe(updateText);
  });

  test('DELETE is applied correctly', async ({page}) => {
    const records = await page.evaluate(postCreate);
    expect(records).toHaveLength(20);

    const deleted = await page.evaluate(async () => {
      const table_name = 'message';
      const sq = window['sq'];
      const sql = `SELECT * FROM ${table_name} ORDER BY RANDOM() LIMIT 1`;
      const existing = (await sq.runQuery({sql}))[0];
      const existingMeta = await sq.getRecordMeta({table_name, row_id: existing.message_id});
      const vclock = JSON.parse(existingMeta.vclock);
      vclock[sq.deviceId!] = vclock[sq.deviceId!] + 1;

      // Simulate UPDATE
      const changes = [
        { 
          id: 2,
          table_name,
          row_id: existing.message_id,
          operation: 'DELETE',
          data: JSON.stringify({ name: `Deleted message` }),
          modified: sq.utils.utcNowAsISO8601(),
          vclock,
        },
      ];

      await sq.applyChangesToLocalDB({changes});

      // Verify item was deleted were applied
      const deleted = await sq.runQuery({
        sql: 'SELECT * FROM message WHERE message_id = :message_id',
        values: {message_id: existing.message_id}
      });
      sq.log.warn({deleted, existing})
      return deleted[0];
    });

    await closeDb(page);
    expect(deleted).toBeFalsy();
  });
  
  test.only('INSERT is applied correctly', async ({page}) => {
    const records = await page.evaluate(postCreate);
    expect(records).toHaveLength(20); 

    const now = new Date().toISOString().replace('Z', '');
    const inserted = await page.evaluate(async ([now]) => {
      const table_name = 'message';
      const sq = window['sq'];
      const randomMember = (
        await sq.runQuery({
          sql: `SELECT * FROM member ORDER BY RANDOM() LIMIT 1`
        })
      )[0];
      sq.log.warn({randomMember})
      if (!randomMember) return;

      const messageId = sq.getNewId();
      const changes = [
        {
          id: 3,
          table_name,
          row_id: messageId,
          operation: 'INSERT',
          data: JSON.stringify({
            message_id: messageId,
            message_member_id: randomMember.member_id,
            message_text: `Inserted message ${messageId}`,
            message_created: now,
            message_updated: null,
            message_deleted: null 
          }),
          modified: sq.utils.utcNowAsISO8601(),
          vclock: {[sq.deviceId!]: 1}
        },
      ];
      await sq.applyChangesToLocalDB({changes});
      const inserted = await sq.getRecord({table_name: 'message', row_id: messageId});
      sq.log.warn({inserted});

      return inserted;
    }, [now]);

    await closeDb(page);
    expect(inserted).toBeTruthy();
    expect(inserted.message_created).toEqual(now);
  });
});