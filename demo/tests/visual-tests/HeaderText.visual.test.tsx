import type {Page} from '@playwright/test';

import {expect, test} from 'playwright/core';

import {HeaderStories} from './Header.helpers';

const getValue = (page: Page) => page.evaluate(() => window.mdEditor?.getValue());

test.describe('Header text', () => {
    test.use({viewport: {width: 1500, height: 1000}});

    test('should show title and description in the editor and the preview', async ({
        mount,
        page,
        editor,
        expectScreenshot,
    }) => {
        await mount(<HeaderStories.Text />);
        const header = page.locator('.ProseMirror .g-md-header');
        const title = header.locator('.g-md-header__title');
        const content = header.locator('.g-md-header__content');
        await expect(title).toHaveText('Team portal');
        await expect(title).toHaveCSS('font-size', '24px');
        await expect(title).toHaveCSS('line-height', '28px');
        await expect(content.locator('p')).toHaveCount(2);
        await expect(content).toHaveCSS('font-size', '14px');
        await expect(content).toHaveCSS('line-height', '20px');
        await expectScreenshot({component: header});
        await editor.switchMode('markup');
        await editor.switchPreview('visible');
        const preview = editor.locators.previewContent.locator('.g-md-header');
        await expect(preview.locator('.g-md-header__title')).toHaveText('Team portal');
        await expect(preview.locator('.g-md-header__title')).toHaveCSS('font-size', '24px');
        await expect(preview.locator('.g-md-header__content p')).toHaveCount(2);
        await expectScreenshot({component: preview, nameSuffix: 'preview'});
    });

    test('should edit text in place and keep it after switching modes', async ({
        mount,
        page,
        editor,
    }) => {
        await mount(<HeaderStories.Wysiwyg />);
        const header = page.locator('.ProseMirror .g-md-header');
        await header.locator('.g-md-header__title').click();
        await editor.pressSequentially('New title');
        await header.locator('.g-md-header__content').click();
        await editor.pressSequentially('First');
        await editor.press('Enter');
        await editor.pressSequentially('Second');
        await editor.switchMode('markup');
        await expect
            .poll(() => getValue(page))
            .toBe(
                ':::header{height="s" width="m"}\n\n:::header-title\nNew title\n:::\n\n' +
                    ':::header-content\nFirst\n\nSecond\n:::\n\n:::\n\nAfter',
            );
        await editor.switchMode('wysiwyg');
        await expect(header.locator('.g-md-header__title')).toHaveText('New title');
        await expect(header.locator('.g-md-header__content p')).toHaveText(['First', 'Second']);
    });

    test('should hide slots and set title size and color from settings', async ({
        mount,
        page,
        editor,
        expectScreenshot,
    }) => {
        await mount(<HeaderStories.Text />);
        const header = page.locator('.ProseMirror .g-md-header');
        await header.click({position: {x: 8, y: 8}});
        const settings = page.getByTestId('header-settings');
        await settings.getByRole('combobox', {name: 'Title size', exact: true}).click();
        await expect(page.getByRole('option')).toHaveText(['H1', 'H2', 'H3', 'H4', 'H5', 'H6']);
        await page.getByRole('option', {name: 'H1', exact: true}).click();
        await settings.getByRole('combobox', {name: 'Title color', exact: true}).click();
        await page.getByRole('option', {name: 'Blue', exact: true}).click();
        await expect(header.locator('.g-md-header__title')).toHaveCSS('font-size', '32px');
        await expectScreenshot({fullPage: true});
        await settings.getByText('Description', {exact: true}).click();
        await expect(header.locator('.g-md-header__content')).toBeHidden();
        await editor.switchMode('markup');
        const value = await getValue(page);
        expect(value).toContain(':::header{height="m" width="m" description="false"}');
        expect(value).toContain(':::header-title{size="1" color="blue"}\nTeam portal\n:::');
        expect(value).toContain('Updated **every week**.');
        await editor.switchPreview('visible');
        const preview = editor.locators.previewContent.locator('.g-md-header');
        await expect(preview.locator('.g-md-header__content')).toBeHidden();
        await expect(preview.locator('.g-md-header__title')).toHaveCSS('font-size', '32px');
        await editor.switchMode('wysiwyg');
        await header.click({position: {x: 8, y: 8}});
        await settings.getByText('Description', {exact: true}).click();
        await expect(header.locator('.g-md-header__content p')).toHaveCount(2);
    });

    test('should change the title size with keyboard shortcuts and undo it', async ({
        mount,
        page,
        editor,
    }) => {
        await mount(<HeaderStories.Text />);
        const title = page.locator('.ProseMirror .g-md-header__title');
        await title.click();
        await editor.press('Control+Alt+3');
        await expect(title).toHaveAttribute('data-size', '3');
        await editor.press('Control+Alt+6');
        await expect(title).toHaveAttribute('data-size', '6');
        await editor.press('Control+z');
        await expect(title).toHaveAttribute('data-size', '3');
        await expect(page.locator('.ProseMirror h1, .ProseMirror h3')).toHaveCount(0);
    });

    test('should keep long text inside the block', async ({mount, page, expectScreenshot}) => {
        const long = 'Long-title-without-spaces-'.repeat(12);
        await mount(
            <HeaderStories.Text
                initial={`:::header\n\n:::header-title\n${long}\n:::\n\n:::header-content\n${'Text '.repeat(150)}\n:::\n\n:::`}
            />,
        );
        const header = page.locator('.ProseMirror .g-md-header');
        await expect(header).toHaveCSS('width', '900px');
        expect(await header.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
            true,
        );
        await expectScreenshot({component: header});
    });
});
