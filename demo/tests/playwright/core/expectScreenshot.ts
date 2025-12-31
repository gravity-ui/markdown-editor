import {expect} from '@playwright/experimental-ct-react';

import type {CaptureScreenshotParams, ExpectScreenshotFixture, PlaywrightFixture} from './types';

const defaultParams: CaptureScreenshotParams = {
    themes: ['light', 'dark'],
};

export const expectScreenshot: PlaywrightFixture<ExpectScreenshotFixture> = async (
    {page},
    use,
    testInfo,
) => {
    const expectScreenshot: ExpectScreenshotFixture = async ({
        fullPage,
        component,
        nameSuffix,
        themes: paramsThemes,
        ...pageScreenshotOptions
    } = defaultParams) => {
        const captureScreenshot = async () => {
            const locator = fullPage
                ? page
                : component ||
                  page.locator('.playwright-wrapper-test').locator('.playground__editor-markup');

            return locator.screenshot({
                animations: 'disabled',
                style: '.playground__pm-selection {display:none;}',
                ...pageScreenshotOptions,
            });
        };

        const nameScreenshot =
            testInfo.titlePath.slice(1).join(' ') + (nameSuffix ? ` ${nameSuffix}` : '');

        const themes = paramsThemes || defaultParams.themes;

        // TODO: @makhnatkin simplify with await loader.waitFor({state: 'hidden'});
        // Wait for loading of all the images
        const locators = await page.locator('//img').all();
        await Promise.all(
            locators.map((locator) =>
                locator.evaluate(
                    (image: HTMLImageElement) =>
                        image.complete ||
                        new Promise<unknown>((resolve) => image.addEventListener('load', resolve)),
                ),
            ),
        );

        // Wait for loading fonts
        await page.evaluate(() => document.fonts.ready);

        if (themes?.includes('light')) {
            await page.emulateMedia({colorScheme: 'light'});
            // sometimes theme doesn't change in webkit without timeout
            await page.waitForTimeout(100);

            expect(await captureScreenshot()).toMatchSnapshot({
                name: `${nameScreenshot} light.png`,
            });
        }

        if (themes?.includes('dark')) {
            await page.emulateMedia({colorScheme: 'dark'});
            // sometimes theme doesn't change in webkit without timeout
            await page.waitForTimeout(100);

            expect(await captureScreenshot()).toMatchSnapshot({
                name: `${nameScreenshot} dark.png`,
            });
        }
    };

    await use(expectScreenshot);
};
