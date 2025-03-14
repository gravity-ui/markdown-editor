import type {PlaywrightFixture, WaitFixture} from './types';

export const wait: PlaywrightFixture<WaitFixture> = async ({page}, use) => {
    await use({
        loadersHiddenQASelect: async () => {
            const loader = await page.getByTestId('loader');

            await loader.waitFor({state: 'hidden'});
        },
        loadersHidden: async () => {
            const loader = await page.locator('.g-loader');

            await loader.waitFor({state: 'hidden'});
        },
    });
};
