import { test, expect } from '@playwright/test';
import { createStatements as defaultPreInit, pageInit, postCreate, setupDb } from './setup';
import { Logger } from 'tslog';
import { LogLevel } from '../src/lib/types';
import { closeDb } from './utils';
import { nanoid } from 'nanoid';

const log = new Logger({ name: 'TinySynq Testing', minLevel: LogLevel.Debug, type: 'pretty' });

test.describe.only('CRUD', () => {
  test('UPDATE is applied correctly', async ({page}) => {
    test.setTimeout(20000);
    
    await pageInit({page, log});
    //const sq = getConfiguredDb({useDefault: true});
    const preInit = defaultPreInit;

    await page.evaluate(setupDb, [preInit, LogLevel]);
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

});