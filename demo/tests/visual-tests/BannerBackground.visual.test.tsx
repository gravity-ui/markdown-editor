import type {CSSProperties} from 'react';

import type {Page} from '@playwright/test';

import {expect} from 'playwright/core';
import {type BannerBlock, test} from 'playwright/core/extensions/banner';
import type {Fixtures} from 'playwright/core/types';

import {BannerStories} from './Banner.helpers';

// The banners grow to their text, so the screenshots stay small.
const sizes = {'--g-md-banner-plugin-height-s': '120px'} as CSSProperties;
const WIDTH = 500;
// The preview buttons take a column to the right of the preview.
const PREVIEW_BUTTONS_WIDTH = 65;

const transparentImage = 'assets/banner-image-transparent.svg';
const opaqueImage = 'assets/banner-image-landscape.svg';

const bannerMarkup = (attrs: string) =>
    [
        `:::banner{height="s" width="full"${attrs}}`,
        '::banner-title[Team portal]',
        ':::banner-content',
        'The [handbook](https://example.com) and the `release` calendar.',
        ':::',
        ':::',
    ].join('\n\n');

const blurMarkup = [
    bannerMarkup(` bg-color="blue-medium" bg-image="${transparentImage}" bg-image-blur="true"`),
    bannerMarkup(` bg-image="${transparentImage}" bg-image-blur="true"`),
].join('\n\n');

// A fill, an image in the page theme, a fill under a transparent image, and an image in each fixed theme.
const combinationsMarkup = [
    bannerMarkup(' bg-color="green-light"'),
    bannerMarkup(` bg-image="${opaqueImage}"`),
    bannerMarkup(` bg-color="yellow-heavy" bg-image="${transparentImage}"`),
    bannerMarkup(` bg-image="${opaqueImage}" bg-theme="dark"`),
    bannerMarkup(` bg-image="${opaqueImage}" bg-theme="light"`),
].join('\n\n');

type BackgroundFixtures = Pick<Fixtures, 'mount' | 'editor' | 'wait'> & {
    page: Page;
    banner: BannerBlock;
};

async function mountWysiwyg({mount, editor, banner}: BackgroundFixtures, markup: string) {
    await mount(
        <div style={sizes}>
            <BannerStories.Banner width={WIDTH} initial={`${markup}\n\nAfter`} />
        </div>,
    );
    await expect(banner.blocks.first()).toBeVisible();
    await editor.focus();
    await editor.press('ControlOrMeta+End');
    await expect(banner.toolbar).toBeHidden();
}

async function mountPreview({mount, page, editor, wait}: BackgroundFixtures, markup: string) {
    await mount(
        <div style={sizes}>
            <BannerStories.Banner
                mode="markup"
                width={WIDTH + PREVIEW_BUTTONS_WIDTH}
                initial={markup}
            />
        </div>,
    );
    await editor.switchPreview('visible');
    await page.mouse.move(0, 0);
    await wait.tooltipsHidden();
    await expect(
        editor.locators.previewContent.locator('.g-md-banner-plugin').first(),
    ).toBeVisible();
}

test.describe('Banner background', () => {
    test('should draw a transparent image with blur @wysiwyg', async ({
        mount,
        page,
        editor,
        banner,
        wait,
        expectScreenshot,
    }) => {
        await mountWysiwyg({mount, page, editor, banner, wait}, blurMarkup);
        await expectScreenshot({component: editor.locators.component});
    });

    test('should draw a transparent image with blur in the preview @markup', async ({
        mount,
        page,
        editor,
        banner,
        wait,
        expectScreenshot,
    }) => {
        await mountPreview({mount, page, editor, banner, wait}, blurMarkup);
        await expectScreenshot({component: editor.locators.component});
    });

    test('should combine fills, images and fixed themes @wysiwyg', async ({
        mount,
        page,
        editor,
        banner,
        wait,
        expectScreenshot,
    }) => {
        await mountWysiwyg({mount, page, editor, banner, wait}, combinationsMarkup);
        await expectScreenshot({component: editor.locators.component});
    });

    test('should combine fills, images and fixed themes in the preview @markup', async ({
        mount,
        page,
        editor,
        banner,
        wait,
        expectScreenshot,
    }) => {
        await mountPreview({mount, page, editor, banner, wait}, combinationsMarkup);
        await expectScreenshot({component: editor.locators.component});
    });
});
