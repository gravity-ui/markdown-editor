import type {CSSProperties} from 'react';

import {expect} from 'playwright/core';
import {type HeaderBlock, test} from 'playwright/core/extensions/header';
import type {Fixtures} from 'playwright/core/types';

import {markupExamplesDocument} from '../../src/stories/header/examples';
import {headerContent, headerExample, headerImages} from '../../src/stories/header/markup';

import {HeaderStories} from './Header.helpers';
import {markupExamples} from './utils/markup-examples';

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
        // The settings window and the page fit the viewport: in a lower one the focus scrolls
        // either the page or the window, and the screenshot differs between runs.
        await page.setViewportSize({width: 740, height: 640});
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

// The examples of the syntax in the preview of the markup mode, in the sizes of the mock.

const HEIGHTS = {s: 236, m: 300, l: 360};
const WIDTHS = {s: 600, m: 900, l: 1200};
const PADDING = 32;
// The examples of a height and a width go by the alignment: left, center and right,
// each with the top, center and bottom vertical alignment.
const LAYOUT_COUNT = 9;

type PreviewFixtures = Pick<Fixtures, 'mount' | 'editor' | 'expectScreenshot'> & {
    header: HeaderBlock;
};

/** Nine examples of a height and a width: `first` is the number of the first one. */
async function expectLayout(
    {mount, editor, header, expectScreenshot}: PreviewFixtures,
    first: number,
    height: keyof typeof HEIGHTS,
    width: keyof typeof WIDTHS | 'full',
) {
    await mount(
        <HeaderStories.Preview
            width={width === 'full' ? 1000 : WIDTHS[width] + 160}
            initial={markupExamplesDocument(
                markupExamples('layout', first, first + LAYOUT_COUNT - 1),
            )}
        />,
    );
    await expect(header.previews).toHaveCount(LAYOUT_COUNT);
    await expect(header.previewsWith(`height_${height}`)).toHaveCount(LAYOUT_COUNT);
    await expect(header.previewsWith(`width_${width}`)).toHaveCount(LAYOUT_COUNT);
    await expect(header.previewsWith('align_center')).toHaveCount(3);
    await expect(header.previewsWith('align_right')).toHaveCount(3);
    await expect(header.previewsWith('vertical_top')).toHaveCount(3);
    await expect(header.previewsWith('vertical_bottom')).toHaveCount(3);
    const sizes = await header.getPreviewSizes();
    expect(sizes.map(([, size]) => size)).toEqual(Array(LAYOUT_COUNT).fill(HEIGHTS[height]));
    if (width === 'full') {
        expect(await header.getPreviewWidthGaps()).toEqual([0]);
    } else {
        expect(sizes.map(([size]) => size)).toEqual(Array(LAYOUT_COUNT).fill(WIDTHS[width]));
    }
    const insets = await header.getPreviewContentInsets();
    insets.forEach((inset, index) => {
        if (!inset) throw new Error('A header must have content');
        const [left, right, top, bottom] = inset;
        expect([left, right]).toEqual([PADDING, PADDING]);
        const vertical = index % 3;
        if (vertical === 0) expect(top).toBe(PADDING);
        if (vertical === 1) expect(Math.abs(top - bottom)).toBeLessThanOrEqual(1);
        if (vertical === 2) expect(bottom).toBe(PADDING);
    });
    await expectScreenshot({component: editor.locators.component});
}

