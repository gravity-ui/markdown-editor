import type {Locator, Page} from '@playwright/test';

import {test as base} from './header';

export class HeaderImageBlock {
    readonly images: Locator;
    readonly emptyBlocks: Locator;
    readonly placeholders: Locator;
    readonly selectedBlocks: Locator;
    readonly previews: Locator;
    protected readonly page: Page;

    constructor(page: Page, preview: Locator) {
        this.page = page;
        const content = page.locator('.ProseMirror');
        this.images = content.locator('img.g-md-header-image-plugin');
        this.emptyBlocks = content.locator('.g-md-header-image-nodeview_empty');
        this.placeholders = content.getByRole('button', {name: 'Add image', exact: true});
        this.selectedBlocks = content.locator('.g-md-header-image-plugin.ProseMirror-selectednode');
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

    /** The box of each image inside the border of its banner and the gap to the next text block. */
    getPlacement(blocks = this.previews) {
        return blocks.evaluateAll((elements) =>
            elements.map((element) => {
                const banner = element.parentElement;
                const image = element.getBoundingClientRect();
                const text = banner?.querySelector(':scope > p')?.getBoundingClientRect();
                return {
                    left:
                        banner &&
                        Math.round(
                            image.left - banner.getBoundingClientRect().left - banner.clientLeft,
                        ),
                    width: Math.round(image.width),
                    bannerWidth: banner?.clientWidth,
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
