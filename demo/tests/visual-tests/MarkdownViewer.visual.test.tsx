import {expect, test} from 'playwright/core';

import {ViewerStories} from './MarkdownViewer.helpers';

test.describe('MarkdownViewer code block actions', () => {
    test.beforeEach(async ({mount, page}) => {
        await mount(<ViewerStories.CodeBlockActions />, {width: 700});
        await page.evaluate(() => document.fonts.ready);
    });

    test('should hide native controls and show actions on focus', async ({page}) => {
        const viewer = page.getByTestId('demo-markdown-viewer');
        const block = viewer.locator('.yfm-code-floating-container');
        const actions = block.locator('.g-md-yfm-code-block__actions');

        await expect(block.locator('.yfm-wrapping-button')).toBeHidden();
        await expect(block.locator('.yfm-clipboard-button')).toBeHidden();

        await page.mouse.move(0, 0);
        await expect(actions).toHaveCSS('opacity', '0');
        await actions.getByRole('button', {name: 'Text wrapping'}).focus();
        await expect(actions).toHaveCSS('opacity', '1');

        await page.getByRole('radio', {name: 'Version 3'}).check();
        const legacy = viewer.locator('.yfm-clipboard');
        await expect(legacy.locator('.yfm-clipboard-button')).toBeHidden();
    });

    test('should move focus between actions with Tab', async ({page}) => {
        const actions = page
            .getByTestId('demo-markdown-viewer')
            .locator('.g-md-yfm-code-block__actions');
        const wrap = actions.getByRole('button', {name: 'Text wrapping'});
        const copy = actions.getByRole('button', {name: 'Copy', exact: true});

        await wrap.focus();
        await page.keyboard.press('Tab');
        await expect(copy).toBeFocused();
        await page.keyboard.press('Shift+Tab');
        await expect(wrap).toBeFocused();
    });

    test('should wrap numbered code without horizontal overflow', async ({page}) => {
        const block = page
            .getByTestId('demo-markdown-viewer')
            .locator('.yfm-code-floating-container');
        const wrap = block.getByRole('button', {name: 'Text wrapping'});
        const code = block.locator('pre code');
        const originalHeight = await code.evaluate(
            (element) => element.getBoundingClientRect().height,
        );
        expect(await code.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(
            true,
        );

        await wrap.press('Enter');
        await expect
            .poll(() => code.evaluate((element) => element.getBoundingClientRect().height))
            .toBeGreaterThan(originalHeight);
        await expect
            .poll(() => code.evaluate((element) => element.scrollWidth <= element.clientWidth + 1))
            .toBe(true);

        await wrap.press('Enter');
        await expect
            .poll(() => code.evaluate((element) => element.getBoundingClientRect().height))
            .toBe(originalHeight);
        expect(await code.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(
            true,
        );
    });

    test('should keep visible actions in the code block corner', async ({
        page,
        expectScreenshot,
    }) => {
        const block = page
            .getByTestId('demo-markdown-viewer')
            .locator('.yfm-code-floating-container');

        await block.hover();
        await expect(block.locator('.g-md-yfm-code-block__actions')).toHaveCSS('opacity', '1');
        await expectScreenshot({component: block, themes: ['light']});

        await block.getByRole('button', {name: 'Text wrapping'}).click();
        await block.hover();
        await expectScreenshot({component: block, themes: ['light'], nameSuffix: 'wrapped'});
    });

    test('should copy code without line numbers in both wrapping states', async ({
        page,
        context,
        helpers,
    }) => {
        await context.grantPermissions(['clipboard-read', 'clipboard-write']);
        const block = page
            .getByTestId('demo-markdown-viewer')
            .locator('.yfm-code-floating-container');
        const expected = [
            "const language = 'TypeScript';",
            "console.log(language, 'This long line shows how code wrapping keeps a complete example readable inside a narrow document without changing the text copied to the clipboard.');",
            '',
        ].join('\n');

        for (const wrapped of [false, true]) {
            if (wrapped) await block.getByRole('button', {name: 'Text wrapping'}).click();
            await page.evaluate(() => navigator.clipboard.writeText('Before copying'));
            await block.getByRole('button', {name: 'Copy', exact: true}).click();
            await expect
                .poll(async () => (await helpers.getClipboardData())['text/plain'])
                .toBe(expected);
        }
    });
});
