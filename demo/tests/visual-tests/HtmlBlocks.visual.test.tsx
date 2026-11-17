import type {Locator} from '@playwright/test';

import {expect, test} from 'playwright/core';

import {ViewerStories} from './MarkdownViewer.helpers';

test.describe('MarkdownViewer HTML blocks', () => {
    for (const theme of ['light', 'dark'] as const) {
        test(`should render an iframe in the ${theme} theme`, async ({
            mount,
            page,
            expectScreenshot,
        }) => {
            await page.emulateMedia({colorScheme: theme});
            await mount(<ViewerStories.HtmlBlocks />, {width: 700});
            const iframe = page
                .getByTestId('demo-markdown-viewer')
                .locator('iframe[data-yfm-sandbox-mode="srcdoc"]');
            const body = iframe.contentFrame().locator('body');

            await expect(body).toHaveClass(theme);
            await expect(
                body.getByRole('heading', {name: 'Duis faucibus dignissim posuere'}),
            ).toBeVisible();
            await expectIframeHeightToMatchContent(iframe);
            await expectScreenshot({component: iframe, themes: [theme]});
        });
    }

    test('should resize the iframe when its content wraps at a smaller width', async ({
        mount,
        page,
    }) => {
        await page.setViewportSize({width: 1000, height: 800});
        await mount(<ViewerStories.HtmlBlocks />, {width: '100%'});
        const iframe = page
            .getByTestId('demo-markdown-viewer')
            .locator('iframe[data-yfm-sandbox-mode="srcdoc"]');
        await expectIframeHeightToMatchContent(iframe);
        const height = await iframe.evaluate((node) => node.clientHeight);

        await page.setViewportSize({width: 600, height: 800});

        await expect
            .poll(() => iframe.evaluate((node) => node.clientHeight))
            .toBeGreaterThan(height);
    });
});

async function expectIframeHeightToMatchContent(iframe: Locator) {
    await expect
        .poll(() =>
            iframe.evaluate((node: HTMLIFrameElement) =>
                Math.abs(
                    node.clientHeight -
                        (node.contentDocument?.documentElement.getBoundingClientRect().height ?? 0),
                ),
            ),
        )
        .toBeLessThan(1);
}
