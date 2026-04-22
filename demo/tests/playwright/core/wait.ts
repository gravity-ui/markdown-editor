import type {Locator} from '@playwright/test';

import type {PlaywrightFixture, WaitFixture} from './types';

const DEFAULT_DELAY = 100;
const MAX_STABLE_CHECKS = 50;
const REQUIRED_STABLE_COUNT = 2;

type Snapshot = {text: string; height: number};

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
        markupRendered: async (delay = DEFAULT_DELAY, stableThreshold = REQUIRED_STABLE_COUNT) => {
            const locator = page.locator('.playground__markup');
            await locator.waitFor({state: 'visible'});

            let prev: Snapshot = {text: '', height: 0};
            let stableCount = 0;

            for (let i = 0; i < MAX_STABLE_CHECKS; i++) {
                const curr = await getMarkupPreviewMetrics(locator);

                if (isStable(prev, curr)) {
                    stableCount++;
                    if (stableCount >= stableThreshold) break;
                } else {
                    stableCount = 0;
                    prev = curr;
                }

                await page.waitForTimeout(delay);
            }
        },
    });
};

async function getMarkupPreviewMetrics(locator: Locator): Promise<Snapshot> {
    const text = (await locator.textContent())?.trim() ?? '';
    const height = (await locator.boundingBox())?.height ?? 0;
    return {text, height};
}

function isStable(prev: Snapshot, curr: Snapshot): boolean {
    return Boolean(curr.text) && prev.text === curr.text && prev.height === curr.height;
}
