import { test, expect } from '@playwright/test';
import { createStatements as defaultPreInit, pageInit, postCreate, setupDb } from './setup';
import { Logger } from 'tslog';
import { LogLevel } from '../src/lib/types';
import { closeDb } from './utils';
import { TINYSYNQ_SAFE_ISO8601_REGEX } from '../src/lib/constants';

const log = new Logger({ name: 'TinySynq Testing', minLevel: LogLevel.Debug, type: 'pretty' });

test.describe('TinySynq', () => {
  test.describe('Utils', () => {
    test.beforeEach(async ({page}) => {
      test.setTimeout(5000);

      await pageInit({page, log});
      const preInit = defaultPreInit;

      await page.evaluate(setupDb, [preInit, LogLevel]);
    });

    test('strftimeAsISO8601 returns a SQLite expression to generate an ISO-8601 string', async ({page}) => {
      const result = await page.evaluate(() => {
        const ts = window['sq'];
        return ts.utils.strftimeAsISO8601;
      });
      expect(result).toBe(`STRFTIME('%Y-%m-%d %H:%M:%f','NOW')`);
    });

    test('nowAsISO8601 returns a SQLite expression to generate an ISO-8601 string', async ({page}) => {
      const result = await page.evaluate(() => {
        const ts = window['sq'];
        return ts.utils.nowAsISO8601;
      });
      expect(result).toBe(`STRFTIME('%Y-%m-%d %H:%M:%f','NOW')`);
    });

    test('utcNowAsISO8601 returns a standard ISO-8601 an ISO-8601 date string', async ({page}) => {
      const result = await page.evaluate(() => {
        const ts = window['sq'];
        return ts.utils.utcNowAsISO8601();
      });
      expect(result).toMatch(TINYSYNQ_SAFE_ISO8601_REGEX);
    });

    test('isSafeISO8601 to correctly identify safe and unsafe date string formats', async ({page}) => {
      const { valid, invalid } = await page.evaluate(() => {
        const ts = window['sq'];
        const invalid = [
          '0000-00-00T00:00:00.000Z',
          '0000-00-00 00:00:00.000Z',
          '0000-00-00T00:00:00.000',
          '0000/00/00 00:00:00',
          '00-00-0000',
        ]
        .map(d => ts.utils.isSafeISO8601(d));

        const valid = [
          '0000-00-00 00:00:00.000',
          '0000-00-00 00:00:00.00',
          '0000-00-00 00:00:00.0',
          '0000-00-00 00:00:00'
        ]
        .map(d => ts.utils.isSafeISO8601(d));
        return { valid, invalid }; 
      });

      for (const d of invalid) {
        expect(d).toBeFalsy();
      }

      for (const d of valid) {
        expect(d).toBeTruthy();
      }
    });
  });
});