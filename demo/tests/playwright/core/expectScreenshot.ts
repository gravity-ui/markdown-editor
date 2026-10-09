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
    const waitForTheme = (theme: 'light' | 'dark') =>
        page.waitForFunction(
            (name) => document.body.classList.contains(`g-root_theme_${name}`),
            theme,
        );

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
                type: 'webp',
                quality: 85,
            });
        };

        const nameScreenshot =
            testInfo.titlePath.slice(1).join(' ') + (nameSuffix ? ` ${nameSuffix}` : '');

        const themes = paramsThemes || defaultParams.themes;

        // img[src] skips hidden CodeMirror widget buffers
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

        // Lazy CSS chunks inject @font-face later, so fonts.ready alone resolves on the wrong set
        await page.waitForLoadState('networkidle');
        await page.evaluate(() => document.fonts.ready);

        if (themes?.includes('light')) {
            await page.emulateMedia({colorScheme: 'light'});
            await waitForTheme('light');

            expect(await captureScreenshot()).toMatchSnapshot({
                name: `${nameScreenshot} light.webp`,
            });
        }

        if (themes?.includes('dark')) {
            await page.emulateMedia({colorScheme: 'dark'});
            await waitForTheme('dark');

            expect(await captureScreenshot()).toMatchSnapshot({
                name: `${nameScreenshot} dark.webp`,
            });
        }
    };

    await use(expectScreenshot);
};
