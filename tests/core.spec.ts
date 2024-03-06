import { test, expect, chromium } from '@playwright/test';
import { createStatements as defaultPreInit, pageInit, setupDb } from './setup';
import { Logger } from 'tslog';
import { LogLevel } from '../src/lib/types';
import { closeDb } from './utils';

const log = new Logger({ name: 'TinySynq Testing', minLevel: LogLevel.Debug, type: 'pretty' });

test.describe('TinySynq', () => {
  test('loads successfully', async ({page}) => {
    test.setTimeout(20000);

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
    test.setTimeout(20000);

    await pageInit({page, log});
    
    const preInit = defaultPreInit;
    const instanceId = await page.evaluate(setupDb, [preInit, LogLevel]);
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
});
