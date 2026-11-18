import type {Page} from '@playwright/test';

import {expect} from 'playwright/core';
import {test} from 'playwright/core/extensions/header-image';

import {HeaderStories} from './Header.helpers';

const HEADER_WIDTH = 600;
const VIEW_WIDTH = 760;
const IMAGE_PADDING = 8;
const IMAGE_RADIUS = '8px';
const NARROW_WIDTH = 400;
const LANDSCAPE = 'assets/header-image-landscape.svg';
const SQUARE = '/assets/header-image-square.svg';
const UPLOADED = '/assets/test-image.jpg';
const scriptUrl = ['javascript', 'alert(1)'].join(':');

const inHeader = (...blocks: string[]) =>
    [':::header{height="s" width="s"}', ...blocks, ':::'].join('\n\n');

const imageMarkup = (src: string) => `::header-image{src="${src}"}`;

const markupOf = (page: Page) => page.evaluate(() => window.mdEditor?.getValue());

const halfInsets = (width: number) => [
    width / 2 + IMAGE_PADDING,
    IMAGE_PADDING,
    IMAGE_PADDING,
    IMAGE_PADDING,
];

test.describe('Header image', () => {
    test('should place the image beside the text in the preview @markup', async ({
        mount,
        page,
        editor,
        headerImage,
        expectScreenshot,
    }) => {
        await page.setViewportSize({width: 1600, height: 640});
        await mount(<HeaderStories.Image mode="markup" width={VIEW_WIDTH} />);
        await editor.switchPreview('visible');
        await expect(headerImage.previews).toHaveCount(1);
        expect(await headerImage.getValues()).toEqual([{src: LANDSCAPE, alt: 'Team', title: null}]);
        const [insets] = await headerImage.getInsets();
        expect(insets).toEqual(halfInsets(HEADER_WIDTH));
        const [text] = await headerImage.getTextPlacement();
        expect(text?.right).toBeLessThanOrEqual(HEADER_WIDTH / 2);
        expect(await headerImage.getRadius()).toEqual([IMAGE_RADIUS]);
        await page.mouse.move(0, 0);
        await expect(page.getByRole('tooltip')).toBeHidden();
        await expectScreenshot();
    });

    test('should move the image above the text in a narrow header @markup', async ({
        mount,
        page,
        editor,
        headerImage,
        expectScreenshot,
    }) => {
        await page.setViewportSize({width: 900, height: 760});
        await mount(<HeaderStories.Image mode="markup" width={NARROW_WIDTH} />);
        await editor.switchPreview('visible');
        await expect(headerImage.previews).toHaveCount(1);
        const [insets] = await headerImage.getInsets();
        expect(insets?.slice(0, 3)).toEqual([IMAGE_PADDING, IMAGE_PADDING, IMAGE_PADDING]);
        const [text] = await headerImage.getTextPlacement();
        expect(text?.below).toBeGreaterThanOrEqual(IMAGE_PADDING);
        await page.mouse.move(0, 0);
        await expect(page.getByRole('tooltip')).toBeHidden();
        await expectScreenshot();
    });

    test('should render the image and the placeholder like the preview @wysiwyg', async ({
        mount,
        editor,
        header,
        headerImage,
        expectScreenshot,
    }) => {
        await mount(<HeaderStories.Image width={VIEW_WIDTH} />);
        await expect(headerImage.images).toHaveCount(1);
        await expect(headerImage.placeholders).toHaveCount(1);
        await expect
            .poll(() => header.blocks.first().evaluate((el) => el.clientWidth))
            .toBe(HEADER_WIDTH);
        expect(await headerImage.getValues(headerImage.images)).toEqual([
            {src: LANDSCAPE, alt: 'Team', title: null},
        ]);
        const insets = await headerImage.getInsets(headerImage.images);
        expect(insets).toEqual([halfInsets(HEADER_WIDTH)]);
        expect(await headerImage.getInsets(headerImage.emptyBlocks)).toEqual(insets);
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
        await headerImage.source.linkInput.fill(scriptUrl);
        await headerImage.source.submitLinkButton.click();
        await expect(headerImage.popup.getByRole('alert')).toHaveText('Unsupported image address');
        await expect(headerImage.source.linkTextInputs.first()).toBeHidden();
        await expect.poll(() => markupOf(page)).toContain(initial);
        await page.mouse.move(0, 0);
        await headerImage.waitForPopupPlaced();
        await expectScreenshot({component: headerImage.popup});

        await headerImage.source.linkInput.fill(SQUARE);
        await headerImage.source.submitLinkButton.click();
        await expect(headerImage.images).toHaveCount(1);
        await expect(headerImage.source.fileName).toHaveText('header-image-square.svg');
        await expect.poll(() => markupOf(page)).toContain(inHeader(imageMarkup(SQUARE), 'Text'));
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
            buffer: Buffer.alloc(2 * 1024 * 1024 + 1),
        });
        await expect(headerImage.popup).toContainText('The file is larger than 2 MB');
        await expect(headerImage.images).toHaveCount(0);

        await headerImage.chooseFile(headerImage.source.uploadButton, {
            name: 'photo.png',
            mimeType: 'image/png',
            buffer: Buffer.from('image'),
        });
        await expect(headerImage.images).toHaveCount(1);
        await expect.poll(() => markupOf(page)).toContain(imageMarkup(UPLOADED));

        await headerImage.resetButton.click();
        await expect(headerImage.placeholders).toHaveCount(1);
        await expect.poll(() => markupOf(page)).toContain(inHeader('::header-image', 'Text'));
    });

    test('should select and remove the image with the keyboard @wysiwyg', async ({
        mount,
        page,
        editor,
        headerImage,
    }) => {
        await mount(
            <HeaderStories.Header
                width={VIEW_WIDTH}
                initial={inHeader(imageMarkup(SQUARE), 'Text')}
            />,
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
        await editor.press('Delete');
        await expect(headerImage.images).toHaveCount(0);
        await expect.poll(() => markupOf(page)).toBe(inHeader('Text'));
    });
});