test.describe('Header sizes and alignment', () => {
    test.use({viewport: {width: 1440, height: 900}});

    test('should lay out height s and width s with every alignment @markup', async ({
        mount,
        editor,
        header,
        expectScreenshot,
    }) => {
        await expectLayout({mount, editor, header, expectScreenshot}, 1, 's', 's');
    });

    test('should lay out height s and width m with every alignment @markup', async ({
        mount,
        editor,
        header,
        expectScreenshot,
    }) => {
        await expectLayout({mount, editor, header, expectScreenshot}, 10, 's', 'm');
    });

    test('should lay out height s and width l with every alignment @markup', async ({
        mount,
        editor,
        header,
        expectScreenshot,
    }) => {
        await expectLayout({mount, editor, header, expectScreenshot}, 19, 's', 'l');
    });

    test('should lay out height s and the full width with every alignment @markup', async ({
        mount,
        editor,
        header,
        expectScreenshot,
    }) => {
        await expectLayout({mount, editor, header, expectScreenshot}, 28, 's', 'full');
    });

    test('should lay out height m and width s with every alignment @markup', async ({
        mount,
        editor,
        header,
        expectScreenshot,
    }) => {
        await expectLayout({mount, editor, header, expectScreenshot}, 37, 'm', 's');
    });

    test('should lay out height m and width m with every alignment @markup', async ({
        mount,
        editor,
        header,
        expectScreenshot,
    }) => {
        await expectLayout({mount, editor, header, expectScreenshot}, 46, 'm', 'm');
    });

    test('should lay out height m and width l with every alignment @markup', async ({
        mount,
        editor,
        header,
        expectScreenshot,
    }) => {
        await expectLayout({mount, editor, header, expectScreenshot}, 55, 'm', 'l');
    });

    test('should lay out height m and the full width with every alignment @markup', async ({
        mount,
        editor,
        header,
        expectScreenshot,
    }) => {
        await expectLayout({mount, editor, header, expectScreenshot}, 64, 'm', 'full');
    });

    test('should lay out height l and width s with every alignment @markup', async ({
        mount,
        editor,
        header,
        expectScreenshot,
    }) => {
        await expectLayout({mount, editor, header, expectScreenshot}, 73, 'l', 's');
    });

    test('should lay out height l and width m with every alignment @markup', async ({
        mount,
        editor,
        header,
        expectScreenshot,
    }) => {
        await expectLayout({mount, editor, header, expectScreenshot}, 82, 'l', 'm');
    });

    test('should lay out height l and width l with every alignment @markup', async ({
        mount,
        editor,
        header,
        expectScreenshot,
    }) => {
        await expectLayout({mount, editor, header, expectScreenshot}, 91, 'l', 'l');
    });

    test('should lay out height l and the full width with every alignment @markup', async ({
        mount,
        editor,
        header,
        expectScreenshot,
    }) => {
        await expectLayout({mount, editor, header, expectScreenshot}, 100, 'l', 'full');
    });
});

// A fill has nine examples: without an image, then the image with every theme, each also blurred.
const FILL_COUNT = 9;

/** The examples of the fills of a family: `first` is the number of the first one. */
async function expectBackgrounds(
    {mount, editor, header, expectScreenshot}: PreviewFixtures,
    first: number,
    fills: readonly string[],
) {
    const count = fills.length * FILL_COUNT;
    await mount(
        <HeaderStories.Preview
            width={760}
            initial={markupExamplesDocument(
                markupExamples('background', first, first + count - 1),
                headerImages.light,
            )}
        />,
    );
    await expect(header.previews).toHaveCount(count);
    for (const fill of fills) {
        await expect(header.previewsWith(`bg-color_${fill}`)).toHaveCount(FILL_COUNT);
    }
    await expect(header.previewsWith('bg-image')).toHaveCount(fills.length * 8);
    await expect(header.previewsWith('bg-image-blur')).toHaveCount(fills.length * 4);
    // The `system` theme is the default and adds no class.
    await expect(header.previewsWithTheme('light')).toHaveCount(fills.length * 2);
    await expect(header.previewsWithTheme('dark')).toHaveCount(fills.length * 2);
    // A fixed theme keeps the typography of the page, and the blur adds no scroll area.
    expect(await header.getPreviewTypography()).toHaveLength(1);
    expect(await header.hasNoHorizontalScroll(editor.locators.previewContent)).toBe(true);
    expect(await header.pageHasNoHorizontalScroll()).toBe(true);
    expect(new Set((await header.getPreviewSizes()).map(([, height]) => height))).toEqual(
        new Set([HEIGHTS.s]),
    );
    await header.waitForImage(headerImages.light);
    await expectScreenshot({component: editor.locators.component});
}

