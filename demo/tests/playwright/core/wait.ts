import {expect} from '@playwright/experimental-ct-react';
import type {Locator} from '@playwright/test';

import type {PlaywrightFixture, WaitFixture} from './types';

const DEFAULT_DELAY = 100;

export const wait: PlaywrightFixture<WaitFixture> = async ({page}, use) => {
    await use({
        loadersHiddenQASelect: async () => {
            const loader = page.getByTestId('loader');
            await allMap(loader, (locator) => locator.waitFor({state: 'hidden'}));
        },
        loadersHidden: async () => {
            const loader = page.locator('.g-loader');
            await allMap(loader, (locator) => locator.waitFor({state: 'hidden'}));
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
        tooltipsHidden: async () => {
            await expect(page.locator('.g-tooltip')).toHaveCount(0);
        },
        markupPreview: async (text: string | RegExp) => {
            await expect(page.locator('.playground__markup')).toContainText(text);
        },
    });
};

async function allMap(locator: Locator, callback: (locator: Locator) => Promise<void>) {
    return Promise.all((await locator.all()).map(callback));
}
