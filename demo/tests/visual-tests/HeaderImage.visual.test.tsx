import type {Page} from '@playwright/test';

import {expect} from 'playwright/core';
import {test} from 'playwright/core/extensions/header-image';

import {TEST_IMAGE} from './Header.const';
import {HeaderStories} from './Header.helpers';

const HEADER_WIDTH = 600;
const VIEW_WIDTH = 760;
const IMAGE_RADIUS = '10px';
const IMAGE_MARGIN = 16;
const LANDSCAPE = 'assets/header-image-landscape.svg';
const SQUARE = '/assets/header-image-square.svg';
const SQUARE_IMAGE = `::header-image{src="${SQUARE}"}`;
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const SCRIPT_URL = ['javascript', 'alert(1)'].join(':');

const imageMarkup = (src: string) => `::header-image{src="${src}"}`;

const inHeader = (...blocks: string[]) =>
    [':::header{height="s" width="s"}', ...blocks, ':::'].join('\n\n');

const markupOf = (page: Page) => page.evaluate(() => window.mdEditor?.getValue());

test.describe('Header image', () => {
    test('should render the image in the flow of the banner in the preview @markup', async ({
        mount,
        page,
        editor,
        headerImage,
        expectScreenshot,
    }) => {
        await page.setViewportSize({width: 1600, height: 900});
        await mount(<HeaderStories.Image mode="markup" width={VIEW_WIDTH} />);
        await editor.switchPreview('visible');
        await expect(headerImage.previews).toHaveCount(1);
        expect(await headerImage.getValues()).toEqual([
            {src: LANDSCAPE, alt: 'Team', title: null, excluded: true},
        ]);
        const [placement] = await headerImage.getPlacement();
        expect(placement).toMatchObject({
            left: 0,
            width: HEADER_WIDTH,
            bannerWidth: HEADER_WIDTH,
            radius: IMAGE_RADIUS,
        });
        expect(placement.textBelow).toBeGreaterThanOrEqual(IMAGE_MARGIN);
        await page.mouse.move(0, 0);
        await expect(page.getByRole('tooltip')).toBeHidden();
        await expectScreenshot();
    });

    test('should render the image and the placeholder in the flow of the banner @wysiwyg', async ({
        mount,
        editor,
        header,
        headerImage,
        expectScreenshot,
    }) => {
        await mount(<HeaderStories.Image width={VIEW_WIDTH} />);
        await expect(headerImage.images).toHaveCount(1);
        await expect(headerImage.placeholders).toHaveCount(1);
        expect(await headerImage.getValues(headerImage.images)).toEqual([
            {src: LANDSCAPE, alt: 'Team', title: null, excluded: true},
        ]);
        const placements = await headerImage.getPlacement(
            headerImage.images.or(headerImage.emptyBlocks),
        );
        for (const placement of placements) {
            expect(placement.left).toBe(0);
            expect(placement.width).toBe(placement.bannerWidth);
            expect(placement.textBelow).toBeGreaterThanOrEqual(IMAGE_MARGIN);
            expect(placement.radius).toBe(IMAGE_RADIUS);
        }
        await editor.focus();
        await editor.press('ControlOrMeta+End');
        await expect(header.toolbar).toBeHidden();
        await expectScreenshot();
    });

    test('should add and remove the image with the settings switch @wysiwyg', async ({
        mount,
        page,
        editor,
        header,
        headerImage,
    }) => {
        await mount(<HeaderStories.Header width={VIEW_WIDTH} initial={inHeader('Text')} />);
        await editor.focus();
        await editor.press('ControlOrMeta+Home');
        await header.openSettings();
        await header.setExpandedSections('Image and background');
        await expect(header.toggle('Image')).not.toBeChecked();
        await header.clickToggle('Image');
        await expect(header.toggle('Image')).toBeChecked();
        await expect(headerImage.placeholders).toHaveCount(1);
        await expect.poll(() => markupOf(page)).toBe(inHeader('::header-image', 'Text'));
        await header.clickToggle('Image');
        await expect(header.toggle('Image')).not.toBeChecked();
        await expect(headerImage.emptyBlocks).toHaveCount(0);
        await expect.poll(() => markupOf(page)).toBe(inHeader('Text'));
    });

    test('should select and remove the image with the keyboard @wysiwyg', async ({
        mount,
        page,
        editor,
        headerImage,
    }) => {
        await mount(
            <HeaderStories.Header width={VIEW_WIDTH} initial={inHeader(SQUARE_IMAGE, 'Text')} />,
        );
        await editor.focus();
        await editor.press('ControlOrMeta+End');
        await editor.press('Home');
        await editor.press('ArrowUp');
        await expect(headerImage.selectedBlocks).toHaveCount(1);
        await editor.press('ArrowDown');
        await expect(headerImage.selectedBlocks).toHaveCount(0);
        await editor.press('Home');
        await editor.press('Backspace');
        await expect(headerImage.selectedBlocks).toHaveCount(1);
        await expect.poll(() => markupOf(page)).toBe(inHeader(SQUARE_IMAGE, 'Text'));
        await editor.press('Delete');
        await expect(headerImage.images).toHaveCount(0);
        await expect.poll(() => markupOf(page)).toBe(inHeader('Text'));
        await editor.press('ControlOrMeta+z');
        await expect(headerImage.images).toHaveCount(1);
    });

    test('should select the image and open its window with a click @wysiwyg', async ({
        mount,
        headerImage,
    }) => {
        await mount(
            <HeaderStories.Header width={VIEW_WIDTH} initial={inHeader(SQUARE_IMAGE, 'Text')} />,
        );
        await headerImage.images.click();
        await expect(headerImage.selectedBlocks).toHaveCount(1);
        await expect(headerImage.images).toHaveClass(/ProseMirror-selectednode/);
        await expect(headerImage.popup).toBeVisible();
        await expect(headerImage.source.fileName).toHaveText('header-image-square.svg');
    });

    test('should add an image to a placeholder by a link @wysiwyg', async ({
        mount,
        page,
        editor,
        headerImage,
        expectScreenshot,
    }) => {
        const initial = inHeader('::header-image', 'Text');
        await mount(<HeaderStories.Header width={VIEW_WIDTH} initial={initial} />);
        await headerImage.placeholders.click();
        await expect(headerImage.popup).toBeVisible();
        await expect(headerImage.selectedBlocks).toHaveCount(1);
        await expect(headerImage.popup).toContainText('JPEG, GIF or PNG, up to 2 MB');
        await headerImage.source.tab('Add by link').click();
        await headerImage.source.linkInput.fill(SCRIPT_URL);
        await headerImage.source.submitLinkButton.click();
        await expect(headerImage.source.error).toHaveText('Unsupported image address');
        expect(await markupOf(page)).toBe(initial);
        await page.mouse.move(0, 0);
        await expectScreenshot({component: headerImage.popup});

        await headerImage.source.linkInput.fill(SQUARE);
        await headerImage.source.submitLinkButton.click();
        await expect(headerImage.images).toHaveCount(1);
        await expect(headerImage.source.fileName).toHaveText('header-image-square.svg');
        await expect.poll(() => markupOf(page)).toBe(inHeader(imageMarkup(SQUARE), 'Text'));
        await editor.press('ControlOrMeta+z');
        await expect(headerImage.placeholders).toHaveCount(1);
    });

    test('should upload a file to a placeholder and reset it @wysiwyg', async ({
        mount,
        page,
        headerImage,
    }) => {
        await mount(
            <HeaderStories.Header
                width={VIEW_WIDTH}
                initial={inHeader('::header-image', 'Text')}
            />,
        );
        await headerImage.placeholders.click();
        await expect(headerImage.popup).toBeVisible();
        await headerImage.chooseFile(headerImage.source.uploadButton, {
            name: 'large.png',
            mimeType: 'image/png',
            buffer: Buffer.alloc(MAX_IMAGE_SIZE + 1),
        });
        await expect(headerImage.source.error).toHaveText('The file is larger than 2 MB');
        await expect(headerImage.images).toHaveCount(0);

        await headerImage.chooseFile(headerImage.source.uploadButton, {
            name: 'photo.png',
            mimeType: 'image/png',
            buffer: Buffer.from('image'),
        });
        await expect(headerImage.images).toHaveCount(1);
        await expect.poll(() => markupOf(page)).toBe(inHeader(imageMarkup(TEST_IMAGE), 'Text'));
        await expect(headerImage.source.replaceFileButton).toBeFocused();

        await headerImage.resetButton.click();
        await expect(headerImage.placeholders).toHaveCount(1);
        await expect(headerImage.popup).toBeVisible();
        await expect.poll(() => markupOf(page)).toBe(inHeader('::header-image', 'Text'));
    });

    test('should open and close the image window with the keyboard @wysiwyg', async ({
        mount,
        page,
        editor,
        headerImage,
    }) => {
        await mount(
            <HeaderStories.Header width={VIEW_WIDTH} initial={inHeader(SQUARE_IMAGE, 'Text')} />,
        );
        await editor.focus();
        await editor.press('ControlOrMeta+End');
        await editor.press('Home');
        await editor.press('Backspace');
        await expect(headerImage.selectedBlocks).toHaveCount(1);
        await editor.press('Enter');
        await expect(headerImage.popup).toBeVisible();
        await expect(headerImage.source.replaceFileButton).toBeFocused();
        await page.keyboard.press('Escape');
        await expect(headerImage.popup).toBeHidden();
        await expect(editor.locators.contenteditable).toBeFocused();
        await expect(headerImage.selectedBlocks).toHaveCount(1);

        await editor.press('Enter');
        await expect(headerImage.source.replaceFileButton).toBeFocused();
        await page.keyboard.press('Tab');
        await expect(headerImage.resetButton).toBeFocused();
        await page.keyboard.press('Tab');
        await expect(headerImage.popup).toBeHidden();
        await expect(editor.locators.contenteditable).toBeFocused();
        await expect.poll(() => markupOf(page)).toBe(inHeader(SQUARE_IMAGE, 'Text'));
    });
});
