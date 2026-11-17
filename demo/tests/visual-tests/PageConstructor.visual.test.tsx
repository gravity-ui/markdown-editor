import {expect, test} from 'playwright/core';

import {ViewerStories} from './MarkdownViewer.helpers';

test.describe('MarkdownViewer Page Constructor', () => {
    test('should render a block with styles in both themes', async ({
        mount,
        page,
        expectScreenshot,
    }) => {
        await mount(<ViewerStories.PageConstructor />, {width: 700});
        const block = page.getByTestId('demo-markdown-viewer').locator('.yfm-page-constructor');

        await expect(block.getByRole('heading', {name: 'Title', exact: true})).toBeVisible();
        await expectScreenshot({component: block});
    });

    test('should discard a pending block when the document changes', async ({mount, page}) => {
        let release!: () => void;
        const pending = new Promise<void>((resolve) => {
            release = resolve;
        });
        const requested = page.waitForRequest('**/DiplodocPageConstructorContent-*.js');
        await page.route('**/DiplodocPageConstructorContent-*.js', async (route) => {
            await pending;
            await route.continue();
        });
        await mount(<ViewerStories.PageConstructor />);
        await requested;
        const viewer = page.getByTestId('demo-markdown-viewer');
        const original = await viewer.locator('.yfm-page-constructor').elementHandle();

        await page.getByRole('radio', {name: 'Updated block'}).check();
        await page.getByRole('radio', {name: 'Plain text'}).check();
        release();

        await expect(viewer.locator('.yfm-page-constructor')).toHaveCount(0);

        await page.getByRole('radio', {name: 'Updated block'}).check();
        await expect(viewer.getByRole('heading', {name: 'Updated title'})).toBeVisible();
        expect(await original?.evaluate((node) => node.childElementCount)).toBe(0);
    });

    test('should show an import error inside the block', async ({mount, page}) => {
        await page.route('**/DiplodocPageConstructorContent-*.js', (route) => route.abort());
        await mount(<ViewerStories.PageConstructor />);
        const viewer = page.getByTestId('demo-markdown-viewer');
        const block = viewer.locator('.yfm-page-constructor');

        await expect(block).toContainText('Failed to fetch dynamically imported module');
        await expect(viewer.getByRole('heading', {name: 'YFM Page Constructor'})).toBeVisible();
    });
});
