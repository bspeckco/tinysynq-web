import { test, expect } from '@playwright/test';
import { createStatements as defaultPreInit, pageInit, postCreate, setupDb } from './setup';
import { Logger } from 'tslog';
import { LogLevel } from '../src/lib/types';
import { closeDb } from './utils';
import { nanoid } from 'nanoid';
import { TinySynq } from '../src/lib/tinysynq.class';
import { TINYSYNQ_ID_SIZE} from '../src/lib/constants';

const log = new Logger({ name: 'TinySynq Testing', minLevel: LogLevel.Debug, type: 'pretty' });

test.describe('Sync', () => {
  test.describe('vclock', () => {
    test.beforeEach(async ({page}) => {
      test.setTimeout(5000);
  
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
        const originalMeta = await sq.getRecordMeta({
          table_name: 'message', row_id: message.message_id
        });
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
        return meta;
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
      const { changes, newMeta, originalMeta, message } = await page.evaluate(async ([remoteId]) => {
        const sq = window['sq'];
        const tst = window['tst'];
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
        const fixed = {'message_member_id': randomMember?.member_id }
        const constraints = new Map(Object.entries({
          'message_member_id':'member',
        }));
        const changes = await tst.generateChangesForTable({
          sq,
          table: 'message',
          origin: remoteId,
          operation: 'UPDATE',
          fixed,
          constraints,
          target: randomMessage.message_id,
        });
        // Ensure this change is newer
        changes[0].modified = sq.utils.utcNowAsISO8601();
      
        sq.log.trace('@@@@ >>> GENERATED CHANGES >>> @@@@', {changes});
        const message = await sq.getRecord({
          table_name: 'message', row_id: changes[0].row_id
        });
        const originalMeta = await sq.getRecordMeta({
          table_name: 'message', row_id: changes[0].row_id
        });

        await sq.applyChangesToLocalDB({ changes });
        
        // Change might not be immediately visible, wait a moment.
        await tst.wait({ms: 100});
        const newMeta = await sq.getRecordMeta({
          table_name: 'message', row_id: changes[0].row_id
        });
        return { newMeta, originalMeta, changes, message }
      }, [remoteId]);

      log.trace('<<!!! CHANGES !!!>>', {changes, message, originalMeta, newMeta});

      await closeDb(page);
      expect(newMeta.vclock).toMatch(JSON.stringify({[localId]: 1, [remoteId]: 1}));
    });
    
    test('should increment a local ID in vclock with another participant', async ({page}) => {
      const remoteId = nanoid(TINYSYNQ_ID_SIZE);
      const updatedText = `Updated to ${performance.now()}`;
      const {localId, finalMeta} = await page.evaluate(async ([remoteId, updatedText]) => {
        const sq = window['sq'];
        const tst = window['tst'];
        const localId = sq.deviceId;
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
        const fixed = {'message_member_id': randomMember?.member_id }
        const constraints = new Map(Object.entries({
          'message_member_id':'member',
        }));
        const changes = await tst.generateChangesForTable({
          sq,
          table: 'message',
          origin: remoteId,
          fixed,
          total: 1,
          constraints,
          operation: 'UPDATE',
          target: randomMessage.message_id
        });
        changes[0].modified = new Date().toISOString();
      
        await sq.applyChangesToLocalDB({ changes });
        
        // Change might not be immediately visible, wait a moment.
        await tst.wait({ms: 100});
        const meta = await sq.getRecordMeta({table_name: 'message', row_id: changes[0].row_id});

        const message = await sq.getRecord({
          table_name: 'message', row_id: changes[0].row_id
        });
        const originalMeta = await sq.getRecordMeta({
          table_name: 'message', row_id: changes[0].row_id
        });
        message.message_text = updatedText;
        const sql = await sq.createInsertFromObject({
          data: message,
          table_name: 'message'
        });
        await sq.runQuery({sql, values: message});
        const finalMeta = await sq.getRecordMeta({table_name: 'message', row_id: message.message_id});
        return {changes, message, meta, localId, finalMeta}
      }, [remoteId, updatedText]);

      await closeDb(page);
      expect(JSON.parse(finalMeta.vclock)).toMatchObject({[remoteId]: 1, [localId]: 2});
    });
  });

  test.describe('changes', () => {
    test.beforeEach(async ({page}) => {
      test.setTimeout(5000);
  
      await pageInit({page, log});
      //const sq = getConfiguredDb({useDefault: true});
      const preInit = defaultPreInit;
  
      await page.evaluate(setupDb, [preInit, LogLevel]);
      await page.evaluate(postCreate);
    });

    test('should move to pending when received out of order', async ({page}) => {
      const {randomMessage, pending} = await page.evaluate(async () => {
        const sq = window['sq'];
        const tst = window['tst'];
        const deviceId = sq.getNewId();
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
        sq.log.warn('<<< RETRIEVED RANDOM >>>', { randomMember, randomMessage });
        const fixed = {'message_member_id': randomMember?.member_id }
        const constraints = new Map(Object.entries({
          'message_member_id':'member',
        }));
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
        changes[0].vclock[deviceId] = 2; // <- This is what makes it appear out of order
        await sq.applyChangesToLocalDB({ changes });
        const pending = await sq.getPending();

        return {randomMember, randomMessage, pending};
      });
      log.debug({randomMessage, pending});

      await closeDb(page);
      expect(pending.length).toBe(1);
      expect(pending[0].row_id).toBe(randomMessage.message_id);
    });

    test('should move to pending when attempting to update non-existent record', async({page}) => {
      const pending = await page.evaluate(async () => {
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
        const target = sq.getNewId();
        const fixed = {'message_member_id': randomMember?.member_id }
        const changes = await tst.generateChangesForTable({
          sq, 
          table: 'message',
          origin: deviceId,
          total: 1,
          constraints,
          fixed,
          operations: ['UPDATE'],
          target: randomMessage.message_id,
        });
        sq.log.debug('<<<< PRE APPLY >>>>', {deviceId, randomMember, randomMessage, changes});

        // Slow way for now, smart way later
        changes[0].row_id = target;
        const modifiedRowData = JSON.parse(changes[0].data);
        modifiedRowData.message_id = target;
        changes[0].data = JSON.stringify(modifiedRowData);

        await sq.applyChangesToLocalDB({ changes });
        const pending = await sq.getPending();
        return pending;
      });

      await closeDb(page);
      expect(pending.length).toBe(1);
    });

    test('when conflicted should keep REMOTE changes if they are newer', async ({page}) => {
      const {updatedRecord, incoming} = await page.evaluate(async () => {
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
        const metaParams = {
          table_name: 'message',
          row_id: randomMessage.message_id
        };
        const currentMeta = sq.getRecordMeta(metaParams);
        const alteredMeta = await tst.alterRecordMeta({
          sq,
          ...metaParams,
          updates: {
            modified: tst.getRandomDateTime({asString: false}) as Date,
            vclock: {[sq.deviceId!]: 1}
          }
        });
        sq.log.warn({currentMeta, alteredMeta, randomMessage});
        const target = randomMessage.message_id;
        const fixed = {'message_member_id': randomMember?.member_id }
        
        await tst.wait(100) // Ensure it ends up with a newer timestamp

        const changes = await tst.generateChangesForTable({
          sq, 
          table: 'message',
          origin: deviceId,
          total: 1,
          constraints,
          fixed,
          target,
          operations: ['UPDATE'],
        });
        
        changes[0].vclock[sq.deviceId] = 0;
        await sq.applyChangesToLocalDB({ changes });

        const updatedRecord = await sq.getById(metaParams);
        const incoming = JSON.parse(changes[0].data);

        return {updatedRecord, incoming};
      });

      await closeDb(page);
      expect(updatedRecord.message_text).toEqual(incoming.message_text);
      expect(updatedRecord.message_updated).toEqual(incoming.message_updated);
    });

    test('when conflicted should keep LOCAL changes if they are newer', async ({page}) => {
      const {
        randomMessage, messageMeta, updatedRecord, updatedMeta, lastSyncBefore, lastSyncAfter
      } = await page.evaluate(async () => {
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
        const metaParams = {
          table_name: 'message',
          row_id: randomMessage.message_id
        };
        const messageMeta = await sq.getRecordMeta(metaParams);
        const lastSyncBefore = await sq.getLastSync();
        const target = randomMessage.message_id;
        const fixed = {'message_member_id': randomMember.member_id }
        const changes = await tst.generateChangesForTable({
          sq, 
          table: 'message',
          origin: deviceId,
          total: 1,
          constraints,
          fixed,
          target,
          operations: ['UPDATE'],
        });
        sq.log.warn('<<< CHANGES PRE >>>', changes, randomMessage)
        // Make the incoming change older to simulate stale change
        changes[0].modified = tst.getRandomDateTime();
        sq.log.warn('<<< CHANGES POST >>>', changes, randomMessage)
        await sq.applyChangesToLocalDB({ changes });
        
        const updatedRecord = await sq.getById(metaParams);
        const updatedMeta = await sq.getRecordMeta(metaParams);
        const lastSyncAfter = await sq.getLastSync();

        return {randomMessage, messageMeta, updatedRecord, updatedMeta, lastSyncBefore, lastSyncAfter};
      });
      log.warn({updatedRecord, randomMessage, updatedMeta, messageMeta});

      await closeDb(page);
      expect(updatedRecord).toMatchObject(randomMessage);
      expect(updatedMeta).toEqual(messageMeta);
      expect(lastSyncBefore).not.toEqual(lastSyncAfter);
    });
  });
});