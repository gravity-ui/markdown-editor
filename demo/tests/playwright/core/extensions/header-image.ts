import type {Locator, Page} from '@playwright/test';

import {test as base} from './header';

export class HeaderImageBlock {
    readonly previews: Locator;
    protected readonly page: Page;

    constructor(page: Page, preview: Locator) {
        this.page = page;
        this.previews = preview.locator('.g-md-header-image-plugin');
    }

    getValues(blocks = this.previews) {
        return blocks.evaluateAll((elements) =>
            elements.map((element) => ({
                src: element.getAttribute('src'),
                alt: element.getAttribute('alt'),
                title: element.getAttribute('title'),
                excluded: element.hasAttribute('data-files-gallery-exclude'),
            })),
        );
    }

    /** The box of each image relative to its banner and the position of the first text block. */
    getPlacement(blocks = this.previews) {
        return blocks.evaluateAll((elements) =>
            elements.map((element) => {
                const banner = element.parentElement?.getBoundingClientRect();
                const image = element.getBoundingClientRect();
                const text = element.parentElement
                    ?.querySelector(':scope > p')
                    ?.getBoundingClientRect();
                return {
                    left: banner && Math.round(image.left - banner.left),
                    width: Math.round(image.width),
                    bannerWidth: banner && Math.round(banner.width),
                    textBelow: text && Math.round(text.top - image.bottom),
                    radius: getComputedStyle(element).borderTopLeftRadius,
                };
            }),
        );
    }
}

type HeaderImageFixtures = {headerImage: HeaderImageBlock};
type Test = ReturnType<typeof base.extend<HeaderImageFixtures>>;

export const test: Test = base.extend<HeaderImageFixtures>({
    headerImage: async ({page, editor}, use) => {
        await use(new HeaderImageBlock(page, editor.locators.previewContent));
    },
});
