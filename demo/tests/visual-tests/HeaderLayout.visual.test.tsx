import {expect} from 'playwright/core';
import {type BannerGeometry, test} from 'playwright/core/extensions/header-layout';

import {HeaderStories} from './Header.helpers';

const NARROW_WIDTH = 600;
const IMAGE_PADDING = 8;
const VIEW_WIDTH = 1300;

/** The image fills one column of a wide banner and spans the banner above the text of a narrow one. */
function expectLayout(banner: BannerGeometry, align: 'left' | 'right') {
    const {image, text, width} = banner;
    if (!image) throw new Error('The banner has no image');
    if (width < NARROW_WIDTH) {
        expect(image.left).toBe(IMAGE_PADDING);
        expect(image.right).toBe(width - IMAGE_PADDING);
        expect(image.bottom).toBeLessThanOrEqual(text.top);
        return;
    }
    const half = width / 2;
    expect(image.width).toBeCloseTo(half - 2 * IMAGE_PADDING, -0.5);
    if (align === 'left') {
        expect(text.right).toBeLessThanOrEqual(Math.ceil(half));
        expect(image.left).toBeGreaterThanOrEqual(Math.floor(half));
    } else {
        expect(image.right).toBeLessThanOrEqual(Math.ceil(half));
        expect(text.left).toBeGreaterThanOrEqual(Math.floor(half));
    }
    expect(image.top).toBe(IMAGE_PADDING);
}

/** An image without text fills the banner at any width. */
function expectImageOnly(banner: BannerGeometry) {
    const {image, width, height} = banner;
    if (!image) throw new Error('The banner has no image');
    expect(image).toMatchObject({
        left: IMAGE_PADDING,
        right: width - IMAGE_PADDING,
        top: IMAGE_PADDING,
        bottom: height - IMAGE_PADDING,
    });
}

test.describe('Header layout', () => {
    for (const width of [599, 600, 601]) {
        test(`should lay out a banner ${width} px wide in the preview @markup`, async ({
            mount,
            page,
            editor,
            preview,
        }) => {
            await page.setViewportSize({width: VIEW_WIDTH * 2, height: 900});
            await mount(<HeaderStories.Layout mode="markup" width={VIEW_WIDTH} />);
            await editor.switchPreview('visible');
            await preview.setBannerWidth(width);
            const [first, , third, fourth, imageOnly] = await preview.geometry();
            expectLayout(first, 'left');
            expectLayout(third, 'right');
            expectLayout(fourth, 'right');
            expectImageOnly(imageOnly);
        });

        test(`should lay out a banner ${width} px wide in the visual editor @wysiwyg`, async ({
            mount,
            page,
            wysiwyg,
        }) => {
            await page.setViewportSize({width: VIEW_WIDTH, height: 1600});
            await mount(<HeaderStories.Layout width={VIEW_WIDTH} />);
            await wysiwyg.setBannerWidth(width);
            const [first, , third, fourth, imageOnly] = await wysiwyg.geometry();
            expectLayout(first, 'left');
            expectLayout(third, 'right');
            expectLayout(fourth, 'right');
            expectImageOnly(imageOnly);
        });
    }

    test('should align the text and place the content vertically @wysiwyg @markup', async ({
        mount,
        page,
        editor,
        preview,
        wysiwyg,
    }) => {
        await page.setViewportSize({width: VIEW_WIDTH * 2, height: 1600});
        await mount(<HeaderStories.Layout mode="markup" width={VIEW_WIDTH} />);
        await editor.switchPreview('visible');
        const fromPreview = await preview.geometry();
        await editor.switchMode('wysiwyg');
        const fromEditor = await wysiwyg.geometry();
        for (const banners of [fromPreview, fromEditor]) {
            expect(banners.map((banner) => banner.textAlign)).toEqual([
                'start',
                'center',
                'end',
                'end',
                '',
            ]);
            const [, top, bottom] = banners;
            expect(top.text.top).toBeLessThan(bottom.text.top);
        }
    });

    test('should render the layouts in both modes @wysiwyg', async ({
        mount,
        page,
        wysiwyg,
        expectScreenshot,
    }) => {
        await page.setViewportSize({width: 1000, height: 1800});
        await mount(<HeaderStories.Layout width={940} />);
        await expectScreenshot({nameSuffix: 'wide'});
        await wysiwyg.setBannerWidth(343);
        await expectScreenshot({nameSuffix: 'narrow'});
    });
});
