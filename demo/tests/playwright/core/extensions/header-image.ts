import type {Locator, Page} from '@playwright/test';

import {test as base} from './header-content';

export class HeaderImageBlock {
    readonly blocks: Locator;
    readonly previews: Locator;
    protected readonly page: Page;

    constructor(page: Page, preview: Locator) {
        this.page = page;
        this.blocks = page.locator('.ProseMirror .g-md-header-image-plugin');
        this.previews = preview.locator('.g-md-header-image-plugin');
    }

    /** The images that stand right in the given blocks: `inHeaders(header.previews)`. */
    inHeaders(headers: Locator) {
        return headers.locator(':scope > .g-md-header-image-plugin');
    }

    /**
     * Images of the preview with the attribute, or with its value:
     * `previewsWith('alt', 'Team')`. An image without a title has no `title` attribute.
     */
    previewsWith(name: string, value?: string) {
        return this.previews.and(
            this.page.locator(value === undefined ? `[${name}]` : `[${name}="${value}"]`),
        );
    }

    /** The address, the alternative text and the title of every image, as its attributes hold them. */
    getValues(blocks = this.previews) {
        return blocks.evaluateAll((elements) =>
            elements.map((element) => ({
                src: element.getAttribute('src'),
                alt: element.getAttribute('alt'),
                title: element.getAttribute('title'),
            })),
        );
    }

    /**
     * Waits until every image is loaded or has failed to load. `expectScreenshot` waits
     * for the `load` event only, which an image with a broken address never fires.
     */
    async waitForImages(blocks = this.previews) {
        await blocks.evaluateAll((elements) =>
            Promise.all(
                (elements as HTMLImageElement[]).map(
                    (image) =>
                        image.complete ||
                        new Promise<unknown>((resolve) => {
                            image.addEventListener('load', resolve);
                            image.addEventListener('error', resolve);
                        }),
                ),
            ),
        );
    }

    /** Whether every image is loaded: an image with a broken address is not. */
    getLoaded(blocks = this.previews) {
        return blocks.evaluateAll((elements) =>
            (elements as HTMLImageElement[]).map(
                (image) => image.complete && image.naturalWidth > 0,
            ),
        );
    }

    /** The width and the height of the file of every image, to compare with its box. */
    getNaturalSizes(blocks = this.previews) {
        return blocks.evaluateAll((elements) =>
            (elements as HTMLImageElement[]).map((image) => [
                image.naturalWidth,
                image.naturalHeight,
            ]),
        );
    }

    /** The width and the height of the box of every image. */
    getSizes(blocks = this.previews) {
        return blocks.evaluateAll((elements) =>
            elements.map((element) => {
                const {width, height} = element.getBoundingClientRect();
                return [Math.round(width), Math.round(height)];
            }),
        );
    }

    /**
     * Where every image stands in the block around it: the distances from the left, right,
     * top and bottom edges of the block to the image.
     */
    getInsets(blocks = this.previews) {
        return blocks.evaluateAll((elements) =>
            elements.map((element) => {
                const parent = element.parentElement;
                if (!parent) return null;
                const box = parent.getBoundingClientRect();
                const image = element.getBoundingClientRect();
                return [
                    Math.round(image.left - box.left),
                    Math.round(box.right - image.right),
                    Math.round(image.top - box.top),
                    Math.round(box.bottom - image.bottom),
                ];
            }),
        );
    }

    /**
     * Where the text stands in the block of every image: the distances from the left and
     * right edges of the block to the first block that is not an image, and from the bottom
     * of the image to the top of that block (negative when they stand side by side).
     */
    getTextInsets(blocks = this.previews) {
        return blocks.evaluateAll((elements) =>
            elements.map((element) => {
                const parent = element.parentElement;
                const text = parent?.querySelector(':scope > :not(.g-md-header-image-plugin)');
                if (!parent || !text) return null;
                const box = parent.getBoundingClientRect();
                const textBox = text.getBoundingClientRect();
                return [
                    Math.round(textBox.left - box.left),
                    Math.round(box.right - textBox.right),
                    Math.round(textBox.top - element.getBoundingClientRect().bottom),
                ];
            }),
        );
    }

    /** How every image fills its box, and its corners. */
    getStyles(blocks = this.previews) {
        return blocks.evaluateAll((elements) =>
            elements.map((element) => {
                const {objectFit, borderTopLeftRadius, borderBottomRightRadius} =
                    getComputedStyle(element);
                return {objectFit, borderTopLeftRadius, borderBottomRightRadius};
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