test.describe('Header backgrounds', () => {
    test('should render the image with every theme and blur without a fill @markup', async ({
        mount,
        editor,
        header,
        expectScreenshot,
    }) => {
        // background-001 … background-009.
        await mount(
            <HeaderStories.Preview
                width={760}
                initial={markupExamplesDocument(
                    markupExamples('background', 1, FILL_COUNT),
                    headerImages.light,
                )}
            />,
        );
        await expect(header.previews).toHaveCount(FILL_COUNT);
        await expect(header.previewsWith('bg-image')).toHaveCount(8);
        await expect(header.previewsWith('bg-image-blur')).toHaveCount(4);
        await expect(header.previewsWithTheme('light')).toHaveCount(2);
        await expect(header.previewsWithTheme('dark')).toHaveCount(2);
        expect(await header.getPreviewTypography()).toHaveLength(1);
        expect(await header.hasNoHorizontalScroll(editor.locators.previewContent)).toBe(true);
        await header.waitForImage(headerImages.light);
        await expectScreenshot({component: editor.locators.component});
    });

    test('should render the gray fills with every state of the image @markup', async ({
        mount,
        editor,
        header,
        expectScreenshot,
    }) => {
        await expectBackgrounds({mount, editor, header, expectScreenshot}, 10, [
            'gray-light',
            'gray-medium',
            'gray-heavy',
        ]);
    });

    test('should render the green fills with every state of the image @markup', async ({
        mount,
        editor,
        header,
        expectScreenshot,
    }) => {
        await expectBackgrounds({mount, editor, header, expectScreenshot}, 37, [
            'green-light',
            'green-medium',
            'green-heavy',
        ]);
    });

    test('should render the yellow fills with every state of the image @markup', async ({
        mount,
        editor,
        header,
        expectScreenshot,
    }) => {
        await expectBackgrounds({mount, editor, header, expectScreenshot}, 64, [
            'yellow-light',
            'yellow-medium',
            'yellow-heavy',
        ]);
    });

    test('should render the blue fills with every state of the image @markup', async ({
        mount,
        editor,
        header,
        expectScreenshot,
    }) => {
        await expectBackgrounds({mount, editor, header, expectScreenshot}, 91, [
            'blue-light',
            'blue-medium',
            'blue-heavy',
        ]);
    });

    test('should render the red fills with every state of the image @markup', async ({
        mount,
        editor,
        header,
        expectScreenshot,
    }) => {
        await expectBackgrounds({mount, editor, header, expectScreenshot}, 118, [
            'red-light',
            'red-medium',
            'red-heavy',
        ]);
    });

    test('should render the violet fills with every state of the image @markup', async ({
        mount,
        editor,
        header,
        expectScreenshot,
    }) => {
        await expectBackgrounds({mount, editor, header, expectScreenshot}, 145, [
            'violet-light',
            'violet-medium',
            'violet-heavy',
        ]);
    });

    test('should render every fill without an image @markup', async ({
        mount,
        editor,
        header,
        expectScreenshot,
    }) => {
        // The fills side by side in the sizes of a palette: three saturations of six families.
        const fills = ['gray', 'green', 'yellow', 'blue', 'red', 'violet'].flatMap((family) =>
            ['light', 'medium', 'heavy'].map((saturation) => `${family}-${saturation}`),
        );
        await mount(
            <HeaderStories.Preview
                width={760}
                initial={fills
                    .map((fill) => headerExample(`width="s" bg-color="${fill}"`, headerContent(3)))
                    .join('\n\n')}
            />,
        );
        await expect(header.previews).toHaveCount(18);
        const colors = await header.previews.evaluateAll((elements) =>
            elements.map((element) => getComputedStyle(element).backgroundColor),
        );
        expect(new Set(colors).size).toBe(18);
        expect(colors).not.toContain('rgba(0, 0, 0, 0)');
        await expectScreenshot({component: editor.locators.component});
    });

    test('should render a light, a dark and a contrast image with every theme and blur @markup', async ({
        mount,
        editor,
        header,
        expectScreenshot,
    }) => {
        const images = [headerImages.light, headerImages.dark, headerImages.contrast];
        const markup = images
            .flatMap((image) =>
                ['system', 'light', 'dark'].flatMap((theme) => [
                    headerExample(
                        `bg-image="${image}" bg-image-theme="${theme}"`,
                        headerContent(3),
                    ),
                    headerExample(
                        `bg-image="${image}" bg-image-theme="${theme}" bg-image-blur="true"`,
                        headerContent(3),
                    ),
                ]),
            )
            .join('\n\n');
        await mount(<HeaderStories.Preview width={760} initial={markup} />);
        await expect(header.previews).toHaveCount(18);
        await expect(header.previewsWith('bg-image-blur')).toHaveCount(9);
        await expect(header.previewsWithTheme('light')).toHaveCount(6);
        await expect(header.previewsWithTheme('dark')).toHaveCount(6);
        expect(await header.getPreviewTypography()).toHaveLength(1);
        expect(await header.hasNoHorizontalScroll(editor.locators.previewContent)).toBe(true);
        for (const image of images) await header.waitForImage(image);
        await expectScreenshot({component: editor.locators.component});
    });
});

