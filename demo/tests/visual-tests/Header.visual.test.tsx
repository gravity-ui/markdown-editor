import type {CSSProperties} from 'react';

import {expect} from 'playwright/core';
import {test} from 'playwright/core/extensions/header';

import {HeaderStories} from './Header.helpers';

const headerMarkup = (height: string, width: string) =>
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
    test('should apply default sizes @wysiwyg', async ({mount, page, header}) => {
        await mount(
            <HeaderStories.Header
                width={1280}
                initial={`${dimensions.map(([height, width]) => headerMarkup(height, width)).join('\n\n')}\n\nAfter`}
            />,
        );
        const column = await page.locator('.ProseMirror > p').boundingBox();
        const sizes = await header.blocks.evaluateAll((elements) =>
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

    test('should insert via toolbar @wysiwyg', async ({mount, editor, header}) => {
        await mount(<HeaderStories.Header width={660} initial="" />);
        await editor.focus();
        await editor.clickMainToolbarButton('Banner');
        await expect(header.blocks).toHaveCount(1);
    });

    test('should insert via toolbar @markup', async ({mount, page, editor}) => {
        await mount(<HeaderStories.Header mode="markup" width={660} initial="" />);
        await editor.focus();
        await editor.clickMainToolbarButton('Banner');
        await expect
            .poll(() => page.evaluate(() => window.mdEditor?.getValue()))
            .toMatch(/:::header\{height="\w+" width="\w+"\}\n\n:::/);
    });

    test('should render dimensions @wysiwyg', async ({mount, page, header, expectScreenshot}) => {
        await mount(
            <div style={smallSizes}>
                <HeaderStories.Header
                    width={300}
                    initial={dimensions
                        .map(([height, width]) => headerMarkup(height, width))
                        .join('\n\n')}
                />
            </div>,
        );
        await expect(header.blocks).toHaveCount(4);
        await header.hideToolbar();
        await expectScreenshot({component: page.locator('.g-md-editor-component')});
    });

    test('should constrain each width to a narrow column @wysiwyg', async ({
        mount,
        page,
        header,
        expectScreenshot,
    }) => {
        await mount(
            <div style={smallSizes}>
                <HeaderStories.Header
                    width={160}
                    initial={['s', 'm', 'l', 'full']
                        .map((width) => headerMarkup('s', width))
                        .join('\n\n')}
                />
            </div>,
        );
        await expect(header.blocks).toHaveCount(4);
        const widths = await header.blocks.evaluateAll((elements) =>
            elements.map((element) => element.getBoundingClientRect().width),
        );
        const [small, medium, large, full] = widths;
        expect(small).toBe(120);
        expect([medium, large]).toEqual([full, full]);
        expect(full).toBeLessThan(180);
        await header.hideToolbar();
        await expectScreenshot({component: page.locator('.g-md-editor-component')});
    });

    test('should show the toolbar when the cursor is in the block @wysiwyg', async ({
        mount,
        editor,
        header,
        expectScreenshot,
    }) => {
        await mount(
            <HeaderStories.Header width={660} initial={`${headerMarkup('s', 's')}\n\nAfter`} />,
        );
        await editor.focus();
        await editor.press('ControlOrMeta+Home');
        await expect(header.toolbar).toBeVisible();
        await expectScreenshot({fullPage: true});
    });

    test('should preserve edits when switching modes @wysiwyg @markup', async ({
        mount,
        page,
        editor,
        header,
    }) => {
        await mount(
            <HeaderStories.Header
                mode="markup"
                width={660}
                initial={':::header{width="s"}\nKeep **text**\n:::'}
            />,
        );
        await editor.switchMode('wysiwyg');
        await expect(header.blocks.locator('strong')).toHaveText('text');
        await header.blocks.locator('p').click();
        await editor.press('End');
        await editor.pressSequentially(' edited');
        await editor.switchMode('markup');
        const markup = await page.evaluate(() => window.mdEditor?.getValue());
        expect(markup).toContain(':::header{height="s" width="s"}');
        expect(markup).toContain('edited');
        await editor.switchMode('wysiwyg');
        await expect(header.blocks.locator('p')).toHaveText('Keep text edited');
        await expect(header.blocks.locator('strong')).toContainText('text');
        await expect(header.blocks).toHaveClass(/g-md-header-plugin_width_s/);
    });

    test('should move focus to the toolbar with Tab and Shift+Tab @wysiwyg', async ({
        mount,
        page,
        editor,
        header,
    }) => {
        await mount(
            <HeaderStories.Header width={660} initial={`${headerMarkup('s', 's')}\n\nAfter`} />,
        );
        await editor.focus();
        await editor.press('ControlOrMeta+Home');
        await editor.press('Tab');
        await expect(header.copyButton).toBeFocused();

        await editor.focus();
        await editor.press('ControlOrMeta+Home');
        await editor.press('Shift+Tab');
        await expect(header.removeButton).toBeFocused();
        await header.removeButton.press('Enter');
        await expect(header.blocks).toHaveCount(0);
        await expect(page.locator('.ProseMirror')).toBeFocused();
        await editor.press('ControlOrMeta+z');
        await expect(header.blocks).toHaveCount(1);
    });
});

test.describe('Header on mobile', () => {
    test.use({viewport: {width: 375, height: 812}});

    test('should fit a mobile viewport @wysiwyg', async ({
        mount,
        page,
        header,
        expectScreenshot,
    }) => {
        await mount(<HeaderStories.Header width={335} />);
        await expect(header.blocks).toBeVisible();
        await header.hideToolbar();
        await expectScreenshot({component: page.locator('.g-md-editor-component')});
    });
});
