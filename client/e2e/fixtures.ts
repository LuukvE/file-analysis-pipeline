import { test as base, _electron as electron, ElectronApplication, Page } from '@playwright/test';
import path from 'path';

type Fixtures = {
  app: ElectronApplication;
  page: Page;
};

export const test = base.extend<Fixtures>({
  app: async ({}, use) => {
    const app = await electron.launch({
      args: [path.join(__dirname, '../out/main/index.js')],
      env: {
        ...process.env,
        NODE_ENV: 'test'
      }
    });

    await use(app);
    await app.close();
  },

  page: async ({ app }, use) => {
    const page = await app.firstWindow();
    await page.waitForLoadState('domcontentloaded');
    await use(page);
  }
});

export { expect } from '@playwright/test';
