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

    test('should add another participant', async ({page}) => {
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
    
    test('should increment a local ID in vclock with another participant', async ({page}) => {
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
      }, [changes[0].row_id]);
      log.trace('<<!!! DATA !!!>>', {message, originalMeta});

      const newMeta = await page.evaluate(async ([changes]) => {
        const sq = window['sq'];
        const tst = window['tst'];
        await sq.applyChangesToLocalDB({ changes });
        
        // Change might not be immediately visible, wait a moment.
        await tst.wait({ms: 100});
        const meta = await sq.getRecordMeta({table_name: 'message', row_id: changes[0].row_id});
        return meta
      }, [changes]);
      log.trace('<<!!! NEW META !!!>>', {newMeta});

      const updateText = `Updated to ${performance.now()}`;
      message.message_text = updateText;
      const finalMeta = await page.evaluate(async ([message]) => {
        const sq = window['sq'];
        const sql = await sq.createInsertFromObject({
          data: message,
          table_name: 'message'
        });
        await sq.runQuery({sql, values: message});
        const meta = await sq.getRecordMeta({table_name: 'message', row_id: message.message_id});
        sq.log.warn('<<<< FINAL META >>>>', meta);
        return meta[0];
      }, [message]);
      log.warn('<<<< FINAL META >>>>', finalMeta);

      await closeDb(page);
      expect(JSON.parse(finalMeta.vclock)).toMatchObject({[remoteId]: 1, [localId]: 2});
    });
  });

  test.describe.only('changes', () => {
    test.beforeEach(async ({page}) => {
      test.setTimeout(20000);
  
      await pageInit({page, log});
      //const sq = getConfiguredDb({useDefault: true});
      const preInit = defaultPreInit;
  
      await page.evaluate(setupDb, [preInit, LogLevel]);
      await page.evaluate(postCreate);
    });

    test.only('should move to pending when received out of order', async ({page}) => {
      const {randomMessage, pending} = await page.evaluate(async () => {
        const sq = window['sq'];
        const tst = window['tst'];
        const deviceId = sq.getNewId();
        const constraints = new Map(Object.entries({
          'message_member_id':'member',
        }));
        const randomMember = (
          await tst.getRecordOrRandom({
            sq, table_name: 'member'
          })
        ).data;
        const randomMessage = (
          await tst.getRecordOrRandom({
            sq, table_name: 'message'
          })
        ).data;
        sq.log.trace('<<< RETRIEVED RANDOM >>>', { randomMember, randomMessage });
        const fixed = {'message_member_id': randomMember?.member_id }
        const changes = await tst.generateChangesForTable({
          sq, 
          table: 'message',
          origin: deviceId,
          total: 2,
          constraints,
          fixed,
          operations: ['UPDATE'],
          target: randomMessage.message_id,
        });
        sq.log.debug('<<<< PRE APPLY >>>>', {deviceId, randomMember, randomMessage, changes})
        /**
         * @TODO (?) I guess I forgot to remove this...
         */
        // if (changes[0].operation === 'INSERT') {
        //   changes.reverse();
        // }
        changes[0].vclock[deviceId] = 2; // <- This is what makes it appear out of order
        await sq.applyChangesToLocalDB({ changes });
        const pending = await sq.getPending();

        return {randomMember, randomMessage, pending};
      });
      log.debug({randomMessage, pending});

      expect(pending.length).toBe(1);
      expect(pending[0].row_id).toBe(randomMessage.message_id);
    });
  });
});