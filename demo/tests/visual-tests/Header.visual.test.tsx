import type {CSSProperties} from 'react';

import {expect, test} from 'playwright/core';

import {HeaderStories} from './Header.helpers';

const header = (height: string, width: string) =>
    `:::header{height="${height}" width="${width}"}\n:::`;

// Host sizes keep the screenshots small; the default sizes are checked in 'should apply default sizes'.
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
    test('should apply default sizes', async ({mount, page}) => {
        await mount(
            <HeaderStories.Header
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

    test('should render dimensions', async ({mount, page, expectScreenshot}) => {
        await mount(
            <div style={smallSizes}>
                <HeaderStories.Header
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

    test('should constrain each width to a narrow column', async ({
        mount,
        page,
        expectScreenshot,
    }) => {
        await mount(
            <div style={smallSizes}>
                <HeaderStories.Header
                    width={160}
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

    test('should show the toolbar on hover', async ({mount, page, expectScreenshot}) => {
        await mount(<HeaderStories.Header width={660} initial={`${header('s', 's')}\n\nAfter`} />);
        await page.locator('.ProseMirror .g-md-header-plugin').hover();
        await expect(page.locator('.g-md-header-view__controls')).toHaveCSS('opacity', '1');
        await expectScreenshot({component: page.locator('.g-md-editor-component')});
    });

    test('should change dimensions in the settings panel', async ({
        mount,
        page,
        expectScreenshot,
    }) => {
        await mount(<HeaderStories.Header width={660} initial={`${header('s', 's')}\n\nAfter`} />);
        const view = page.locator('.g-md-editor-component');
        const block = page.locator('.ProseMirror .g-md-header-plugin');
        const settingsButton = page
            .locator('.g-md-header-view__toolbar')
            .getByRole('button', {name: 'Settings', exact: true});
        await block.hover();
        await settingsButton.click();
        const settings = page.getByRole('dialog', {name: 'Banner settings'});
        const height = settings.getByRole('combobox', {name: 'Height', exact: true});
        await expect(settings).toBeVisible();
        await expect(height).toBeFocused();
        await expectScreenshot({component: view});

        await height.click();
        await expect(page.getByRole('option')).toHaveText(['S', 'M', 'L']);
        await expectScreenshot({component: view, nameSuffix: 'height list'});
        await page.keyboard.press('Escape');
        await expect(page.getByRole('option')).toHaveCount(0);
        await expect(settings).toBeVisible();
        await height.click();
        await page.getByRole('option', {name: 'M', exact: true}).click();
        await expect(block).toHaveClass(/g-md-header-plugin_height_m/);

        await settings.getByRole('combobox', {name: 'Width', exact: true}).click();
        await expect(page.getByRole('option')).toHaveText(['S', 'M', 'L', 'Full width']);
        await expectScreenshot({component: view, nameSuffix: 'width list'});
        await page.getByRole('option', {name: 'M', exact: true}).click();
        await expect(block).toHaveClass(/g-md-header-plugin_width_m/);

        await settings.getByRole('button', {name: 'Close', exact: true}).click();
        await expect(settings).toBeHidden();
        await expect(settingsButton).toBeFocused();
    });

    test('should preserve edited content and dimensions when switching modes', async ({
        mount,
        page,
        editor,
    }) => {
        await mount(
            <HeaderStories.Header
                mode="markup"
                width={660}
                initial={':::header{width="s"}\nKeep **text**\n:::'}
            />,
        );
        await editor.switchMode('wysiwyg');
        const block = page.locator('.ProseMirror .g-md-header-plugin');
        await expect(block.locator('strong')).toHaveText('text');
        await block.locator('p').click();
        await editor.press('End');
        await editor.pressSequentially(' edited');
        await block.hover();
        await page
            .getByRole('toolbar')
            .getByRole('button', {name: 'Settings', exact: true})
            .click();
        const settings = page.getByRole('dialog', {name: 'Banner settings'});
        await settings.getByText('Banner settings', {exact: true}).click({clickCount: 3});
        // ProseMirror restores its own selection 20 ms after the editor gains focus.
        await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 50)));
        expect(
            await page.evaluate(() => {
                const selection = getSelection();
                return {
                    range: selection?.rangeCount ? selection.getRangeAt(0).toString().trim() : '',
                    text: selection?.toString().trim(),
                };
            }),
        ).toEqual({range: 'Banner settings', text: 'Banner settings'});
        await settings.getByRole('combobox', {name: 'Height', exact: true}).click();
        await page.getByRole('option', {name: 'L', exact: true}).click();
        await settings.getByRole('button', {name: 'Close', exact: true}).click();
        await editor.switchMode('markup');
        const markup = await page.evaluate(() => window.mdEditor?.getValue());
        expect(markup).toContain(':::header{height="l" width="s"}');
        expect(markup).toContain('edited');
        await editor.switchMode('wysiwyg');
        await expect(block.locator('p')).toHaveText('Keep text edited');
        await expect(block.locator('strong')).toContainText('text');
        await expect(block).toHaveClass(/g-md-header-plugin_height_l/);
    });

    test('should support keyboard controls and return focus to the settings button', async ({
        mount,
        page,
        editor,
    }) => {
        await mount(<HeaderStories.Header width={660} initial={`${header('s', 's')}\n\nAfter`} />);
        const block = page.locator('.ProseMirror .g-md-header-plugin');
        const toolbar = block.getByRole('toolbar');
        const settingsButton = toolbar.getByRole('button', {name: 'Settings', exact: true});
        const copy = toolbar.getByRole('button', {name: 'Copy', exact: true});
        const remove = toolbar.getByRole('button', {name: 'Delete', exact: true});
        await editor.focus();
        await editor.press('ControlOrMeta+Home');
        await editor.press('Tab');
        await expect(settingsButton).toBeFocused();
        await expect(block.locator('.g-md-header-view__controls')).toHaveCSS('opacity', '1');
        await settingsButton.press('Enter');
        const settings = page.getByRole('dialog', {name: 'Banner settings'});
        const height = settings.getByRole('combobox', {name: 'Height', exact: true});
        await expect(height).toBeFocused();
        await height.press('Escape');
        await expect(settings).toBeHidden();
        await expect(settingsButton).toBeFocused();

        await settingsButton.press('Enter');
        await expect(settings).toBeVisible();
        await settingsButton.press('Tab');
        await copy.press('Tab');
        await remove.press('Tab');
        const close = settings.getByRole('button', {name: 'Close', exact: true});
        await expect(close).toBeFocused();
        await close.press('Enter');
        await expect(settings).toBeHidden();
        await expect(settingsButton).toBeFocused();

        await editor.press('Shift+Tab');
        await expect(remove).toBeFocused();
        await remove.press('Enter');
        await expect(block).toHaveCount(0);
        await expect(page.locator('.ProseMirror')).toBeFocused();
        await editor.press('ControlOrMeta+z');
        await expect(block).toHaveCount(1);
    });
});

test.describe('Header on mobile', () => {
    test.use({viewport: {width: 375, height: 812}});

    test('should fit a mobile viewport', async ({mount, page, expectScreenshot}) => {
        await mount(<HeaderStories.Header width={335} />);
        await expect(page.locator('.ProseMirror .g-md-header-plugin')).toBeVisible();
        await expectScreenshot({component: page.locator('.g-md-editor-component')});
    });

    test('should keep settings inside a narrow block', async ({mount, page, expectScreenshot}) => {
        await mount(<HeaderStories.Header width={335} />);
        const block = page.locator('.ProseMirror .g-md-header-plugin');
        await block.hover();
        await block.getByRole('button', {name: 'Settings', exact: true}).click();
        const settings = page.getByRole('dialog', {name: 'Banner settings'});
        await expect(settings).toBeVisible();
        const blockBounds = await block.boundingBox();
        const panelBounds = await settings.boundingBox();
        if (!blockBounds || !panelBounds) throw new Error('Header and settings must have bounds');
        expect(panelBounds.x).toBeGreaterThanOrEqual(blockBounds.x);
        expect(panelBounds.x + panelBounds.width).toBeLessThanOrEqual(
            blockBounds.x + blockBounds.width,
        );
        expect(
            await settings.evaluate((element) => element.scrollWidth <= element.clientWidth),
        ).toBe(true);
        await settings.getByRole('combobox', {name: 'Width', exact: true}).click();
        await page.getByRole('option', {name: 'Full width', exact: true}).click();
        await expect(block).toHaveClass(/g-md-header-plugin_width_full/);
        await expectScreenshot({component: page.locator('.g-md-editor-component')});
    });
});
