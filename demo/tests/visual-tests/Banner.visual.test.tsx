import type {CSSProperties} from 'react';

import {expect} from 'playwright/core';
import {test} from 'playwright/core/extensions/banner';

import {BannerStories} from './Banner.helpers';

const bannerMarkup = (height: string, width: string) =>
    `:::banner{height="${height}" width="${width}"}\n:::`;

// Host sizes keep the screenshots small; the default sizes are checked in 'should apply default sizes'.
const smallSizes = {
    '--g-md-banner-plugin-height-s': '40px',
    '--g-md-banner-plugin-height-m': '60px',
    '--g-md-banner-plugin-height-l': '80px',
    '--g-md-banner-plugin-width-s': '120px',
    '--g-md-banner-plugin-width-m': '180px',
    '--g-md-banner-plugin-width-l': '240px',
} as CSSProperties;

const SETTINGS_INSET = 16;
const SETTINGS_MIN_HEIGHT = 160;

const dimensions = [
    ['s', 'm'],
    ['s', 's'],
    ['m', 'l'],
    ['s', 'full'],
];

test.describe('Banner', () => {
    test('should apply default sizes @wysiwyg', async ({mount, page, banner}) => {
        await mount(
            <BannerStories.Banner
                width={1280}
                initial={`${dimensions.map(([height, width]) => bannerMarkup(height, width)).join('\n\n')}\n\nAfter`}
            />,
        );
        const column = await page.locator('.ProseMirror > p').boundingBox();
        const sizes = await banner.blocks.evaluateAll((elements) =>
            elements.map((element) => {
                const {width, height} = element.getBoundingClientRect();
                return [width, height];
            }),
        );
        expect(sizes).toEqual([
            [900, 236],
            [600, 236],
            [1200, 300],
            [column && Math.round(column.width), 236],
        ]);
    });

    test('should insert via toolbar @wysiwyg', async ({mount, editor, banner}) => {
        await mount(<BannerStories.Banner width={660} initial="" />);
        await editor.focus();
        await editor.clickMainToolbarButton('Banner');
        await expect(banner.blocks).toHaveCount(1);
    });

    test('should insert via toolbar @markup', async ({mount, page, editor}) => {
        await mount(<BannerStories.Banner mode="markup" width={660} initial="" />);
        await editor.focus();
        await editor.clickMainToolbarButton('Banner');
        await expect
            .poll(() => page.evaluate(() => window.mdEditor?.getValue()))
            .toMatch(/:::banner\{height="\w+" width="\w+"\}\n\n::banner-title\[/);
    });

    test('should render dimensions @wysiwyg', async ({mount, editor, banner, expectScreenshot}) => {
        await mount(
            <div style={smallSizes}>
                <BannerStories.Banner
                    width={300}
                    initial={dimensions
                        .map(([height, width]) => bannerMarkup(height, width))
                        .join('\n\n')}
                />
            </div>,
        );
        await expect(banner.blocks).toHaveCount(4);
        await banner.focusEditor();
        await banner.hideToolbar();
        await expectScreenshot({component: editor.locators.component});
    });

    test('should constrain each width to a narrow column @wysiwyg', async ({
        mount,
        editor,
        banner,
        expectScreenshot,
    }) => {
        await mount(
            <div style={smallSizes}>
                <BannerStories.Banner
                    width={160}
                    initial={['s', 'm', 'l', 'full']
                        .map((width) => bannerMarkup('s', width))
                        .join('\n\n')}
                />
            </div>,
        );
        await expect(banner.blocks).toHaveCount(4);
        const widths = await banner.blocks.evaluateAll((elements) =>
            elements.map((element) => element.getBoundingClientRect().width),
        );
        const [small, medium, large, full] = widths;
        expect(small).toBe(120);
        expect([medium, large]).toEqual([full, full]);
        expect(full).toBeLessThan(180);
        await banner.focusEditor();
        await banner.hideToolbar();
        await expectScreenshot({component: editor.locators.component});
    });

    test('should keep a blurred background inside a narrow column @wysiwyg', async ({
        mount,
        banner,
    }) => {
        await mount(
            <BannerStories.Banner
                width={300}
                initial={
                    ':::banner{height="s" width="full" bg-image="https://example.com/banner.png" bg-image-blur="true"}\n:::'
                }
            />,
        );
        await expect(banner.blocks).toHaveCount(1);
        const overflow = await banner.blocks.evaluate((element) => {
            const parent = element.parentElement;
            return parent ? parent.scrollWidth - parent.clientWidth : null;
        });
        expect(overflow).toBe(0);
    });

    test('should show the toolbar when the cursor is in the block @wysiwyg', async ({
        mount,
        editor,
        banner,
        expectScreenshot,
    }) => {
        await mount(
            <BannerStories.Banner width={660} initial={`${bannerMarkup('s', 's')}\n\nAfter`} />,
        );
        await editor.focus();
        await editor.press('ControlOrMeta+Home');
        await expect(banner.toolbar).toBeVisible();
        await expectScreenshot({component: editor.locators.component});
    });

    test('should change dimensions in the settings panel @wysiwyg', async ({
        mount,
        page,
        editor,
        wait,
        banner,
        expectScreenshot,
    }) => {
        await page.setViewportSize({width: 740, height: 640});
        await mount(
            <BannerStories.Banner width={660} initial={`${bannerMarkup('s', 's')}\n\nAfter`} />,
        );
        await editor.focus();
        await editor.press('ControlOrMeta+Home');
        await banner.openSettings();
        await expect(banner.height).toBeFocused();
        await expect.poll(() => banner.settingsOffsets()).toEqual([0, 0]);
        await banner.setExpandedSections();
        await expectScreenshot({fullPage: true});

        await banner.height.click();
        await expect(banner.options).toHaveText(['S', 'M', 'L']);
        await expectScreenshot({fullPage: true, nameSuffix: 'height list'});
        await page.keyboard.press('Escape');
        await expect(banner.options).toHaveCount(0);
        await expect(banner.settings).toBeVisible();
        await banner.select(banner.height, 'M');
        await expect(banner.blocks).toHaveClass(/g-md-banner-plugin_height_m/);
        await wait.markupPreview(':::banner{height="m" width="s"}');

        await banner.width.click();
        await expect(banner.options).toHaveText(['S', 'M', 'L', 'Full width']);
        await expectScreenshot({fullPage: true, nameSuffix: 'width list'});
        await banner.option('M').click();
        await expect(banner.blocks).toHaveClass(/g-md-banner-plugin_width_m/);

        await banner.closeButton.click();
        await expect(banner.settings).toBeHidden();
        await expect(banner.settingsButton).toBeFocused();
    });

    test('should close the settings on a second click of the settings button @wysiwyg', async ({
        mount,
        editor,
        banner,
    }) => {
        await mount(
            <BannerStories.Banner width={660} initial={`${bannerMarkup('s', 's')}\n\nAfter`} />,
        );
        await editor.focus();
        await editor.press('ControlOrMeta+Home');
        await banner.openSettings();
        await banner.settingsButton.click();
        await expect(banner.settings).toBeHidden();
    });

    test('should keep the settings usable near the bottom edge of the viewport @wysiwyg', async ({
        mount,
        page,
        editor,
        banner,
    }) => {
        await page.setViewportSize({width: 700, height: 600});
        await mount(
            <BannerStories.Banner width={660} initial={`${bannerMarkup('s', 's')}\n\nAfter`} />,
        );
        await editor.focus();
        await editor.press('ControlOrMeta+Home');
        await banner.openSettings();
        const block = await banner.blocks.boundingBox();
        if (!block) throw new Error('The banner must have bounds');
        // Less than the minimum height remains between the panel corner and the viewport bottom.
        const height = Math.round(block.y) + 2 * SETTINGS_INSET + SETTINGS_MIN_HEIGHT - 20;
        await page.setViewportSize({width: 700, height});
        await expect.poll(() => banner.settingsBottom()).toBe(height - SETTINGS_INSET);
        expect((await banner.settings.boundingBox())?.height).toBeCloseTo(SETTINGS_MIN_HEIGHT, 0);
        await expect(banner.closeButton).toBeInViewport({ratio: 1});
        await expect(banner.width).toBeInViewport({ratio: 1});
    });

    test('should fit the settings to the viewport after the banner moves @wysiwyg', async ({
        mount,
        page,
        editor,
        banner,
    }) => {
        await page.setViewportSize({width: 700, height: 600});
        await mount(
            <BannerStories.Banner width={660} initial={`${bannerMarkup('s', 's')}\n\nAfter`} />,
        );
        await editor.focus();
        await editor.press('ControlOrMeta+Home');
        await banner.openSettings();
        await expect.poll(() => banner.settingsBottom()).toBe(600 - SETTINGS_INSET);
        // Content above the banner grows without resize or scroll events.
        await page.locator('.playwright-wrapper-test').evaluate((element) => {
            element.style.paddingTop = '120px';
        });
        await expect.poll(() => banner.settingsOffsets()).toEqual([0, 0]);
        await expect.poll(() => banner.settingsBottom()).toBe(600 - SETTINGS_INSET);
    });

    test('should show all settings sections @wysiwyg', async ({
        mount,
        page,
        editor,
        banner,
        expectScreenshot,
    }) => {
        await page.setViewportSize({width: 1080, height: 914});
        await mount(<BannerStories.Wysiwyg />);
        await editor.focus();
        await editor.press('ControlOrMeta+Home');
        await banner.openSettings();
        await expect(banner.toggle('Title')).toBeChecked();
        await expect(banner.toggle('Description')).toBeChecked();
        await expect(banner.toggle('Button 1')).toBeChecked();
        await expect(banner.toggle('Button 2')).not.toBeChecked();
        await expect(banner.toggle('Button 2')).toBeEnabled();
        await expect(banner.toggle('Button 3')).not.toBeChecked();
        await expect(banner.toggle('Button 3')).toBeDisabled();
        await expect(banner.toggle('Image')).toBeChecked();
        await expect(banner.alignment('Vertically', 'Center')).toBeChecked();
        await expect(banner.alignment('Horizontally', 'Left')).toBeChecked();
        await banner.scrollSettingsToEnd();
        await expect(banner.background).toBeInViewport({ratio: 1});
        await page.mouse.move(0, 0);
        await expectScreenshot({fullPage: true, nameSuffix: 'panel'});
    });

    test('should select a background fill with arrow keys @wysiwyg', async ({
        mount,
        editor,
        banner,
    }) => {
        await mount(<BannerStories.Banner width={660} />);
        await editor.focus();
        await editor.press('ControlOrMeta+Home');
        await banner.openSettings();
        await banner.background.click();

        await banner.backgroundSwatch('Gray 20%').press('ArrowRight');
        await expect(banner.backgroundSwatch('Green 20%')).toBeFocused();
        await expect(banner.backgroundSwatch('Green 20%')).toBeChecked();
        await expect(banner.blocks).toHaveAttribute('data-bg-color', 'green-light');

        await banner.backgroundSwatch('Green 20%').press('ArrowDown');
        await expect(banner.backgroundSwatch('Green 50%')).toBeFocused();
        await expect(banner.backgroundSwatch('Green 50%')).toBeChecked();
        await expect(banner.blocks).toHaveAttribute('data-bg-color', 'green-medium');
    });

    test('should close the background popup with Escape and keep the settings @wysiwyg', async ({
        mount,
        page,
        editor,
        banner,
    }) => {
        await mount(<BannerStories.Banner width={660} />);
        await editor.focus();
        await editor.press('ControlOrMeta+Home');
        await banner.openSettings();
        const initial = await page.evaluate(() => window.mdEditor?.getValue());

        await expect(banner.background).toHaveAccessibleName('Background No background');
        await banner.background.click();
        // Until the popup takes focus, the settings panel handles Escape.
        await expect(banner.backgroundTab('Fill')).toBeFocused();
        await page.keyboard.press('Escape');
        await expect(banner.backgroundPopup).toBeHidden();
        await expect(banner.settings).toBeVisible();
        expect(await page.evaluate(() => window.mdEditor?.getValue())).toBe(initial);
    });

    test('should select the settings text with the mouse @wysiwyg', async ({
        mount,
        page,
        editor,
        banner,
    }) => {
        await mount(
            <BannerStories.Banner width={660} initial={`${bannerMarkup('s', 's')}\n\nAfter`} />,
        );
        await editor.focus();
        await editor.press('ControlOrMeta+Home');
        await banner.openSettings();

        for (const text of ['Banner settings', 'Height', 'Width']) {
            const box = await banner.settings.getByText(text, {exact: true}).boundingBox();
            if (!box) throw new Error(`"${text}" is not rendered`);
            const y = box.y + box.height / 2;
            await page.mouse.move(box.x + 1, y);
            await page.mouse.down();
            await page.mouse.move(box.x + box.width - 2, y, {steps: 5});
            await page.mouse.up();
            expect(await page.evaluate(() => getSelection()?.toString().trim())).toBe(text);
        }
    });

    test('should close the settings and preserve edits when switching modes @wysiwyg @markup', async ({
        mount,
        page,
        editor,
        banner,
    }) => {
        await mount(
            <BannerStories.Banner
                mode="markup"
                width={660}
                initial={':::banner{width="s"}\nKeep **text**\n:::'}
            />,
        );
        await editor.switchMode('wysiwyg');
        await expect(banner.blocks.locator('strong')).toHaveText('text');
        await banner.blocks.locator('p').click();
        await editor.press('End');
        await editor.pressSequentially(' edited');
        await banner.openSettings();
        await banner.select(banner.height, 'L');
        await editor.switchMode('markup');
        await expect(banner.settings).toBeHidden();
        const markup = await page.evaluate(() => window.mdEditor?.getValue());
        expect(markup).toContain(':::banner{height="l" width="s"}');
        expect(markup).toContain('edited');
        await editor.switchMode('wysiwyg');
        await expect(banner.blocks.locator('p')).toHaveText('Keep text edited');
        await expect(banner.blocks.locator('strong')).toContainText('text');
        await expect(banner.blocks).toHaveClass(/g-md-banner-plugin_height_l/);
        await expect(banner.settings).toBeHidden();
    });

    test('should support keyboard controls and return focus to the settings button @wysiwyg', async ({
        mount,
        page,
        editor,
        banner,
    }) => {
        await mount(
            <BannerStories.Banner width={660} initial={`${bannerMarkup('s', 's')}\n\nAfter`} />,
        );
        await editor.focus();
        await editor.press('ControlOrMeta+Home');
        await editor.press('Tab');
        await expect(banner.settingsButton).toBeFocused();
        await banner.settingsButton.press('Enter');
        await expect(banner.height).toBeFocused();
        await banner.height.press('Escape');
        await expect(banner.settings).toBeHidden();
        await expect(banner.settingsButton).toBeFocused();

        await banner.settingsButton.press('Enter');
        await expect(banner.height).toBeFocused();
        await banner.height.press('Shift+Tab');
        await expect(banner.closeButton).toBeFocused();
        await banner.closeButton.press('Enter');
        await expect(banner.settings).toBeHidden();
        await expect(banner.settingsButton).toBeFocused();

        await editor.press('Shift+Tab');
        await expect(banner.removeButton).toBeFocused();
        await banner.removeButton.press('Enter');
        await expect(banner.blocks).toHaveCount(0);
        await expect(page.locator('.ProseMirror')).toBeFocused();
        await editor.press('ControlOrMeta+z');
        await expect(banner.blocks).toHaveCount(1);
    });
});

test.describe('Banner on mobile', () => {
    test.use({viewport: {width: 375, height: 812}});

    test('should fit a mobile viewport @wysiwyg', async ({
        mount,
        editor,
        banner,
        expectScreenshot,
    }) => {
        await mount(<BannerStories.Banner width={335} />);
        await expect(banner.blocks).toBeVisible();
        await banner.focusEditor();
        await banner.hideToolbar();
        await expectScreenshot({component: editor.locators.component});
    });

    test('should keep the settings inside a mobile viewport @wysiwyg', async ({
        mount,
        page,
        editor,
        banner,
        wait,
        expectScreenshot,
    }) => {
        await mount(<BannerStories.Banner width={375} />, {rootStyle: {padding: 0}});
        await editor.focus();
        await editor.press('ControlOrMeta+Home');
        await banner.openSettings();
        const bounds = await banner.settings.boundingBox();
        if (!bounds) throw new Error('Settings must have bounds');
        expect(bounds.x).toBeGreaterThanOrEqual(0);
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(page.viewportSize()?.width ?? 0);
        expect(bounds.y).toBeGreaterThanOrEqual(0);
        expect(bounds.y + bounds.height).toBeLessThanOrEqual(page.viewportSize()?.height ?? 0);
        expect(
            await banner.settings.evaluate((element) => element.scrollWidth <= element.clientWidth),
        ).toBe(true);
        await banner.select(banner.width, 'Full width');
        await expect(banner.blocks).toHaveClass(/g-md-banner-plugin_width_full/);
        await wait.markupPreview('width="full"');
        await banner.setExpandedSections();
        await expectScreenshot();
        await banner.setExpandedSections('Text', 'Buttons', 'Image and background');
        await banner.background.scrollIntoViewIfNeeded();
        await expect(banner.background).toBeInViewport();
        await page.setViewportSize({width: 375, height: 480});
        await expect
            .poll(async () => {
                const settings = await banner.settings.boundingBox();
                return settings ? settings.y + settings.height : Infinity;
            })
            .toBeLessThanOrEqual(480);
        await banner.background.scrollIntoViewIfNeeded();
        await expect(banner.background).toBeInViewport();
    });
});
