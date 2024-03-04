import { test, expect, chromium } from '@playwright/test';
import { createStatements } from './setup';
import { Logger } from 'tslog';
import { LogLevel } from '../src/lib/types';

const log = new Logger({ name: 'TinySynq Testing', minLevel: 1 });

type TestWindow = Window & {
  tinysynq?: any;
  [key: string]: any
};

test.describe('TinySynq', () => {

  test('load', async () => {
    test.setTimeout(20000);

    const browser = await chromium.launch();
    const page = await browser.newPage();

    page.on('console', (...args) => {
      log.info(...args);
    });

    await page.goto('http://localhost:8181');
    await page.waitForFunction(() => !!window['tinysynq']);

    const preInit = createStatements;

    const res = await page.evaluate(async ([preInit, LogLevel]) => {
      const { tinysynq } = window as TestWindow;
      let db;
      try {
        db = await tinysynq({
          filePath: 'pwtst.db',
          prefix: 'pwtst',
          tables: [
            { name: 'member', id: 'member_id'},
            { name: 'message', id: 'message_id'}
          ],
          preInit,
          logOptions: {
            name: 'test-tinysynq',
            minLevel: LogLevel['Trace']
          }
        });
        console.debug('\n\n!!! YAY !!!\n\n');
        return !!db;
      }
      catch(err) {
        console.error('\n >>>>> ERRRRORRR <<<<<\n', err);
        return false;
      }

    }, [preInit, LogLevel]);

    log.debug({res});
    expect(res).toBeTruthy();

    await page.close();
    await browser.close();
  })
});
