import {expect} from 'playwright/core';
import {test} from 'playwright/core/extensions/header-image';

import {HeaderStories} from './Header.helpers';

const HEADER_WIDTH = 600;
const VIEW_WIDTH = 760;
const IMAGE_RADIUS = '10px';
const IMAGE_MARGIN = 16;
const LANDSCAPE = 'assets/header-image-landscape.svg';

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
});
