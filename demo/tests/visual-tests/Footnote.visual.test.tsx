import {expect, test} from 'playwright/core';

import {FootnoteEditor} from './Footnote.helpers';

test.describe('Footnote', () => {
    for (const theme of ['light', 'dark'] as const) {
        test(`should display markers and a keyboard tooltip in ${theme} theme`, async ({
            mount,
            page,
            expectScreenshot,
        }) => {
            await mount(<FootnoteEditor theme={theme} />);
            const markers = page.locator('.ProseMirror .g-md-footnote__marker');
            await expect(markers).toHaveText(['1', '*', '2']);
            await markers.first().focus();
            const tooltip = page.getByRole('tooltip');
            await expect(tooltip).toBeVisible();
            await expect(tooltip.locator('strong')).toHaveText('Formatted');
            await expect(tooltip.getByRole('link')).toHaveAttribute('href', 'https://example.com');
            const id = await tooltip.getAttribute('id');
            await expect(markers.first()).toHaveAttribute('aria-describedby', id ?? '');
            await expectScreenshot({fullPage: true, themes: [theme]});
            await markers.first().press('Escape');
            await expect(tooltip).toBeHidden();
        });

        test(`should edit a footnote in ${theme} theme`, async ({
            mount,
            page,
            expectScreenshot,
        }) => {
            await mount(<FootnoteEditor theme={theme} />);
            await page.locator('.ProseMirror .g-md-footnote__marker').nth(1).click();
            const form = page.locator('.g-md-footnote-editor');
            await expect(form).toBeVisible();
            await form.locator('textarea').fill('**Updated** note');
            await expectScreenshot({fullPage: true, themes: [theme]});
            await form.getByRole('button', {name: /Save|Сохранить/}).click();
            await expect(form).toBeHidden();
            await page.getByRole('button', {name: 'Save document'}).click();
            await expect(page.getByTestId('footnote-markup')).toContainText(
                ':footnote[**Updated** note]{marker="*"}',
            );
        });
    }

    test('should insert a footnote from the slash menu', async ({mount, page}) => {
        await mount(<FootnoteEditor markup="" />);
        const editor = page.locator('.ProseMirror');
        await editor.pressSequentially('/footnote');
        await page.getByText(/^(Footnote|Сноска)$/).click();
        const form = page.locator('.g-md-footnote-editor');
        await expect(form).toBeVisible();
        await form.locator('textarea').fill('Inserted note');
        await form.getByRole('button', {name: /Save|Сохранить/}).click();
        await page.getByRole('button', {name: 'Save document'}).click();
        await expect(page.getByTestId('footnote-markup')).toHaveText(':footnote[Inserted note]');
    });

    test('should close a hovered tooltip with Escape and include the text in print', async ({
        mount,
        page,
    }) => {
        await mount(<FootnoteEditor />);
        await page.locator('.ProseMirror .g-md-footnote__marker').first().hover();
        const tooltip = page.getByRole('tooltip');
        await expect(tooltip).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(tooltip).toBeHidden();
        await page.emulateMedia({media: 'print'});
        await expect(page.locator('.ProseMirror .g-md-footnote__content').first()).toBeVisible();
    });
});
