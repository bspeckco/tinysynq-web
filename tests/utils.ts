import { Page } from "@playwright/test";

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