import type {CSSProperties} from 'react';

import {expect, test} from 'playwright/core';

import {HeaderStories} from './Header.helpers';

const header = (height: string, width: string) =>
    `:::header{height="${height}" width="${width}"}\n:::`;

// Host sizes keep the screenshots small; the default sizes are checked in 'default sizes'.
const smallSizes = {
    '--g-md-header-plugin-height-s': '40px',
    '--g-md-header-plugin-height-m': '60px',
    '--g-md-header-plugin-height-l': '80px',
    '--g-md-header-plugin-width-s': '120px',
    '--g-md-header-plugin-width-m': '180px',
    '--g-md-header-plugin-width-l': '240px',
} as CSSProperties;

const dimensions = [
    ['s', 'm'],
    ['s', 's'],
    ['m', 'l'],
    ['s', 'full'],
];

test.describe('Header', () => {
    test('default sizes', async ({mount, page}) => {
        await mount(
            <HeaderStories.Wysiwyg
                width={1280}
                initial={`${dimensions.map(([height, width]) => header(height, width)).join('\n\n')}\n\nAfter`}
            />,
        );
        const column = await page.locator('.ProseMirror > p').boundingBox();
        const sizes = await page
            .locator('.ProseMirror .g-md-header-plugin')
            .evaluateAll((elements) =>
                elements.map((element) => {
                    const {width, height} = element.getBoundingClientRect();
                    return [width, height];
                }),
            );
        expect(sizes).toEqual([
            [900, 236],
            [600, 236],
            [1200, 300],
            [column?.width, 236],
        ]);
    });

    test('dimensions', async ({mount, page, expectScreenshot}) => {
        await mount(
            <div style={smallSizes}>
                <HeaderStories.Wysiwyg
                    width={300}
                    initial={dimensions
                        .map(([height, width]) => header(height, width))
                        .join('\n\n')}
                />
            </div>,
        );
        await expect(page.locator('.ProseMirror .g-md-header-plugin')).toHaveCount(4);
        await expectScreenshot({component: page.locator('.g-md-editor-component')});
    });

    test('each width in a narrow column', async ({mount, page, expectScreenshot}) => {
        await mount(
            <div style={smallSizes}>
                <HeaderStories.Wysiwyg
                    width={200}
                    initial={['s', 'm', 'l', 'full']
                        .map((width) => header('s', width))
                        .join('\n\n')}
                />
            </div>,
        );
        const blocks = page.locator('.ProseMirror .g-md-header-plugin');
        await expect(blocks).toHaveCount(4);
        const widths = await blocks.evaluateAll((elements) =>
            elements.map((element) => element.getBoundingClientRect().width),
        );
        const [small, medium, large, full] = widths;
        expect(small).toBe(120);
        expect([medium, large]).toEqual([full, full]);
        expect(full).toBeLessThan(180);
        await expectScreenshot({component: page.locator('.g-md-editor-component')});
    });

    test('hover toolbar', async ({mount, page, expectScreenshot}) => {
        await mount(<HeaderStories.Wysiwyg width={660} initial={`${header('s', 's')}\n\nAfter`} />);
        await page.locator('.ProseMirror .g-md-header-plugin').hover();
        await expect(page.locator('.g-md-header-view__toolbar')).toBeVisible();
        await expectScreenshot({component: page.locator('.g-md-editor-component')});
    });

    test('settings panel', async ({mount, page, expectScreenshot}) => {
        await mount(<HeaderStories.Wysiwyg width={660} initial={`${header('s', 's')}\n\nAfter`} />);
        const view = page.locator('.g-md-editor-component');
        const block = page.locator('.ProseMirror .g-md-header-plugin');
        await block.hover();
        await page
            .locator('.g-md-header-view__toolbar')
            .getByRole('button', {name: 'Settings', exact: true})
            .click();
        const settings = page.getByRole('dialog', {name: 'Block settings'});
        await expect(settings).toBeVisible();
        await expectScreenshot({component: view});

        await settings.getByRole('combobox', {name: 'Height', exact: true}).click();
        await expect(page.getByRole('option')).toHaveText(['S', 'M', 'L']);
        await expectScreenshot({component: view, nameSuffix: 'height list'});
        await page.getByRole('option', {name: 'M', exact: true}).click();
        await expect(block).toHaveClass(/g-md-header-plugin_height_m/);

        await settings.getByRole('combobox', {name: 'Width', exact: true}).click();
        await expect(page.getByRole('option')).toHaveText(['S', 'M', 'L', 'Full width']);
        await expectScreenshot({component: view, nameSuffix: 'width list'});
        await page.getByRole('option', {name: 'M', exact: true}).click();
        await expect(block).toHaveClass(/g-md-header-plugin_width_m/);

        await settings.getByRole('button', {name: 'Close', exact: true}).click();
        await expect(settings).toBeHidden();
    });

    test('text after switching modes', async ({mount, page, editor}) => {
        const source = ':::header{width="s"}\nKeep **text**\n:::';
        await mount(<HeaderStories.Markdown width={400} initial={source} />);
        await editor.switchMode('wysiwyg');
        await page.locator('.ProseMirror .g-md-header-plugin').hover();
        const toolbar = page.locator('.g-md-header-view__toolbar');
        await expect(toolbar.getByRole('button', {name: 'Copy', exact: true})).toBeVisible();
        await expect(toolbar.getByRole('button', {name: 'Settings', exact: true})).toBeHidden();
        await editor.switchMode('markup');
        await expect.poll(() => page.evaluate(() => window.mdEditor?.getValue())).toBe(source);
    });
});

test.describe('Header on mobile', () => {
    test.use({viewport: {width: 375, height: 812}});

    test('block', async ({mount, page, expectScreenshot}) => {
        await mount(<HeaderStories.Wysiwyg width={335} />);
        await expect(page.locator('.ProseMirror .g-md-header-plugin')).toBeVisible();
        await expectScreenshot({component: page.locator('.g-md-editor-component')});
    });
});
