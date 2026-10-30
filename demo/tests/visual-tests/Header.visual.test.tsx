import {expect, test} from 'playwright/core';

import {HeaderStories} from './Header.helpers';

test.describe('Header dimensions', () => {
    test.use({viewport: {width: 1500, height: 1000}});

    test('should show only two size controls and round trip their values through Markdown preview', async ({
        mount,
        page,
        editor,
        expectScreenshot,
    }) => {
        await mount(<HeaderStories.Wysiwyg />);
        const header = page.locator('.ProseMirror .g-md-header');
        await expect(header).toHaveCSS('width', '900px');
        await expect(header).toHaveCSS('height', '236px');
        await expect(header).toHaveCSS('border-top-style', 'dashed');
        await expect(header).toHaveCSS('border-top-width', '2px');
        await expect(header).toHaveCSS('border-top-left-radius', '16px');
        await expect(header).toBeEmpty();
        await header.click();
        const settings = page.getByRole('dialog', {name: 'Cover settings'});
        await expect(settings).toBeVisible();
        await expect(settings).toHaveCSS('width', '286px');
        await expect(settings).toHaveCSS('box-sizing', 'content-box');
        await expect(settings.getByText('Cover settings', {exact: true})).toHaveCSS(
            'font-size',
            '17px',
        );
        await expect(settings.getByText('Height', {exact: true})).toHaveCSS('font-size', '13px');
        await expect(settings.getByRole('combobox')).toHaveCount(2);
        const height = settings.getByRole('combobox', {name: 'Height', exact: true});
        const width = settings.getByRole('combobox', {name: 'Width', exact: true});
        await expect(height).toHaveText('S');
        await expect(width).toHaveText('M');
        const sizes = await settings.getByRole('group').evaluateAll((elements) =>
            elements.map((element) => {
                const rect = element.getBoundingClientRect();
                return {width: rect.width, height: rect.height};
            }),
        );
        expect(sizes).toEqual([
            {width: 158, height: 28},
            {width: 158, height: 28},
        ]);
        await expectScreenshot({fullPage: true});
        await height.click();
        await expect(page.getByRole('option')).toHaveText(['S', 'M', 'L']);
        await page.getByRole('option', {name: 'M', exact: true}).click();
        await expect(header).toHaveCSS('height', '300px');
        await width.click();
        await expect(page.getByRole('option')).toHaveText(['S', 'M', 'L', 'Full width']);
        await page.getByRole('option', {name: 'S', exact: true}).click();
        await expect(header).toHaveCSS('width', '600px');
        await settings.getByRole('button', {name: 'Close', exact: true}).click();
        await expect(settings).toBeHidden();
        await header.click();
        await expect(settings).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(settings).toBeHidden();
        await editor.switchMode('markup');
        await expect
            .poll(() => page.evaluate(() => window.mdEditor?.getValue()))
            .toContain(':::header{height="m" width="s"}\n:::');
        await editor.switchPreview('visible');
        const previewHeader = editor.locators.previewContent.locator('.g-md-header');
        await expect(previewHeader).toHaveCSS('width', '600px');
        await expect(previewHeader).toHaveCSS('height', '300px');
        await expect(previewHeader).toBeEmpty();
        await editor.switchMode('wysiwyg');
        await expect(header).toHaveAttribute('data-height', 'm');
        await expect(header).toHaveAttribute('data-width', 's');
    });

    test('should hide settings after switching editor modes', async ({mount, page, editor}) => {
        await mount(<HeaderStories.Wysiwyg />);
        const settings = page.getByTestId('header-settings');
        await page.locator('.ProseMirror .g-md-header').click();
        await expect(settings).toBeVisible();
        await editor.switchMode('markup');
        await expect(settings).toHaveCount(0);
        await editor.switchMode('wysiwyg');
        await expect(settings).toHaveCount(0);
    });

    test('should undo and redo each dimension and keep keyboard navigation available', async ({
        mount,
        page,
    }) => {
        await mount(<HeaderStories.Wysiwyg />);
        const header = page.locator('.ProseMirror .g-md-header');
        await header.click();
        const settings = page.getByTestId('header-settings');
        await settings.getByRole('combobox', {name: 'Height', exact: true}).click();
        await page.getByRole('option', {name: 'L', exact: true}).click();
        await settings.getByRole('combobox', {name: 'Width', exact: true}).click();
        await page.getByRole('option', {name: 'Full width', exact: true}).click();
        await settings.getByRole('button', {name: 'Close', exact: true}).click();
        await page.keyboard.press('Control+z');
        await expect(header).toHaveAttribute('data-height', 'l');
        await expect(header).toHaveAttribute('data-width', 'm');
        await page.keyboard.press('Control+z');
        await expect(header).toHaveAttribute('data-height', 's');
        await page.keyboard.press('Control+Shift+z');
        await expect(header).toHaveAttribute('data-height', 'l');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.type('Text ');
        await expect(header).toHaveCount(1);
        await expect(page.locator('.ProseMirror')).toContainText('Text');
    });

    for (const width of ['s', 'm', 'l', 'full']) {
        test(`should constrain width ${width} to a narrow column in both modes`, async ({
            mount,
            page,
            editor,
        }) => {
            await mount(
                <HeaderStories.Wysiwyg
                    width={420}
                    initial={`:::header{height="l" width="${width}"}\n:::\n\nAfter`}
                />,
            );
            const header = page.locator('.ProseMirror .g-md-header');
            await expect(header).toHaveCSS('height', '360px');
            expect(
                await header.evaluate((element) => element.getBoundingClientRect().width),
            ).toBeLessThanOrEqual(420);
            expect(
                await header.evaluate((element) =>
                    Boolean(
                        element.parentElement &&
                        element.parentElement.scrollWidth <= element.parentElement.clientWidth,
                    ),
                ),
            ).toBe(true);
            await editor.switchMode('markup');
            await editor.switchPreview('visible');
            const preview = editor.locators.previewContent.locator('.g-md-header');
            await expect(preview).toHaveCSS('height', '360px');
            expect(
                await preview.evaluate((element) => element.getBoundingClientRect().width),
            ).toBeLessThanOrEqual(420);
            expect(
                await preview.evaluate((element) =>
                    Boolean(
                        element.parentElement &&
                        element.parentElement.scrollWidth <= element.parentElement.clientWidth,
                    ),
                ),
            ).toBe(true);
        });
    }

    test('should use host radius and large size variables and align narrow blocks to the left', async ({
        mount,
        page,
        editor,
    }) => {
        await mount(
            <HeaderStories.Wysiwyg
                width={1400}
                initial={':::header{height="l" width="l"}\n:::\n\nAfter'}
            />,
            {
                styles: ':root {--g-md-header-height-l: 380px; --g-md-header-width-l: 1100px;} .g-root {--g-border-radius-2xl: 24px;}',
            },
        );
        const header = page.locator('.ProseMirror .g-md-header');
        await expect(header).toHaveCSS('height', '380px');
        await expect(header).toHaveCSS('width', '1100px');
        await expect(header).toHaveCSS('border-top-left-radius', '24px');
        const left = await header.evaluate((element) => element.getBoundingClientRect().x);
        expect(left).toBe(
            await page
                .locator('.ProseMirror p')
                .last()
                .evaluate((element) => element.getBoundingClientRect().x),
        );
        await editor.switchMode('markup');
        await editor.switchPreview('visible');
        const preview = editor.locators.previewContent.locator('.g-md-header');
        await expect(preview).toHaveCSS('height', '380px');
        await expect(preview).toHaveCSS('width', '1100px');
        await expect(preview).toHaveCSS('border-top-left-radius', '24px');
    });

    test('should hide settings and reject edits in readonly mode', async ({mount, page}) => {
        await mount(<HeaderStories.Wysiwyg readonly />);
        const header = page.locator('.ProseMirror .g-md-header');
        await header.click();
        await expect(page.getByTestId('header-settings')).toHaveCount(0);
        await expect(page.locator('.ProseMirror')).toHaveAttribute('contenteditable', 'false');
        await expect(page.getByRole('button', {name: 'Cover', exact: true})).toBeDisabled();
        await expect(header).toHaveAttribute('data-height', 's');
        await expect(header).toHaveAttribute('data-width', 'm');
    });

    for (const mode of ['wysiwyg', 'markup'] as const) {
        test(`should insert an empty header in ${mode} mode`, async ({mount, page, editor}) => {
            await mount(<HeaderStories.Wysiwyg initial="" mode={mode} />);
            await page.getByRole('button', {name: 'Cover', exact: true}).click();
            await expect
                .poll(() => page.evaluate(() => window.mdEditor?.getValue()))
                .toContain(':::header{height="s" width="m"}\n:::');
            await editor.switchMode('wysiwyg');
            await expect(page.locator('.ProseMirror .g-md-header')).toHaveCount(1);
        });
    }

    test('should insert a header after the current markup line', async ({mount, page}) => {
        await mount(<HeaderStories.Markdown initial="Before" />);
        await page.getByRole('button', {name: 'Cover', exact: true}).click();
        await expect
            .poll(() => page.evaluate(() => window.mdEditor?.getValue()))
            .toContain('Before\n\n:::header{height="s" width="m"}\n:::');
    });

    test('should preserve unsupported content when switching editor modes', async ({
        mount,
        page,
        editor,
    }) => {
        const source = ':::header{width="s" title="Keep title"}\nKeep **content**\n:::';
        await mount(<HeaderStories.Markdown initial={source} />);
        await editor.switchMode('wysiwyg');
        await expect(page.locator('.ProseMirror pre[data-header-source]')).toHaveText(source);
        await expect(page.getByTestId('header-settings')).toHaveCount(0);
        await editor.switchMode('markup');
        await expect.poll(() => page.evaluate(() => window.mdEditor?.getValue())).toBe(source);
    });
});
