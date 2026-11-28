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
        const defaultDimensions = [...dimensions, ['l', 'm']];
        await mount(
            <BannerStories.Banner
                width={1280}
                initial={`${defaultDimensions.map(([height, width]) => bannerMarkup(height, width)).join('\n\n')}\n\nAfter`}
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
            [740, 236],
            [1200, 300],
            [column?.width, 236],
            [900, 420],
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
            .toMatch(/:::banner\{height="\w+" width="\w+"\}\n\n:::/);
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
        banner,
        wait,
        expectScreenshot,
    }) => {
        await mount(
            <BannerStories.Banner width={660} initial={`${bannerMarkup('s', 's')}\n\nAfter`} />,
        );
        await editor.focus();
        await editor.press('ControlOrMeta+Home');
        await banner.openSettings();
        await expect(banner.height).toBeFocused();
        await expect.poll(() => banner.settingsInsets()).toEqual([SETTINGS_INSET, SETTINGS_INSET]);
        // The collapsed panel fits the editor frame.
        await banner.setExpandedSections();
        await expectScreenshot();

        await banner.height.click();
        await expect(banner.options).toHaveText(['S', 'M', 'L']);
        await page.keyboard.press('Escape');
        await expect(banner.options).toHaveCount(0);
        await expect(banner.settings).toBeVisible();
        await banner.select(banner.height, 'M');
        await expect(banner.blocks).toHaveClass(/g-md-banner-plugin_height_m/);
        await wait.markupPreview(':::banner{height="m" width="s"}');

        await banner.width.click();
        await expect(banner.options).toHaveText(['S', 'M', 'L', 'Full width']);
        await expectScreenshot({nameSuffix: 'width list'});
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
        expect((await banner.settings.boundingBox())?.height).toBe(SETTINGS_MIN_HEIGHT);
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
        await expect.poll(() => banner.settingsInsets()).toEqual([SETTINGS_INSET, SETTINGS_INSET]);
        await expect.poll(() => banner.settingsBottom()).toBe(600 - SETTINGS_INSET);
    });

    test('should show all settings sections @wysiwyg', async ({
        mount,
        page,
        editor,
        banner,
        expectScreenshot,
    }) => {
        await page.setViewportSize({width: 740, height: 980});
        await mount(<BannerStories.Banner width={660} />);
        await editor.focus();
        await editor.press('ControlOrMeta+Home');
        await banner.openSettings();
        await expect(banner.toggle('Title')).toBeChecked();
        await expect(banner.toggle('Description')).toBeChecked();
        await expect(banner.toggle('Button 1')).toBeChecked();
        await expect(banner.toggle('Button 2')).not.toBeChecked();
        await expect(banner.toggle('Button 3')).not.toBeChecked();
        await expect(banner.toggle('Image')).toBeChecked();
        await expect(banner.alignment('Vertically', 'Top')).toBeChecked();
        await expect(banner.alignment('Horizontally', 'Center')).toBeChecked();
        await banner.setExpandedSections('Text');
        await expectScreenshot({component: banner.settings, nameSuffix: 'text'});
        await banner.setExpandedSections('Buttons');
        await expectScreenshot({component: banner.settings, nameSuffix: 'buttons'});
        await banner.setExpandedSections('Image and background');
        await expectScreenshot({
            component: banner.settings,
            nameSuffix: 'image and background',
        });
    });

    test('should keep demonstration settings local and reset them on reopening @wysiwyg', async ({
        mount,
        page,
        editor,
        banner,
        expectScreenshot,
    }) => {
        await page.setViewportSize({width: 740, height: 980});
        await mount(<BannerStories.Banner width={660} />);
        await editor.focus();
        await editor.press('ControlOrMeta+Home');
        await banner.openSettings();
        const initial = await page.evaluate(() => window.mdEditor?.getValue());
        const messages: string[] = [];
        page.on('console', (message) => {
            if (message.type() === 'log') messages.push(message.text());
        });

        for (const name of ['Title', 'Description', 'Button 1', 'Button 2', 'Button 3', 'Image']) {
            const toggle = banner.toggle(name);
            const checked = await toggle.isChecked();
            await banner.clickToggle(name);
            await expect(toggle).toBeChecked({checked: !checked});
            expect(messages).toContain(`${name} toggle clicked`);
        }
        await banner.alignment('Vertically', 'Bottom').click();
        await banner.alignment('Vertically', 'Bottom').click();
        await banner.alignment('Horizontally', 'Right').click();
        await expect(banner.alignment('Vertically', 'Bottom')).toBeChecked();
        await expect(banner.alignment('Horizontally', 'Right')).toBeChecked();
        expect(
            messages.filter((message) => message === 'Align bottom button clicked'),
        ).toHaveLength(2);
        expect(messages).toContain('Align right button clicked');

        await expect(banner.background).toHaveAccessibleName('Background No background');
        await banner.background.click();
        // Until the popup takes focus, the settings panel handles Escape.
        await expect(banner.backgroundTab('Fill')).toBeFocused();
        await page.keyboard.press('Escape');
        await expect(banner.backgroundPopup).toBeHidden();
        await expect(banner.settings).toBeVisible();
        expect(await page.evaluate(() => window.mdEditor?.getValue())).toBe(initial);

        await banner.section('Text').click();
        await expect(banner.toggle('Title')).toBeHidden();
        await expect(banner.section('Text')).toHaveAttribute('aria-expanded', 'false');
        await banner.section('Text').press('Enter');
        await expect(banner.section('Text')).toHaveAttribute('aria-expanded', 'true');
        await expect(banner.toggle('Title')).not.toBeChecked();
        await expect(banner.alignment('Vertically', 'Bottom')).toBeChecked();
        expect(
            messages.filter((message) => message === 'Text section button clicked'),
        ).toHaveLength(2);

        await banner.select(banner.height, 'M');
        await expect(banner.blocks).toHaveClass(/g-md-banner-plugin_height_m/);
        await expect(banner.toggle('Title')).not.toBeChecked();
        await banner.toggle('Title').press('Space');
        await expect(banner.toggle('Title')).toBeChecked();
        await banner.section('Buttons').click();
        await banner.section('Image and background').click();
        expect(messages).toContain('Buttons section button clicked');
        expect(messages).toContain('Image and background section button clicked');
        await banner.setExpandedSections('Text');
        await expectScreenshot({component: banner.settings, nameSuffix: 'collapsed'});

        await banner.closeButton.click();
        await banner.openSettings();
        await expect(banner.toggle('Description')).toBeChecked();
        await expect(banner.toggle('Button 1')).toBeChecked();
        await expect(banner.toggle('Button 2')).not.toBeChecked();
        await expect(banner.toggle('Button 3')).not.toBeChecked();
        await expect(banner.toggle('Image')).toBeChecked();
        await expect(banner.alignment('Vertically', 'Top')).toBeChecked();
        await expect(banner.alignment('Horizontally', 'Center')).toBeChecked();
        await expect(banner.section('Buttons')).toHaveAttribute('aria-expanded', 'true');
        await expect(banner.section('Image and background')).toHaveAttribute(
            'aria-expanded',
            'true',
        );
        await expect(banner.height).toHaveText('M');
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

const layoutTitle = '::banner-title[Team portal]{size="2"}';
const layoutContent =
    ':::banner-content\nRead the **guide** and open the [portal](/portal).\n\nAsk the team in the chat.\n:::';
const layoutButtons = [
    ':button[Open](/portal){view="action" color="standard"}',
    ':button[Guide](/guide){view="normal" color="gray"}',
    ':button[Chat](/chat){view="flat" color="standard"}',
].join(' ');
const layoutImage = '::banner-image[Abstract illustration](/assets/banner-image.webp)';

const layoutFill = 'bg-color="yellow-light"';
const layoutBackground = 'bg-image="/assets/banner-background.webp"';

// The scenarios grow from the title to the full set of parts, first on a fill, then on a background image.
const layoutCases: [name: string, attrs: string, parts: string[]][] = [
    ['the title on a fill', layoutFill, [layoutTitle]],
    ['the title and the description on a fill', layoutFill, [layoutTitle, layoutContent]],
    [
        'the title, the description and the buttons on a fill',
        layoutFill,
        [layoutTitle, layoutContent, layoutButtons],
    ],
    [
        'the title, the description, the buttons and the image on a fill',
        layoutFill,
        [layoutTitle, layoutContent, layoutButtons, layoutImage],
    ],
    [
        'the title, the description and the buttons on a background image',
        layoutBackground,
        [layoutTitle, layoutContent, layoutButtons],
    ],
    [
        'the title, the description, the buttons and the image on a background image',
        layoutBackground,
        [layoutTitle, layoutContent, layoutButtons, layoutImage],
    ],
    [
        'the title, the description and the buttons on a background image with a fixed theme',
        `${layoutBackground} bg-theme="light"`,
        [layoutTitle, layoutContent, layoutButtons],
    ],
    [
        'the title, the description and the buttons on a blurred background image',
        `${layoutBackground} bg-image-blur="true"`,
        [layoutTitle, layoutContent, layoutButtons],
    ],
];

test.describe('Banner layout', () => {
    for (const [name, attrs, parts] of layoutCases) {
        test(`should show ${name} @wysiwyg`, async ({
            mount,
            page,
            editor,
            banner,
            expectScreenshot,
        }) => {
            await mount(
                <BannerStories.Banner
                    width={900}
                    initial={[`:::banner{width="full" ${attrs}}`, ...parts, ':::'].join('\n\n')}
                />,
            );
            await expect(banner.blocks).toBeVisible();
            for (const image of await banner.images.all()) {
                await expect(image).toHaveJSProperty('complete', true);
                await expect(image).not.toHaveJSProperty('naturalWidth', 0);
            }
            if (attrs.includes('bg-image')) {
                // The background is a CSS image: the block paints it after the browser loads the file.
                await page.evaluate(async () => {
                    const image = new Image();
                    image.src = '/assets/banner-background.webp';
                    await image.decode();
                });
            }
            await banner.hideToolbar();
            await expectScreenshot({component: editor.locators.component});
        });
    }
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
        await banner.hideToolbar();
        await expectScreenshot({component: editor.locators.component});
    });

    test('should keep the settings inside a mobile viewport @wysiwyg', async ({
        mount,
        page,
        editor,
        banner,
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