test.describe('Header syntax examples', () => {
    test.use({viewport: {width: 1440, height: 900}});

    test('should lay out the title, the description and the buttons @markup', async ({
        mount,
        editor,
        header,
        expectScreenshot,
    }) => {
        // structure-001 … structure-016: without an image beside the text.
        await mount(
            <HeaderStories.Preview
                width={1060}
                initial={markupExamplesDocument(markupExamples('structure', 1, 16))}
            />,
        );
        await expect(header.previews).toHaveCount(16);
        expect(await header.getPreviewSizes()).toEqual(Array(16).fill([WIDTHS.m, HEIGHTS.s]));
        await expectScreenshot({component: editor.locators.component});
    });

    test('should lay out the content beside an image @markup', async ({
        mount,
        editor,
        header,
        expectScreenshot,
    }) => {
        // structure-017 … structure-032: with an image beside the text.
        await mount(
            <HeaderStories.Preview
                width={1060}
                initial={markupExamplesDocument(markupExamples('structure', 17, 32))}
            />,
        );
        await expect(header.previews).toHaveCount(16);
        // The height is a minimum: the tallest content grows the block.
        const sizes = await header.getPreviewSizes();
        expect(sizes.map(([width]) => width)).toEqual(Array(16).fill(WIDTHS.m));
        expect(Math.min(...sizes.map(([, height]) => height))).toBe(HEIGHTS.s);
        await expectScreenshot({component: editor.locators.component});
    });

    test('should render the defaults and normalize unsupported values @markup', async ({
        mount,
        editor,
        header,
        expectScreenshot,
    }) => {
        // The empty header, the minimal title and description, the explicit defaults, the empty
        // title and description; an unknown attribute, an invalid height, a theme and a blur
        // without an image.
        const examples = [
            ...markupExamples('defaults', 1, 3),
            ...markupExamples('defaults', 7, 8),
            ...markupExamples('boundaries', 7, 8),
            ...markupExamples('boundaries', 14, 14),
        ];
        await mount(
            <HeaderStories.Preview width={1060} initial={markupExamplesDocument(examples)} />,
        );
        await expect(header.previews).toHaveCount(8);
        await expect(header.previewsWith('height_s')).toHaveCount(8);
        await expect(header.previewsWith('width_m')).toHaveCount(8);
        await expect(header.previewsWith('bg-image-blur')).toHaveCount(0);
        await expect(header.previewsWithTheme('dark')).toHaveCount(0);
        for (const name of ['data-align', 'data-vertical', 'data-bg-image-theme', 'unknown']) {
            await expect(header.previewsWithAttribute(name)).toHaveCount(0);
        }
        expect(await header.getPreviewSizes()).toEqual(Array(8).fill([WIDTHS.m, HEIGHTS.s]));
        await expectScreenshot({component: editor.locators.component});
    });

    test('should combine every attribute in a centered header @markup', async ({
        mount,
        editor,
        header,
        expectScreenshot,
    }) => {
        // mixed-001 … mixed-008: the large full-width header with a fill, a blurred image and
        // a fixed theme, centered at the bottom.
        await mount(
            <HeaderStories.Preview
                width={1000}
                initial={markupExamplesDocument(markupExamples('mixed', 1, 8), headerImages.dark)}
            />,
        );
        await expect(header.previews).toHaveCount(8);
        await expect(header.previewsWith('align_center')).toHaveCount(8);
        await expect(header.previewsWith('vertical_bottom')).toHaveCount(8);
        await expect(header.previewsWith('bg-color_violet-light')).toHaveCount(8);
        await expect(header.previewsWith('bg-image-blur')).toHaveCount(8);
        await expect(header.previewsWithTheme('dark')).toHaveCount(8);
        expect(await header.getPreviewWidthGaps()).toEqual([0]);
        expect((await header.getPreviewSizes()).map(([, height]) => height)).toEqual(
            Array(8).fill(HEIGHTS.l),
        );
        await header.waitForImage(headerImages.dark);
        await expectScreenshot({component: editor.locators.component});
    });

    test('should combine every attribute in a right-aligned header with an image @markup', async ({
        mount,
        editor,
        header,
        expectScreenshot,
    }) => {
        // mixed-009 … mixed-016: the same header with an image beside the right-aligned text.
        await mount(
            <HeaderStories.Preview
                width={1000}
                initial={markupExamplesDocument(markupExamples('mixed', 9, 16), headerImages.dark)}
            />,
        );
        await expect(header.previews).toHaveCount(8);
        await expect(header.previewsWith('align_right')).toHaveCount(8);
        await expect(header.previewsWith('vertical_bottom')).toHaveCount(8);
        await expect(header.previewsWith('bg-image-blur')).toHaveCount(8);
        await expect(header.previewsWithTheme('dark')).toHaveCount(8);
        await header.waitForImage(headerImages.dark);
        await expectScreenshot({component: editor.locators.component});
    });
});

