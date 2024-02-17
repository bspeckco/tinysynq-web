import { test, expect, chromium } from '@playwright/test';
import { createStatements } from './setup';
import { Logger } from 'tslog';
import { LogLevel } from '../src/lib/types';

const log = new Logger({ name: 'SynQLite Testing', minLevel: 1 });

type TestWindow = Window & {
  synqlite?: any;
  [key: string]: any
};

test.describe('SynQLite', () => {

  test('load', async () => {
    test.setTimeout(20000);

    const browser = await chromium.launch();
    const page = await browser.newPage();

    page.on('console', (...args) => {
      log.info(...args);
    });

    await page.goto('http://localhost:8181');
    await page.waitForFunction(() => !!window['synqlite']);

    const preInit = createStatements;

    const res = await page.evaluate(async ([preInit, LogLevel]) => {
      const { synqlite } = window as TestWindow;
      let db;
      try {
        db = await synqlite({
          filename: 'pwtst.db',
          prefix: 'pwtst',
          tables: [
            { name: 'member', id: 'member_id'},
            { name: 'message', id: 'message_id'}
          ],
          preInit,
          logOptions: {
            name: 'test-synqlite',
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
