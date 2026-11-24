import type {CSSProperties} from 'react';

import {expect} from 'playwright/core';
import {test} from 'playwright/core/extensions/banner';

import {TEST_IMAGE} from './Banner.const';
import {BannerStories, BannerUploadExample} from './Banner.helpers';

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

const TEST_IMAGE_FILE = `tests/visual-tests/public${TEST_IMAGE}`;
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

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
            [column?.width, 236],
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
        await expectScreenshot({nameSuffix: 'height list'});
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
        await expect(banner.backgroundPopup).toBeVisible();
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

    test('should render backgrounds @wysiwyg', async ({
        mount,
        page,
        editor,
        banner,
        expectScreenshot,
    }) => {
        const backgrounds = [
            'bg-color="blue-medium"',
            `bg-image="${TEST_IMAGE}"`,
            `bg-image="${TEST_IMAGE}" bg-image-blur="true"`,
            `bg-image="${TEST_IMAGE}" bg-image-theme="dark"`,
        ];
        await mount(
            <div style={smallSizes}>
                <BannerStories.Banner
                    width={300}
                    initial={backgrounds
                        .map(
                            (attrs) =>
                                `:::banner{height="l" width="l" ${attrs}}\nText [link](#)\n:::`,
                        )
                        .join('\n\n')}
                />
            </div>,
        );
        await expect(banner.blocks).toHaveCount(4);
        await expect(banner.blocks.nth(0)).toHaveClass(/g-md-banner-plugin_bg-color_blue-medium/);
        await expect(banner.blocks.nth(1)).toHaveAttribute(
            'style',
            `background-image:url("${TEST_IMAGE}")`,
        );
        await expect(banner.blocks.nth(2)).toHaveClass(/g-md-banner-plugin_bg-image-blur/);
        await expect(banner.blocks.nth(3)).toHaveClass(/\bg-root g-root_theme_dark\b/);
        await banner.hideToolbar();

        const fixedLink = banner.blocks.nth(3).locator('a');
        const linkColor = () => fixedLink.evaluate((link) => getComputedStyle(link).color);
        await page.emulateMedia({colorScheme: 'light'});
        await expect(page.locator('body')).toHaveClass(/g-root_theme_light/);
        const lightPageColor = await linkColor();
        await page.emulateMedia({colorScheme: 'dark'});
        await expect(page.locator('body')).toHaveClass(/g-root_theme_dark/);
        expect(await linkColor()).toBe(lightPageColor);

        await banner.waitForImage(TEST_IMAGE);
        await expectScreenshot({component: editor.locators.component});
    });

    test('should fill the background from the palette @wysiwyg', async ({
        mount,
        page,
        editor,
        banner,
        expectScreenshot,
        wait,
    }) => {
        await page.setViewportSize({width: 740, height: 640});
        await mount(
            <BannerStories.Banner width={660} initial={`${bannerMarkup('s', 's')}\n\nAfter`} />,
        );
        await editor.focus();
        await editor.press('ControlOrMeta+Home');
        await banner.openSettings();
        await banner.openBackground();
        await expect(banner.backgroundTab('Fill')).toHaveAttribute('aria-selected', 'true');
        await expect(banner.backgroundPopup.getByRole('tabpanel').getByRole('radio')).toHaveCount(
            18,
        );

        await banner.swatch('Blue 20%').click();
        await expect(banner.swatch('Blue 20%')).toHaveAttribute('aria-checked', 'true');
        await expect(banner.blocks).toHaveClass(/g-md-banner-plugin_bg-color_blue-light/);
        await expect(banner.background).toHaveAccessibleName('Background Blue 20%');
        expect(await page.evaluate(() => window.mdEditor?.getValue())).toBe(
            ':::banner{height="s" width="s" bg-color="blue-light"}\n\n:::\n\nAfter',
        );
        await wait.markupPreview('bg-color="blue-light"');
        await page.mouse.move(0, 0);
        await expectScreenshot({fullPage: true});
    });

    test('should navigate the palette with one tab stop @wysiwyg', async ({
        mount,
        editor,
        banner,
        page,
    }) => {
        await mount(
            <BannerStories.Banner width={660} initial={`${bannerMarkup('s', 's')}\n\nAfter`} />,
        );
        await editor.focus();
        await editor.press('ControlOrMeta+Home');
        await banner.openSettings();
        await banner.openBackground();
        await expect(banner.backgroundTab('Fill')).toBeFocused();
        const palette = banner.backgroundPopup.getByRole('radiogroup', {name: 'Fill', exact: true});
        await expect(palette.locator('[tabindex="0"]')).toHaveCount(1);
        const gray = banner.swatch('Gray 20%');
        await gray.focus();
        await gray.press('ArrowRight');
        await expect(banner.swatch('Green 20%')).toBeFocused();
        await banner.swatch('Green 20%').press('ArrowDown');
        await expect(banner.swatch('Green 50%')).toBeFocused();
        await banner.swatch('Green 50%').press('End');
        await expect(banner.swatch('Violet 100%')).toBeFocused();
        await banner.swatch('Violet 100%').press('Home');
        await expect(gray).toBeFocused();
        await gray.press('Space');
        await expect(gray).toBeChecked();
        await palette.evaluate((element) => element.setAttribute('dir', 'rtl'));
        await page.keyboard.press('ArrowLeft');
        await expect(banner.swatch('Green 20%')).toBeFocused();
        await page.keyboard.press('Tab');
        await expect(banner.backgroundPopup).toBeHidden();
    });

    test('should discard a background upload after closing its popup @wysiwyg', async ({
        mount,
        page,
        editor,
        banner,
        expectScreenshot,
    }) => {
        let finish: (() => Promise<void>) | undefined;
        await page.route('**/banner-background-upload', (route) => {
            finish = () => route.fulfill({status: 200, body: 'ok'});
        });
        await mount(<BannerUploadExample />);
        await editor.focus();
        await editor.press('ControlOrMeta+Home');
        const initial = await page.evaluate(() => window.mdEditor?.getValue());
        await banner.openSettings();
        await banner.openBackground();
        await banner.backgroundTab('Image').click();
        await banner.chooseFile(banner.uploadButton, TEST_IMAGE_FILE);
        await expect.poll(() => Boolean(finish)).toBe(true);
        await expect(banner.uploadButton).toBeDisabled();
        await expectScreenshot({fullPage: true});
        await banner.backgroundPopup.getByRole('button', {name: 'Close', exact: true}).click();
        await expect(banner.backgroundPopup).toBeHidden();
        const response = page.waitForResponse('**/banner-background-upload');
        await finish?.();
        await response;
        await banner.background.click();
        await banner.backgroundTab('Image').click();
        await expect(banner.uploadButton).toBeEnabled();
        expect(await page.evaluate(() => window.mdEditor?.getValue())).toBe(initial);
    });

    test('should restore focus after an upload fails and replacement is cancelled @wysiwyg', async ({
        mount,
        page,
        editor,
        banner,
    }) => {
        await page.route('**/banner-background-upload', (route) => route.fulfill({status: 500}));
        await mount(<BannerUploadExample />);
        await editor.focus();
        await editor.press('ControlOrMeta+Home');
        await banner.openSettings();
        await banner.openBackground();
        await banner.backgroundTab('Image').click();
        await banner.chooseFile(banner.uploadButton, TEST_IMAGE_FILE);
        await expect(banner.backgroundPopup.getByRole('alert')).toContainText(
            'Failed to upload the file',
        );
        await expect(banner.uploadButton).toBeFocused();
        await banner.backgroundTab('Add by link').click();
        await banner.linkInput.fill(TEST_IMAGE);
        await banner.submitLinkButton.click();
        await expect(banner.replaceFileButton).toBeFocused();
        await banner.replaceFileButton.click();
        await expect(
            banner.backgroundPopup.getByRole('tab', {name: 'Upload from device', exact: true}),
        ).toBeFocused();
        await banner.backgroundPopup.getByRole('button', {name: 'Cancel', exact: true}).click();
        await expect(banner.replaceFileButton).toBeFocused();
    });

    test('should upload a background image @wysiwyg', async ({
        mount,
        page,
        editor,
        banner,
        expectScreenshot,
    }) => {
        await mount(
            <BannerStories.Banner width={660} initial={`${bannerMarkup('s', 's')}\n\nAfter`} />,
        );
        await editor.focus();
        await editor.press('ControlOrMeta+Home');
        await banner.openSettings();
        await banner.openBackground();
        await banner.backgroundTab('Image').click();
        await expect(banner.backgroundPopup).toContainText('JPEG, GIF or PNG, up to 2 MB');
        await banner.chooseFile(banner.uploadButton, TEST_IMAGE_FILE);

        await expect(banner.textColor).toHaveText('Depends on the theme');
        await expect(banner.blocks).toHaveClass(/g-md-banner-plugin_bg-image/);
        await expect(banner.blur).not.toBeChecked();
        await expect
            .poll(() => page.evaluate(() => window.mdEditor?.getValue()))
            .toBe(`:::banner{height="s" width="s" bg-image="${TEST_IMAGE}"}\n\n:::\n\nAfter`);
        await expect(banner.background).toHaveAccessibleName('Background banner-background.jpg');

        const darkPage = await page
            .locator('body')
            .evaluate((body) => body.classList.contains('g-root_theme_dark'));
        await expect(banner.bannerPreview).toHaveClass(
            darkPage ? /\bg-root_theme_dark\b/ : /\bg-root_theme_light\b/,
        );
        await banner.previewTheme('Dark theme').click();
        await expect(banner.bannerPreview).toHaveClass(/\bg-root_theme_dark\b/);
        await banner.previewTheme('Light theme').click();
        await expect(banner.bannerPreview).toHaveClass(/\bg-root_theme_light\b/);

        await banner.waitForImage(TEST_IMAGE);
        await page.mouse.move(0, 0);
        await expectScreenshot({component: banner.backgroundPopup});
    });

    test('should change and clear the background @wysiwyg', async ({
        mount,
        page,
        editor,
        banner,
    }) => {
        const markup = () => page.evaluate(() => window.mdEditor?.getValue());
        await mount(
            <BannerStories.Banner width={660} initial={`${bannerMarkup('s', 's')}\n\nAfter`} />,
        );
        await editor.focus();
        await editor.press('ControlOrMeta+Home');
        await banner.openSettings();
        await banner.openBackground();

        await banner.swatch('Green 50%').click();
        await banner.backgroundTab('Image').click();
        await banner.chooseFile(banner.uploadButton, TEST_IMAGE_FILE);
        await expect
            .poll(markup)
            .toBe(
                `:::banner{height="s" width="s" bg-color="green-medium" bg-image="${TEST_IMAGE}"}\n\n:::\n\nAfter`,
            );

        await banner.select(banner.textColor, 'Always light');
        await expect(banner.blocks).toHaveClass(/\bg-root g-root_theme_dark\b/);
        expect(await markup()).toMatch(/ bg-image-theme="dark"\}/);
        await banner.select(banner.textColor, 'Always dark');
        await expect(banner.blocks).toHaveClass(/\bg-root_theme_light\b/);
        await banner.select(banner.textColor, 'Depends on the theme');
        await expect(banner.blocks).not.toHaveClass(/\bg-root\b/);
        expect(await markup()).not.toContain('bg-image-theme');

        await page.keyboard.press('Escape');
        await expect(banner.backgroundPopup).toBeHidden();
        await banner.clickToggle('Blur background');
        await expect(banner.blocks).toHaveClass(/g-md-banner-plugin_bg-image-blur/);
        expect(await markup()).toMatch(/ bg-image-blur="true"\}/);

        await banner.background.click();
        await banner.select(banner.textColor, 'Always light');
        await banner.backgroundTab('Fill').click();
        await banner.swatch('Red 100%').click();
        expect(await markup()).toBe(
            ':::banner{height="s" width="s" bg-color="red-heavy"}\n\n:::\n\nAfter',
        );
        await expect(banner.blur).toBeHidden();

        await banner.backgroundTab('Image').click();
        await banner.chooseFile(banner.uploadButton, TEST_IMAGE_FILE);
        await expect.poll(markup).toContain(`bg-image="${TEST_IMAGE}"`);
        await banner.resetBackgroundButton.click();
        expect(await markup()).toBe(':::banner{height="s" width="s"}\n\n:::\n\nAfter');
        await expect(banner.background).toHaveAccessibleName('Background No background');

        await banner.backgroundTab('Add by link').click();
        await banner.linkInput.fill(TEST_IMAGE);
        await banner.submitLinkButton.click();
        expect(await markup()).toBe(
            `:::banner{height="s" width="s" bg-image="${TEST_IMAGE}"}\n\n:::\n\nAfter`,
        );
        await banner.replaceFileButton.click();
        await expect(banner.uploadButton).toBeVisible();
        await banner.backgroundPopup.getByRole('button', {name: 'Cancel', exact: true}).click();
        await expect(banner.textColor).toBeVisible();

        await banner.backgroundTab('Fill').click();
        await banner.swatch('Gray 20%').click();
        await page.keyboard.press('Escape');
        await banner.clearBackgroundButton.click();
        expect(await markup()).toBe(':::banner{height="s" width="s"}\n\n:::\n\nAfter');
        await expect(banner.clearBackgroundButton).toBeHidden();
    });

    test('should reject a file of another type or a larger size @wysiwyg', async ({
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
        const initial = await page.evaluate(() => window.mdEditor?.getValue());
        await banner.openSettings();
        await banner.openBackground();
        await banner.backgroundTab('Image').click();

        await banner.chooseFile(banner.uploadButton, {
            name: 'large.png',
            mimeType: 'image/png',
            buffer: Buffer.alloc(MAX_IMAGE_SIZE + 1),
        });
        await expect(banner.backgroundPopup).toContainText('The file is larger than 2 MB');
        await banner.chooseFile(banner.uploadButton, {
            name: 'notes.txt',
            mimeType: 'text/plain',
            buffer: Buffer.from('text'),
        });
        await expect(banner.backgroundPopup).toContainText('Unsupported file format');
        expect(await page.evaluate(() => window.mdEditor?.getValue())).toBe(initial);
        await expect(banner.blocks).not.toHaveClass(/g-md-banner-plugin_bg-image/);
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
