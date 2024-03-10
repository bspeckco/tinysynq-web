import { Page } from "@playwright/test";
import { Change, TinySynqOperation } from "../src/lib/types";
import { TinySynq } from "../src/lib/tinysynq.class";

export const closeDb = async (page: Page) => {
  return await page.evaluate(() => {
    try {
      const sq = window['sq'];
      sq.db({type: 'close', dbId: sq.deviceId, args: {unlink: true}});
      return true;
    }
    catch(err) {
      console.error('\n >>>>> ERR! Unable to close DB <<<<<\n', err);
      return false;
    }
  });
}

export function getRandomDbPath() {
  return `tst_${Math.ceil(Math.random() * 1000)}.db`;
}