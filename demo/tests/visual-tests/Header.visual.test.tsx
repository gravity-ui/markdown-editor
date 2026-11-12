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

const SETTINGS_INSET = 16;
const SETTINGS_MIN_HEIGHT = 160;

const TEST_IMAGE = '/assets/test-image.jpg';
const TEST_IMAGE_FILE = 'tests/visual-tests/public/assets/test-image.jpg';
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

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

    test('should render dimensions @wysiwyg', async ({mount, editor, header, expectScreenshot}) => {
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
        await expectScreenshot({component: editor.locators.component});
    });

    test('should constrain each width to a narrow column @wysiwyg', async ({
        mount,
        editor,
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
        await expectScreenshot({component: editor.locators.component});
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
        await expectScreenshot({component: editor.locators.component});
    });

    test('should change dimensions in the settings panel @wysiwyg', async ({
        mount,
        page,
        editor,
        header,
        expectScreenshot,
    }) => {
        await mount(
            <HeaderStories.Header width={660} initial={`${headerMarkup('s', 's')}\n\nAfter`} />,
        );
        await editor.focus();
        await editor.press('ControlOrMeta+Home');
        await header.openSettings();
        await expect(header.height).toBeFocused();
        await expect.poll(() => header.settingsInsets()).toEqual([SETTINGS_INSET, SETTINGS_INSET]);
        // The collapsed panel fits the editor frame.
        await header.setExpandedSections();
        await expectScreenshot();

        await header.height.click();
        await expect(header.options).toHaveText(['S', 'M', 'L']);
        await expectScreenshot({nameSuffix: 'height list'});
        await page.keyboard.press('Escape');
        await expect(header.options).toHaveCount(0);
        await expect(header.settings).toBeVisible();
        await header.select(header.height, 'M');
        await expect(header.blocks).toHaveClass(/g-md-header-plugin_height_m/);

        await header.width.click();
        await expect(header.options).toHaveText(['S', 'M', 'L', 'Full width']);
        await expectScreenshot({nameSuffix: 'width list'});
        await header.option('M').click();
        await expect(header.blocks).toHaveClass(/g-md-header-plugin_width_m/);

        await header.closeButton.click();
        await expect(header.settings).toBeHidden();
        await expect(header.settingsButton).toBeFocused();
    });

    test('should close the settings on a second click of the settings button @wysiwyg', async ({
        mount,
        editor,
        header,
    }) => {
        await mount(
            <HeaderStories.Header width={660} initial={`${headerMarkup('s', 's')}\n\nAfter`} />,
        );
        await editor.focus();
        await editor.press('ControlOrMeta+Home');
        await header.openSettings();
        await header.settingsButton.click();
        await expect(header.settings).toBeHidden();
    });

    test('should keep the settings usable near the bottom edge of the viewport @wysiwyg', async ({
        mount,
        page,
        editor,
        header,
    }) => {
        await page.setViewportSize({width: 700, height: 600});
        await mount(
            <HeaderStories.Header width={660} initial={`${headerMarkup('s', 's')}\n\nAfter`} />,
        );
        await editor.focus();
        await editor.press('ControlOrMeta+Home');
        await header.openSettings();
        const block = await header.blocks.boundingBox();
        if (!block) throw new Error('The banner must have bounds');
        // Less than the minimum height remains between the panel corner and the viewport bottom.
        const height = Math.round(block.y) + 2 * SETTINGS_INSET + SETTINGS_MIN_HEIGHT - 20;
        await page.setViewportSize({width: 700, height});
        await expect.poll(() => header.settingsBottom()).toBe(height - SETTINGS_INSET);
        expect((await header.settings.boundingBox())?.height).toBe(SETTINGS_MIN_HEIGHT);
        await expect(header.closeButton).toBeInViewport({ratio: 1});
        await expect(header.width).toBeInViewport({ratio: 1});
    });

    test('should fit the settings to the viewport after the banner moves @wysiwyg', async ({
        mount,
        page,
        editor,
        header,
    }) => {
        await page.setViewportSize({width: 700, height: 600});
        await mount(
            <HeaderStories.Header width={660} initial={`${headerMarkup('s', 's')}\n\nAfter`} />,
        );
        await editor.focus();
        await editor.press('ControlOrMeta+Home');
        await header.openSettings();
        await expect.poll(() => header.settingsBottom()).toBe(600 - SETTINGS_INSET);
        // Content above the banner grows without resize or scroll events.
        await page.locator('.playwright-wrapper-test').evaluate((element) => {
            element.style.paddingTop = '120px';
        });
        await expect.poll(() => header.settingsInsets()).toEqual([SETTINGS_INSET, SETTINGS_INSET]);
        await expect.poll(() => header.settingsBottom()).toBe(600 - SETTINGS_INSET);
    });

    test('should show all settings sections @wysiwyg', async ({
        mount,
        page,
        editor,
        header,
        expectScreenshot,
    }) => {
        await page.setViewportSize({width: 740, height: 980});
        await mount(<HeaderStories.Header width={660} />);
        await editor.focus();
        await editor.press('ControlOrMeta+Home');
        await header.openSettings();
        await expect(header.toggle('Title')).toBeChecked();
        await expect(header.toggle('Description')).toBeChecked();
        await expect(header.toggle('Button 1')).toBeChecked();
        await expect(header.toggle('Button 2')).not.toBeChecked();
        await expect(header.toggle('Button 3')).not.toBeChecked();
        await expect(header.toggle('Image')).toBeChecked();
        await expect(header.alignment('Vertically', 'Top')).toBeChecked();
        await expect(header.alignment('Horizontally', 'Center')).toBeChecked();
        await header.setExpandedSections('Text');
        await expectScreenshot({component: header.settings, nameSuffix: 'text'});
        await header.setExpandedSections('Buttons');
        await expectScreenshot({component: header.settings, nameSuffix: 'buttons'});
        await header.setExpandedSections('Image and background');
        await expectScreenshot({
            component: header.settings,
            nameSuffix: 'image and background',
        });
    });

    test('should keep demonstration settings local and reset them on reopening @wysiwyg', async ({
        mount,
        page,
        editor,
        header,
        expectScreenshot,
    }) => {
        await page.setViewportSize({width: 740, height: 980});
        await mount(<HeaderStories.Header width={660} />);
        await editor.focus();
        await editor.press('ControlOrMeta+Home');
        await header.openSettings();
        const initial = await page.evaluate(() => window.mdEditor?.getValue());
        const messages: string[] = [];
        page.on('console', (message) => {
            if (message.type() === 'log') messages.push(message.text());
        });

        for (const name of ['Title', 'Description', 'Button 1', 'Button 2', 'Button 3', 'Image']) {
            const toggle = header.toggle(name);
            const checked = await toggle.isChecked();
            await header.clickToggle(name);
            await expect(toggle).toBeChecked({checked: !checked});
            expect(messages).toContain(`${name} toggle clicked`);
        }
        await header.alignment('Vertically', 'Bottom').click();
        await header.alignment('Vertically', 'Bottom').click();
        await header.alignment('Horizontally', 'Right').click();
        await expect(header.alignment('Vertically', 'Bottom')).toBeChecked();
        await expect(header.alignment('Horizontally', 'Right')).toBeChecked();
        expect(
            messages.filter((message) => message === 'Align bottom button clicked'),
        ).toHaveLength(2);
        expect(messages).toContain('Align right button clicked');

        await expect(header.background).toHaveAccessibleName('Background No background');
        await header.background.click();
        await expect(header.backgroundPopup).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(header.backgroundPopup).toBeHidden();
        await expect(header.settings).toBeVisible();
        expect(await page.evaluate(() => window.mdEditor?.getValue())).toBe(initial);

        await header.section('Text').click();
        await expect(header.toggle('Title')).toBeHidden();
        await expect(header.section('Text')).toHaveAttribute('aria-expanded', 'false');
        await header.section('Text').press('Enter');
        await expect(header.section('Text')).toHaveAttribute('aria-expanded', 'true');
        await expect(header.toggle('Title')).not.toBeChecked();
        await expect(header.alignment('Vertically', 'Bottom')).toBeChecked();
        expect(
            messages.filter((message) => message === 'Text section button clicked'),
        ).toHaveLength(2);

        await header.select(header.height, 'M');
        await expect(header.blocks).toHaveClass(/g-md-header-plugin_height_m/);
        await expect(header.toggle('Title')).not.toBeChecked();
        await header.toggle('Title').press('Space');
        await expect(header.toggle('Title')).toBeChecked();
        await header.section('Buttons').click();
        await header.section('Image and background').click();
        expect(messages).toContain('Buttons section button clicked');
        expect(messages).toContain('Image and background section button clicked');
        await header.setExpandedSections('Text');
        await expectScreenshot({component: header.settings, nameSuffix: 'collapsed'});

        await header.closeButton.click();
        await header.openSettings();
        await expect(header.toggle('Description')).toBeChecked();
        await expect(header.toggle('Button 1')).toBeChecked();
        await expect(header.toggle('Button 2')).not.toBeChecked();
        await expect(header.toggle('Button 3')).not.toBeChecked();
        await expect(header.toggle('Image')).toBeChecked();
        await expect(header.alignment('Vertically', 'Top')).toBeChecked();
        await expect(header.alignment('Horizontally', 'Center')).toBeChecked();
        await expect(header.section('Buttons')).toHaveAttribute('aria-expanded', 'true');
        await expect(header.section('Image and background')).toHaveAttribute(
            'aria-expanded',
            'true',
        );
        await expect(header.height).toHaveText('M');
    });

    test('should render backgrounds @wysiwyg', async ({
        mount,
        page,
        editor,
        header,
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
                <HeaderStories.Header
                    width={300}
                    initial={backgrounds
                        .map((attrs) => `:::header{width="s" ${attrs}}\nText [link](#)\n:::`)
                        .join('\n\n')}
                />
            </div>,
        );
        await expect(header.blocks).toHaveCount(4);
        await expect(header.blocks.nth(0)).toHaveClass(/g-md-header-plugin_bg-color_blue-medium/);
        await expect(header.blocks.nth(1)).toHaveAttribute(
            'style',
            `background-image:url("${TEST_IMAGE}")`,
        );
        await expect(header.blocks.nth(2)).toHaveClass(/g-md-header-plugin_bg-image-blur/);
        await expect(header.blocks.nth(3)).toHaveClass(/\bg-root g-root_theme_dark\b/);
        await header.hideToolbar();

        const fixedLink = header.blocks.nth(3).locator('a');
        const linkColor = () => fixedLink.evaluate((link) => getComputedStyle(link).color);
        await page.emulateMedia({colorScheme: 'light'});
        await expect(page.locator('body')).toHaveClass(/g-root_theme_light/);
        const lightPageColor = await linkColor();
        await page.emulateMedia({colorScheme: 'dark'});
        await expect(page.locator('body')).toHaveClass(/g-root_theme_dark/);
        expect(await linkColor()).toBe(lightPageColor);

        await header.waitForImage(TEST_IMAGE);
        await expectScreenshot({component: editor.locators.component});
    });

    test('should fill the background from the palette @wysiwyg', async ({
        mount,
        page,
        editor,
        header,
        expectScreenshot,
    }) => {
        await page.setViewportSize({width: 740, height: 600});
        await mount(
            <HeaderStories.Header width={660} initial={`${headerMarkup('s', 's')}\n\nAfter`} />,
        );
        await editor.focus();
        await editor.press('ControlOrMeta+Home');
        await header.openSettings();
        await header.openBackground();
        await expect(header.backgroundTab('Fill')).toHaveAttribute('aria-selected', 'true');
        await expect(header.backgroundPopup.getByRole('tabpanel').getByRole('button')).toHaveCount(
            18,
        );

        await header.swatch('Blue 20%').click();
        await expect(header.swatch('Blue 20%')).toHaveAttribute('aria-pressed', 'true');
        await expect(header.blocks).toHaveClass(/g-md-header-plugin_bg-color_blue-light/);
        await expect(header.background).toHaveAccessibleName('Background Blue 20%');
        expect(await page.evaluate(() => window.mdEditor?.getValue())).toBe(
            ':::header{height="s" width="s" bg-color="blue-light"}\n\n:::\n\nAfter',
        );
        await page.mouse.move(0, 0);
        await expectScreenshot({fullPage: true});
    });

    test('should upload a background image @wysiwyg', async ({
        mount,
        page,
        editor,
        header,
        expectScreenshot,
    }) => {
        await mount(
            <HeaderStories.Header width={660} initial={`${headerMarkup('s', 's')}\n\nAfter`} />,
        );
        await editor.focus();
        await editor.press('ControlOrMeta+Home');
        await header.openSettings();
        await header.openBackground();
        await header.backgroundTab('Image').click();
        await expect(header.backgroundPopup).toContainText('JPEG, GIF or PNG, up to 2 MB');
        await header.chooseFile(header.uploadButton, TEST_IMAGE_FILE);

        await expect(header.textColor).toHaveText('Depends on the theme');
        await expect(header.blocks).toHaveClass(/g-md-header-plugin_bg-image/);
        await expect(header.blur).not.toBeChecked();
        await expect
            .poll(() => page.evaluate(() => window.mdEditor?.getValue()))
            .toBe(`:::header{height="s" width="s" bg-image="${TEST_IMAGE}"}\n\n:::\n\nAfter`);
        await expect(header.background).toHaveAccessibleName('Background test-image.jpg');

        const darkPage = await page
            .locator('body')
            .evaluate((body) => body.classList.contains('g-root_theme_dark'));
        await expect(header.bannerPreview).toHaveClass(
            darkPage ? /\bg-root_theme_dark\b/ : /\bg-root_theme_light\b/,
        );
        await header.previewTheme('Dark theme').click();
        await expect(header.bannerPreview).toHaveClass(/\bg-root_theme_dark\b/);
        await header.previewTheme('Light theme').click();
        await expect(header.bannerPreview).toHaveClass(/\bg-root_theme_light\b/);

        await header.waitForImage(TEST_IMAGE);
        await page.mouse.move(0, 0);
        await expectScreenshot({component: header.backgroundPopup});
    });

    test('should change and clear the background @wysiwyg', async ({
        mount,
        page,
        editor,
        header,
    }) => {
        const markup = () => page.evaluate(() => window.mdEditor?.getValue());
        await mount(
            <HeaderStories.Header width={660} initial={`${headerMarkup('s', 's')}\n\nAfter`} />,
        );
        await editor.focus();
        await editor.press('ControlOrMeta+Home');
        await header.openSettings();
        await header.openBackground();

        await header.swatch('Green 50%').click();
        await header.backgroundTab('Image').click();
        await header.chooseFile(header.uploadButton, TEST_IMAGE_FILE);
        await expect
            .poll(markup)
            .toBe(
                `:::header{height="s" width="s" bg-color="green-medium" bg-image="${TEST_IMAGE}"}\n\n:::\n\nAfter`,
            );

        await header.select(header.textColor, 'Always light');
        await expect(header.blocks).toHaveClass(/\bg-root g-root_theme_dark\b/);
        expect(await markup()).toMatch(/ bg-image-theme="dark"\}/);
        await header.select(header.textColor, 'Always dark');
        await expect(header.blocks).toHaveClass(/\bg-root_theme_light\b/);
        await header.select(header.textColor, 'Depends on the theme');
        await expect(header.blocks).not.toHaveClass(/\bg-root\b/);
        expect(await markup()).not.toContain('bg-image-theme');

        await page.keyboard.press('Escape');
        await expect(header.backgroundPopup).toBeHidden();
        await header.clickToggle('Blur background');
        await expect(header.blocks).toHaveClass(/g-md-header-plugin_bg-image-blur/);
        expect(await markup()).toMatch(/ bg-image-blur="true"\}/);

        await header.background.click();
        await header.select(header.textColor, 'Always light');
        await header.backgroundTab('Fill').click();
        await header.swatch('Red 100%').click();
        expect(await markup()).toBe(
            ':::header{height="s" width="s" bg-color="red-heavy"}\n\n:::\n\nAfter',
        );
        await expect(header.blur).toBeHidden();

        await header.backgroundTab('Image').click();
        await header.chooseFile(header.uploadButton, TEST_IMAGE_FILE);
        await expect.poll(markup).toContain(`bg-image="${TEST_IMAGE}"`);
        await header.resetBackgroundButton.click();
        expect(await markup()).toBe(':::header{height="s" width="s"}\n\n:::\n\nAfter');
        await expect(header.background).toHaveAccessibleName('Background No background');

        await header.backgroundTab('Add by link').click();
        await header.linkInput.fill(TEST_IMAGE);
        await header.submitLinkButton.click();
        expect(await markup()).toBe(
            `:::header{height="s" width="s" bg-image="${TEST_IMAGE}"}\n\n:::\n\nAfter`,
        );
        await header.replaceFileButton.click();
        await expect(header.uploadButton).toBeVisible();
        await header.backgroundPopup.getByRole('button', {name: 'Cancel', exact: true}).click();
        await expect(header.textColor).toBeVisible();

        await header.backgroundTab('Fill').click();
        await header.swatch('Gray 20%').click();
        await page.keyboard.press('Escape');
        await header.clearBackgroundButton.click();
        expect(await markup()).toBe(':::header{height="s" width="s"}\n\n:::\n\nAfter');
        await expect(header.clearBackgroundButton).toBeHidden();
    });

    test('should skip a blob: image address @wysiwyg', async ({mount, page, header}) => {
        await mount(
            <HeaderStories.Header
                width={660}
                initial={':::header{width="s" bg-image="blob:https://example.com/0f8c"}\n:::'}
            />,
        );
        await expect(header.blocks).not.toHaveClass(/g-md-header-plugin_bg-image/);
        await expect(header.blocks).not.toHaveAttribute('style');
        expect(await page.evaluate(() => window.mdEditor?.getValue())).toBe(
            ':::header{height="s" width="s"}\n\n:::',
        );
    });

    test('should reject a file of another type or a larger size @wysiwyg', async ({
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
        const initial = await page.evaluate(() => window.mdEditor?.getValue());
        await header.openSettings();
        await header.openBackground();
        await header.backgroundTab('Image').click();

        await header.chooseFile(header.uploadButton, {
            name: 'large.png',
            mimeType: 'image/png',
            buffer: Buffer.alloc(MAX_IMAGE_SIZE + 1),
        });
        await expect(header.backgroundPopup).toContainText('The file is larger than 2 MB');
        await header.chooseFile(header.uploadButton, {
            name: 'notes.txt',
            mimeType: 'text/plain',
            buffer: Buffer.from('text'),
        });
        await expect(header.backgroundPopup).toContainText('Unsupported file format');
        expect(await page.evaluate(() => window.mdEditor?.getValue())).toBe(initial);
        await expect(header.blocks).not.toHaveClass(/g-md-header-plugin_bg-image/);
    });

    test('should select the settings text with the mouse @wysiwyg', async ({
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
        await header.openSettings();

        for (const text of ['Banner settings', 'Height', 'Width']) {
            const box = await header.settings.getByText(text, {exact: true}).boundingBox();
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
        await header.openSettings();
        await header.select(header.height, 'L');
        await editor.switchMode('markup');
        await expect(header.settings).toBeHidden();
        const markup = await page.evaluate(() => window.mdEditor?.getValue());
        expect(markup).toContain(':::header{height="l" width="s"}');
        expect(markup).toContain('edited');
        await editor.switchMode('wysiwyg');
        await expect(header.blocks.locator('p')).toHaveText('Keep text edited');
        await expect(header.blocks.locator('strong')).toContainText('text');
        await expect(header.blocks).toHaveClass(/g-md-header-plugin_height_l/);
        await expect(header.settings).toBeHidden();
    });

    test('should support keyboard controls and return focus to the settings button @wysiwyg', async ({
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
        await expect(header.settingsButton).toBeFocused();
        await header.settingsButton.press('Enter');
        await expect(header.height).toBeFocused();
        await header.height.press('Escape');
        await expect(header.settings).toBeHidden();
        await expect(header.settingsButton).toBeFocused();

        await header.settingsButton.press('Enter');
        await expect(header.height).toBeFocused();
        await header.height.press('Shift+Tab');
        await expect(header.closeButton).toBeFocused();
        await header.closeButton.press('Enter');
        await expect(header.settings).toBeHidden();
        await expect(header.settingsButton).toBeFocused();

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
        editor,
        header,
        expectScreenshot,
    }) => {
        await mount(<HeaderStories.Header width={335} />);
        await expect(header.blocks).toBeVisible();
        await header.hideToolbar();
        await expectScreenshot({component: editor.locators.component});
    });

    test('should keep the settings inside a mobile viewport @wysiwyg', async ({
        mount,
        page,
        editor,
        header,
        expectScreenshot,
    }) => {
        await mount(<HeaderStories.Header width={375} />, {rootStyle: {padding: 0}});
        await editor.focus();
        await editor.press('ControlOrMeta+Home');
        await header.openSettings();
        const bounds = await header.settings.boundingBox();
        if (!bounds) throw new Error('Settings must have bounds');
        expect(bounds.x).toBeGreaterThanOrEqual(0);
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(page.viewportSize()?.width ?? 0);
        expect(bounds.y).toBeGreaterThanOrEqual(0);
        expect(bounds.y + bounds.height).toBeLessThanOrEqual(page.viewportSize()?.height ?? 0);
        expect(
            await header.settings.evaluate((element) => element.scrollWidth <= element.clientWidth),
        ).toBe(true);
        await header.select(header.width, 'Full width');
        await expect(header.blocks).toHaveClass(/g-md-header-plugin_width_full/);
        await header.setExpandedSections();
        await expectScreenshot();
        await header.setExpandedSections('Text', 'Buttons', 'Image and background');
        await header.background.scrollIntoViewIfNeeded();
        await expect(header.background).toBeInViewport();
        await page.setViewportSize({width: 375, height: 480});
        await expect
            .poll(async () => {
                const settings = await header.settings.boundingBox();
                return settings ? settings.y + settings.height : Infinity;
            })
            .toBeLessThanOrEqual(480);
        await header.background.scrollIntoViewIfNeeded();
        await expect(header.background).toBeInViewport();
    });
});
