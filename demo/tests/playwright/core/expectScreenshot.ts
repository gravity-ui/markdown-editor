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

        // Wait for loading of all the images (img[src] skips hidden CM widget buffer elements)
        const locators = await page.locator('img[src]').all();
        await Promise.all(
            locators.map((locator) =>
                locator.evaluate(
                    (image: HTMLImageElement) =>
                        image.complete ||
                        new Promise<unknown>((resolve) => image.addEventListener('load', resolve)),
                ),
            ),
        );

        // Wait for lazy CSS chunks (YFM fonts, html-extension styles, etc.) to finish loading,
        // then wait for the browser to finish loading the font files they declare.
        // Without networkidle, document.fonts.ready may resolve before lazy chunks inject their
        // @font-face rules, causing a race where screenshots capture the wrong typeface.
        await page.waitForLoadState('networkidle');
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
