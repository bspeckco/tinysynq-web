import { test, expect } from '@playwright/test';
import { createStatements as defaultPreInit, pageInit, postCreate, setupDb } from './setup';
import { Logger } from 'tslog';
import { LogLevel } from '../src/lib/types';
import { closeDb } from './utils';
import { nanoid } from 'nanoid';
import { TinySynq } from '../src/lib/tinysynq.class';
import { TINYSYNQ_ID_SIZE} from '../src/lib/constants';

const log = new Logger({ name: 'TinySynq Testing', minLevel: LogLevel.Debug, type: 'pretty' });

test.describe.only('Sync', () => {
  test.describe('vclock', () => {
    test.beforeEach(async ({page}) => {
      test.setTimeout(20000);
  
      await pageInit({page, log});
      //const sq = getConfiguredDb({useDefault: true});
      const preInit = defaultPreInit;
  
      await page.evaluate(setupDb, [preInit, LogLevel]);
      await page.evaluate(postCreate);
    });

    test('should increment by 1', async ({page}) => {
      const deviceId = await page.evaluate(async () => {
        return window['sq'].deviceId;
      });
      const {message, originalMeta} = await page.evaluate(async () => {
        const sq = window['sq'] as TinySynq;
        const message = (
          await sq.runQuery({
            sql: 'SELECT * FROM message LIMIT 1'
          })
        )[0];
        const originalMeta = (
          await sq.getRecordMeta({
            table_name: 'message', row_id: message.message_id
          })
        )[0];
        return {message, originalMeta};
      });
      
      const meta: any = await page.evaluate(async ([message]) => {
        const sq = window['sq'] as TinySynq;
        const table_name = 'message';
        if (!message) return;
        
        const originalMeta = await sq.getRecordMeta({table_name, row_id: message.message_id});
        if (!originalMeta) return;
 
        message.message_text = `Updated at ${Date.now()}`;
        const insertSql = sq.createInsertFromObject({data: message, table_name});
        await sq.runQuery({sql: insertSql, values: message});
        const meta = await sq.getRecordMeta({table_name, row_id: message.message_id});
        return meta[0];
      }, [message]);

      await closeDb(page);

      expect(originalMeta.vclock).toMatch(JSON.stringify({[deviceId]: 1}));
      expect(meta).toBeTruthy();
      expect(meta.vclock).toMatch(JSON.stringify({[deviceId]: 2}) as any);
    });

    test.only('should add another participant', async ({page}) => {
      const localId = await page.evaluate(async () => {
        return window['sq'].deviceId;
      });
      const remoteId = nanoid(TINYSYNQ_ID_SIZE);
      const changes = await page.evaluate(async ([remoteId]) => {
        const sq = window['sq'];
        const tst = window['tst'];
        const changes = await tst.generateChangesForTable({
          sq,
          table: 'message',
          origin: remoteId,
          operation: 'UPDATE',
        });
      
        sq.log.trace('@@@@ >>> GENERATED CHANGES >>> @@@@', {changes});

        return changes;
      }, [remoteId]);
      log.trace('<<!!! CHANGES !!!>>', {changes});

      const {message, originalMeta} = await page.evaluate(async ([row_id]) => {
        const sq = window['sq'] as TinySynq;
        const message = (
          await sq.runQuery({
            sql: 'SELECT * FROM message WHERE message_id = :message_id',
            values: {message_id: row_id}
          })
        )[0];
        const originalMeta = (
          await sq.getRecordMeta({
            table_name: 'message', row_id
          })
        );
        return {message, originalMeta};
      }, [changes[0].message_id]);
      log.trace('<<!!! DATA !!!>>', {message, originalMeta});

      const newMeta = await page.evaluate(async ([changes]) => {
        const sq = window['sq'];
        const tst = window['tst'];
        sq.applyChangesToLocalDB({ changes });
        
        // Change might not be immediately visible, wait a moment.
        await tst.wait({ms: 100});
        const meta = sq.getRecordMeta({table_name: 'message', row_id: changes[0].row_id});
        return meta
      }, [changes]);
      log.trace('<<!!! NEW META !!!>>', {newMeta});

      await closeDb(page);
      expect(newMeta[0].vclock).toMatch(JSON.stringify({[localId]: 1, [remoteId]: 1}));
    }); 
  });
});