const longTitle =
    'A long title that does not fit into one line of the header and wraps onto the next lines of the block';
const longText =
    'A long description of the page: what it is about, who it is for and what to do next. It does not fit into one line of the header and wraps onto the next lines of the block, and the header grows with it.';
const unbreakable = 'Unbreakable'.repeat(14);
const tallText = Array.from(
    {length: 14},
    (_, index) => `Paragraph ${index + 1} of a description taller than the header.`,
).join('\n\n');
const stressMarkup = [
    headerExample('bg-color="gray-light"', headerContent(3, longTitle, longText)),
    headerExample(
        'width="s" align="center" bg-color="blue-light"',
        headerContent(3, longTitle, longText),
    ),
    headerExample(
        'width="s" align="right" vertical="bottom" bg-color="green-light"',
        headerContent(3, unbreakable, unbreakable),
    ),
    headerExample('height="l" vertical="top" bg-color="yellow-light"', headerContent(1, 'A', 'B')),
    headerExample('height="l" vertical="bottom" bg-color="red-light"', headerContent(0, 'A', 'B')),
    headerExample(
        `width="s" bg-image="${headerImages.contrast}" bg-image-theme="dark" bg-image-blur="true"`,
        headerContent(3, longTitle, tallText),
    ),
    headerExample(
        'align="center" vertical="top" bg-color="violet-light"',
        [
            headerContent(0, 'Many buttons'),
            ...Array.from(
                {length: 9},
                (_, index) =>
                    `:button[Button ${index + 1} with a label]{href="/page" view="normal" color="violet"}`,
            ),
        ].join('\n\n'),
    ),
    headerExample('bg-color="gray-medium"', 'Text right in the header, without blocks.'),
].join('\n\n');

