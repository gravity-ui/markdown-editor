import type {Locator, Page} from '@playwright/test';

import {test as base} from './button';

export class HeaderTitleBlock {
    readonly blocks: Locator;
    readonly previews: Locator;
    protected readonly page: Page;

    constructor(page: Page, preview: Locator) {
        this.page = page;
        this.blocks = page.locator('.ProseMirror .g-md-header-title-plugin');
        this.previews = preview.locator('.g-md-header-title-plugin');
    }

    /** The titles that stand right in the given blocks: `inHeaders(header.previews)`. */
    inHeaders(headers: Locator) {
        return headers.locator(':scope > .g-md-header-title-plugin');
    }

    /**
     * Titles of the preview with the attribute, or with its value:
     * `previewsWith('aria-level', '1')`. The default size and color render no data attribute.
     */
    previewsWith(name: string, value?: string) {
        return this.previews.and(
            this.page.locator(value === undefined ? `[${name}]` : `[${name}="${value}"]`),
        );
    }

    /** The level, the color and the text of every title. */
    getValues(blocks = this.previews) {
        return blocks.evaluateAll((elements) =>
            elements.map((element) => ({
                size: element.getAttribute('aria-level'),
                color: element.getAttribute('data-color') ?? 'auto',
                text: element.textContent?.trim(),
            })),
        );
    }

    /** The font size, the line height and the font weight of every title. */
    getTypography(blocks = this.previews) {
        return blocks.evaluateAll((elements) =>
            elements.map((element) => {
                const {fontSize, lineHeight, fontWeight} = getComputedStyle(element);
                return [fontSize, lineHeight, fontWeight];
            }),
        );
    }

    /** The computed text color of every title. */
    getColors(blocks = this.previews) {
        return blocks.evaluateAll((elements) =>
            elements.map((element) => getComputedStyle(element).color),
        );
    }

    /** The computed text color of the block around every title. */
    getParentColors(blocks = this.previews) {
        return blocks.evaluateAll((elements) =>
            elements.map((element) =>
                element.parentElement ? getComputedStyle(element.parentElement).color : '',
            ),
        );
    }

    /** The different distances from the titles to the blocks after them. */
    getGaps(blocks = this.previews) {
        return blocks.evaluateAll((elements) =>
            Array.from(
                new Set(
                    elements.flatMap((element) => {
                        const next = element.nextElementSibling;
                        if (!next) return [];
                        const {bottom} = element.getBoundingClientRect();
                        return [Math.round(next.getBoundingClientRect().top - bottom)];
                    }),
                ),
            ),
        );
    }

    /** The number of text lines of every title. */
    getLineCounts(blocks = this.previews) {
        return blocks.evaluateAll((elements) =>
            elements.map((element) =>
                Math.round(
                    element.getBoundingClientRect().height /
                        parseFloat(getComputedStyle(element).lineHeight),
                ),
            ),
        );
    }
}

type HeaderTitleFixtures = {headerTitle: HeaderTitleBlock};
type Test = ReturnType<typeof base.extend<HeaderTitleFixtures>>;

export const test: Test = base.extend<HeaderTitleFixtures>({
    headerTitle: async ({page, editor}, use) => {
        await use(new HeaderTitleBlock(page, editor.locators.previewContent));
    },
});
