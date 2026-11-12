import {expect, test} from 'playwright/core';

import {ViewerStories} from './MarkdownViewer.helpers';

test.describe('MarkdownViewer LaTeX', () => {
    test('should render inline and block formulas with runtime styles', async ({
        mount,
        page,
        expectScreenshot,
    }) => {
        await mount(<ViewerStories.Latex />, {width: 700});
        const viewer = page.getByTestId('demo-markdown-viewer');

        await expect(viewer.locator('.katex')).toHaveCount(2);
        await expect(viewer.locator('.katex-display')).toHaveCount(1);
        await expectScreenshot({component: viewer});
    });

    test('should ignore old targets after a delayed runtime import', async ({mount, page}) => {
        let release!: () => void;
        const pending = new Promise<void>((resolve) => {
            release = resolve;
        });
        let requested = false;
        await page.route('**/index-browser-*.js', async (route) => {
            requested = true;
            await pending;
            await route.continue();
        });
        await mount(<ViewerStories.Latex />);
        await expect.poll(() => requested).toBe(true);
        const viewer = page.getByTestId('demo-markdown-viewer');
        const original = await viewer.locator('.yfm-latex').first().elementHandle();

        await page.getByRole('radio', {name: 'Updated formulas'}).check();
        await page.getByRole('radio', {name: 'Formulas', exact: true}).check();
        release();

        await expect(viewer.locator('.katex')).toHaveCount(2);
        expect(await original?.evaluate((node) => node.childElementCount)).toBe(0);
    });

    test('should report a failed import without replacing HTML', async ({mount, page}) => {
        const errors: string[] = [];
        page.on('console', (message) => {
            if (message.type() === 'error') errors.push(message.text());
        });
        await page.route('**/index-browser-*.js', (route) => route.abort());
        await mount(<ViewerStories.Latex />);

        await expect
            .poll(() => errors.some((error) => error.includes('dynamically imported module')))
            .toBe(true);
        await expect(
            page.getByTestId('demo-markdown-viewer').locator('.yfm-latex').first(),
        ).toBeEmpty();
    });

    test('should display invalid formulas in the theme error color', async ({
        mount,
        page,
        expectScreenshot,
    }) => {
        await mount(<ViewerStories.Latex />, {width: 700});
        await page.getByRole('radio', {name: 'Invalid formulas'}).check();
        const viewer = page.getByTestId('demo-markdown-viewer');
        const errors = viewer.locator('.katex-error');

        await expect(errors).toHaveText(['\\frac{', '\\sqrt{\n']);
        await expectScreenshot({component: viewer});
    });
});