test.describe('Header stress', () => {
    test('should wrap long content and grow with tall content @markup', async ({
        mount,
        editor,
        header,
        expectScreenshot,
    }) => {
        await mount(<HeaderStories.Preview width={1060} initial={stressMarkup} />);
        await expect(header.previews).toHaveCount(8);
        const sizes = await header.getPreviewSizes();
        // The width is kept: long words wrap. The height is a minimum: tall content grows it.
        expect(sizes.map(([width]) => width)).toEqual([900, 600, 600, 900, 900, 600, 900, 900]);
        expect(sizes[3][1]).toBe(HEIGHTS.l);
        expect(sizes[4][1]).toBe(HEIGHTS.l);
        expect(sizes[5][1]).toBeGreaterThan(HEIGHTS.s);
        expect(await header.hasNoHorizontalScroll(editor.locators.previewContent)).toBe(true);
        await header.waitForImage(headerImages.contrast);
        await expectScreenshot({component: editor.locators.component});
    });

    test('should switch to the narrow layout below the width of a small header @markup', async ({
        mount,
        editor,
        header,
        expectScreenshot,
    }) => {
        // A header of 599 px is narrow; headers of 600 px and wider keep the wide layout.
        await mount(
            <HeaderStories.Preview
                width={760}
                initial={[
                    headerExample('width="s" bg-color="gray-light"', headerContent(3)),
                    headerExample('width="m" bg-color="gray-light"', headerContent(3)),
                ].join('\n\n')}
            />,
            {
                styles: ':root {--g-md-header-plugin-width-s: 599px; --g-md-header-plugin-width-m: 600px;}',
            },
        );
        await expect(header.previews).toHaveCount(2);
        expect((await header.getPreviewSizes()).map(([width]) => width)).toEqual([599, 600]);
        const insets = await header.getPreviewContentInsets();
        expect(insets.map((inset) => inset?.[0])).toEqual([16, PADDING]);
        await expectScreenshot({component: editor.locators.component});
    });
});

const mobileMarkup = [
    headerExample('', headerContent(1)),
    headerExample('bg-color="gray-light"', headerContent(3)),
    headerExample('align="center" vertical="top" bg-color="blue-medium"', headerContent(2)),
    headerExample(
        'height="m" align="right" vertical="bottom" bg-color="green-heavy"',
        headerContent(1),
    ),
    headerExample(
        `height="l" width="full" bg-image="${headerImages.dark}" bg-image-theme="dark"`,
        headerContent(3, longTitle, longText),
    ),
    headerExample(
        `width="s" bg-color="violet-light" bg-image="${headerImages.contrast}" bg-image-theme="light" bg-image-blur="true"`,
        headerContent(1),
    ),
    headerExample('bg-color="red-light"', headerContent(2, unbreakable, unbreakable)),
].join('\n\n');

test.describe('Header preview on mobile', () => {
    test.use({viewport: {width: 343, height: 812}});

    test('should lay out the content in a narrow column @markup', async ({
        mount,
        editor,
        header,
        expectScreenshot,
    }) => {
        await mount(<HeaderStories.Preview width={343} initial={mobileMarkup} />, {
            rootStyle: {padding: 0},
        });
        await expect(header.previews).toHaveCount(7);
        // Every width fills the column, and the text keeps the narrow padding.
        expect(await header.getPreviewWidthGaps()).toEqual([0]);
        const insets = await header.getPreviewContentInsets();
        expect(insets.map((inset) => inset?.slice(0, 2))).toEqual(Array(7).fill([16, 16]));
        expect(await header.getPreviewTypography()).toHaveLength(1);
        expect(await header.hasNoHorizontalScroll(editor.locators.previewContent)).toBe(true);
        await header.waitForImage(headerImages.dark);
        await header.waitForImage(headerImages.contrast);
        await expectScreenshot({component: editor.locators.component});
    });
});
