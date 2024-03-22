import { test, expect } from '@playwright/test';
import { createStatements as defaultPreInit, pageInit, postCreate, setupDb } from './setup';
import { Logger } from 'tslog';
import { LogLevel } from '../src/lib/types';
import { closeDb } from './utils';

const log = new Logger({ name: 'TinySynq Testing', minLevel: LogLevel.Debug, type: 'pretty' });

test.describe('TinySynq', () => {
  test.beforeEach(async ({page}) => {
    test.setTimeout(5000);

    await pageInit({page, log});
    const preInit = defaultPreInit;

    await page.evaluate(setupDb, [preInit, LogLevel]);
  });
  
  test('loads successfully', async ({page}) => {
    await pageInit({page, log});

    const preInit = defaultPreInit;
    const instanceId = await page.evaluate(setupDb, [preInit, LogLevel]);

    log.debug({instanceId});
    expect(instanceId).toBeTruthy();

    const isClosed = await closeDb(page);
    expect(isClosed).toBe(true);

    await page.close();
  });

  test('initializer creates necessary tables and triggers', async ({page}) => {
    const instanceId = await page.evaluate(setupDb, [[], LogLevel]);
    expect(instanceId).toBeTruthy();

    // Expected tables to be present
    const tablesValid = await page.evaluate(async ([dbId]) => {
      const db = window['sq'];
      const tables = await db.runQuery({
        sql:`SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '${db.synqPrefix}_%'`
      });
      const expectedTables = ['changes', 'meta', 'record_meta', 'pending', 'dump'];
      return expectedTables.reduce((acc, expectedTable) => {
        return acc && tables.some((table: any) => table.name === `${db._synqPrefix}_${expectedTable}`);
      }, true);
    }, [instanceId]);
    expect(tablesValid).toBe(true);

    // Expect triggers to be present
    const triggerCount = await page.evaluate(async ([dbId]) => {
      const db = window['sq'];
      // Check for the existence of triggers
      const triggers = await db.runQuery({
        sql: `SELECT name FROM sqlite_master WHERE type='trigger' AND name LIKE '${db._synqPrefix}_%'`
      });
      return triggers.length;
    }, [instanceId]);
    expect(triggerCount).toBeGreaterThan(0);
    
    await closeDb(page);
  });
  
  test('sets meta data and change for table row update', async ({page}) => {
    await page.evaluate(postCreate);
    
    const {changes, vclock, deviceId, meta, messageText, updatedMessage} = await page.evaluate(async () => {
      const sq = window['sq'];
      const tst = window['tst'];
      const messageId = 'dummyMessage01';
      
      try {
        await sq.runQuery({
          sql:`
            INSERT INTO message (message_id, message_text, message_member_id)
            SELECT :message_id, :message_text, member_id
            FROM member
            ORDER BY RANDOM()
            LIMIT 1
            RETURNING *`,
          values: { message_id: messageId, message_text: `dummyText01 ${Date.now()}` }
        });
      }
      catch(err) {
        sq.log.error(err);
        sq.log.error(err.stack);
      }
      await tst.wait(1000);

      const message = (
        await sq.runQuery({
          sql:'select * from message'
        })
      )[0];

      const deviceId = sq.deviceId;
      const vclock = {[deviceId]: 1};
      const messageMeta = await sq.getRecordMeta({table_name: 'message', row_id: messageId});
      const messageVClock = JSON.parse(messageMeta.vclock);
      messageVClock[deviceId]++;
      const messageText = `Updated ${messageId}: ${sq.getNewId()}`;
      const updates = [
        { 
          id: 1,
          table_name: 'message',
          row_id: messageId,
          operation: 'UPDATE',
          data: JSON.stringify({message_id: messageId, message_text: messageText}),
          modified: sq.utils.utcNowAsISO8601(),
          vclock: JSON.stringify(messageVClock),
          source: sq.deviceId!,
        },
      ];
      
      await sq.applyChangesToLocalDB({changes: updates});
      const updatedMessage = await sq.getById({table_name: 'message', row_id: messageId})
      const meta = await sq.getRecordMeta({table_name: 'message', row_id: message.message_id});
      const changes = await sq.getFilteredChanges();
      return {changes, vclock, deviceId, meta, messageText, updatedMessage};
    });

    const change = changes.pop();
    expect(deviceId).toBeTruthy();
    expect(meta).toBeTruthy();
    expect(changes).toHaveLength(40);
    expect(change.row_id).toEqual('dummyMessage01');
    expect(change.vclock).toMatch(JSON.stringify(vclock));
    expect(change.source).toMatch(deviceId);
    expect(updatedMessage.message_text).toEqual(messageText);
    
    await closeDb(page);
  });
});
