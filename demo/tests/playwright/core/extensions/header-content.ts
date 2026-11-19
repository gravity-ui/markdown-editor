import type {Locator, Page} from '@playwright/test';

import {test as base} from './header';

const selector = '.g-md-header-content-plugin';

export class HeaderContentBlock {
    readonly blocks: Locator;
    readonly previews: Locator;
    readonly paragraphs: Locator;
    readonly placeholders: Locator;

    constructor(page: Page, preview: Locator) {
        this.blocks = page.locator(`.ProseMirror ${selector}`);
        this.previews = preview.locator(selector);
        this.paragraphs = this.blocks.first().locator(':scope > p');
        this.placeholders = this.blocks.locator('.g-md-placeholder');
    }

    /** The descriptions that are child blocks of the given banners. */
    inHeaders(headers: Locator) {
        return headers.locator(`:scope > ${selector}`);
    }

    getValues(blocks = this.previews) {
        return blocks.evaluateAll((elements) =>
            elements.map((element) => ({
                paragraphs: Array.from(
                    element.querySelectorAll(':scope > p'),
                    (paragraph) => paragraph.textContent,
                ),
            })),
        );
    }

    getTypography(blocks: Locator) {
        return blocks.evaluateAll((elements) =>
            elements.map((element) => {
                const {fontSize, lineHeight, fontWeight} = getComputedStyle(element);
                return [fontSize, lineHeight, fontWeight];
            }),
        );
    }

    /** The distinct vertical gaps between the neighboring blocks of each description. */
    getParagraphGaps(blocks = this.previews) {
        return blocks.evaluateAll((elements) =>
            Array.from(
                new Set(
                    elements.flatMap((element) =>
                        Array.from(element.children)
                            .slice(1)
                            .map((child) =>
                                Math.round(
                                    child.getBoundingClientRect().top -
                                        (child.previousElementSibling?.getBoundingClientRect()
                                            .bottom ?? 0),
                                ),
                            ),
                    ),
                ),
            ),
        );
    }
}

type HeaderContentFixtures = {headerContent: HeaderContentBlock};
type Test = ReturnType<typeof base.extend<HeaderContentFixtures>>;

export const test: Test = base.extend<HeaderContentFixtures>({
    headerContent: async ({page, editor}, use) => {
        await use(new HeaderContentBlock(page, editor.locators.previewContent));
    },
});
