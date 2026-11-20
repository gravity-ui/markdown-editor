import type {Page} from '@playwright/test';

import {expect} from 'playwright/core';
import {test} from 'playwright/core/extensions/header-image';

import {HeaderStories} from './Header.helpers';

const HEADER_WIDTH = 600;
const VIEW_WIDTH = 760;
const IMAGE_RADIUS = '10px';
const IMAGE_MARGIN = 16;
const LANDSCAPE = 'assets/header-image-landscape.svg';
const SQUARE_IMAGE = '::header-image{src="/assets/header-image-square.svg"}';

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

    test('should select the image with a click @wysiwyg', async ({mount, headerImage}) => {
        await mount(
            <HeaderStories.Header width={VIEW_WIDTH} initial={inHeader(SQUARE_IMAGE, 'Text')} />,
        );
        await headerImage.images.click();
        await expect(headerImage.selectedBlocks).toHaveCount(1);
        await expect(headerImage.images).toHaveClass(/ProseMirror-selectednode/);
    });
});
