import {expect, test} from 'playwright/core';

import {HeaderStories} from './Header.helpers';

const header = (height: string, width: string) =>
    `:::header{height="${height}" width="${width}"}\n:::`;

test.describe('Header', () => {
    test.use({viewport: {width: 1500, height: 1000}});

    for (const [height, width] of [
        ['s', 'm'],
        ['s', 's'],
        ['m', 'l'],
        ['s', 'full'],
    ]) {
        test(`block height ${height} width ${width}`, async ({mount, page, expectScreenshot}) => {
            await mount(
                <HeaderStories.Wysiwyg
                    width={1300}
                    initial={`${header(height, width)}\n\nAfter`}
                />,
            );
            await expect(page.locator('.ProseMirror .g-md-header-plugin')).toBeVisible();
            await expectScreenshot({component: page.locator('.playwright-wrapper-test')});
        });
    }

    test('hover toolbar', async ({mount, page, expectScreenshot}) => {
        await mount(<HeaderStories.Wysiwyg />);
        await page.locator('.ProseMirror .g-md-header-plugin').hover();
        await expect(page.locator('.g-md-header-view__toolbar')).toBeVisible();
        await expectScreenshot({fullPage: true});
    });

    test('settings panel', async ({mount, page, expectScreenshot}) => {
        await mount(<HeaderStories.Wysiwyg />);
        const block = page.locator('.ProseMirror .g-md-header-plugin');
        await block.hover();
        await page
            .locator('.g-md-header-view__toolbar')
            .getByRole('button', {name: 'Settings', exact: true})
            .click();
        const settings = page.getByRole('dialog', {name: 'Block settings'});
        await expect(settings).toBeVisible();
        await expectScreenshot({fullPage: true});

        await settings.getByRole('combobox', {name: 'Height', exact: true}).click();
        await expect(page.getByRole('option')).toHaveText(['S', 'M', 'L']);
        await expectScreenshot({fullPage: true, nameSuffix: 'height list'});
        await page.getByRole('option', {name: 'M', exact: true}).click();
        await expect(block).toHaveAttribute('data-height', 'm');

        await settings.getByRole('combobox', {name: 'Width', exact: true}).click();
        await expect(page.getByRole('option')).toHaveText(['S', 'M', 'L', 'Full width']);
        await expectScreenshot({fullPage: true, nameSuffix: 'width list'});
        await page.getByRole('option', {name: 'S', exact: true}).click();
        await expect(block).toHaveAttribute('data-width', 's');

        await settings.getByRole('button', {name: 'Close', exact: true}).click();
        await expect(settings).toBeHidden();
    });

    test('each width in a narrow column', async ({mount, page, expectScreenshot}) => {
        await mount(
            <HeaderStories.Wysiwyg
                width={420}
                initial={['s', 'm', 'l', 'full'].map((width) => header('s', width)).join('\n\n')}
            />,
        );
        const blocks = page.locator('.ProseMirror .g-md-header-plugin');
        await expect(blocks).toHaveCount(4);
        for (const block of await blocks.all()) {
            expect((await block.boundingBox())?.width).toBeLessThanOrEqual(420);
        }
        await expectScreenshot({component: page.locator('.playwright-wrapper-test')});
    });

    test('unsupported text after switching modes', async ({
        mount,
        page,
        editor,
        expectScreenshot,
    }) => {
        const source = ':::header{width="s"}\nKeep **text**\n:::';
        await mount(<HeaderStories.Markdown initial={source} />);
        await editor.switchMode('wysiwyg');
        await expect(page.locator('.ProseMirror pre[data-header-source]')).toHaveText(source);
        await expectScreenshot({component: page.locator('.playwright-wrapper-test')});
        await editor.switchMode('markup');
        await expect.poll(() => page.evaluate(() => window.mdEditor?.getValue())).toBe(source);
    });
});

test.describe('Header on mobile', () => {
    test.use({viewport: {width: 375, height: 812}});

    test('block', async ({mount, page, expectScreenshot}) => {
        await mount(<HeaderStories.Wysiwyg width={335} />);
        await expect(page.locator('.ProseMirror .g-md-header-plugin')).toBeVisible();
        await expectScreenshot({fullPage: true});
    });
});
