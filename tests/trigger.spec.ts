import { test, expect } from '@playwright/test';
import { getUpdateTriggerDiffQuery, getOldVsNewUnionColumnSelection } from "../src/lib/trigger.js";
import { testCreateTableUser, testFinalDiffQuery, testOldVsNewUnionColumnSelectionSample, testPragmaTableInfo } from "./test-data/trigger.data.js";
import { pageInit, setupDb } from "./setup.js";
import { LogLevel } from "../src/lib/types.js";
import { Logger } from 'tslog';

const log = new Logger({ name: 'Trigger Testing', minLevel: LogLevel.Debug, type: 'pretty' })

test.describe('Trigger', () => {
  test('getOldVsNewColumnSelection', () => {    
    const columns = testPragmaTableInfo;
    const selection = getOldVsNewUnionColumnSelection({columns});
    expect(selection).toHaveLength(6);
    expect(selection).toMatchObject(testOldVsNewUnionColumnSelectionSample);
  });

  /*
  // @TODO:
  // Actually, not sure how to go about testing this. `getUpdateTriggerDiffQuery`
  // isn't exposed in any way in the web library, but testing it depends on an
  // instance of TinySynq, which is only available in the browser context.
  test('generateUpdateDiffQuery', async ({page}) => {
    await pageInit({page, log});
    const preInit = [testCreateTableUser];

    await page.evaluate(setupDb, [preInit, LogLevel]);

    const {prefix, sql} = await page.evaluate(async () => {
      const ts = window['ts'];
      const sql = await getUpdateTriggerDiffQuery({ts, table: ts.synqTables!.user});
      const prefix = ts.synqPrefix;
      return { prefix, sql };
    });
    
    expect(sql.replace(/\s+/g,'')).toEqual(testFinalDiffQuery.replace('{{synqPrefix}}', prefix).replace(/\s+/g,''));
  });
  */
});