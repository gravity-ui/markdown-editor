import {expect, test} from 'playwright/core';

import {GptEditor} from './GPT.helpers';

for (const mode of ['wysiwyg', 'markup'] as const) {
    test.describe(`GPT compatibility ${mode}`, () => {
        test.beforeEach(async ({mount, editor}) => {
            await mount(<GptEditor />, {
                width: 900,
                rootStyle: {paddingTop: 900, paddingBottom: 900},
            });
            await editor.switchMode(mode);
            await editor.fill('original text');
        });

        test('should focus the prompt without scrolling and restore editor focus on close', async ({
            page,
            editor,
        }) => {
            const button = editor.locators.toolbars.main.getByRole('button', {
                name: 'Help with text',
                exact: true,
            });
            await button.scrollIntoViewIfNeeded();
            const scrollY = await page.evaluate(() => window.scrollY);
            expect(scrollY).toBeGreaterThan(0);
            await button.click();
            const input = page.locator('.g-md-gpt-dialog input');
            await expect(input).toBeFocused();
            await input.fill('Correct this text');
            expect(await page.evaluate(() => window.scrollY)).toBe(scrollY);
            await input.press('Escape');
            await expect(page.locator('.g-md-gpt-dialog')).toBeHidden();
            await expect(editor.locators.contenteditable).toBeFocused();
            expect(await page.evaluate(() => window.scrollY)).toBe(scrollY);
            await button.click();
            await expect(input).toBeFocused();
            await expect(input).toHaveValue('');
        });

        test('should replace the selected text through the existing integration and support undo', async ({
            page,
            editor,
        }) => {
            await editor.press('ControlOrMeta+a');
            await editor.clickMainToolbarButton('Help with text');
            const dialog = page.locator('.g-md-gpt-dialog');
            await dialog.getByRole('button', {name: 'Make the text flashy', exact: true}).click();
            await expect(dialog.locator('.g-md-gpt-dialog__answer')).toHaveText('ORIGINAL TEXT');
            await dialog
                .getByRole('button', {name: 'Replace the selected text', exact: true})
                .click();
            await expect(dialog).toBeHidden();
            await expect(editor.locators.contenteditable).toHaveText('ORIGINAL TEXT');
            await editor.press('ControlOrMeta+z');
            await expect(editor.locators.contenteditable).toHaveText('original text');
        });
    });
}
