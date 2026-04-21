import type {Locator} from '@playwright/test';

import type {PlaywrightFixture, WaitFixture} from './types';

const DEFAULT_DELAY = 100;

export const wait: PlaywrightFixture<WaitFixture> = async ({page}, use) => {
    await use({
        loadersHiddenQASelect: async () => {
            const loader = page.getByTestId('loader');
            await loader.waitFor({state: 'hidden'});
        },
        loadersHidden: async () => {
            const loader = page.locator('.g-loader');
            await loader.waitFor({state: 'hidden'});
        },
        visible: async (locator: Locator) => {
            await locator.waitFor({state: 'visible'});
        },
        hidden: async (locator: Locator) => {
            await locator.waitFor({state: 'hidden'});
        },
        timeout: async (delay = DEFAULT_DELAY) => {
            await page.waitForTimeout(delay);
        },
    });
};
